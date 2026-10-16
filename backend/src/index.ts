import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

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

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Mobile & WebView compatibility
}));

app.use(cors());
app.use(express.json());

// Rate Limiting (DDoS & Brute-force protection)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25, // 15 dakikada maks 25 giriş/kayıt denemesi
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla giriş denemesi yapıldı. Lütfen 15 dakika sonra tekrar deneyin.' }
});

app.use('/api/', generalLimiter);

// Sensitive Body Logger Sanitization (PCI-DSS & KVKK compliance)
const sanitizeBody = (body: any) => {
  if (!body || typeof body !== 'object') return body;
  const clone = { ...body };
  const sensitiveKeys = ['password', 'cardNumber', 'cvc', 'expiry', 'token', 'resetCode', 'tcNo'];
  for (const key of sensitiveKeys) {
    if (key in clone && clone[key]) {
      clone[key] = '***REDACTED***';
    }
  }
  return clone;
};

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(sanitizeBody(req.body)));
  }
  next();
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
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

if (process.env.VERCEL !== '1') {
  const server = app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`Accessible on local network via http://192.168.1.166:${port}`);
  });

  // Bağlantı stabilitesi için keep-alive ayarları
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 70000;

  // Process-level hata yakalama
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server] Unhandled Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('[Server] Uncaught Exception:', error);
    server.close(() => process.exit(1));
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('[Server] Kapatılıyor...');
    server.close(() => {
      console.log('[Server] Tüm bağlantılar kapatıldı.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;
