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
use rand::seq::SliceRandom;

mod packets;
mod game;
mod args;

#[derive(Deserialize)]
struct Query {
    name: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let cliargs = args::Args::parse();
    let mut inner_game_state = game::State::new(cliargs.timelimit, cliargs.maxpoints, cliargs.endontime);
    inner_game_state.add_words(read_words(&cliargs.words)?);
    let game_state: game::GameServerState = Arc::new(Mutex::new(inner_game_state));

    let (tx, mut _rx) = broadcast::channel::<String>(100);

    let game_clone = game_state.clone();
    task::spawn(async move {
        while let Ok(msg) = _rx.recv().await {
            for (_, sender) in game_clone.lock().unwrap().peer_map.iter() {
                let _ = sender.send(msg.clone());
            }
        }
    });

    let ws_route = warp::path("chat")
        .and(warp::query::<Query>())
        .and(warp::ws())
        .and(with_game_state(game_state.clone()))
        .and(with_broadcast(tx.clone()))
        .map(|query: Query, ws: warp::ws::Ws, peer_map, tx| {
            ws.on_upgrade(move |socket| game::handle(socket, peer_map, tx, query.name))
        });

    let static_files = warp::fs::dir("frontend");
    let routes = ws_route.or(static_files);

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


fn read_words(path: &str) -> Result<Vec<String>, Box<dyn Error>> {
    let mut words: Vec<String> = fs::read_to_string(path)?.split('\n').map(|x| x.to_string()).filter(|x| !x.is_empty()).collect();
    words.shuffle(&mut thread_rng());
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