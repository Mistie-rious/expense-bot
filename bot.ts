
import { Bot, session } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import dotenv from 'dotenv'
import { prisma } from './src/client';
import expenseController from './src/controllers/expenseController';
import { greeting} from './src/conversations/mainConversation';
import { MyContext } from './src/context/context';
import { InlineKeyboard } from 'grammy';
dotenv.config()

const confirm = new InlineKeyboard().text('Yes', 'yes').text('No', 'no');



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




bot.use(session({ initial: () => ({ moonCount: 0, expenses: [] as { amount: number; category: string; description: string; date: Date }[] }) }));
bot.use(conversations());

bot.use(createConversation(greeting))
bot.use(createConversation(expenseController.addExpenses));
bot.use(createConversation(expenseController.viewExpenses));
bot.use(createConversation(expenseController.deleteExpenses));
bot.use(createConversation(expenseController.editExpenses));

bot.command('start', async (ctx) => {
  const telegramId = ctx.from?.id.toString(); 


  let user = await prisma.user.findFirst({
    where: { id: telegramId }
  });

  if (user) {
    await ctx.reply("You are already registered. Use /reset if you want to reset your data.");
  } else {
    
    user = await prisma.user.create({
      data: {
        id: telegramId,  
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    await ctx.reply("Welcome! You are now registered.");
  }
});



bot.command('reset', async (ctx) => {
  const telegramId = ctx.from?.id.toString();

  
  const user = await prisma.user.findUnique({
    where: { id: telegramId }
  });

  await ctx.reply("Are you sure you want to reset your account? This action cannot be undone.", {
    reply_markup: confirm

  });

  
});

bot.callbackQuery('yes', async (ctx) => {
  const telegramId = ctx.from?.id.toString();

  await prisma.user.delete({
    where: { id: telegramId }
  });

  ctx.session.userId = undefined;
  await ctx.answerCallbackQuery({ text: "Your account has been reset." });

  })

  bot.callbackQuery('no', async (ctx) => {
    await ctx.answerCallbackQuery({ text: "Your account has not been reset." });
  })


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

bot.hears("Add Expenses", async (ctx) => {
  await ctx.conversation.enter("addExpenses");
});

bot.hears("View Expenses", async (ctx) => {
  await ctx.conversation.enter("viewExpenses");
});

bot.hears("Delete Expenses", async (ctx) => {
  await ctx.conversation.enter("deleteExpenses");
});

bot.hears("Edit Expenses", async (ctx) => {
  await ctx.conversation.enter("editExpenses");
});



bot.start();