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

  const user = await prisma.user.findFirst({
    where: { id: ctx.session.userId }, 
  });

  if (!user) {
    await ctx.reply("User not found.");
    return;
  }

  await ctx.reply("Please enter the amount of the expense:");
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

  const user = await prisma.user.findFirst({
    where: { id: ctx.session.userId }, 
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

  const user = await prisma.user.findFirst({
    where: { id: ctx.session.userId }, 
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
  await ctx.reply("This function is not available. You can add new expenses or delete all expenses.");
}

export default { addExpenses, viewExpenses, deleteExpenses, editExpenses };