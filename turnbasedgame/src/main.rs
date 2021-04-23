use std::sync::Arc;
use std::sync::Mutex;

use actix_web::{get, http::StatusCode, web, App, HttpResponse, HttpServer, ResponseError};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct Post {
    id: i64,
    num: i64,
    user: String,
}

#[derive(Debug)]
struct Error {}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("bob")
    }
}

impl From<rusqlite::Error> for Error {
    fn from(_: rusqlite::Error) -> Self {
        Self {}
    }
}

impl ResponseError for Error {
    fn status_code(&self) -> StatusCode {
        StatusCode::INTERNAL_SERVER_ERROR
    }

    fn error_response(&self) -> HttpResponse {
        "so sad".into()
    }
}

#[get("/all/")]
async fn index2(conn: web::Data<Arc<Mutex<Connection>>>) -> Result<HttpResponse, Error> {
    let l = conn.lock().unwrap();
    let mut stmt = l.prepare("SELECT id, num, user FROM posts")?;
    let iter = stmt
        .query_map(params![], |row| {
            Ok(Post {
                id: row.get(0)?,
                num: row.get(1)?,
                user: row.get(2)?,
            })
        })?
        .filter(|a| a.is_ok())
        .map(|x| x.unwrap());
    Ok(HttpResponse::Ok().json(iter.collect::<Vec<Post>>()))
}
#[get("/{id}/{name}")]
async fn index(
    web::Path((id, name)): web::Path<(u32, String)>,
    conn: web::Data<Arc<Mutex<Connection>>>,
) -> Result<HttpResponse, Error> {
    let r = conn.lock().unwrap().execute(
        "INSERT INTO posts (num, user) VALUES (?1, ?2)",
        params![id, name],
    )?;
    Ok(HttpResponse::Ok().json(r))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    if let Ok(conn) = Connection::open(&"./bob.db") {
        let _ = conn.execute(
            "CREATE TABLE posts (
                  id              INTEGER PRIMARY KEY,
                  num             INT8,
                  user            INT8
                  )",
            params![],
        );
        let x = web::Data::new(Arc::new(Mutex::new(conn)));
        HttpServer::new(move || {
            App::new()
                .service(index2)
                .service(index)
                .app_data(x.clone())
        })
        .bind("127.0.0.1:8080")?
        .run()
        .await?;
    }
    Ok(())
}
