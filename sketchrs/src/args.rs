use clap::Parser;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
pub struct Args {
    /// Words file
    #[arg(short, long)]
    pub words: String,

    /// Port to serve on
    #[arg(short, long, default_value_t = 3030)]
    pub port: u16,
}