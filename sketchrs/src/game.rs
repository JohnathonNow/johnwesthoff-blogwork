use super::packets;
use futures::{SinkExt, StreamExt};
use serde::Serialize;
use std::cmp;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use strsim;
use tokio::sync::broadcast;
use warp::ws::{Message, WebSocket};

pub type GameServerState = Arc<Mutex<State>>;
type PeerMap = HashMap<String, broadcast::Sender<String>>;
type Words = HashMap<String, String>;

const MAX_NAME_LENGTH: usize = 24;


pub struct State {
    pub peer_map: PeerMap,
    sendable: SendableState,
    words: Words,
    word_pool: Vec<String>,
}

impl State {
    pub fn new(timelimit: i32, maxpoints: i32, end_on_time: bool) -> Self {
        Self {
            peer_map: HashMap::new(),
            sendable: SendableState::new(timelimit, maxpoints, end_on_time),
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
            GameState::LOBBY => {}
            GameState::RUNNING => {
                self.sendable.tick_running();
                if self.sendable.is_over() {
                    self.sendable.set_state(GameState::POSTGAME);
                    self.broadcast_state();
                }
            }
            GameState::POSTGAME => {}
        }
    }
}

pub async fn handle(
    ws: WebSocket,
    game_state: GameServerState,
    gtx: broadcast::Sender<String>,
    login_name_pre: String,
) {
    let login_name = truncate(&login_name_pre, MAX_NAME_LENGTH).to_string();
    let (tx, mut _rx) = broadcast::channel::<String>(100);
    let (mut user_ws_tx, mut user_ws_rx) = ws.split();
    let mut die = false;
    {
        let mut gs = game_state.lock().unwrap();
        gs.sendable.set_host(&login_name);
        let pm: &mut PlayerState = gs.sendable.get_player_mut(&login_name);
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
            let pm: &mut PlayerState = gs.sendable.get_player_mut(&login_name);
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
                                gs.sendable.set_state(GameState::RUNNING);
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

#[derive(Serialize, Debug, Clone, Copy)]
pub enum GameState {
    LOBBY,
    RUNNING,
    POSTGAME,
}

#[derive(Serialize, Debug)]
pub struct SendableState {
    players: HashMap<String, PlayerState>,
    state: GameState,
    host: Option<String>,
    time: i32,
    timelimit: i32,
    maxpoints: i32,
    end_on_time: bool,
}

impl SendableState {
    pub fn new(timelimit: i32, maxpoints: i32, end_on_time: bool) -> Self {
        Self {
            players: HashMap::new(),
            state: GameState::LOBBY,
            time: 0,
            host: None,
            timelimit,
            maxpoints,
            end_on_time
        }
    }
    pub fn restart(&mut self) {
        self.set_state(GameState::LOBBY);
        self.time = 0;
        for (_name, p) in self.players.iter_mut() {
            p.restart();
        }
    }
    pub fn get_host(&self) -> Option<&String> {
        self.host.as_ref().map(|x| x)
    }
    pub fn set_host(&mut self, new_host: &str) {
        if self.host.is_none() {
            self.host = Some(new_host.to_string());
        }
    }
    pub fn get_player_mut(&mut self, name: &String) -> &mut PlayerState {
        if let None = self.players.get_mut(name) {
            self.players.insert(name.clone(), PlayerState::new());
        }
        self.players.get_mut(name).unwrap()
    }
    pub fn tick_running(&mut self) {
        self.time += 1;
    }
    pub fn is_over(&self) -> bool {
        let (count_actives, count_guesses) = self
            .players
            .iter()
            .filter(|(_, p)| p.active)
            .fold((0, 0), |a, (_, p)| {
                (a.0 + 1, a.1 + self.player_count_guesses(p))
            });
        count_actives * (count_actives - 1) == count_guesses || (self.end_on_time && self.time > self.timelimit)
    }
    pub fn set_state(&mut self, new_state: GameState) {
        self.state = new_state;
    }
    pub fn get_state(&self) -> GameState {
        self.state
    }
    fn player_count_guesses(&self, player: &PlayerState) -> i32 {
        player.guess_list.keys().fold(0, |acc: i32, name| {
            if self.player_is_active(name) {
                acc + 1
            } else {
                acc
            }
        })
    }
    fn player_is_active(&self, name: &String) -> bool {
        if let Some(p) = self.players.get(name) {
            p.active
        } else {
            false
        }
    }
    pub fn guess(&mut self, drawer: &String, guesser: &String) -> i32 {
        let points = if self.time >= self.timelimit {
            0
        } else {
            (((self.timelimit / self.maxpoints) + self.timelimit - self.time) * self.maxpoints) / self.timelimit
        };
        let player = self.get_player_mut(drawer);
        if let None = player.guess_list.get(guesser) {
            player.guess_list.insert(guesser.clone(), points);
            player.score += points / 5;
            self.get_player_mut(guesser).score += points;
            points
        } else {
            0
        }
    }
}

#[derive(Serialize, Debug)]
pub struct PlayerState {
    active: bool,
    #[serde(skip_serializing)]
    drawing: Vec<String>,
    score: i32,
    guess_list: HashMap<String, i32>,
    /*#[serde(skip_serializing)]
    word: String,*/
}

impl PlayerState {
    pub fn new() -> Self {
        Self {
            active: false,
            drawing: Vec::new(),
            score: 0,
            guess_list: HashMap::new(),
            //word: "".into(),
        }
    }
    pub fn restart(&mut self) {
        self.drawing = Vec::new();
        self.guess_list = HashMap::new();
        self.score = 0;
    }
    pub fn set_active(&mut self, active: bool) {
        self.active = active
    }
    pub fn add_drawing(&mut self, drawing: &mut Vec<String>) -> i32 {
        let i = self.drawing.len();
        self.drawing.append(drawing);
        i as i32
    }
    pub fn is_active(&self) -> bool {
        self.active
    }
    pub fn undo(&mut self, i: i32) {
        let newlen = self.drawing.len().saturating_sub(i as usize);
        self.drawing.truncate(newlen);
    }
    pub fn slice(&self, i: i32) -> &[String] {
        &self.drawing[cmp::min(i as usize, self.drawing.len())..self.drawing.len()]
    }
}

fn truncate(s: &str, max_chars: usize) -> &str {
    match s.char_indices().nth(max_chars) {
        None => s,
        Some((idx, _)) => &s[..idx],
    }
}