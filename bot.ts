
import { Bot, session } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import dotenv from 'dotenv'
import { mainConversation } from './src/conversations/mainConversation';
import { MyContext } from './src/context/context';
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



bot.use(session({ initial: () => ({ moonCount: 0, expenses: [] as number[] }) }));

bot.use(conversations());
bot.use(createConversation(mainConversation))

bot.command("start", async (ctx) => {
await ctx.conversation.enter("mainConversation");
})



bot.command("stop", async (ctx) => {
  await ctx.reply("Bot is stopping...", { reply_markup: { remove_keyboard: true } });
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

bot.callbackQuery(/^delete_expense_(\d+)$/, async (ctx) => {
  console.log(ctx.match);
  const expenseIndex = parseInt(ctx.match[1], 10);
  console.log(expenseIndex);

  
  if (!isNaN(expenseIndex)) {
    console.log('Expense index is a number:', expenseIndex);
    if (expenseIndex >= 0) {
      console.log('Expense index is non-negative:', expenseIndex);
      console.log(ctx.session.expenses)
      if (expenseIndex < ctx.session.expenses.length) {
        console.log('Expense index is within bounds:', expenseIndex);
        const deletedExpense = ctx.session.expenses.splice(expenseIndex, 1)[0];
        const total = ctx.session.expenses.reduce((a, b) => a + b, 0);
        await ctx.answerCallbackQuery(`Expense of ${deletedExpense} deleted.`);
        await ctx.editMessageText(`Expense of ${deletedExpense} deleted. Your total expenses are now ${total}.`);
      } else {
        console.log('Expense index is out of bounds:', expenseIndex);
        await ctx.answerCallbackQuery("Invalid input. Please try again.");
      }
    } else {
      console.log('Expense index is negative:', expenseIndex);
      await ctx.answerCallbackQuery("bello.");
    }
  } else {
    console.log('Expense index is not a number:', expenseIndex);
    await ctx.answerCallbackQuery("Invalid input. Please try again.");
  }
});


bot.on("message", (ctx, next) => {
  if (!ctx.conversation.active) {
    return ctx.reply("I have no casual response to this situation. Lots of love! 🌝");
  }

  return next();
});

bot.start();