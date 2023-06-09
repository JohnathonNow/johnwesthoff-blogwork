use serde::{Serialize, Deserialize};
#[derive(Serialize, Deserialize, Debug)]
pub enum Incoming {
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
}

#[derive(Serialize, Deserialize, Debug)]
pub enum Outgoing {
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
        assignment: String,
    },
}
