use std::env;
use std::error::Error;

use serenity::{
    async_trait,
    model::{
        channel::{Message, ReactionType},
        gateway::Ready,
    },
    prelude::*,
};

struct Handler;

#[async_trait]
impl EventHandler for Handler {
    async fn message(&self, ctx: Context, msg: Message) {
        let v = match &msg.content {
            x if x.starts_with("??") => vec!["⏫", "🔼", "⏸", "🔽", "⏬"],
            x if x.starts_with("?.") => vec!["✔", "❌", "🤔"],
            x if x.starts_with("?4") => vec!["🇦", "🇧", "🇨", "🇩"],
            x if x.starts_with("?") => vec!["✔", "❌"],
            _ => vec![],
        };
        for emoji in v {
            if let Err(e) = msg
                .react(&ctx.http, ReactionType::Unicode(emoji.to_string()))
                .await
            {
                println!("Error: {}", e);
            }
        }
    }

    async fn ready(&self, _: Context, ready: Ready) {
        println!("{} is connected!", ready.user.name);
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let token = env::var("DISCORD_TOKEN")?;
    let mut client = Client::builder(&token).event_handler(Handler).await?;
    client.start().await?;
    Ok(())
}
