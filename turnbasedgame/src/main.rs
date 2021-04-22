use std::sync::Arc;
use std::sync::Mutex;

use actix_web::{get, web, App, HttpServer, Responder};
use rusqlite::{params, Connection};

#[derive(Debug)]
struct Post {
    id: i64,
    num: i64,
    user: String,
}
#[get("/{id}/{name}")]
async fn index(
    web::Path((id, name)): web::Path<(u32, String)>,
    conn: web::Data<Arc<Mutex<Connection>>>,
) -> impl Responder {
    if let Ok(_) = conn.lock().unwrap().execute(
        "INSERT INTO posts (num, user) VALUES (?1, ?2)",
        params![id, name],
    ) {
        format!("Hello {}! id:{}", name, id)
    } else {
        format!("big sad!")
    }
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
        HttpServer::new(move || App::new().service(index).app_data(x.clone()))
            .bind("127.0.0.1:8080")?
            .run()
            .await?;
    }
    Ok(())
}
