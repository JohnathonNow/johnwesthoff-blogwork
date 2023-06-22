use serde::{Deserialize, Serialize};
use std::collections::HashMap;
#[derive(Serialize, Deserialize, Debug)]
pub enum Incoming {
    Guess { username: String, guess: String },
    Image { username: String, image: String },
    Assign {},
    Start {},
}

#[derive(Serialize, Debug)]
pub enum GameState {
    LOBBY,
    RUNNING,
    POSTGAME,
}

#[derive(Serialize, Debug)]
pub struct State {
    players: HashMap<String, PlayerState>,
    state: GameState,
    time: i32,
}

impl State {
    pub fn new() -> Self {
        Self {
            players: HashMap::new(),
            state: GameState::LOBBY,
            time: 0,
        }
    }
    pub fn get_player_mut(&mut self, name: &String) -> &mut PlayerState {
        if let None = self.players.get_mut(name) {
            self.players.insert(name.clone(), PlayerState::new());
        }
        self.players.get_mut(name).unwrap()
    }
    pub fn set_state(&mut self, new_state: GameState) {
        self.state = new_state;
    }
    pub fn guess(&mut self, drawer: &String, guesser: &String) -> i32 {
        let time = self.time;
        let player = self.get_player_mut(drawer);
        if let None = player.guess_list.get(guesser) {
            player.guess_list.insert(guesser.clone(), time);
            self.time
        } else {
            0
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PlayerState {
    active: bool,
    drawing: String,
    score: i32,
    guess_list: HashMap<String, i32>,
}

impl PlayerState {
    pub fn new() -> Self {
        Self {
            active: false,
            drawing: "".into(),
            score: 0,
            guess_list: HashMap::new(),
        }
    }
    pub fn set_active(&mut self, active: bool) {
        self.active = active
    }
    pub fn set_drawing(&mut self, drawing: String) {
        self.drawing = drawing
    }
}

#[derive(Serialize, Debug)]
pub enum Outgoing<'a> {
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
    FullState {
        state: &'a State,
    },
}
