use clap::Parser;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
pub struct Args {
    /// Words file
    #[arg(short, long)]
    pub words: String,

    /// Port to serve on
    #[arg(short, long, default_value_t = 3031)]
    pub port: u16,

    /// Certificate to use
    #[arg(short, long)]
    pub cert: Option<String>,

    /// Keyfile to use
    #[arg(short, long)]
    pub key: Option<String>,
}
