import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import { velocigate } from './middlewares/velocigate.js';
import analyticsRouter from './routes/analytics.js';

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'UP', message: 'Velocigate is active' });
});

app.use('/admin', analyticsRouter);
app.use('/debug', analyticsRouter);

app.use('/api', velocigate());

app.get('/api/resource', (req, res) => {
  res.json({ data: 'Resource content' });
});

export default app;
