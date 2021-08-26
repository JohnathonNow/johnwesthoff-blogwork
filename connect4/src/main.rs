mod lib;
use lib::*;

fn main() {
    let mut b = Board::new();
    let mut evaluator = Evaluator::new();
    let mut turn = 1;
    while b.is_won() == 0 && b.free_columns().len() > 0 {
        let x = evaluator.get_move(&b, turn);
        b.place(turn, x.slot);
        println!("{:?}", x);
        println!("{}", b);
        turn *= -1;
    }
}
