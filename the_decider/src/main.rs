use std::{collections::HashMap, env, sync::Arc};
use std::error::Error;

use serenity::{async_trait, model::{channel::{Message, ReactionType}, gateway::Ready, id::RoleId}, prelude::*};

struct Handler {
    talkers: Arc<Mutex<HashMap<String, i64>>>,
}

impl Handler {
    fn new() -> Self {
        Self {
            talkers: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

#[async_trait]
impl EventHandler for Handler {
    async fn message(&self, ctx: Context, msg: Message) {
        let mut talkers = self.talkers.lock().await;
        talkers.insert(msg.author.name.clone(), msg.timestamp.timestamp());
        
        let v = match &msg.content {
            x if x.starts_with("??") => vec!["⏫", "🔼", "⏸", "🔽", "⏬"],
            x if x.starts_with("?.") => vec!["✔", "❌", "🤔"],
            x if x.starts_with("?4") => vec!["🇦", "🇧", "🇨", "🇩"],
            x if x.starts_with("?") => vec!["✔", "❌"],
            _ => vec![],
        };
        for emoji in v {
            msg.react(&ctx.http, ReactionType::Unicode(emoji.to_string()))
                .await
                .ok();
        }
        if let Some(x) = msg.guild_id {
            if let Ok(mut y) = x.member(&ctx, msg.author.id).await {
                y.add_role(&ctx, RoleId(825089774251147355)).await.unwrap_or(());
            }
        }
        println!("{:?}", talkers);
    }

    async fn ready(&self, _: Context, ready: Ready) {
        println!("{} is connected!", ready.user.name);
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let token = env::var("DISCORD_TOKEN")?;
    let mut client = Client::builder(&token).event_handler(Handler::new()).await?;
    client.start().await?;
    Ok(())
}
