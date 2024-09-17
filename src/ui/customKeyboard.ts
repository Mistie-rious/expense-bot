import { Context, Keyboard, InlineKeyboard } from "grammy";

export const userKeyboards = new Map<string, Keyboard[]>();


export function setCurrentKeyboard(userId: string, keyboard: Keyboard) {
    const previousKeyboards = userKeyboards.get(userId) || [];
    userKeyboards.set(userId, [...previousKeyboards, keyboard]);
}

export function getPreviousKeyboard(userId: string): Keyboard | null {
  const keyboards = userKeyboards.get(userId) || [];
  if (keyboards.length > 1) {
      keyboards.pop(); 
      return keyboards[keyboards.length - 1]; 
  }
  return null; 
}



const labels = [
    "Add Expenses",
    "View Expenses",
    "Delete Expenses",
    "Edit Expenses",
    "Go Back"

]

export const categoryKeyboard = new Keyboard()
.text("Add Category").row()
.text("View Categories").row()
.text("Delete Category").row()
.text("Edit Category").row()
.text("Go Back").row()
.resized()

export const viewKeyboard = new Keyboard()
.text("View by date").row()
.text("View by category").row()
.text("Go Back").row()
.resized()

export const dateRangeKeyboard = new InlineKeyboard()
  .text("This week", "date_week")
  .text("This month", "date_month")
  .row()
  .text("Last 3 months", "date_3months")
  .text("Custom range", "date_custom")
  .row()
  .text("Exit", "exit");
const buttonRows = labels.map((label) => [Keyboard.text(label)]);

export const expensesKeyboard = Keyboard.from(buttonRows).resized()

export const startKeyboard = new Keyboard()
.text("Manage Expenses").row()
.text("Manage Categories").row()
.resized()

export const yesNoKeyboard = new InlineKeyboard()
.text("Yes", "view_again_yes")
.text("No", "view_again_no"); 

export const skipDescriptionKeyboard = new InlineKeyboard()
.text("Skip description", "skip_description");
