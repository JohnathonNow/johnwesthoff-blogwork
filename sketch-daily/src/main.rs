use serde::{Serialize, Deserialize};
use serde_json::json;
use std::error::Error;
use std::sync::{Arc};
use async_mutex::Mutex;
use std::net::SocketAddr;
use std::fs;
use std::time::Duration;
use tokio::sync::broadcast;
use tokio::{task, time};
use warp::Filter;
use clap::Parser;
use rand::thread_rng;
use std::collections::HashMap;
use rand::seq::SliceRandom;
use handlebars::Handlebars;

mod packets;
mod game;
mod args;

#[derive(Deserialize)]
struct Query {
}

struct WithTemplate<T: Serialize> {
    name: &'static str,
    value: T,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let cliargs = args::Args::parse();
    let mut inner_game_state = game::State::new().await;
    inner_game_state.add_words(read_words(&cliargs.words)?);

    let mut hb = Handlebars::new();
    hb.register_template_file("results", "./resources/results.hbs").unwrap();

    let game_state: game::GameServerState = Arc::new(Mutex::new(inner_game_state));

    let ws_route = warp::path("word")
        .and(with_game_state(game_state.clone()))
        .and_then(|game_state| async move {
            if true {
                Ok(game::word(game_state).await)
            } else {
                Err(warp::reject::not_found())
            }
        });

    let judge = warp::path("judge")
        .and(warp::body::content_length_limit(1024 * 1024 * 32))
        .and(warp::body::json())
        .and(warp::addr::remote())
        .and(with_game_state(game_state.clone()))
        .and_then(|map: HashMap<String, String>, addr: Option<SocketAddr>, game_state| async move {
            let s = game::judge(game_state, map.get("image").unwrap_or(&"".to_string()), &format!("{:?}", addr)).await;
            if let Ok(s) = s {
                Ok(warp::reply::json(&s))
            } else {
                Err(warp::reject::not_found())
            }
        });

    let info = warp::path("info")
        .and(warp::path::param())
        .and(with_game_state(game_state.clone()))
        .and_then(|id: String, game_state| async move {
            let (prompt, path, score) = game::info(game_state, &id).await;
            let out = packets::Outgoing::Info { prompt, score, path };
            if true {
                Ok(warp::reply::json(&out))
            } else {
                Err(warp::reject::not_found())
            }
        });

    let hb = Arc::new(hb);
    let handlebars = move |with_template| render(with_template, hb.clone());
    let results = warp::path("results")
        .and(warp::path::param())
        .and(with_game_state(game_state.clone()))
        .and_then(|id: String, game_state| async move {
            let (prompt, path, score) = game::info(game_state, &id).await;
            if true {
                Ok(WithTemplate {
                    name: "results",
                    value: json!({
                        "prompt": &prompt,
                        "score": score,
                        "path": &path.strip_prefix("frontend").unwrap_or(&path),
                        "base": format!("https://ca.johnwesthoff.com"),
                    }),
                })
            } else {
                Err(warp::reject::not_found())
            }
        }).map(handlebars);

    let static_files = warp::fs::dir("frontend");
    let routes = ws_route.or(static_files).or(judge).or(info);//.or(results);

    let forever = task::spawn(async move {
        let mut interval = time::interval(Duration::from_millis(1000));

        loop {
            interval.tick().await;
            game_state.lock().await.tick();
        }
    });
    let server = if let (Some(cert), Some(key)) = (cliargs.cert, cliargs.key) {
        task::spawn(async move {warp::serve(routes).tls().cert_path(cert).key_path(key).run(([0, 0, 0, 0], cliargs.port)).await;})
    } else {
        task::spawn(async move {warp::serve(routes).run(([0, 0, 0, 0], cliargs.port)).await;})
    };

    (forever.await?, server.await?);

    Ok(())
}

fn render<T>(template: WithTemplate<T>, hbs: Arc<Handlebars<'_>>) -> impl warp::Reply
where
    T: Serialize,
{
    let render = hbs
        .render(template.name, &template.value)
        .unwrap_or_else(|err| err.to_string());
    warp::reply::html(render)
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
    let words: HashMap<String, game::Word> = serde_json::from_str::<HashMap<String, game::Word>>(&fs::read_to_string(path)?)?;
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
