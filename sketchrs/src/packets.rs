use serde::{Deserialize, Serialize};

use crate::game;
#[derive(Serialize, Deserialize, Debug)]
pub enum Incoming {
    Guess { guess: String },
    Image { image: Vec<String> },
    Pull { i: i32, username: String },
    Assign {},
    Start {},
    Restart {},
    Undo { i: i32 },
}

#[derive(Serialize, Debug)]
pub enum Outgoing<'a> {
    Guess {
        username: String,
        guess: String,
    },
    Guessed {
        guesser: String,
        drawer: String,
        points: i32,
    },
    Image {
        username: String,
        image: &'a [String],
        i: i32,
    },
    Assign {
        username: String,
        assignment: String,
    },
    FullState {
        state: &'a game::SendableState,
    },
    Undo {
        username: String,
    },
    NewName {
        new_name: String,
    },
}
