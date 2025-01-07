use serde::Deserialize;
use std::error::Error;
use std::sync::{Arc, Mutex};
use std::fs;
use std::time::Duration;
use tokio::sync::broadcast;
use tokio::{task, time};
use warp::Filter;
use clap::Parser;
use rand::thread_rng;
use std::collections::HashMap;
use rand::seq::SliceRandom;

mod packets;
mod game;
mod args;

#[derive(Deserialize)]
struct Query {
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let cliargs = args::Args::parse();
    let mut inner_game_state = game::State::new(cliargs.timelimit, cliargs.maxpoints, cliargs.endontime);
    inner_game_state.add_words(read_words(&cliargs.words)?);
    let game_state: game::GameServerState = Arc::new(Mutex::new(inner_game_state));


    // TODO: return today's word
    let ws_route = warp::path("word")
        .and(with_game_state(game_state.clone()))
        .map(|game_state| {
            game::word(game_state)
        });

    // TODO: add route for scoring
    let judge = warp::path("judge")
        .and(warp::body::content_length_limit(1024 * 1024 * 32))
        .and(warp::body::json())
        .and(with_game_state(game_state.clone()))
        .map(|map: HashMap<String, String>, game_state| {
            warp::reply::json(&game::judge(game_state, map.get("image").unwrap_or(&"".to_string())))
        });

    let static_files = warp::fs::dir("frontend");
    let routes = ws_route.or(static_files).or(judge);

    let forever = task::spawn(async move {
        let mut interval = time::interval(Duration::from_millis(1000));

        loop {
            interval.tick().await;
            game_state.lock().unwrap().tick();
        }
    });
    let server = task::spawn(async move {warp::serve(routes).run(([0, 0, 0, 0], cliargs.port)).await;});

    (forever.await?, server.await?);

    Ok(())
}

fn with_game_state(
    game_state: game::GameServerState,
) -> impl Filter<Extract = (game::GameServerState,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || game_state.clone())
}

fn with_broadcast(
    gtx: broadcast::Sender<String>,
) -> impl Filter<Extract = (broadcast::Sender<String>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || gtx.clone())
}


fn read_words(path: &str) -> Result<HashMap<String, game::Word>, Box<dyn Error>> {
    let mut words: HashMap<String, game::Word> = serde_json::from_str::<HashMap<String, game::Word>>(&fs::read_to_string(path)?)?;
    Ok(words)
}

#[test]
fn test_read_words() -> Result<(), Box<dyn Error>> {
    use std::path::PathBuf;
    let mut d = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    d.push("resources/words.txt");
    let words = read_words(d.to_str().unwrap())?;
    assert!(words.len() > 1000);
    assert!(words[0].starts_with('A'));
    assert!(!words[0].contains('\n'));
    assert!(words[words.len() - 1].starts_with('Z'));
    Ok(())
}
