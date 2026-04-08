import 'dotenv/config';
import app from '../src/app.js';
import { connectMongo } from '../src/config/mongo.js';

export default async (req, res) => {
  try {
    // Ensure MongoDB is connected
    await connectMongo();
    
    // Use the express app to handle the request
    return app(req, res);
  } catch (error) {
    console.error('Serverless Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
