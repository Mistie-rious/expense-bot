import { Context,NextFunction } from "grammy";

async function responseTime(
    ctx: Context,
    next: NextFunction, 
  ): Promise<void> {
   
      const before = Date.now();
      console.log(`Received a request at ${new Date(before).toISOString()}`);
      await next();
      const after = Date.now();
      console.log(`Response time: ${after - before}ms`);
  }

  export default responseTime;