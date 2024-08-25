import {
    type Conversation,
    type ConversationFlavor,

  } from "@grammyjs/conversations";
  import { Context, SessionFlavor } from "grammy";
import { startKeyboard } from "../src/ui/customKeyoard";
export interface sessionData {
  moonCount: number;
  expenses: number[]
}

 export type MyContext = Context & ConversationFlavor & SessionFlavor<sessionData>
export  type MyConversation = Conversation<MyContext>



 export async function greeting(conversation:MyConversation, ctx:MyContext) {
  await ctx.reply("Hello! What's your name?");

  const {message} = await conversation.waitFor("message:text");
  const userName = message.text;
  await ctx.reply(`Nice to meet you, ${userName}!`);
  await ctx.reply("What would you like to do today?", {
    reply_markup: startKeyboard,
  });

  }

  export async function mainConversation(conversation:MyConversation, ctx:MyContext) {
    // await ctx.reply("Hello! What's your name?");
  
    // const {message} = await conversation.waitFor("message:text");
    // const userName = message.text;
    // await ctx.reply(`Nice to meet you, ${userName}!`);

    let continueConversation = true;

    while(continueConversation) {
      await ctx.reply("What would you like to do today?", {
        reply_markup: startKeyboard,
      });

      const {message} = await conversation.waitFor(["message:text", "message"]);
      const userCommand = message.text.toLowerCase();

      switch(userCommand) {
        case "add expenses":
       
  console.log('About to call addExpenses');
  await addExpenses(conversation, ctx);
  break;
   
        case "view expenses":
          await viewExpenses(conversation, ctx);
          break;
        case "delete expenses":
          await deleteExpenses(conversation, ctx);
          break;
        case "edit expenses":
          await editExpenses(conversation, ctx);
          break;
        case "/stop":
          continueConversation = false;
          break;
        default:
          await ctx.reply("I don't understand that command. Please try again.");
      }
  
    }
  
    }


    async function addExpenses(conversation: MyConversation, ctx: MyContext) {
      console.log('addExpenses function called');
      await ctx.reply("How much did you spend? Please enter an integer value.");
     
      const { message } = await conversation.waitFor("message:text");
      const amount = parseInt(message.text, 10);
    
      if (!isNaN(amount) && Number.isInteger(amount)) {
        if (!Array.isArray(ctx.session.expenses)) {
          ctx.session.expenses = [];
        }
        ctx.session.expenses.push(amount);
        const total = ctx.session.expenses.reduce((a, b) => a + b, 0);
        message.text = '';
        await ctx.reply(`Expense of ${amount} added. Your total expenses are now ${total}.`);
      } else {
        await ctx.reply("Invalid input. Please enter a valid integer value.");
      }


      
      // Exit the addExpenses conversation
      return;
    }

    async function viewExpenses(conversation: MyConversation, ctx: MyContext) {
      if (!Array.isArray(ctx.session.expenses) || ctx.session.expenses.length === 0) {
        await ctx.reply("You haven't recorded any expenses yet.");
      } else {
        const total = ctx.session.expenses.reduce((a, b) => a + b, 0);
        await ctx.reply(`Your expenses: ${ctx.session.expenses.join(', ')}\nTotal: ${total}`);
      }
    }

async function deleteExpenses(conversation: MyConversation, ctx: MyContext) {
  ctx.session.expenses = [];
  await ctx.reply("All expenses have been deleted!");
}

async function editExpenses(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply("This function is not available. You can add new expenses or delete all expenses.");
}