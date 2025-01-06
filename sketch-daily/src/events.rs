use std::collections::HashMap;
use serde::{Serialize, Deserialize};
#[derive(Serialize, Deserialize, Debug)]
pub enum Incoming {
    Connect {
        client: u64,
    },
    Login {
        username: String,
    },
    Guess {
        username: String,
        guess: String,
    },
    Image {
        username: String,
        image: String,
    },
    Assign {
        username: String,
        word: String,
        client: u64,
    },
    Disconnect {
        client: u64,
        username: String,
    },
}