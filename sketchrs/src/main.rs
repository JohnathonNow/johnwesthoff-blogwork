use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use tokio::sync::broadcast;
use tokio::task;
use warp::ws::{Message, WebSocket};
use warp::Filter;
use futures::{StreamExt, SinkExt};

type PeerMap = Arc<Mutex<HashMap<u64, broadcast::Sender<String>>>>;

mod packets;

#[tokio::main]
async fn main() {
    // Initialize the peer map
    let peer_map: PeerMap = Arc::new(Mutex::new(HashMap::new()));

    // Create a broadcast channel for chat messages
    let (tx, mut _rx) = broadcast::channel::<String>(100);

    // Spawn a task to listen for incoming messages and broadcast them
    let peer_clone = peer_map.clone();
    task::spawn(async move {
        while let Ok(msg) = _rx.recv().await {
            // Broadcast the message to all connected peers
            for (_, sender) in peer_clone.lock().unwrap().iter() {
                let _ = sender.send(msg.clone());
            }
        }
    });

    // WebSocket route handler
    let ws_route = warp::path("chat")
        .and(warp::ws())
        .and(with_peer_map(peer_map.clone()))
        .and(with_broadcast(tx.clone()))
        .map(|ws: warp::ws::Ws, peer_map, tx| {
            ws.on_upgrade(move |socket| user_connected(socket, peer_map, tx))
        });

    // Serve static files from the "frontend" directory
    let static_files = warp::fs::dir("frontend");

    // Combine the WebSocket route and static files route
    let routes = ws_route.or(static_files);
    // Start the server
    warp::serve(routes).run(([0, 0, 0, 0], 3030)).await;
}

async fn user_connected(ws: WebSocket, peer_map: PeerMap, gtx: broadcast::Sender<String>) {
    // Create a new channel for the connected user
    let (tx, mut _rx) = broadcast::channel::<String>(100);

    // Generate a unique ID for the user
    let user_id = rand::random::<u64>();

    // Save the sender in the peer map
    peer_map.lock().unwrap().insert(user_id, tx.clone());

    // Forward incoming messages from the user to the broadcast channel
    let (mut user_ws_tx, mut user_ws_rx) = ws.split();
    let user_id_clone = user_id;
    println!("USER CONNECTED!");
    tokio::task::spawn(async move {
        let login_name = loop { 
            if let Some(result) = user_ws_rx.next().await {
                let message = match result {
                    Ok(msg) => msg,
                    Err(e) => {
                        eprintln!("WebSocket error: {}", e);
                        return;
                    }
                };

                let message = if let Ok(text) = message.to_str() {
                    text.to_owned()
                } else {
                    continue;
                };

                if let Ok(packet) = serde_json::from_str::<packets::Incoming>(&message) {
                    println!("LoginWaiter: It's {:?}!", packet);
                    match packet {
                        packets::Incoming::Login{username} => {break username;},
                        _ => {}
                    }
                }
            } else {
                return;
            }
        };
        while let Some(result) = user_ws_rx.next().await {
            let message = match result {
                Ok(msg) => msg,
                Err(e) => {
                    eprintln!("WebSocket error: {}", e);
                    break;
                }
            };

            let message = if let Ok(text) = message.to_str() {
                text.to_owned()
            } else {
                continue;
            };

            println!("GOT MESSAGE {}!", message);
            if let Ok(packet) = serde_json::from_str::<packets::Incoming>(&message) {
                println!("MainLoop: It's {:?}!", packet);
                match packet {
                    packets::Incoming::Chat{message} => {
                        let _ = gtx.send(serde_json::to_string(&packets::Outgoing::Chat{sender: login_name.clone(), message, tick: 0}).unwrap());
                    },
                    _ => {}
                }
            }
        }

        // Remove the user from the peer map when the connection is closed
        peer_map.lock().unwrap().remove(&user_id_clone);
    });

    // Forward broadcast messages to the connected user
    while let Ok(msg) = _rx.recv().await {
        let _ = user_ws_tx.send(Message::text(msg)).await;
    }
}

fn with_peer_map(
    peer_map: PeerMap,
) -> impl Filter<Extract = (PeerMap,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || peer_map.clone())
}

fn with_broadcast(
    gtx: broadcast::Sender<String>,
) -> impl Filter<Extract = (broadcast::Sender<String>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || gtx.clone())
}
