use std::sync::Arc;
use std::sync::Mutex;

use crate::error::Error;
use actix_web::{get, put, web, HttpResponse};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct Game {
    id: i64,
    turn: i64,
    version: i64,
    drawer: i64,
    time: i64,
    word: String,
    image: String,
}

pub fn setup(conn: &mut Connection) -> std::io::Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS games (
              id          INTEGER PRIMARY KEY,
              turn        INTEGER,
              version     INTEGER,
              drawer      INTEGER,
              time        INTEGER,
              word        TEXT,
              image       TEXT
              )",
        params![],
    )
    .unwrap();
    Ok(())
}

#[put("game/drawing/{game_id}/{image}")]
pub async fn set_specific(
    web::Path((game_id, image)): web::Path<(i64, String)>,
    conn: web::Data<Arc<Mutex<Connection>>>,
) -> Result<HttpResponse, Error> {
    let l = conn.lock().unwrap();
    let r = l.execute(
        "UPDATE games SET image = ?1, version = version + 1 WHERE id=?2",
        params![image, game_id],
    )?;
    Ok(HttpResponse::Ok().json(r))
}

#[get("game/{game_id}/")]
pub async fn specific(
    web::Path(game_id): web::Path<i64>,
    conn: web::Data<Arc<Mutex<Connection>>>,
) -> Result<HttpResponse, Error> {
    let l = conn.lock().unwrap();
    let mut stmt = l.prepare("SELECT * FROM games WHERE id = ?1")?;
    let iter = stmt
        .query_map(params![game_id], |row| {
            Ok(Game {
                id: row.get(0)?,
                turn: row.get(1)?,
                version: row.get(2)?,
                drawer: row.get(3)?,
                time: row.get(4)?,
                word: row.get(5)?,
                image: row.get(6)?,
            })
        })?
        .filter(|a| a.is_ok())
        .map(|x| x.unwrap());
    Ok(HttpResponse::Ok().json(
        iter.collect::<Vec<Game>>()
            .first()
            .ok_or(Error::new("none found"))?,
    ))
}

#[get("game/all/")]
pub async fn all(conn: web::Data<Arc<Mutex<Connection>>>) -> Result<HttpResponse, Error> {
    let l = conn.lock().unwrap();
    let mut stmt = l.prepare("SELECT * FROM games")?;
    let iter = stmt
        .query_map(params![], |row| {
            Ok(Game {
                id: row.get(0)?,
                turn: row.get(1)?,
                version: row.get(2)?,
                drawer: row.get(3)?,
                time: row.get(4)?,
                word: row.get(5)?,
                image: row.get(6)?,
            })
        })?
        .filter(|a| a.is_ok())
        .map(|x| x.unwrap());
    Ok(HttpResponse::Ok().json(iter.collect::<Vec<Game>>()))
}

#[get("game/new/")]
pub async fn add(conn: web::Data<Arc<Mutex<Connection>>>) -> Result<HttpResponse, Error> {
    let r = conn
        .lock()
        .unwrap()
        .execute("INSERT INTO games (version, turn, drawer, time, word, image) VALUES (0, 0, 0, 0, \"\", \"\");", params![])?;
    Ok(HttpResponse::Ok().json(r))
}
