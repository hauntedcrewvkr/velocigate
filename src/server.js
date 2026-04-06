import 'dotenv/config';
import app from './app.js';
import { connectMongo } from './config/mongo.js';

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectMongo();
    app.listen(PORT, () => {
      console.log(`🚀 Velocigate server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

start();
