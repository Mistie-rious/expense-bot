import { session } from "grammy";
import { sessionData } from "./context";

 export function initial(): sessionData {
  return { moonCount: 0 , expenses: [] as number[]};
}