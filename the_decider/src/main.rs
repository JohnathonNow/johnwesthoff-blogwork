use std::env;
use std::error::Error;

use serenity::{async_trait, model::{channel::{Message, ReactionType}, gateway::Ready}, prelude::*};

struct Handler;

#[async_trait]
impl EventHandler for Handler {
    async fn message(&self, ctx: Context, msg: Message) {
        async fn inner(ctx: &Context, msg: &Message) -> Result<(), Box<dyn Error>> {
            if msg.content.starts_with("??") {
                let v = vec!["⏫", "🔼", "⏸", "🔽", "⏬"];
                for emoji in v {
                    msg.react(&ctx.http, ReactionType::Unicode(emoji.to_string())).await?;
                }
            } else if msg.content.starts_with("?") {
                let v = vec!["✔", "❌"];
                for emoji in v {
                    msg.react(&ctx.http, ReactionType::Unicode(emoji.to_string())).await?;
                }
            }
            Ok(())
        }
        inner(&ctx, &msg).await.unwrap_or(());
    }

    async fn ready(&self, _: Context, ready: Ready) {
        println!("{} is connected!", ready.user.name);
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>>{
    let token = env::var("DISCORD_TOKEN")?;
    let mut client = Client::builder(&token).event_handler(Handler).await?;
    client.start().await?;
    Ok(())
}
