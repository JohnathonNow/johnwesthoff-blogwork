use std::{cmp::min, collections::HashMap, fmt::{Display}};

use rand::prelude::*;

const MAX_FUTURES: usize = 7;
const SCORE_THRESHOLD: i32 = 1000000;
const WEIGHT_WIN: i32 = 4;
const WEIGHT_LOSS: i32 = 5;
const WEIGHT_TIE: i32 = 1;

#[derive(Debug, Clone, Copy)]
struct Evaluation {
    piece: i8,
    slot: usize,
    wins: i32,
    losses: i32,
    ties: i32,
}

impl Evaluation {
    fn score(&self) -> i32 {
        self.wins*WEIGHT_WIN + self.ties*WEIGHT_TIE - self.losses*WEIGHT_LOSS
    }
    fn flip(&self) -> Self {
        Self::new(-self.piece, self.slot, self.losses, self.wins, self.ties)
    }
    fn add(&mut self, other: &Self) {
        self.wins += other.wins;
        self.losses += other.losses;
        self.ties += other.ties;
    }
}

impl Evaluation {
    fn new(piece: i8, slot: usize, wins: i32, losses: i32, ties: i32) -> Self { Self { piece, slot, wins, losses, ties } }
}

#[derive(Debug, Clone, Copy, Hash, PartialEq, Eq)]
struct Board {
    board: [[i8; 6] ; 7],
}

impl Display for Board {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let mut s = String::new();
        for col in (0..6).rev() {
            if col != 5 {
                s += "\n";
            }
            s += "|";
            for row in 0..7 {
                if row != 0 {
                    s += " ";
                }
                s += match self.board[row][col] {
                    1 => "X",
                    -1 => "O",
                    _ => " ",
                }
            }
            s += "|";
        }
        s += match self.is_won() {
            1 => "\n X won",
            -1 => "\n O won",
            _ => "",
        };
        f.write_str(s.as_str())
    }
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
   
    fn is_won_row(&self) -> i8 {
        for y in 0..6 {
            let mut in_a_row = 0;
            let mut last = 0;
            for x in 0..7 {
                if self.board[x][y] == last {
                    in_a_row += 1;
                    if in_a_row == 4 && last != 0{
                        return last;
                    }
                } else {
                    last = self.board[x][y];
                    in_a_row = 1;
                }
            }
        }
        0
    }

    fn is_won_col(&self) -> i8 {
        for x in 0..7 {
            let mut in_a_row = 0;
            let mut last = 0;
            for y in 0..6 {
                if self.board[x][y] == last {
                    in_a_row += 1;
                    if in_a_row == 4 && last != 0{
                        return last;
                    }
                } else {
                    last = self.board[x][y];
                    in_a_row = 1;
                }
            }
        }
        0
    }

    fn is_won_diag_lm(&self, row: usize, col: usize) -> i8 {
        let piece = self.board[row][col];
        let mut up = 0;
        let mut down = 0;
        for i in 0..4 {
            if col + i < 6 && row + i < 7 && self.board[row+i][col+i] == piece {
                down += 1;
            }
            if col > i && row + i < 7 && self.board[row+i][col-i] == piece {
                up += 1;
            }
        }
        if up == 4 || down == 4 {
            piece
        } else {
            0
        }
    }

    fn is_won_diag(&self) -> i8 {
        for x in 0..=3 {
            for y in 0..6 {
                let p = self.is_won_diag_lm(x, y);
                if p != 0 {
                    return p;
                }
            }
        }
        0
    }

    fn is_won(&self) -> i8 {
        let c = self.is_won_col();
        if c != 0 {
            return c;
        }
        let r = self.is_won_row();
        if r != 0 {
            return r;
        }
        self.is_won_diag()
    }

    fn free_columns(&self) -> Vec<usize> {
        let mut v = vec![];
        for i in 0..7 {
            if self.board[i][5] == 0 {
                v.push(i);
            }
        }
        v
    }
}

struct Evaluator{
    cache: HashMap<Board, Evaluation>
}
impl Evaluator{
    fn new() -> Self { Self { cache: HashMap::new() } }


    fn get_move(&mut self, b: &Board, piece: i8) -> Evaluation {
        if let Some(r) = self.cache.get(b) {
            *r
        } else {
        let b = *b;
        let mut possible_futures: Vec<(usize, Board)> = b.free_columns().iter().map(|i|{
            let mut y = b;
            y.place(piece, *i);
            (*i, y)
        }).collect();
        for (i, board) in &possible_futures {
            if board.is_won() == piece {
                return Evaluation::new(piece, *i, 1, 0, 0);
            }
        }
        let mut rng = rand::thread_rng();
        possible_futures.shuffle(&mut rng);
        let mut result = Evaluation::new(piece, 0, 0, 0, 1);
        let mut best = result;
        let mut first = true;
        for i in 0..min(MAX_FUTURES, possible_futures.len()) {
            let mut e = self.get_move(&possible_futures[i].1, -piece).flip();
            result.add(&e);
            if e.score() > best.score() || first {
                first = false;
                best = e;
                result.slot = possible_futures[i].0;
            }
            if e.score() > SCORE_THRESHOLD && SCORE_THRESHOLD != 0 {
                e.slot = possible_futures[i].0;
                return e;
            }
        }
        self.cache.insert(b, result);
        result
    }
}
}

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
