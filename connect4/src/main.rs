#[derive(Debug, Clone, Copy)]
struct Board {
    board: [[i8; 6] ; 7],
}
impl Board {
    fn new() -> Self {
        Board { board: [[0;6];7] }
    }

    fn place(&mut self, piece: i8, row: usize) {
        for i in 0..6 {
            if self.board[row][i] == 0 {
                self.board[row][i] = piece;
                return;
            }
        }
    }
   
    fn is_won(&self) -> i8 {
        0     
    }
}
fn main() {
    let mut b = Board::new();
    b.place(1, 3);
    println!("{:?}", b);
}
