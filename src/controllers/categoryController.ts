import { prisma } from "../client";
import { MyConversation, MyContext } from "../context/context";
import { categoryKeyboard } from "../ui/customKeyboard";
import { User } from "./expenseController";
import { InlineKeyboard } from "grammy";

const addCategory = async (conversation: MyConversation, ctx: MyContext) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: ctx.from?.id.toString() },
    });

    if (!user) {
      await ctx.reply("User not found.");
      return;
    }

    await ctx.reply("Please enter the name of the category:");
    const { message } = await conversation.waitFor(["message:text"]);

    const categoryExist = await prisma.category.findFirst({
where: { name: message.text }
    })

    if (categoryExist) {
      await ctx.reply("Category already exists.");
      return;
    }

    const category = await prisma.category.create({
      data: {
        name: message.text,
        userId: user.id,
      },
    });

    await ctx.reply(`Category '${category.name}' created successfully.`, {
      reply_markup: categoryKeyboard,
    });
  } catch (e) {
    console.error("Error during category creation:", e);
    await ctx.reply(
      "An error occurred during category creation. Please try again later."
    );
  }
};

const viewCategories = async (conversation: MyConversation, ctx: MyContext) => {
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

    if (categories.length === 0) {
      await ctx.reply("No categories found.");
      return;
    }

    const categoryNames = categories
      .map((category) => category.name)
      .join("\n");
    await ctx.reply(`Your categories:\n${categoryNames}`);
  } catch (e) {
    console.error("Error viewing categories:", e);
    await ctx.reply(
      "An error occurred while viewing categories. Please try again later."
    );
  }
};

const editCategory = async (conversation: MyConversation, ctx: MyContext) => {
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

    if (categories.length === 0) {
      await ctx.reply("No categories found.");
      return;
    }

    const categoryKeyboard = categories.map((category) => [
      {
        text: category.name,
        callback_data: `edit_category_${category.id}`,
      },
    ]);

    await ctx.reply("Select a category to edit:", {
      reply_markup: {
        inline_keyboard: categoryKeyboard,
      },
    });

    const result = await conversation.waitFor(("callback_query:data"));

    const callbackQueryId = result.update.callback_query.id;


    try {
      await ctx.api.answerCallbackQuery(callbackQueryId);
    } catch (error) {
      console.error("Error answering callback query:", error);
     
    }
    
    if (!result) {
    await ctx.reply("No category selected.");
      return;
    }



    const callbackData = result.update.callback_query.data;
    const categoryId = callbackData.split("_")[2];

   const categoryExist =  await prisma.category.findUnique({
        where: { id: categoryId },
    })

    if (!categoryExist) {
        await ctx.reply("Category not found.");
        return;
    }

    await ctx.reply("Please enter the new name of the category");

    const {message} = await conversation.waitFor("message:text");

    await prisma.category.update({
        where: { id: categoryId },
        data: {
            name: message.text
        }
    });

    await ctx.reply("Category updated successfully.");





  } catch (e) {
    console.error("Error viewing categories:", e);
    await ctx.reply(
      "An error occurred while editing categories. Please try again later."
    );
  }
};

const deleteCategory = async (conversation: MyConversation, ctx: MyContext) => {
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

    if (categories.length === 0) {
      await ctx.reply("No categories found.");
      return;
    }

    const categoryKeyboard = categories.map((category) => [
      {
        text: category.name,
        callback_data: `delete_category_${category.id}`,
      },
    ]);

    await ctx.reply("Select a category to delete:", {
      reply_markup: {
        inline_keyboard: categoryKeyboard,
      },
    }

);

const result = await conversation.waitFor(("callback_query:data"));
if (!result) {
await ctx.reply("No category selected.");
  return;
}
const callbackQueryId = result.update.callback_query.id;


try {
  await ctx.api.answerCallbackQuery(callbackQueryId);
} catch (error) {
  console.error("Error answering callback query:", error);
 
}

const callbackData = result.update.callback_query.data;
const categoryId = callbackData.split("_")[2];

const categoryExist =  await prisma.category.findUnique({
    where: { id: categoryId },
})

if (!categoryExist) {
    await ctx.reply("Category not found.");
    return;
}

await prisma.expense.deleteMany({
where: { categoryId: categoryId }
})


await prisma.category.delete({
    where: { id: categoryId }
});


await ctx.reply(`${categoryExist.name} deleted successfully.`);

  } catch (e) {
    console.error("Error viewing categories:", e);
    await ctx.reply(
      "An error occurred while deleting categories. Please try again later."
    );
  }
};

export default { addCategory, viewCategories, deleteCategory, editCategory };
