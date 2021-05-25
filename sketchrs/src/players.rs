use std::sync::Arc;
use std::sync::Mutex;

use crate::error::Error;
use actix_web::{get, web, HttpResponse};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct Player {
    name: String,
    game_id: i64,
    correct: i64,
    drawer: i64,
    score: i64,
}

pub fn setup(conn: &mut Connection) -> std::io::Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS players (
            name        TEXT PRIMARY KEY,
            game_id     INTEGER,
            correct     INTEGER,
            drawer      INTEGER,
            score       INTEGER
              )",
        params![],
    )
    .unwrap();
    Ok(())
}

#[get("player/join/{name}/{game_id}")]
pub async fn add(
    web::Path((name, game_id)): web::Path<(String, i64)>,
    conn: web::Data<Arc<Mutex<Connection>>>,
) -> Result<HttpResponse, Error> {
    let r = conn.lock().unwrap().execute(
        "INSERT INTO players (name, game_id, correct, drawer, score) VALUES ($1, $2, 0, 0, 0);",
        params![name, game_id],
    )?;
    Ok(HttpResponse::Ok().json(r))
}

