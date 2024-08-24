import {
    type Conversation,
    type ConversationFlavor,

  } from "@grammyjs/conversations";
  import { Context } from "grammy";

 export type MyContext = Context & ConversationFlavor
export  type MyConversation = Conversation<MyContext>


 export async function greeting(conversation:MyConversation, ctx:MyContext) {
  await ctx.reply("Hello! What's your name?");

  const {message} = await conversation.waitFor("message:text");
  const userName = message.text;
  await ctx.reply(`Nice to meet you, ${userName}!`);
  }