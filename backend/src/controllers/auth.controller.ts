import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { generateToken } from '../utils/jwt';
import { validateTcKimlikNo } from '../utils/tcKimlik';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, phone, tcNo, city, role, taxOffice, taxNumber, companyName } = req.body;

    // Validation
    if (!email || !password || !name || !phone || !city) {
      res.status(400).json({ error: 'Email, şifre, ad, telefon ve il alanları zorunludur.' });
      return;
    }

    if (role === 'EXPERT') {
      if (!taxOffice || !taxNumber || !companyName) {
        res.status(400).json({ error: 'Uzman kayıtlarında Vergi Dairesi, Vergi Numarası ve Firma Ünvanı zorunludur.' });
        return;
      }
    } else {
      if (!tcNo) {
        res.status(400).json({ error: 'TC Kimlik Numarası zorunludur.' });
        return;
      }
      if (!validateTcKimlikNo(tcNo)) {
        res.status(400).json({ error: 'Geçersiz T.C. Kimlik Numarası! Lütfen 11 haneli kimlik numaranızı doğru giriniz.' });
        return;
      }
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(tcNo ? [{ tcNo }] : [])
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
        tcNo: tcNo || null,
        city,
        taxOffice: taxOffice || null,
        taxNumber: taxNumber || null,
        companyName: companyName || null,
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

// Güvenli şifre sıfırlama kod deposu (email -> { code, expiry })
const passwordResetStore = new Map<string, { code: string; expiry: number }>();

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'E-posta adresi zorunludur.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      // Güvenlik gereği kullanıcının varlığını ifşa etmeden standart mesaj döner
      res.status(200).json({ message: 'Eğer bu e-posta adresi kayıtlıysa, 6 haneli sıfırlama kodu iletildi.' });
      return;
    }

    // 6 haneli doğrulama kodu üret
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 15 * 60 * 1000; // 15 dakika geçerli

    passwordResetStore.set(cleanEmail, { code, expiry });
    console.log(`🔑 [ŞİFRE SIFIRLAMA] ${cleanEmail} için üretilen kod: ${code}`);

    res.status(200).json({
      message: 'Sıfırlama kodunuz oluşturuldu. Lütfen gelen kodu giriniz.',
      devCode: process.env.NODE_ENV !== 'production' ? code : undefined
    });
  } catch (error) {
    console.error('forgotPassword error', error);
    res.status(500).json({ error: 'Şifre sıfırlama kodu gönderilirken bir hata oluştu.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      res.status(400).json({ error: 'E-posta, doğrulama kodu ve yeni şifre zorunludur.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalıdır.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const resetData = passwordResetStore.get(cleanEmail);

    if (!resetData || resetData.code !== code.toString().trim()) {
      res.status(400).json({ error: 'Geçersiz veya hatalı doğrulama kodu girdiniz.' });
      return;
    }

    if (Date.now() > resetData.expiry) {
      passwordResetStore.delete(cleanEmail);
      res.status(400).json({ error: 'Doğrulama kodunun 15 dakikalık süresi dolmuş. Lütfen yeni kod isteyin.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email: cleanEmail },
      data: { password: hashedPassword }
    });

    passwordResetStore.delete(cleanEmail);

    res.status(200).json({ message: 'Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz.' });
  } catch (error) {
    console.error('resetPassword error', error);
    res.status(500).json({ error: 'Şifre sıfırlanırken bir hata oluştu.' });
  }
};

