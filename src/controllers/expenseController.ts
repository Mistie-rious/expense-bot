import { MyContext, MyConversation } from "../context/context";
import { prisma } from "../client";


export interface User {
  id: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

async function addExpenses(conversation: MyConversation, ctx: MyContext) {
  console.log('addExpenses function called');
 
 
  const user = await prisma.user.findUnique({
    where: { id: ctx.from?.id.toString() }, 
  });



  if (!user) {
    await ctx.reply("User not found.");
    return;
  }

  await ctx.reply("Please enter the amount you spent:");
  const { message } = await conversation.waitFor(["message:text"]);
  console.log(`User entered: ${message.text}`);
  const amount = parseFloat(message.text);

  if (isNaN(amount)) {
    await ctx.reply("Invalid amount. Please try again.");
    return;
  }

  let category = await prisma.category.findFirst({
    where: { name: "Uncategorized" },
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: "Uncategorized",
        userId: user.id,
      },
    });
  }
  if (!isNaN(amount) && Number.isInteger(amount)) {
    try {
      await prisma.expense.create({
        data: {
          amount: amount,
          categoryId: category.id,
          description: "Expense description",
          userId: user.id,
        },
      });
      await ctx.reply(`Expense of ${amount} recorded.`);
      console.log(user.id)
      console.log(`Expense ${amount} recorded`);

    } catch (e) {
      console.error("Error creating expense:", e);
      await ctx.reply("There was an error recording the expense. Please try again.");
    }
  } else {
    await ctx.reply("Invalid input. Please enter a valid integer value.");
  }
}

async function viewExpenses(conversation: MyConversation, ctx: MyContext) {

  const user = await prisma.user.findUnique({
    where: { id:  ctx.from?.id.toString() }, 
  });

  if (!user) {
    await ctx.reply("User not found.");
    return;
  }

  const expenses = await prisma.expense.findMany({
    where: { userId: user.id },
    select: { amount: true },
  });

  if (expenses.length === 0) {
    await ctx.reply("You haven't recorded any expenses yet.");
  } else {
    const total = expenses.reduce((a, b) => a + b.amount, 0);
    const expenseStrings = expenses.map((expense) => `${expense.amount}`);
    await ctx.reply(`Your expenses: ${expenseStrings.join(', ')}\nTotal: ${total}`);
  }
}

async function deleteExpenses(conversation: MyConversation, ctx: MyContext) {

  const user = await prisma.user.findUnique({
    where: { id:  ctx.from?.id.toString() }, 
  });


  if (!user) {
    await ctx.reply("User not found.");
    return;
  }

  const expenses = await prisma.expense.findMany({
    where: { userId: user.id },
    select: { id: true, amount: true },
  });

  if (expenses.length === 0) {
    await ctx.reply("You haven't recorded any expenses yet.");
    return;
  }

  const expensesKeyboard = expenses.map((expense, index) => [
    { text: `Expense ${index + 1}: ${expense.amount}`, callback_data: `delete_expense_${expense.id}` },
  ]);

  await ctx.reply("Delete which expense?", {
    reply_markup: {
      inline_keyboard: expensesKeyboard,
    },
  });





}
async function editExpenses(conversation: MyConversation, ctx: MyContext) {


  const user = await prisma.user.findUnique({
    where: { id: ctx.from?.id.toString() },
  });

  
  if (!user) {
    await ctx.reply("User not found.");
    return;
  }
  const expenses = await prisma.expense.findMany({
    where: { userId: user.id },
    select: { id: true, amount: true },
  });
  if (expenses.length === 0) {
    await ctx.reply("You haven't recorded any expenses yet.");
    return;
  }
  const expensesKeyboard = expenses.map((expense, index) => [
    { text: `Expense ${index + 1}: ${expense.amount}`, callback_data: `edit_expense_${expense.id}` },
  ]);
  await ctx.reply("Edit which expense?", {
    reply_markup: {
      inline_keyboard: expensesKeyboard,
    },
  });


  const result = await conversation.waitFor("callback_query:data");
  if (!result) {
    await ctx.reply("No expense selected. Operation cancelled.");
    return;
  }

  
  const callbackQueryId = result.update.callback_query.id;


  try {
    await ctx.api.answerCallbackQuery(callbackQueryId);
  } catch (error) {
    console.error("Error answering callback query:", error);
   
  }

  const callbackData = result.update.callback_query.data
  const expenseId = callbackData.split("_")[2];


  const expenseToEdit = await prisma.expense.findUnique({
    where: { id: expenseId },
  });

  if (!expenseToEdit) {
    await ctx.reply("Expense not found. Operation cancelled.");
    return;
  }


  await ctx.reply(`Current amount: ${expenseToEdit.amount}. Please enter the new amount:`);


  const response = await conversation.wait();
  if (!response.message?.text) {
    await ctx.reply("Invalid response. Operation cancelled.");
    return;
  }
  
  const newAmount = parseFloat(response.message.text);
  if (isNaN(newAmount)) {
    await ctx.reply("Invalid amount. Please try again with a valid number.");
    return;
  }


  try {
    await prisma.expense.update({
      where: { id: expenseId },
      data: { amount: newAmount },
    });

    await ctx.reply(`New amount is ${newAmount}.`);
  } catch (error) {
    console.error("Error updating expense:", error);
    await ctx.reply("An error occurred while updating the expense. Please try again later.");
  }
}


export default { addExpenses, viewExpenses, deleteExpenses, editExpenses };