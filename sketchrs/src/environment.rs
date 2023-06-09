use priority_queue::PriorityQueue;


#[derive(Hash, PartialEq, Eq)]
pub enum EnvironmentEvent {
    MESSAGE{text: String},
}

struct EnvironmentQueue {
    queue: PriorityQueue<EnvironmentEvent, i32>,
}

impl EnvironmentQueue {
    fn new(queue: PriorityQueue<EnvironmentEvent, i32>) -> Self { Self { queue } }
    pub fn enqueue(&mut self, event: EnvironmentEvent, priority: i32) {
        self.queue.push(event, priority);
    }
}

pub struct Environment {
    queue: EnvironmentQueue,
}

impl Environment {
    pub fn new() -> Self { Self { queue: EnvironmentQueue::new(PriorityQueue::new()) } }
    pub fn enqueue(&mut self, event: EnvironmentEvent, priority: i32) {
        self.queue.enqueue(event, priority);
    }
    pub fn tick(&mut self) {

    }
}