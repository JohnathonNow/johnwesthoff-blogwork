use std::{cmp::{max, min}, collections::HashMap, error::Error, fs};
use walkdir::{DirEntry, WalkDir};

const THRESHOLD: i32 = 70;

type Tracker = HashMap<String, i32>;

fn is_similar(a: &Tracker, b: &Tracker) -> bool {
    let mut score = 0;
    for (k, v) in a {
        if let Some(x) = b.get(k) {
            score += min(x, v);
        }
    }
    let len = max(a.len(), b.len()) as i32;
    return score * 100 / len > THRESHOLD;
}

fn find_trigrams(entry: &DirEntry) -> Tracker {
    let mut trigrams: Tracker = HashMap::new();
    let path = entry.path();
    if path.is_file() {
        if let Ok(contents) = fs::read_to_string(path) {
            let contentsv = contents.replace("'", "").to_lowercase();
            let words: Vec<&str> = contentsv.split_whitespace().collect();
            for i in 0..words.len() - 3 {
                let s = format!("{} {} {}", words[i], words[i + 1], words[i + 2]);
                if let Some(x) = trigrams.get_mut(&s) {
                    *x += 1;
                } else {
                    trigrams.insert(s, 1);
                }
            }
        }
    }
    return trigrams;
}

fn handle_file(entry: &DirEntry, others: &[DirEntry]) {
    let my_trigrams = find_trigrams(entry);
    let my_fname = entry.file_name().to_string_lossy();

    for other_entry in others {
        let other_trigrams = find_trigrams(&other_entry);
        let other_fname = other_entry.file_name().to_string_lossy();
        if is_similar(&my_trigrams, &&other_trigrams) {
            println!("rm \"{}\" # same as {}", other_fname, my_fname);
        }
    }
}

fn main() -> Result<(), Box<dyn Error>> {
    let v: Vec<DirEntry> = WalkDir::new(".")
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
        .collect();
    for i in 0..v.len() {
        handle_file(&v[i], &v[i+1..]);
    }
    Ok(())
}
