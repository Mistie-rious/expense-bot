
import { Bot, session } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import dotenv from 'dotenv'

import { MyContext, greeting } from './context/logic';
dotenv.config()



const botToken = process.env.BOT_TOKEN;
if (!botToken) {
  throw new Error("BOT_TOKEN is not defined in the environment variables.");
}
const bot = new Bot<MyContext>(botToken);

bot.use(session({ initial: () => ({}) }));

bot.use(conversations());
bot.use(createConversation(greeting))

bot.command("start", async (ctx) => {
await ctx.conversation.enter("greeting");
})

bot.command("stop", (ctx) => {
  ctx.reply("Bot is stopping...");
  bot.stop();
});

bot.on("message", (ctx) => ctx.reply("Got another message!"));


bot.start();