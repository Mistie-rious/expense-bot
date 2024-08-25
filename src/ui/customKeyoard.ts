import { Context, Keyboard } from "grammy";




const labels = [
    "Add Expenses",
    "View Expenses",
    "Delete Expenses",
    "Edit Expenses"

]

const buttonRows = labels.map((label) => [Keyboard.text(label)]);

export const startKeyboard = Keyboard.from(buttonRows).resized()