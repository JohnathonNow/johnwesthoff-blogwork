use std::sync::Arc;
use std::sync::Mutex;

use actix_files::Files;
use actix_web::{web, App, HttpServer};
use rusqlite::Connection;

mod error;
mod games;
mod guesses;
mod players;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    if let Ok(mut conn) = Connection::open(&"./bob.db") {
        guesses::setup(&mut conn)?;
        games::setup(&mut conn)?;
        let x = web::Data::new(Arc::new(Mutex::new(conn)));
        HttpServer::new(move || {
            App::new()
                .service(guesses::all)
                .service(guesses::guess)
                .service(games::add)
                .service(games::all)
                .service(games::specific)
                .service(games::set_specific)
                .service(players::add)
                .service(Files::new("/", "./static/").index_file("index.html"))
                .app_data(x.clone())
        })
        .bind("127.0.0.1:8080")?
        .run()
        .await?;
    }
    Ok(())
}
