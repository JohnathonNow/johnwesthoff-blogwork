use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use futures::{SinkExt, StreamExt};
use tokio::sync::broadcast;
use tokio::task;
use warp::ws::{Message, WebSocket};
use warp::Filter;

type PeerMap = HashMap<u64, broadcast::Sender<String>>;
type GameState = Arc<Mutex<State>>;
type Words = HashMap<String, String>;

mod packets;

struct State {
    peer_map: PeerMap,
    sendable: packets::State,
    words: Words
}

impl State {
    fn new() -> Self {
        Self {
            peer_map: HashMap::new(),
            sendable: packets::State::new(),
            words: HashMap::new(),
        }
    }
}

#[derive(Serialize, Deserialize)]
struct Query {
    name: String,
}

#[tokio::main]
async fn main() {
    // Initialize the peer map
    let game_state: GameState = Arc::new(Mutex::new(State::new()));

    // Create a broadcast channel for chat messages
    let (tx, mut _rx) = broadcast::channel::<String>(100);

    // Spawn a task to listen for incoming messages and broadcast them
    let game_clone = game_state.clone();
    task::spawn(async move {
        while let Ok(msg) = _rx.recv().await {
            // Broadcast the message to all connected peers
            for (_, sender) in game_clone.lock().unwrap().peer_map.iter() {
                let _ = sender.send(msg.clone());
            }
        }
    });

    // WebSocket route handler
    let ws_route = warp::path("chat")
        .and(warp::query::<Query>())
        .and(warp::ws())
        .and(with_game_state(game_state.clone()))
        .and(with_broadcast(tx.clone()))
        .map(|query: Query, ws: warp::ws::Ws, peer_map, tx| {
            println!("{}!!!!", query.name);
            ws.on_upgrade(move |socket| user_connected(socket, peer_map, tx, query.name))
        });

    // Serve static files from the "frontend" directory
    let static_files = warp::fs::dir("frontend");

    // Combine the WebSocket route and static files route
    let routes = ws_route.or(static_files);
    // Start the server
    warp::serve(routes).run(([0, 0, 0, 0], 3030)).await;
}

async fn user_connected(
    ws: WebSocket,
    game_state: GameState,
    gtx: broadcast::Sender<String>,
    login_name: String,
) {
    // Create a new channel for the connected user
    let (tx, mut _rx) = broadcast::channel::<String>(100);

    // Generate a unique ID for the user
    let user_id = rand::random::<u64>();

    // Save the sender in the peer map
    game_state
        .lock()
        .unwrap()
        .peer_map
        .insert(user_id, tx.clone());
    // Forward incoming messages from the user to the broadcast channel
    let (mut user_ws_tx, mut user_ws_rx) = ws.split();
    let user_id_clone = user_id;
    println!("USER {} CONNECTED!", login_name);
    tokio::task::spawn(async move {
        game_state
            .lock()
            .unwrap()
            .sendable
            .get_player_mut(&login_name)
            .set_active(true);

        let _ = gtx.send(
            serde_json::to_string(&packets::Outgoing::FullState {
                state: &game_state.lock().unwrap().sendable,
            })
            .unwrap(),
        );

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
                    packets::Incoming::Guess { username, guess } => {
                        if guess == "!word" {
                            if let Some(sender) = game_state.lock().unwrap().peer_map.get(&user_id)
                            {
                                sender
                                    .send(
                                        serde_json::to_string(&packets::Outgoing::Assign {
                                            username: login_name.clone(),
                                            assignment: "bob".into(),
                                        })
                                        .unwrap(),
                                    )
                                    .unwrap_or(0);
                            }
                        }
                        let _ = gtx.send(
                            serde_json::to_string(&packets::Outgoing::Guess {
                                username: login_name.clone(),
                                guess,
                            })
                            .unwrap(),
                        );
                    }
                    packets::Incoming::Image { username, image } => {
                        game_state
                            .lock()
                            .unwrap()
                            .sendable
                            .get_player_mut(&login_name)
                            .set_drawing(image.clone());
                        let _ = gtx.send(
                            serde_json::to_string(&packets::Outgoing::Image {
                                username: login_name.clone(),
                                image,
                            })
                            .unwrap(),
                        );
                    }
                    _ => {}
                }
            }
        }

        // Remove the user from the peer map when the connection is closed
        let mut x = game_state.lock().unwrap();
        x.peer_map.remove(&user_id_clone);
        x.sendable.get_player_mut(&login_name).set_active(false);
    });

    // Forward broadcast messages to the connected user
    while let Ok(msg) = _rx.recv().await {
        let _ = user_ws_tx.send(Message::text(msg)).await;
    }
}

fn with_game_state(
    game_state: GameState,
) -> impl Filter<Extract = (GameState,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || game_state.clone())
}

fn with_broadcast(
    gtx: broadcast::Sender<String>,
) -> impl Filter<Extract = (broadcast::Sender<String>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || gtx.clone())
}
