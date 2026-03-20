import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';

// Extending express request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let token = '';
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
       res.status(401).json({ error: 'Auth token missing or invalid' });
       return;
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
     res.status(401).json({ error: 'Invalid or expired token' });
     return;
  }
};

export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
       res.status(403).json({ error: 'Access denied: insufficient permissions' });
       return;
    }
    
    next();
  };
};
