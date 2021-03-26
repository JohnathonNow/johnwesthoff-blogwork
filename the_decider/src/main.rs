use chrono::prelude::*;
use rand::prelude::SliceRandom;
use serenity::{
    async_trait,
    model::{
        channel::{Message, ReactionType},
        gateway::Ready,
        id::{RoleId, UserId},
    },
    prelude::*,
};
use std::error::Error;
use std::{collections::HashMap, env, sync::Arc};

const TIME_LIMIT: i64 = 120;
const DEVIL_ROLE: u64 = 825089774251147355;

struct Handler {
    talkers: Arc<Mutex<HashMap<String, (i64, u64)>>>,
    devil: Arc<Mutex<u64>>,
}

impl Handler {
    fn new() -> Self {
        Self {
            talkers: Arc::new(Mutex::new(HashMap::new())),
            devil: Arc::new(Mutex::new(0)),
        }
    }
}

#[async_trait]
impl EventHandler for Handler {
    async fn message(&self, ctx: Context, msg: Message) {
        let mut talkers = self.talkers.lock().await;
        talkers.insert(
            msg.author.name.clone(),
            (msg.timestamp.timestamp(), *msg.author.id.as_u64()),
        );

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
        if msg.content.starts_with("!devil") {
            let now = Utc::now().timestamp();
            let candidates = talkers
                .iter()
                .filter(|(_, (time, _))| now - *time <= TIME_LIMIT)
                .collect::<Vec<(&String, &(i64, u64))>>();
            if let Some(x) = msg.guild_id {
                let mut userid = self.devil.lock().await;
                if let Ok(mut y) = x.member(&ctx, UserId(*userid)).await {
                    y.remove_role(&ctx, RoleId(DEVIL_ROLE))
                        .await
                        .unwrap_or(());
                }
                let devil = candidates
                    .choose(&mut rand::thread_rng())
                    .unwrap_or(&(&"".to_string(), &(0, *msg.author.id.as_u64()))).1.1;
                if let Ok(mut y) = x.member(&ctx, UserId(devil)).await {
                    y.add_role(&ctx, RoleId(DEVIL_ROLE))
                        .await
                        .unwrap_or(());
                    *userid = *msg.author.id.as_u64();
                }
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
    let mut client = Client::builder(&token)
        .event_handler(Handler::new())
        .await?;
    client.start().await?;
    Ok(())
}
