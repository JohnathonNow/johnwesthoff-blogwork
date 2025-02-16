use super::packets;
use chrono::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc};
use async_mutex::Mutex;
use tokio::sync::broadcast;
use warp::ws::{Message, WebSocket};
use std::fs::File;
use std::io::{Write, BufWriter};
use base64::Engine;
use reqwest::Error;
use std::fs;
use uuid::Uuid;
use tokio_rusqlite::Connection;
use sqids::Sqids;
use reqwest;


const MAX: f32 = 175.0;

pub type GameServerState = Arc<Mutex<State>>;

#[derive(Serialize, Deserialize, Debug)]
pub struct Word {
    pub word: String,
    pub embedding: Vec<f32>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Vector {
    pub inner: Vec<f32>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Options {
    pub offset: Vec<f32>,
    pub blank: Vec<f32>,
}

pub struct State {
    word_pool: HashMap<String, Word>,
    embedding: Vec<f32>,
    word: String,
    offset_embedding: Vec<f32>,
    blank_embedding: Vec<f32>,
    db: Connection,
}

impl State {
    pub async fn new() -> Self {

        //TODO: improve this?
        let config: Options = serde_json::from_str::<Options>(&fs::read_to_string("./resources/offsets.json").unwrap()).unwrap();
        let db = Connection::open("./resources/saves.db").await.unwrap();
        db.call(|conn| Ok(conn.execute( //lol OK Brian Kelly
            "CREATE TABLE IF NOT EXISTS saves(
                id      INTEGER PRIMARY KEY,
                prompt  TEXT,
                path    TEXT,
                score   REAL,
                ip      TEXT
            )",
            ()
        ))).await.unwrap();
        Self {
            word_pool: HashMap::new(),
            embedding: vec![],
            word: "".to_string(),
            offset_embedding: config.offset,
            blank_embedding: config.blank,
            db
        }
    }

    async fn score(&self, file: &str) -> Result<f32, ()> {
		let request_url = format!("http://localhost:9991/?path={}", file);
		let client = reqwest::Client::new();
		let response = client
			.get(request_url)
			.send().await.unwrap()
            .json::<Vector>().await.unwrap();

        return Ok(response.inner
                .iter()
                .zip(self.offset_embedding.iter())
                .map(|(&x1, &x2)| (x1 - x2))
                .zip(self.embedding.iter())
                .map(|(x1, &x2)| (x1 - x2).powi(2))
                .sum())
        //f32::INFINITY
    }

    fn restart(&mut self) {
        let date = format!("{}", Utc::now().format("%Y-%m-%d"));
        if let Some(word) = self.word_pool.get(&date) {
            self.embedding = word.embedding.clone();
            self.word = word.word.clone();
        }
    }
    pub fn add_words(&mut self, words: HashMap<String, Word>) {
        self.word_pool.extend(words);
        self.restart();
    }
    pub fn tick(&mut self) {
        self.restart();
    }
}

pub async fn word(game_state: GameServerState) -> String {
    let mut gs = game_state.lock().await;
    gs.word.clone()
}

pub async fn judge(game_state: GameServerState, image: &str, ip: &str) -> Result<packets::Outgoing, ()> {
    //TODO: No unwraps
    let mut gs = game_state.lock().await;
    let path = &format!("frontend/drawings/{}-{}.png", &gs.word, &Uuid::new_v4());
    let _ = save_png_from_data_url(&image, path);
    let score = f32::max(MAX - gs.score(path).await.unwrap(), 0.0);
    let ip = ip.to_string();
    let word = gs.word.clone();
    let path = path.to_string();
    let id = gs.db.call(move |conn| {
        let mut prepared = conn.prepare(
            "INSERT INTO saves (prompt, path, score, ip)
            VALUES (?, ?, ?, ?) RETURNING id"
        ).unwrap();
        let mut rows = prepared.query((&word, &path, score, &ip)).unwrap();
        Ok(rows.next().unwrap().unwrap().get(0).unwrap())
    }).await.unwrap();
    println!("Wow, score is {}", score);
    let sqids = Sqids::default();
    let id = sqids.encode(&[id]).unwrap();
    Ok(packets::Outgoing::Score {
        score,
        id
    })
}

pub async fn info(game_state: GameServerState, id: &str) -> (String, String, f32) {
    //TODO: No unwraps
    let sqids = Sqids::default();
    let id = sqids.decode(&id)[0];
    let mut gs = game_state.lock().await;
    gs.db.call(move |conn| {
        let mut prepared = conn.prepare(
            "SELECT prompt, path, score FROM saves 
            WHERE id = ?"
        ).unwrap();
        let mut rows = prepared.query([&id]).unwrap();
        let mut row = rows.next().unwrap().unwrap();
        Ok((
            row.get(0).unwrap(),
            row.get(1).unwrap(),
            row.get(2).unwrap()
        ))
    }).await.unwrap()
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


