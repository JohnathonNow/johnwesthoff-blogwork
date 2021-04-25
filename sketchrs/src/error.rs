use actix_web::{http::StatusCode, HttpResponse, ResponseError};
#[derive(Debug)]
pub struct Error {
    s: String
}

impl Error {
    pub fn new(s: &str) -> Self { Self { s: s.into() } }
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("bob")
    }
}

impl From<rusqlite::Error> for Error {
    fn from(e: rusqlite::Error) -> Self {
        Self {s: e.to_string()}
    }
}

impl ResponseError for Error {
    fn status_code(&self) -> StatusCode {
        StatusCode::INTERNAL_SERVER_ERROR
    }

    fn error_response(&self) -> HttpResponse {
        self.s.clone().into()
    }
}
