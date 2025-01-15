use serde::{Deserialize, Serialize};

use crate::game;
#[derive(Serialize, Deserialize, Debug)]
pub enum Incoming {
    Guess { guess: String },
    Image { image: String },
    Start {},
    Restart {},
}

#[derive(Serialize, Debug)]
pub enum Outgoing {
    Guess {
        username: String,
        guess: String,
    },
    NewName {
        new_name: String,
    },
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
