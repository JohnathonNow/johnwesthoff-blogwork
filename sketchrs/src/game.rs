use super::packets;
use futures::{SinkExt, StreamExt};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::broadcast;
use warp::ws::{Message, WebSocket};

pub type GameState = Arc<Mutex<State>>;
type PeerMap = HashMap<String, broadcast::Sender<String>>;
type Words = HashMap<String, String>;

pub struct State {
    pub peer_map: PeerMap,
    sendable: packets::State,
    words: Words,
    word_pool: Vec<String>,
    host: Option<String>,
}

impl State {
    pub fn new() -> Self {
        Self {
            peer_map: HashMap::new(),
            sendable: packets::State::new(),
            words: HashMap::new(),
            word_pool: Vec::new(),
            host: None,
        }
    }
    fn broadcast_state(&self) {
        self.broadcast(
            serde_json::to_string(&packets::Outgoing::FullState {
                state: &self.sendable,
            })
            .unwrap(),
        );
    }
    fn broadcast(&self, message: String) {
        for (_, tx) in self.peer_map.iter() {
            tx.send(message.clone()).unwrap_or(0);
        }
    }
    fn guess(&mut self, guesser: &String, guess: &String) -> Option<i32> {
        for (drawer, word) in &self.words {
            if word == guess && drawer != guesser {
                return Some(self.sendable.guess(drawer, guesser));
            }
        }
        None
    }
    fn assign_all(&mut self) {
        println!("{:?}", self.word_pool);
        for (p, tx) in self.peer_map.iter() {
            let word = if let Some(x) = self.words.get(p) {
                x.clone()
            } else {
                let word = self.word_pool.pop().unwrap();
                self.words.insert(p.clone(), word.clone());
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
        println!("{:?}", self.words);
    }
    fn assign_word(&mut self, drawer: &String) -> String {
        if let Some(x) = self.words.get(drawer) {
            return x.clone();
        } else {
            let word = self.word_pool.pop().unwrap();
            self.words.insert(drawer.clone(), word.clone());
            word
        }
    }
    pub fn add_words(&mut self, words: Vec<String>) {
        self.word_pool.extend(words);
    }
    pub fn tick(&mut self) {
        match self.sendable.get_state() {
            packets::GameState::LOBBY => {}
            packets::GameState::RUNNING => {
                self.sendable.tick_running();
                if self.sendable.is_over() {
                    self.sendable.set_state(packets::GameState::POSTGAME);
                    self.broadcast_state();
                }
            }
            packets::GameState::POSTGAME => {}
        }
    }
}

pub async fn handle(
    ws: WebSocket,
    game_state: GameState,
    gtx: broadcast::Sender<String>,
    login_name: String,
) {
    let (tx, mut _rx) = broadcast::channel::<String>(100);

    {
        let mut gs = game_state.lock().unwrap();
        if gs.host.is_none() {
            gs.host = Some(login_name.clone());
        }
        gs.peer_map.insert(login_name.clone(), tx.clone());
        drop(gs);
    }
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
                    packets::Incoming::Guess { guess } => {
                        if let Some(time) = game_state.lock().unwrap().guess(&login_name, &guess) {
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
                    packets::Incoming::Image { image } => {
                        let i = game_state
                            .lock()
                            .unwrap()
                            .sendable
                            .get_player_mut(&login_name)
                            .add_drawing(&mut image.clone());
                        let _ = gtx.send(
                            serde_json::to_string(&packets::Outgoing::Image {
                                username: login_name.clone(),
                                image: game_state
                                .lock()
                                .unwrap()
                                .sendable
                                .get_player_mut(&login_name).slice(i),
                                i
                            })
                            .unwrap(),
                        );
                    }
                    packets::Incoming::Pull { i , username } => {
                    let _ = tx.send(
                        serde_json::to_string(&packets::Outgoing::Image {
                            username: username.clone(),
                            image: game_state
                            .lock()
                            .unwrap()
                            .sendable
                            .get_player_mut(&username).slice(i),
                            i: i
                        })
                        .unwrap(),
                    );
                    },
                    packets::Incoming::Undo { i } => {
                        game_state
                            .lock()
                            .unwrap()
                            .sendable
                            .get_player_mut(&login_name)
                            .undo(i);
                        let _ = gtx.send(
                            serde_json::to_string(&packets::Outgoing::Undo {
                                username: login_name.clone()
                            })
                            .unwrap(),
                        );
                    },
                }
            }
        }

        let mut x = game_state.lock().unwrap();
        x.peer_map.remove(&login_name);
        x.sendable.get_player_mut(&login_name).set_active(false);
        let _ = gtx.send(
            serde_json::to_string(&packets::Outgoing::FullState {
                state: &x.sendable,
            })
            .unwrap(),
        );
    });

    while let Ok(msg) = _rx.recv().await {
        let _ = user_ws_tx.send(Message::text(msg)).await;
    }
}
