import { startKeyboard } from "../ui/customKeyoard";
import { MyContext, MyConversation } from "../context/context";
import expenseController from "../controllers/expenseController";
import { prisma } from "../client";

export async function greeting(conversation: MyConversation, ctx: MyContext) {
    await ctx.reply("Hello! What's your name?");
  const { message } = await conversation.waitFor("message:text");
  const userName = message.text;

  try {
    let user = await prisma.user.findFirst({
      where: { name: userName },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: userName,
        },
      });
      await ctx.reply(`Nice to meet you, ${userName}!`);
    } else {
      await ctx.reply(`Welcome back, ${userName}!`);
    }

    await ctx.reply("What would you like to do today?", {
      reply_markup: startKeyboard,
    });
  } catch (e) {
    console.error("Error creating/finding user:", e);
    await ctx.reply("There was an error. Please try again.");
  }
}

export async function mainConversation(conversation: MyConversation, ctx: MyContext) {
  await greeting(conversation, ctx);

  let continueConversation = true;

  while (continueConversation) {
    const { message } = await conversation.waitFor(["message:text", "message"]);
    const userCommand = message.text.toLowerCase();

    switch (userCommand) {
      case "add expenses":
        console.log('About to call addExpenses');
        await expenseController.addExpenses(conversation, ctx);
        break;
      case "view expenses":
        await expenseController.viewExpenses(conversation, ctx);
        break;
      case "delete expenses":
        await expenseController.deleteExpenses(conversation, ctx);
        break;
      case "edit expenses":
        await expenseController.editExpenses(conversation, ctx);
        break;
      case "/stop":
        continueConversation = false;
        break;
      default:
        await ctx.reply("I don't understand that command. Please try again.");
    }
  }
}