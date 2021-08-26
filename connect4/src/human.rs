use std::io::{self, BufRead};

mod lib;
use lib::*;

fn main() {
    let mut b = Board::new();
    let mut evaluator = Evaluator::new();
    let mut turn = 1;
    let stdin = io::stdin();
    while b.is_won() == 0 && b.free_columns().len() > 0 {
        let x = if turn == -1 {
            evaluator.get_move(&b, turn).slot
        } else {
            let mut buffer = String::new();
            stdin.lock().read_line(&mut buffer).unwrap();
            buffer.trim().parse().unwrap()
        };
        b.place(turn, x);
        println!("{}\n", b);
        turn *= -1;
    }
}
