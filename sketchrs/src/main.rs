use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::error::Error;
use std::sync::{Arc, Mutex};
use std::fs;
use futures::{SinkExt, StreamExt};
use tokio::sync::broadcast;
use tokio::task;
use warp::ws::{Message, WebSocket};
use warp::Filter;

type PeerMap = HashMap<String, broadcast::Sender<String>>;
type GameState = Arc<Mutex<State>>;
type Words = HashMap<String, String>;

mod packets;

struct State {
    peer_map: PeerMap,
    sendable: packets::State,
    words: Words,
    word_pool: Vec<String>,
    host: Option<String>,
}

impl State {
    fn new() -> Self {
        Self {
            peer_map: HashMap::new(),
            sendable: packets::State::new(),
            words: HashMap::new(),
            word_pool: vec!["a".into(), "b".into(), "c".into(), "d".into(), "e".into()],
            host: None,
        }
    }
    fn guess(&mut self, guesser: &String, guess: &String) -> Option<i32> {
        if let Some(drawer) = self.words.get(guess) {
            Some(self.sendable.guess(drawer, guesser))
        } else {
            None
        }
    }
    fn assign_all(&mut self) {
        for (p, tx) in self.peer_map.iter() {
            let word =  if let Some(x) = self.words.values().find(|&x| x == p) {
                x.clone()
            } else {
                let word = self.word_pool.pop().unwrap();
                self.words.insert(word.clone(), p.clone());
                word
            };
            tx.send(
                serde_json::to_string(&packets::Outgoing::Assign {
                    username: p.clone(),
                    assignment: word,
                })
                .unwrap(),
            )
            .unwrap_or(0);
        }
    }
    fn assign_word(&mut self, drawer: &String) -> String {
        if let Some(x) = self.words.values().find(|&x| x == drawer) {
            return x.clone();
        } else {
            let word = self.word_pool.pop().unwrap();
            self.words.insert(word.clone(), drawer.clone());
            word
        }
    }
}

#[derive(Deserialize)]
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
    {
        let mut gs = game_state.lock().unwrap();
        // Save the sender in the peer map
        if gs.host.is_none() {
            gs.host = Some(login_name.clone());
        }
        gs.peer_map.insert(login_name.clone(), tx.clone());
        drop(gs);
    }
    // Forward incoming messages from the user to the broadcast channel
    let (mut user_ws_tx, mut user_ws_rx) = ws.split();

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
                    packets::Incoming::Start {} => {
                        let mut gs = game_state.lock().unwrap();
                        if let Some(host) = &gs.host {
                            println!("{} - {}", host, login_name);
                            if host == &login_name {
                                gs.sendable.set_state(packets::GameState::RUNNING);
                            }
                        }
                        gs.assign_all();
                        let _ = gtx.send(
                            serde_json::to_string(&packets::Outgoing::FullState {
                                state: &gs.sendable,
                            })
                            .unwrap(),
                        );
                    }
                    packets::Incoming::Assign {} => {
                        let mut gs = game_state.lock().unwrap();
                        let word = gs.assign_word(&login_name);
                        tx.send(
                            serde_json::to_string(&packets::Outgoing::Assign {
                                username: login_name.clone(),
                                assignment: word,
                            })
                            .unwrap(),
                        )
                        .unwrap_or(0);
                    }
                    packets::Incoming::Guess { username, guess } => {
                        if let Some(time) = game_state.lock().unwrap().guess(&username, &guess) {
                            let _ = gtx.send(
                                serde_json::to_string(&packets::Outgoing::Guess {
                                    username: "".into(),
                                    guess: format!("{} guessed a word at {}!", &login_name, time)
                                        .to_string(),
                                })
                                .unwrap(),
                            );
                        } else {
                            let _ = gtx.send(
                                serde_json::to_string(&packets::Outgoing::Guess {
                                    username: login_name.clone(),
                                    guess,
                                })
                                .unwrap(),
                            );
                        }
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
        x.peer_map.remove(&login_name);
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


fn read_words(path: &str) -> Result<Vec<String>, Box<dyn Error>> {
    Ok(fs::read_to_string(path)?.split('\n').map(|x| x.to_string()).collect())
}

#[test]
fn test_read_words() -> Result<(), Box<dyn Error>> {
    use std::path::PathBuf;
    let mut d = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    d.push("resources/words.txt");
    let words = read_words(d.to_str().unwrap())?;
    assert!(words.len() > 1000);
    assert!(words[0].starts_with('A'));
    assert!(!words[0].contains('\n'));
    assert!(words[words.len() - 1].starts_with('Z'));
    Ok(())
}