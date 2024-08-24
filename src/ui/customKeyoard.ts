import { Context, Keyboard } from "grammy";

export const entryKeyboard = new Keyboard()
.text("Add Expense")
.row()
.text("View Expenses")
.row()
.text("Delete Expense")
.row()
.text("Edit Expense")
.row()
.resized()
