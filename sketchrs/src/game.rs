use super::packets;
use futures::{SinkExt, StreamExt};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use strsim;
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
}

impl State {
    pub fn new(timelimit: i32, maxpoints: i32) -> Self {
        Self {
            peer_map: HashMap::new(),
            sendable: packets::State::new(timelimit, maxpoints),
            words: HashMap::new(),
            word_pool: Vec::new(),
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
    fn guess_is_good(&self, guess: &str, word: &str) -> bool {
        let distance = strsim::levenshtein(&guess.to_lowercase(), &word.to_lowercase());
        return distance <= guess.len().min(word.len()) / 5;
    }
    fn guess(&mut self, guesser: &String, guess: &String) -> Option<(i32, String)> {
        for (drawer, word) in &self.words {
            if self.guess_is_good(&*guess, &*word) && drawer != guesser {
                return Some((self.sendable.guess(drawer, guesser), drawer.clone()));
            }
        }
        None
    }
    fn restart(&mut self) {
        self.sendable.restart();
        self.words = HashMap::new();
    }
    fn assign_all(&mut self) {
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
    let (mut user_ws_tx, mut user_ws_rx) = ws.split();
    let mut die = false;
    {
        let mut gs = game_state.lock().unwrap();
        gs.sendable.set_host(&login_name);
        let pm: &mut packets::PlayerState = gs.sendable.get_player_mut(&login_name);
        if pm.is_active() {
            die = true;
        } else {
            gs.peer_map.insert(login_name.clone(), tx.clone());
        }
    }

    if die {
        let _ = user_ws_tx.send(Message::text(
            serde_json::to_string(&packets::Outgoing::NewName {
                new_name: login_name.clone(),
            })
            .unwrap(),
        )).await;
        return;
    }

    tokio::task::spawn(async move {
        {
            let mut gs = game_state.lock().unwrap();
            let pm: &mut packets::PlayerState = gs.sendable.get_player_mut(&login_name);
            pm.set_active(true);
        }
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

            println!("{}: {}", &login_name, message);
            if let Ok(packet) = serde_json::from_str::<packets::Incoming>(&message) {
                match packet {
                    packets::Incoming::Start {} => {
                        let mut gs = game_state.lock().unwrap();
                        if let Some(host) = gs.sendable.get_host() {
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
                    packets::Incoming::Restart {} => {
                        let mut gs = game_state.lock().unwrap();
                        if let Some(host) = gs.sendable.get_host() {
                            if host == &login_name {
                                gs.restart();
                            }
                        }
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
                        if let Some((time, drawer)) =
                            game_state.lock().unwrap().guess(&login_name, &guess)
                        {
                            let _ = gtx.send(
                                serde_json::to_string(&packets::Outgoing::Guessed {
                                    drawer,
                                    guesser: login_name.clone(),
                                    points: time,
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
                                    .get_player_mut(&login_name)
                                    .slice(i),
                                i,
                            })
                            .unwrap(),
                        );
                    }
                    packets::Incoming::Pull { i, username } => {
                        let _ = tx.send(
                            serde_json::to_string(&packets::Outgoing::Image {
                                username: username.clone(),
                                image: game_state
                                    .lock()
                                    .unwrap()
                                    .sendable
                                    .get_player_mut(&username)
                                    .slice(i),
                                i: i,
                            })
                            .unwrap(),
                        );
                    }
                    packets::Incoming::Undo { i } => {
                        game_state
                            .lock()
                            .unwrap()
                            .sendable
                            .get_player_mut(&login_name)
                            .undo(i);
                        let _ = gtx.send(
                            serde_json::to_string(&packets::Outgoing::Undo {
                                username: login_name.clone(),
                            })
                            .unwrap(),
                        );
                    }
                }
            }
        }

        let mut x = game_state.lock().unwrap();
        x.peer_map.remove(&login_name);
        x.sendable.get_player_mut(&login_name).set_active(false);
        let _ = gtx.send(
            serde_json::to_string(&packets::Outgoing::FullState { state: &x.sendable }).unwrap(),
        );
    });

    while let Ok(msg) = _rx.recv().await {
        let _ = user_ws_tx.send(Message::text(msg)).await;
    }
}
