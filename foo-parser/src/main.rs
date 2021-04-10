use std::{
    collections::{HashMap, HashSet},
    error::Error,
    fs,
};
use walkdir::WalkDir;

fn main() -> Result<(), Box<dyn Error>> {
    let mut trigrams: HashMap<String, HashSet<String>> = HashMap::new();

    for entry in WalkDir::new("./foo")
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();

        if path.is_file() {
            if let Ok(contents) = fs::read_to_string(path) {
                let fname = entry.file_name().to_string_lossy().to_ascii_lowercase().replace(&['\'', '(', ')', ',', '.'][..], "");
                let contentsv = contents.replace("'", "").to_lowercase();
                let words: Vec<&str> = contentsv.split_whitespace().collect();
                for i in 0..words.len() - 3 {
                    let s = format!("{} {} {}", words[i], words[i + 1], words[i + 2]);
                    if let Some(x) = trigrams.get_mut(&s) {
                        x.insert(fname.to_string());
                    } else {
                        let mut y = HashSet::new();
                        y.insert(fname.to_string());
                        trigrams.insert(s, y);
                    }
                }
            }
        }
    }
    let mut longest: Option<HashSet<String>> = None;
    for (k, v) in trigrams {
        if v.len() > 1 {
            println!("{}: {:?}", k, v)
        }
        if let Some(x) = &longest {
            if x.len() < v.len() {
                longest = Some(v);
            }
        } else {
            longest = Some(v);
        }
    }
    println!("{:?}", longest);

    Ok(())
}
