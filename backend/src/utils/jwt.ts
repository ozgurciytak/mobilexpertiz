import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ [GÜVENLİK UYARISI] JWT_SECRET ortam değişkeni tanımlanmamış! Lütfen .env dosyanızda güçlü bir JWT_SECRET belirleyin.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'mobil_expertiz_secure_jwt_secret_key_2026';
const EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: number;
  role: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};
