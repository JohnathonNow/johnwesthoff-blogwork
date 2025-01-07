use super::packets;
use futures::{SinkExt, StreamExt};
use chrono::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::broadcast;
use warp::ws::{Message, WebSocket};
use std::fs::File;
use std::io::{Write, BufWriter};
use base64::Engine;
use fastembed::{ImageEmbedding, ImageInitOptions, ImageEmbeddingModel};
use std::fs;
use uuid::Uuid;


const MAX: f32 = 175.0;

pub type GameServerState = Arc<Mutex<State>>;

#[derive(Serialize, Deserialize, Debug)]
pub struct Word {
    pub word: String,
    pub embedding: Vec<f32>,
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
    ai: ImageEmbedding,
}

impl State {
    pub fn new(timelimit: i32, maxpoints: i32, end_on_time: bool) -> Self {

        let ai = ImageEmbedding::try_new(
            ImageInitOptions::new(ImageEmbeddingModel::ClipVitB32).with_show_download_progress(true),
        ).unwrap(); //we can die without the model at load
        //TODO: improve this?
        let config: Options = serde_json::from_str::<Options>(&fs::read_to_string("./resources/offsets.json").unwrap()).unwrap();

        Self {
            word_pool: HashMap::new(),
            embedding: vec![],
            word: "".to_string(),
            offset_embedding: config.offset,
            blank_embedding: config.blank,
            ai,
        }
    }
    fn score(&self, file: &str) -> f32 {
        let images = vec![file];
        if let Ok(embeddings) = self.ai.embed(images, None) {
            embeddings[0]
                .iter()
                .zip(self.offset_embedding.iter())
                .map(|(&x1, &x2)| (x1 - x2))
                .zip(self.embedding.iter())
                .map(|(x1, &x2)| (x1 - x2).powi(2))
                .sum()
        }
        else {
            f32::INFINITY
        }
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

pub fn word(game_state: GameServerState) -> String {
    let mut gs = game_state.lock().unwrap();
    gs.word.clone()
}

pub fn judge(game_state: GameServerState, image: &str) -> packets::Outgoing {
    let mut gs = game_state.lock().unwrap();
    let path = &format!("frontend/drawings/{}-{}.png", &gs.word, &Uuid::new_v4());
    let _ = save_png_from_data_url(&image, path);
    let score = gs.score(path);
    println!("Wow, score is {}", score);
    packets::Outgoing::Score {
        score: f32::max(MAX - score, 0.0),
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


