import bot from '../bot';

export default async function handler(req, res) {
  // Verify webhook secret
  if (req.headers['x-telegram-bot-api-secret-token'] !== process.env.WEBHOOK_SECRET) {
    return res.status(401).send('Unauthorized');
  }

  try {
    if (req.method === 'POST') {
      // Handle the update
      await bot.init();
      await bot.handleUpdate(req.body);
      res.status(200).json({ ok: true });
    } else {
      res.status(405).send('Method not allowed');
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).send('Internal Server Error');
  }
}