#[derive(Debug)]
struct Board {
    board: [[i8; 6] ; 7],
}
impl Board {
    fn new() -> Self {
        Board { board: [[0;6];7] }
    }
}
fn main() {
    let b = Board::new();
    println!("{:?}", b);
}
