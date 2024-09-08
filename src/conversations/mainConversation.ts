import { startKeyboard } from "../ui/customKeyboard"
import { MyContext, MyConversation } from "../context/context";
import  expenseController from "../controllers/expenseController";
import { prisma } from "../client";
import { User } from "../controllers/expenseController";


const defaultCategories = ["Food", "Transport", "Self Care",  "Shopping", "Entertainment", "Subscriptions"];
import { userKeyboards, setCurrentKeyboard, getPreviousKeyboard } from '../ui/customKeyboard'

export async function greeting(conversation: MyConversation, ctx: MyContext) {
  

  const telegramId = ctx.from?.id.toString(); 

try{

  let user = await prisma.user.findFirst({
    where: { id: telegramId }
  });

  if (user) {
    setCurrentKeyboard(telegramId!, startKeyboard);
    await ctx.reply(`You are already registered. Use /reset if you want to reset your data.`, {
      reply_markup: startKeyboard
    });

    console.log(user.id)
  } else {

    await ctx.reply("Welcome!🌸 What's your name?");

    const { message } = await conversation.waitFor("message:text");
    const userName = message.text;
    
    user = await prisma.user.create({
      data: {
        name: userName,
        id: telegramId,  
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    for (const category of defaultCategories) {
      await prisma.category.create({
        data: {
          name: category,
          userId: telegramId!,
        }
      });
    }

  
    
    setCurrentKeyboard(telegramId!, startKeyboard);
    await ctx.reply(`Welcome to PiggyPal, ${user.name} 🐷.`, {
      reply_markup: startKeyboard
    }); 
    }

}catch(e){
  console.error("Error during registration:", e);
  await ctx.reply("An error occurred during registration. Please try again later.");
}

}

