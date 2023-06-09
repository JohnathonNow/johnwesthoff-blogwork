use priority_queue::PriorityQueue;

#[derive(Hash, PartialEq, Eq)]
enum PlayerEvent {
    WALK{x: i32, y: i32},
}

struct PlayerQueue {
    queue: PriorityQueue<PlayerEvent, i32>,
}

impl PlayerQueue {
    fn new() -> Self { Self { queue: PriorityQueue::new() } }
}

pub struct Player {
    x: i32,
    y: i32,
    queue: PlayerQueue,
}

impl Player {
    pub fn tick(&mut self) {
        if let Some(event) = self.queue.queue.pop() {
            match event.0 {
                PlayerEvent::WALK { x, y } => {
                    self.x = x;
                    self.y = y;
                },
            }
        }
        
    }
    pub fn walk(&mut self, x: i32, y: i32) {
        self.queue.queue.push(PlayerEvent::WALK{x, y}, 0);
    }
    pub fn new() -> Self {
        Self{ x: 0, y: 0, queue: PlayerQueue::new()}
    }
}
