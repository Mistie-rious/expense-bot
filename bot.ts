
import { Bot, session } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import dotenv from 'dotenv'
import { prisma } from './src/client';
import expenseController from './src/controllers/expenseController';
import categoryController from './src/controllers/categoryController';
import { greeting} from './src/conversations/mainConversation';
import { MyContext } from './src/context/context';
import { InlineKeyboard } from 'grammy';
import { Keyboard } from 'grammy';
import { categoryKeyboard ,expensesKeyboard } from './src/ui/customKeyboard';
dotenv.config()
import { userKeyboards, setCurrentKeyboard, getPreviousKeyboard } from './src/ui/customKeyboard';

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

const calledConversations = [
  createConversation(greeting),
  createConversation(expenseController.addExpenses),
  createConversation(expenseController.viewExpenses),
  createConversation(expenseController.deleteExpenses),
  createConversation(expenseController.editExpenses),
  createConversation(categoryController.addCategory),
  createConversation(categoryController.viewCategories),
  createConversation(categoryController.deleteCategory),
  createConversation(categoryController.editCategory)
];

calledConversations.forEach(conversation => bot.use(conversation));
bot.command('start', async (ctx) => {



  await ctx.conversation.enter("greeting");
 

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

 
  bot.callbackQuery(/^delete_expense_/, async (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    const expenseId = callbackData.split("_")[2];
  
    try {
      await prisma.expense.delete({
        where: { id: expenseId },
      });
  
      await ctx.answerCallbackQuery("Expense deleted successfully.");
      await ctx.editMessageText("Expense has been deleted.");
    } catch (error) {
      console.error("Error deleting expense:", error);
      await ctx.answerCallbackQuery("Error deleting expense.");
      await ctx.reply("An error occurred while deleting the expense. Please try again later.");
    }
  });

  bot.callbackQuery(/^edit_category_/, async (ctx) => {

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

bot.hears("Manage Expenses", async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  await ctx.reply("What would you like to do?", {
   reply_markup: expensesKeyboard
  });
  setCurrentKeyboard(telegramId!, expensesKeyboard);
})

bot.hears("Manage Categories", async (ctx) => {
  const telegramId = ctx.from?.id.toString();

  await ctx.reply("What would you like to do?", {
   reply_markup: categoryKeyboard
  });
  setCurrentKeyboard(telegramId!, categoryKeyboard);
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

bot.hears("Add Category", async (ctx) => {
  await ctx.conversation.enter("addCategory");
});

bot.hears("View Categories", async (ctx) => {
  await ctx.conversation.enter("viewCategories");
});

bot.hears("Edit Category", async (ctx) => {
  await ctx.conversation.enter("editCategory");
})

bot.hears("Delete Category", async (ctx) => {
  await ctx.conversation.enter("deleteCategory");
});

bot.hears("Go Back", async (ctx) => {
  const previousKeyboard = getPreviousKeyboard(ctx.from?.id.toString()!);
  if (previousKeyboard) {
      await ctx.reply("As you wish.", { reply_markup: previousKeyboard });
  } else {
      await ctx.reply("No previous menu available.");
  }
})



bot.start();