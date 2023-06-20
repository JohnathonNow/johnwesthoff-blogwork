use std::collections::HashMap;
use serde::{Serialize, Deserialize};
#[derive(Serialize, Deserialize, Debug)]
pub enum Incoming {
    Guess {
        username: String,
        guess: String,
    },
    Image {
        username: String,
        image: String,
    },
}

#[derive(Serialize, Debug)]
pub struct State {
    players: HashMap<String, PlayerState>,
    started: bool,
    time: i32,   
}

impl State {
    pub fn new() -> Self { Self { players: HashMap::new(), started: false, time: 0 } }
    pub fn get_player_mut(&mut self, name: &String) -> &mut PlayerState {
        if let None = self.players.get_mut(name) {
            self.players.insert(name.clone(), PlayerState::new());
        } 
        self.players.get_mut(name).unwrap()
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
    pub fn new() -> Self { Self { active: false, drawing: "".into(), score: 0, guess_list: HashMap::new() } }
    pub fn set_active(&mut self, active: bool) {self.active = active }
    pub fn set_drawing(&mut self, drawing: String) {self.drawing = drawing }

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
        state: &'a State
    }
}

