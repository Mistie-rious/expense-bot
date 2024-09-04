import { startKeyboard } from "../ui/customKeyoard"
import { MyContext, MyConversation } from "../context/context";
import  expenseController from "../controllers/expenseController";
import { prisma } from "../client";
import { User } from "../controllers/expenseController";

export async function handleUserCommand(conversation: MyConversation, ctx: MyContext, user: User) {
  while (true) {
    await ctx.reply("What would you like to do today?", {
      reply_markup: startKeyboard,
    });
    
    const { message } = await conversation.waitFor(["message:text"]);
    const userCommand = message.text.toLowerCase();

    
    console.log(`User command received: ${userCommand}`);
    
    // switch (userCommand) {
    //   case "add expenses":
    //     await expenseController.addExpenses(conversation, ctx, user);
    //     break;

    //   case "view expenses":
    //     await expenseController.viewExpenses(conversation, ctx, user);
    //     break;
    //   case "delete expenses":
    //     await expenseController.deleteExpenses(conversation, ctx, user);
    //     break;
    //   case "edit expenses":
    //     await expenseController.editExpenses(conversation, ctx, user);
    //     break;
    //   case "/stop":
    //     await ctx.reply("Goodbye! Use /start to begin again.");
    //     return;
    //   default:
    //     await ctx.reply("I don't understand that command. Please try again.");
    //     continue;
    // }
  }
}


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

    ctx.session.userId = user.id;

      

 
  } catch (e) {
    console.error("Error creating/finding user:", e);
    await ctx.reply("There was an error. Please try again.");
  }
}

export async function mainConversation(conversation: MyConversation, ctx: MyContext) {
  const user = await prisma.user.findFirst({
    where: { id: ctx.from!.id.toString() },
  });
  
  if (user) {
    await handleUserCommand(conversation, ctx, user);
  } else {
    await greeting(conversation, ctx);
  }
}