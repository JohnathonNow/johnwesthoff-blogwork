use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub enum Incoming {
    Guess { guess: String },
    Image { image: String },
    Start {},
    Restart {},
}

#[derive(Serialize, Debug)]
pub enum Outgoing {
    Score {
        score: f32,
        id: String,
    },
    Info {
        prompt: String,
        score: f32,
        path: String,
    },
}
