use serde::{Deserialize, Serialize};
use std::collections::HashMap;
#[derive(Serialize, Deserialize, Debug)]
pub enum Incoming {
    Guess { guess: String },
    Image { image: String },
    Assign {},
    Start {},
}

#[derive(Serialize, Debug, Clone, Copy)]
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
    pub fn tick_running(&mut self) {
        self.time += 1;

        let mut count_guesses = 0;
        let mut count_actives = 0;
        for (_name, player) in &self.players {
            if player.active {
                count_actives += 1;
                count_guesses += self.player_count_guesses(player);
            }
        }
        let (count_actives, count_guesses) = self.players.iter().filter(|(_, p)| p.active).fold((0, 0), |a, (_, p)| (a.0 + 1, a.1 + self.player_count_guesses(p)));
        if count_actives * (count_actives - 1) == count_guesses {
            self.state = GameState::POSTGAME;
        }
    }
    pub fn set_state(&mut self, new_state: GameState) {
        self.state = new_state;
    }
    pub fn get_state(&self) -> GameState {
        self.state
    }
    fn player_count_guesses(&self, player: &PlayerState) -> i32 {
        player.guess_list.keys().fold(0, |acc: i32, name| if self.player_is_active(name) {acc + 1} else {acc})
    }
    fn player_is_active(&self, name: &String) -> bool {
        if let Some(p) = self.players.get(name) {
            p.active
        } else {
            false
        }
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
    /*#[serde(skip_serializing)]
    word: String,*/
}

impl PlayerState {
    pub fn new() -> Self {
        Self {
            active: false,
            drawing: "".into(),
            score: 0,
            guess_list: HashMap::new(),
            //word: "".into(),
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
