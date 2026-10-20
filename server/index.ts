import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { initSchema } from './db';
import authRoutes from './routes/auth';
import businessRoutes from './routes/business';
import reportsRoutes from './routes/reports';
import exportRoutes from './routes/export';
import aiRoutes from './routes/ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MotoLarry OS API' });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api', businessRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/sales/export', exportRoutes);
app.use('/api/ai', aiRoutes);

// Always serve static frontend assets
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    next();
  }
});

// Initialize self-healing database schema on startup
initSchema().catch(err => {
  console.error('Failed to initialize database schema:', err);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
