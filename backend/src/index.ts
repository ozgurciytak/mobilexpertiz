import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Route imports
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import requestRoutes from './routes/request.routes';
import quoteRoutes from './routes/quote.routes';
import reportRoutes from './routes/report.routes';
import reviewRoutes from './routes/review.routes';
import uploadRoutes from './routes/upload.routes';
import paymentRoutes from './routes/payment.routes';
import supportRoutes from './routes/support.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body));
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Mobil Expertiz API is running' });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[GLOBAL ERROR]', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

const server = app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Accessible on local network via http://192.168.1.166:${port}`);
});

// Bağlantı stabilitesi için keep-alive ayarları
// (mobile istemcilerin idle bağlantıları düşmesini önler)
server.keepAliveTimeout = 65000; // 65 saniye (proxy timeout'larının üzerinde)
server.headersTimeout = 70000;   // keepAliveTimeout'tan biraz büyük olmalı

// Process-level hata yakalama (server crash'i önler)
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
  // Kritik hatalarda graceful shutdown
  server.close(() => process.exit(1));
});

// Graceful shutdown (CTRL+C veya sistem sinyali)
const shutdown = () => {
  console.log('[Server] Kapatılıyor...');
  server.close(() => {
    console.log('[Server] Tüm bağlantılar kapatıldı.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
