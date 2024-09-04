import {
    type Conversation,
    type ConversationFlavor,

  } from "@grammyjs/conversations";

  import { Context, SessionFlavor } from "grammy";


export interface sessionData {
    moonCount: number;
    expenses: {
      amount: number;
      category: string;
      description: string;
      date: Date;
    }[];
    userId?: string;
  }

  
export type MyContext = Context & ConversationFlavor & SessionFlavor<sessionData> & {
  callback_query?: {
    data: string;
  };
};
export  type MyConversation = Conversation<MyContext>


