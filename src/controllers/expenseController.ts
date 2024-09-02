import { MyConversation, MyContext } from "../context/context";
import { startKeyboard } from "../ui/customKeyoard";
import { prisma } from "../client";

async function addExpenses(conversation: MyConversation, ctx: MyContext) {
    console.log('addExpenses function called');
    await ctx.reply("How much did you spend?");
   
    const { message } = await conversation.waitFor("message:text");
    const amount = parseInt(message.text, 10);

    const user = await prisma.user.findFirst({
      where: { id: ctx.from?.id.toString() },
    });

    if (!user) {
      await ctx.reply("User not found in the database.");
      return;
    }

    
    const category = await prisma.category.findFirst({
      where: { name: "Uncategorized" },
    });

  
    if (!isNaN(amount) && Number.isInteger(amount)) {
      try{
        await prisma.expense.create({
          data: {
            amount: amount,
            categoryId: category?.id || "",
            description: "Expense description",
            userId: user.id,
          },
        });
        await ctx.reply(`Expense of ${amount} recorded.`);
     
      }
      catch(e){

      }
      
    } else {
      await ctx.reply("Invalid input. Please enter a valid integer value.");
    }

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
    if (!Array.isArray(ctx.session.expenses) || ctx.session.expenses.length === 0) {
      await ctx.reply("You haven't recorded any expenses yet.");
      return;
    }
  
    const expensesKeyboard = ctx.session.expenses.map((expense, index) => [
      { text: `Expense ${index + 1}: ${expense}`, callback_data: `delete_expense_${index}` },
    ])
    await ctx.reply("Delete which expense?", {
      reply_markup: {
        inline_keyboard: expensesKeyboard,
      },
      })
   
  }

  async function editExpenses(conversation: MyConversation, ctx: MyContext) {
    await ctx.reply("This function is not available. You can add new expenses or delete all expenses.");
  }

  export default {addExpenses, viewExpenses, deleteExpenses, editExpenses};