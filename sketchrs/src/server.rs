
use crate::{player::Player, environment::{Environment, EnvironmentEvent}};

pub struct Server {
    env: Environment,
    players: Vec<Player>,
}

impl Server {
    pub fn new() -> Self {
        Self { env: Environment::new(), players: Vec::new() } 
    }
    
    pub fn env_queue(&mut self, s: String, i: i32) {
        self.env.enqueue(EnvironmentEvent::MESSAGE{text: s}, i);
    }

    pub fn login(&mut self) {
        self.players.push(Player::new());
    }

    pub fn player_walk(&mut self, i: usize, x: i32, y: i32) -> Option<()> {
        self.players.get_mut(i)?.walk(x, y);
        Some(())
    }

    pub fn tick(&mut self) {
        self.env.tick();
        for player in &mut self.players {
            player.tick();
        }
    }
}
