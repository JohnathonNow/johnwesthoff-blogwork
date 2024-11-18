use super::packets;
use futures::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::broadcast;
use warp::ws::{Message, WebSocket};
use std::fs::File;
use std::io::{Write, BufWriter};
use base64::Engine;
use fastembed::{ImageEmbedding, ImageInitOptions, ImageEmbeddingModel};

pub type GameServerState = Arc<Mutex<State>>;
type PeerMap = HashMap<String, broadcast::Sender<String>>;

const MAX_NAME_LENGTH: usize = 24;

#[derive(Serialize, Deserialize, Debug)]
pub struct Word {
    pub word: String,
    pub embedding: Vec<f32>,
}

pub struct State {
    pub peer_map: PeerMap,
    sendable: SendableState,
    word_pool: Vec<Word>,
    embedding: Vec<f32>,
    ai: ImageEmbedding,
}

impl State {
    pub fn new(timelimit: i32, maxpoints: i32, end_on_time: bool) -> Self {

        let ai = ImageEmbedding::try_new(
            ImageInitOptions::new(ImageEmbeddingModel::ClipVitB32).with_show_download_progress(true),
        ).unwrap(); //we can die without the model at load

        Self {
            peer_map: HashMap::new(),
            sendable: SendableState::new("".into(), timelimit, maxpoints, end_on_time),
            word_pool: Vec::new(),
            embedding: vec![],
            ai,
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
    fn score(&self, file: &str) -> f32 {
        let images = vec![file];
        if let Ok(embeddings) = self.ai.embed(images, None) {
            embeddings[0]
                .iter()
                .zip(self.embedding.iter())
                .map(|(&x1, &x2)| (x1 - x2).powi(2))
                .sum()
        }
        else {
            f32::INFINITY
        }
    }
    fn restart(&mut self) {
        if let Some(word) = self.word_pool.pop() {
            self.sendable.word = word.word;
            self.embedding = word.embedding;
        }
        self.sendable.restart();
    }
    pub fn add_words(&mut self, words: Vec<Word>) {
        self.word_pool.extend(words);
        self.restart();
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
                    packets::Incoming::Guess { guess } => {
                        let _ = gtx.send(
                            serde_json::to_string(&packets::Outgoing::Guess {
                                username: login_name.clone(),
                                guess,
                            })
                            .unwrap(),
                        );
                    }
                    packets::Incoming::Image { image } => {
                        let mut gs = game_state.lock().unwrap();
                        let path = &format!("frontend/drawings/{}-{}.png", &login_name, &gs.sendable.wordname());
                        let _ = save_png_from_data_url(&image, path);
                        let score = gs.score(path);
                        println!("Wow, score is {}", score);
                        gs.sendable.get_player_mut(&login_name).score = score;
                        let _ = gtx.send(
                            serde_json::to_string(&packets::Outgoing::Score {
                                score,
                            })
                            .unwrap(),
                        );
                        gs.broadcast_state();
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
    word: String,
    host: Option<String>,
    time: i32,
    timelimit: i32,
    maxpoints: i32,
    end_on_time: bool,
}

impl SendableState {
    pub fn new(word: String, timelimit: i32, maxpoints: i32, end_on_time: bool) -> Self {
        Self {
            players: HashMap::new(),
            state: GameState::LOBBY,
            word,
            host: None,
            time: 0,
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
        self.end_on_time && self.time > self.timelimit
    }
    pub fn set_state(&mut self, new_state: GameState) {
        self.state = new_state;
    }
    pub fn get_state(&self) -> GameState {
        self.state
    }
    pub fn wordname(&self) -> String {
        self.word.replace(" ", "-")
    }
}

#[derive(Serialize, Debug)]
pub struct PlayerState {
    active: bool,
    score: f32,
}

impl PlayerState {
    pub fn new() -> Self {
        Self {
            active: false,
            score: 0.0,
        }
    }
    pub fn restart(&mut self) {
        self.score = 0.0;
    }
    pub fn set_active(&mut self, active: bool) {
        self.active = active
    }
    pub fn is_active(&self) -> bool {
        self.active
    }
}

fn truncate(s: &str, max_chars: usize) -> &str {
    match s.char_indices().nth(max_chars) {
        None => s,
        Some((idx, _)) => &s[..idx],
    }
}


fn save_png_from_data_url(data_url: &str, output_path: &str) -> std::io::Result<()> {
    // Step 1: Extract the base64-encoded part (strip off the data URL prefix)
    let base64_data = if let Some(comma_pos) = data_url.find(",") {
        &data_url[comma_pos + 1..]
    } else {
        return Err(std::io::Error::new(std::io::ErrorKind::InvalidData, "Invalid data URL"));
    };

    // Step 2: Decode the base64 string
    let decoded_data = base64::prelude::BASE64_STANDARD.decode(base64_data).map_err(|_| {
        std::io::Error::new(std::io::ErrorKind::InvalidData, "Failed to decode base64 data")
    })?;

    // Step 3: Write the decoded bytes to a PNG file
    let file = File::create(output_path)?;
    let mut writer = BufWriter::new(file);
    writer.write_all(&decoded_data)?;
    Ok(())
}


