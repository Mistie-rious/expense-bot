
import bot from '../bot'; 

export default async (req, res) => {
  try {
    if (req.method === 'POST') {
   
      await bot.handleUpdate(req.body, res);
    } else {
      res.status(404).send('Not found');
    }
  } catch (error) {
    console.error('Error handling bot request:', error);
    res.status(500).send('Internal Server Error');
  }
};
