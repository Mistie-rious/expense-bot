import { Context, Keyboard } from "grammy";

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

const buttonRows = labels.map((label) => [Keyboard.text(label)]);

export const expensesKeyboard = Keyboard.from(buttonRows).resized()

export const startKeyboard = new Keyboard()
.text("Manage Expenses").row()
.text("Manage Categories").row()
.resized()