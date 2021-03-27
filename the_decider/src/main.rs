use chrono::prelude::*;
use rand::prelude::SliceRandom;
use serenity::{
    async_trait,
    futures::StreamExt,
    model::{
        channel::{Message, ReactionType},
        gateway::Ready,
        id::{GuildId, RoleId, UserId},
    },
    prelude::*,
};
use std::error::Error;
use std::{collections::HashMap, env, sync::Arc};

const TIME_LIMIT: i64 = 120;
const DEVIL_ROLE: u64 = 825089774251147355;

struct Talker {
    time: i64,
    id: u64,
}

struct Handler {
    talkers: Arc<Mutex<HashMap<String, Talker>>>,
}

impl Handler {
    fn new() -> Self {
        Self {
            talkers: Arc::new(Mutex::new(HashMap::new())),
        }
    }
    async fn remove_role(&self, g: &GuildId, h: &Context) {
        let mut mems = g.members_iter(h).boxed();
        while let Some(mr) = mems.next().await {
            if let Ok(mut m) = mr {
                m.remove_role(h, RoleId(DEVIL_ROLE)).await.unwrap_or(());
            }
        }
    }

    async fn make_devil(&self, g: &GuildId, h: &Context, candidates: &Vec<u64>) {
        let devil = *candidates.choose(&mut rand::thread_rng()).unwrap_or(&0);
        if let Ok(mut y) = g.member(h, UserId(devil)).await {
            if let Err(z) = y.add_role(h, RoleId(DEVIL_ROLE)).await {
                println!("big sad with {:?}", z);
            }
        }
    }
}

#[async_trait]
impl EventHandler for Handler {
    async fn message(&self, ctx: Context, msg: Message) {
        let mut talkers = self.talkers.lock().await;
        talkers.insert(
            msg.author.name.clone(),
            Talker {
                time: msg.timestamp.timestamp(),
                id: *msg.author.id.as_u64(),
            },
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

            if let Some(g) = msg.guild_id {
                self.remove_role(&g, &ctx).await;
                let candidates = talkers
                    .iter()
                    .filter(|(_, x)| now - x.time <= TIME_LIMIT)
                    .map(|(_, y)| y.id)
                    .collect::<Vec<u64>>();
                self.make_devil(&g, &ctx, &candidates).await;
            }
        } else if msg.content.starts_with("!nodevil") {
            if let Some(g) = msg.guild_id {
                self.remove_role(&g, &ctx).await;
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
    let mut client = Client::builder(&token)
        .event_handler(Handler::new())
        .await?;
    client.start().await?;
    Ok(())
}
