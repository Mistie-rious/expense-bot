
import { Bot, session } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import dotenv from 'dotenv'
import { initial } from './context/session';
import { MyContext, greeting } from './context/context';
dotenv.config()




const botToken = process.env.BOT_TOKEN;
if (!botToken) {
  throw new Error("BOT_TOKEN is not defined in the environment variables.");
}
const bot = new Bot<MyContext>(botToken);

async function startup(){
  await bot.api.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "stop", description: "Stop the bot" },
    { command: "moon", description: "🌝" },
  ]);
  
  }
  
  startup();



bot.use(session({ initial: () => ({ moonCount: 0 }) }));

bot.use(conversations());
bot.use(createConversation(greeting))

bot.command("start", async (ctx) => {
await ctx.conversation.enter("greeting");
})



bot.command("stop", (ctx) => {
  ctx.reply("Bot is stopping...");
  bot.stop();
});

bot.command("moon", async (ctx) => {
  const count = ctx.session.moonCount;
  await ctx.reply(`You have sent ${count} moons. Don't stop going! 🌝`) ;
})

bot.hears(/.*🌝*./, async (ctx) => {
  console.log(ctx.match);
  const emoji = ctx.match[0];
  ctx.session.moonCount++;
 await  ctx.reply(`Moons are cool! ${emoji}`);
})

bot.on("message", (ctx) => ctx.reply("I have no casual response to this situation. Lots of love! 🌝"));

bot.start();