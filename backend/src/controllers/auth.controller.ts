import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { generateToken } from '../utils/jwt';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, phone, tcNo, city, role } = req.body;

    // Validation
    if (!email || !password || !name || !phone || !tcNo || !city) {
      res.status(400).json({ error: 'Email, şifre, ad, telefon, il ve TC No alanları zorunludur.' });
      return;
    }

    if (tcNo.length !== 11 || !/^\d+$/.test(tcNo)) {
      res.status(400).json({ error: 'TC Kimlik Numarası 11 haneli bir sayı olmalıdır.' });
      return;
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { tcNo }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.isBlocked) {
        res.status(403).json({ error: 'Bu kullanıcı sistemden engellenmiştir ve tekrar kayıt olamaz.' });
        return;
      }
      const field = existingUser.email === email ? 'E-posta' : 'TC No';
      res.status(409).json({ error: `${field} zaten kullanımda.` });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const trialDays = 3;
    const subscriptionEndDate = role === 'EXPERT' ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000) : null;
    const subscriptionActive = role === 'EXPERT' ? true : false;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        tcNo,
        city,
        role: role || 'USER',
        isApproved: role === 'EXPERT' ? false : true,
        subscriptionActive,
        subscriptionEndDate,
        trialUsed: role === 'EXPERT' ? true : false
      }
    });

    const token = generateToken({ userId: user.id, role: user.role });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        city: user.city,
        role: user.role,
        isApproved: user.isApproved,
        subscriptionActive: user.subscriptionActive,
        subscriptionEndDate: user.subscriptionEndDate
      }
    });
  } catch (error) {
    console.error('Registration error', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Check user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
       res.status(401).json({ error: 'Invalid email or password' });
       return;
    }

    if (user.isBlocked) {
       res.status(403).json({ error: 'Hesabınız askıya alınmıştır. Lütfen destek ile iletişime geçin.', blockedReason: user.blockedReason });
       return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
       res.status(401).json({ error: 'Invalid email or password' });
       return;
    }

    // Create token
    const token = generateToken({ userId: user.id, role: user.role });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        city: user.city,
        role: user.role,
        isApproved: user.isApproved,
        subscriptionActive: user.subscriptionActive,
        subscriptionEndDate: user.subscriptionEndDate,
        trialUsed: user.trialUsed
      }
    });
  } catch (error) {
    console.error('Login error', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};
