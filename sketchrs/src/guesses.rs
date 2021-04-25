use std::sync::Arc;
use std::sync::Mutex;

use crate::error::Error;
use actix_web::{get, web, HttpResponse};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct Guess {
    id: i64,
    game_id: i64,
    user: String,
    text: String,
}

pub fn setup(conn: &mut Connection) -> std::io::Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS guesses (
              id              INTEGER PRIMARY KEY,
              game_id         INTEGER,
              user            TEXT,
              text            TEXT
              )",
        params![],
    )
    .unwrap();
    Ok(())
}

#[get("{game_id}/guesses/all/")]
pub async fn all(
    web::Path(game_id): web::Path<i64>,
    conn: web::Data<Arc<Mutex<Connection>>>,
) -> Result<HttpResponse, Error> {
    let l = conn.lock().unwrap();
    let mut stmt = l.prepare("SELECT id, user, text FROM guesses WHERE game_id = ?1")?;
    let iter = stmt
        .query_map(params![game_id], |row| {
            Ok(Guess {
                id: row.get(0)?,
                game_id: game_id,
                user: row.get(1)?,
                text: row.get(2)?,
            })
        })?
        .filter(|a| a.is_ok())
        .map(|x| x.unwrap());
    Ok(HttpResponse::Ok().json(iter.collect::<Vec<Guess>>()))
}

#[get("{game_id}/guesses/{user}/{text}/")]
pub async fn guess(
    web::Path((game_id, user, text)): web::Path<(i64, String, String)>,
    conn: web::Data<Arc<Mutex<Connection>>>,
) -> Result<HttpResponse, Error> {
    let r = conn.lock().unwrap().execute(
        "INSERT INTO guesses (game_id, user, text) VALUES (?1, ?2, ?3);
             UPDATE games SET version = version + 1 WHERE gameid = ?1;",
        params![game_id, user, text],
    )?;
    Ok(HttpResponse::Ok().json(r))
}