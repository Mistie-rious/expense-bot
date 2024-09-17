import { MyContext, MyConversation } from "../context/context";
import { prisma } from "../client";
import { InlineKeyboard } from "grammy";
import { expensesKeyboard, dateRangeKeyboard, yesNoKeyboard , skipDescriptionKeyboard} from "../ui/customKeyboard";
import { viewKeyboard } from "../ui/customKeyboard";
import { Prisma } from "@prisma/client";
import { getPreviousKeyboard } from "../ui/customKeyboard";


export interface User {
  id: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}
async function addExpenses(conversation: MyConversation, ctx: MyContext) {
  console.log("addExpenses function called");
  try {
    const user = await prisma.user.findUnique({
      where: { id: ctx.from?.id.toString() },
    });
    if (!user) {
      await ctx.reply("User not found.");
      return;
    }

   
await ctx.reply("Please enter the amount you spent:");
   
    const { message: amountMessage } = await conversation.waitFor(["message:text"]);
    console.log(`User entered amount: ${amountMessage.text}`);
    const amount = parseFloat(amountMessage.text);

    if (isNaN(amount)) {
      await ctx.reply("Invalid amount. Please try again.");
      return;
    }

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
    });
    const categoriesKeyboard = new InlineKeyboard();
    categories.forEach((category) => {
      categoriesKeyboard.text(category.name, `category_${category.id}`).row();
    });

   const addMessage = await ctx.reply("Where does this fall under?", {
      reply_markup: categoriesKeyboard,
    });
    const addID = addMessage.message_id;
    const categoryResult = await conversation.waitFor("callback_query:data");
    const categoryCallbackData = categoryResult.update.callback_query.data;
    const categoryId = categoryCallbackData.split("_")[1];

    try {
      await ctx.api.answerCallbackQuery(categoryResult.update.callback_query.id);
    } catch (e) {
      console.error("Error answering category callback query:", e);
    }


    await ctx.api.editMessageText(ctx.chat!.id, addID,"Enter a description for this expense (or click 'Skip description'):", {
      reply_markup: skipDescriptionKeyboard,
    });

    const descriptionResult = await conversation.waitFor(["message:text", "callback_query:data"]);
    let description = "";

    if (descriptionResult.callbackQuery?.data === "skip_description") {
      try {
        await ctx.api.answerCallbackQuery(descriptionResult.callbackQuery.id);
      } catch (e) {
        console.error("Error answering skip description callback query:", e);
      }
    } else if (descriptionResult.message?.text) {
      description = descriptionResult.message.text;
    }


    try {
      await prisma.expense.create({
        data: {
          amount: amount,
          categoryId: categoryId,
          description: description,
          userId: user.id,
          date: new Date(), 
        },
      });
      await ctx.reply(`Expense of ₦${amount.toFixed(2)} recorded.\nDescription: ${description}`, {
        reply_markup: expensesKeyboard
      });
      console.log(`Expense ₦${amount.toFixed(2)} recorded for user ${user.id}`);
    } catch (e) {
      console.error("Error creating expense:", e);
      await ctx.reply(
        "There was an error recording the expense. Please try again."
      );
    }
  } catch (e) {
    console.error("Error recording expense:", e);
    await ctx.reply("An error occurred while adding the expense. Please try again.");
  }
}
async function viewExpenses(conversation: MyConversation, ctx: MyContext) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: ctx.from?.id.toString() },
    });
    if (!user) {
      await ctx.reply("User not found.");
      return;
    }

    const viewKeyboard = new InlineKeyboard()
      .text("View by category", "view_category").row()
      .text("View by date", "view_date") .row()
     
     

    const viewExpense = await ctx.reply("View expenses by:", { reply_markup: viewKeyboard });
    
    // Wait for callback query
    const response = await conversation.waitFor("callback_query:data");
    if (!response) {
      await ctx.reply("No selection made. Operation cancelled.");
      return;
    }

    const callbackData = response.update.callback_query.data;
    const messageId = viewExpense.message_id;

    // Answer the callback query to remove the loading indicator
    await ctx.api.answerCallbackQuery(response.update.callback_query.id);

    switch (callbackData) {
      case "view_category":
        await viewByCategory(conversation, ctx, user.id, messageId);
        break;
      case "view_date":

        await viewByDate(conversation, ctx, user.id, messageId);
    
        break;
    
      default:
        await ctx.reply("Invalid choice. Please select from the keyboard options.");
    }
  } catch (e) {
    console.error("Error viewing expenses:", e);
    await ctx.reply("An error occurred while viewing expenses. Please try again later.");
  }
}

async function viewByCategory(conversation: MyConversation, ctx: MyContext, userId: string, messageId: number) {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: userId },
    });
    const categoriesKeyboard = new InlineKeyboard();
    categories.forEach((category) => {
      categoriesKeyboard.text(category.name, `category_${category.id}`).row();
    });
    
    try {
      await ctx.api.editMessageText(
        ctx.chat!.id,
        messageId,
        "View expenses in which category?",
        { reply_markup: categoriesKeyboard }
      );
    } catch (editError) {
      console.error("Error editing message:", editError);
      // If editing fails, send a new message
      await ctx.reply("View expenses in which category?", {
        reply_markup: categoriesKeyboard,
      });
    }

    const result = await conversation.waitFor("callback_query:data");
    if (!result) {
      await ctx.reply("No category selected. Operation cancelled.");
      return;
    }

    const callbackQueryId = result.update.callback_query.id;
    try {
      await ctx.api.answerCallbackQuery(callbackQueryId);
    } catch (error) {
      console.error("Error answering callback query:", error);
    }

    const callbackData = result.update.callback_query.data;
    const categoryId = callbackData.split("_")[1];
    
    await displayExpenses(ctx, userId, { categoryId }, messageId);

    // Optionally, you can add a message here to indicate the operation is complete
   

  } catch (error) {
    console.error("Error in viewByCategory:", error);
    if (error instanceof Error) {
      await ctx.reply(`An error occurred: ${error.message}`);
    } else {
      await ctx.reply("An unknown error occurred.");
    }
  }
}
async function viewByDate(conversation: MyConversation, ctx: MyContext, userId: string, messageId: number) {
  const dateRangeKeyboard = new InlineKeyboard()
    .text("Last Week", "date_week")
    .text("Last Month", "date_month")
    .row()
    .text("Last 3 Months", "date_3months")
    .text("Custom Range", "date_custom");

  await ctx.api.editMessageText(
    ctx.chat!.id,
    messageId,
    "Select a date range:",
    { reply_markup: dateRangeKeyboard }
  );

  const result = await conversation.waitFor("callback_query:data");
  if (!result) {
    await ctx.reply("No date range selected. Operation cancelled.");
    return;
  }

  const callbackQueryId = result.update.callback_query.id;
  try {
    await ctx.api.answerCallbackQuery(callbackQueryId);
  } catch (error) {
    console.error("Error answering callback query:", error);
  }

  const callbackData = result.update.callback_query.data;
  let startDate: Date, endDate: Date;
  const now = new Date();
  let isCustomRange = false;

  switch (callbackData) {
    case "date_week":
      startDate = new Date(now.setDate(now.getDate() - 7));
      endDate = new Date();
      break;
    case "date_month":
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      endDate = new Date();
      break;
    case "date_3months":
      startDate = new Date(now.setMonth(now.getMonth() - 3));
      endDate = new Date();
      break;
    case "date_custom":
      await ctx.api.editMessageText(ctx.chat!.id, messageId, "Please enter the start date (YYYY-MM-DD):");
      const startDateStr = await conversation.form.text();
      await ctx.reply("Please enter the end date (YYYY-MM-DD):");
      const endDateStr = await conversation.form.text();
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
      isCustomRange = true;
      break;
    default:
      await ctx.reply("Invalid date range. Please try again.");
      return;
  }

  await displayExpenses(ctx, userId, { startDate, endDate }, messageId, isCustomRange);
}

async function displayExpenses(
  ctx: MyContext, 
  userId: string, 
  filter: { categoryId?: string, startDate?: Date, endDate?: Date }, 
  messageId: number,
  isCustomRange: boolean = false
) {
  const whereClause: Prisma.ExpenseWhereInput = { userId };
  
  if (filter.categoryId) {
    whereClause.categoryId = filter.categoryId;
  }
  
  if (filter.startDate || filter.endDate) {
    whereClause.date = {};
    if (filter.startDate) {
      whereClause.date.gte = new Date(filter.startDate.setHours(0, 0, 0, 0));
    }
    if (filter.endDate) {
      whereClause.date.lte = new Date(filter.endDate.setHours(23, 59, 59, 999));
    }
  }

  const expenses = await prisma.expense.findMany({
    where: whereClause,
    include: { category: true },
    orderBy: { date: 'desc' },
  });

  if (expenses.length === 0) {
    const noExpensesMessage = "No expenses found for the selected criteria.";
    if (isCustomRange) {
      await ctx.reply(noExpensesMessage);
    } else {
      await ctx.api.editMessageText(ctx.chat!.id, messageId, noExpensesMessage);
    }
    return;
  }

  let message = "Your expenses:\n\n";
  let total = 0;

  for (const expense of expenses) {
    const formattedDate = expense.date.toISOString().split('T')[0];
    message += `Date: ${formattedDate}\n`;
    message += `Category: ${expense.category.name}\n`;
    message += `Amount: ₦${expense.amount.toFixed(2)}\n`;
    if (expense.description) {
      message += `Description: ${expense.description}\n`;
    }
    message += '-------------------------\n';
    total += expense.amount;
  }

  message += `\nTotal: ₦${total.toFixed(2)}`;

  if (isCustomRange) {
    await ctx.reply(message);
  } else {
    await ctx.api.editMessageText(ctx.chat!.id, messageId, message);
  }
}

async function deleteExpenses(conversation: MyConversation, ctx: MyContext) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: ctx.from?.id.toString() },
    });
    if (!user) {
      await ctx.reply("User not found.");
      return;
    }
    
    const categories = await prisma.category.findMany({
      where: { userId: user.id },
    });
    
    const categoriesKeyboard = new InlineKeyboard();
    categories.forEach((category) => {
      categoriesKeyboard.text(category.name, `category_${category.id}`).row();
    });
   
    const deleteMessage = await ctx.reply("Delete expenses in which category?", {
      reply_markup: categoriesKeyboard,
    });
    const messageId = deleteMessage.message_id;

    // Wait for category selection
    const categoryResult = await conversation.waitFor("callback_query:data");
    if (!categoryResult) {
      await ctx.reply("No category selected. Operation cancelled.");
      return;
    }

    await ctx.api.answerCallbackQuery(categoryResult.update.callback_query.id);
    
    const categoryId = categoryResult.update.callback_query.data.split("_")[1];
    console.log(`User selected category ${categoryId}`);
    const expenses = await prisma.expense.findMany({
      where: { userId: user.id, categoryId: categoryId },
      select: { id: true, amount: true },
    });

    if (expenses.length === 0) {
      await ctx.api.editMessageText(ctx.chat!.id, messageId, "You haven't recorded any expenses in this category.");
      return;
    }

    const expensesKeyboard = new InlineKeyboard();
    expenses.forEach((expense, index) => {
      expensesKeyboard
        .text(`Expense ${index + 1}: ${expense.amount}`, `delete_expense_${expense.id}`)
        .row();
    });

    await ctx.api.editMessageText(
      ctx.chat!.id, 
      messageId, 
      "Delete which expense?", 
      { reply_markup: expensesKeyboard }
    );

    // Wait for expense selection
    const expenseResult = await conversation.waitFor("callback_query:data");
    if (!expenseResult) {
      await ctx.reply("No expense selected. Operation cancelled.");
      return;
    }

    await ctx.api.answerCallbackQuery(expenseResult.update.callback_query.id);

    const expenseId = expenseResult.update.callback_query.data.split("_")[2];

    // Delete the selected expense
    await prisma.expense.delete({
      where: { id: expenseId },
    });

    await ctx.api.editMessageText(ctx.chat!.id, messageId, "Expense deleted successfully.");




  } catch (e) {
    console.error("Error in deleteExpenses:", e);
    await ctx.reply("An error occurred while deleting the expense. Please try again later.");
  }

}

async function editExpenses(conversation: MyConversation, ctx: MyContext) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: ctx.from?.id.toString() },
    });

    if (!user) {
      await ctx.reply("User not found.");
      return;
    }

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
    });

    const categoriesKeyboard = new InlineKeyboard();
    categories.forEach((category) => {
      categoriesKeyboard.text(category.name, `category_${category.id}`).row();
    });

    const editMessage = await ctx.reply("Edit expenses in which category?", {
      reply_markup: categoriesKeyboard,
    });
    const messageId = editMessage.message_id;

    // Wait for category selection
    const categoryResult = await conversation.waitFor("callback_query:data");
    if (!categoryResult) {
      await ctx.reply("No category selected. Operation cancelled.");
      return;
    }

    await ctx.api.answerCallbackQuery(categoryResult.update.callback_query.id);

    const categoryId = categoryResult.update.callback_query.data.split("_")[1];
    console.log(`User selected category ${categoryId}`);
    const expenses = await prisma.expense.findMany({
      where: { userId: user.id, categoryId: categoryId },
      select: { id: true, amount: true },
    });

    if (expenses.length === 0) {
      await ctx.api.editMessageText(ctx.chat!.id, messageId, "You haven't recorded any expenses in this category.");
      return;
    }

    const expensesKeyboard = new InlineKeyboard();
    expenses.forEach((expense, index) => {
      expensesKeyboard
        .text(`Expense ${index + 1}: ${expense.amount}`, `edit_expense_${expense.id}`)
        .row();
    });

    await ctx.api.editMessageText(
      ctx.chat!.id, 
      messageId, 
      "Edit which expense?", 
      { reply_markup: expensesKeyboard }
    );

    const editExpenseResult = await conversation.waitFor("callback_query:data");
    if (!editExpenseResult) {
      await ctx.reply("No expense selected. Operation cancelled.");
      return;
    }

    await ctx.api.answerCallbackQuery(editExpenseResult.update.callback_query.id);

    const expenseId = editExpenseResult.update.callback_query.data.split("_")[2];

    const expenseToEdit = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expenseToEdit) {
      await ctx.reply("Expense not found. Operation cancelled.");
      return;
    }

    await ctx.api.editMessageText(ctx.chat!.id, messageId,
      `Current amount: ${expenseToEdit.amount}. Please enter the new amount:`
    );

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

      await ctx.reply(`Expense updated successfully. New amount is ${newAmount}.`);
    } catch (error) {
      console.error("Error updating expense:", error);
      await ctx.reply(
        "An error occurred while updating the expense. Please try again later."
      );
    }

  } catch (e) {
    console.error("Error editing expense:", e);
    await ctx.reply("An error occurred while editing the expense. Please try again later.");
  }
}
export default { addExpenses, viewExpenses, deleteExpenses, editExpenses };
