import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import { velocigate } from './middlewares/velocigate.js';
import analyticsRouter from './routes/analytics.js';

const app = express();

// 1. CORS MUST be first to ensure headers are set even on errors/404s
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(helmet({
  crossOriginResourcePolicy: false, // Essential for cross-site frontend access
}));
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'UP', message: 'Velocigate is active' });
});

// Analytics and Debug
app.use('/admin', analyticsRouter);
app.use('/debug', analyticsRouter);

// Rate Limited API
app.use('/api', velocigate());

app.get('/api/resource', (req, res) => {
  res.json({ data: 'Resource content' });
});

// 404 Handler to ensure CORS is returned even for missing routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
