import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { validateTcKimlikNo } from '../utils/tcKimlik';
import { registerUserPushToken } from '../services/pushNotification.service';

export const savePushToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { token } = req.body;
    if (!userId || !token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    registerUserPushToken(userId, token);
    res.status(200).json({ message: 'Push token başarıyla kaydedildi' });
  } catch (error) {
    console.error('savePushToken error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
       res.status(401).json({ error: 'Unauthorized' });
       return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        tcNo: true,
        taxOffice: true,
        taxNumber: true,
        companyName: true,
        city: true,
        role: true,
        isApproved: true,
        isBlocked: true,
        subscriptionActive: true,
        subscriptionEndDate: true,
        createdAt: true
      }
    });

    if (!user) {
       res.status(404).json({ error: 'User not found' });
       return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('getProfile error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, phone, city, tcNo, password, taxOffice, taxNumber, companyName } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (city !== undefined) updateData.city = city;
    
    // For EXPERTs tax fields
    if (taxOffice !== undefined) updateData.taxOffice = taxOffice;
    if (taxNumber !== undefined) updateData.taxNumber = taxNumber;
    if (companyName !== undefined) updateData.companyName = companyName;

    if (tcNo !== undefined) {
      if (tcNo && !validateTcKimlikNo(tcNo)) {
        res.status(400).json({ error: 'Geçersiz T.C. Kimlik Numarası! Lütfen doğru bir kimlik numarası giriniz.' });
        return;
      }
      updateData.tcNo = tcNo;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        city: true,
        tcNo: true,
        taxOffice: true,
        taxNumber: true,
        companyName: true,
        isApproved: true,
        subscriptionActive: true,
        subscriptionEndDate: true
      }
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('updateProfile error', error);
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Bu TC Kimlik Numarası başka bir kullanıcı tarafından kullanılıyor.' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Güvenli İlişkisel Silme (Transaction)
    // Foreign key constraint (P2003) hatasını önlemek için ilişkili kayıtlar sırayla temizlenir
    await prisma.$transaction(async (tx) => {
      // 1. Destek mesajları ve talepleri
      await tx.supportMessage.deleteMany({
        where: { OR: [{ senderId: userId }, { request: { userId } }] }
      });
      await tx.supportRequest.deleteMany({ where: { userId } });

      // 2. Yorumlar (yazdığı ve aldığı)
      await tx.review.deleteMany({
        where: { OR: [{ userId }, { expertId: userId }] }
      });

      // 3. Ödemeler
      await tx.payment.deleteMany({ where: { userId } });

      // 4. Uzman olarak verdiği teklifler
      await tx.quote.deleteMany({ where: { expertId: userId } });

      // 5. Kullanıcının taleplerine bağlı teklifler ve raporlar
      const userRequests = await tx.expertiseRequest.findMany({
        where: { userId },
        select: { id: true }
      });
      const requestIds = userRequests.map(r => r.id);

      if (requestIds.length > 0) {
        await tx.report.deleteMany({ where: { requestId: { in: requestIds } } });
        await tx.quote.deleteMany({ where: { requestId: { in: requestIds } } });
        await tx.review.deleteMany({ where: { requestId: { in: requestIds } } });
        await tx.expertiseRequest.deleteMany({ where: { id: { in: requestIds } } });
      }

      // 6. Uzman olarak yazdığı diğer raporlar
      await tx.report.deleteMany({ where: { expertId: userId } });

      // 7. Uzman olarak atandığı diğer talepler varsa bağlantısını çöz
      await tx.expertiseRequest.updateMany({
        where: { selectedExpertId: userId },
        data: { selectedExpertId: null, status: 'PENDING' }
      });

      // 8. Son olarak kullanıcı hesabını kalıcı olarak sil
      await tx.user.delete({ where: { id: userId } });
    });

    res.status(200).json({ message: 'Hesabınız ve ilişkili tüm verileriniz kalıcı olarak silindi.' });
  } catch (error) {
    console.error('deleteProfile transaction error', error);
    res.status(500).json({ error: 'Hesap silinirken bir veritabanı hatası oluştu.' });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const roleMode = req.query.role as string;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};
    if (roleMode === 'EXPERT') {
      whereClause.role = 'EXPERT';
    } else if (roleMode === 'USER') {
      whereClause.role = 'USER';
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isApproved: true,
        isBlocked: true,
        subscriptionActive: true,
        subscriptionEndDate: true,
        createdAt: true,
        payments: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const transformedUsers = users.map(user => {
      let remainingDays = null;
      if (user.subscriptionEndDate) {
        const diff = new Date(user.subscriptionEndDate).getTime() - new Date().getTime();
        remainingDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      return {
        ...user,
        remainingDays,
        lastPaymentDate: user.payments?.[0]?.createdAt || null
      };
    });

    res.status(200).json(transformedUsers);
  } catch (error) {
    console.error('getAllUsers error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const approveExpert = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    if (typeof isApproved !== 'boolean') {
       res.status(400).json({ error: 'isApproved boolean value is required' });
       return;
    }

    const expert = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!expert || expert.role !== 'EXPERT') {
       res.status(404).json({ error: 'Expert not found' });
       return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { isApproved },
      select: {
        id: true,
        name: true,
        role: true,
        isApproved: true
      }
    });

    res.status(200).json({
      message: `Expert ${isApproved ? 'approved' : 'rejected'} successfully`,
      expert: updatedUser
    });
  } catch (error) {
    console.error('approveExpert error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { subscriptionActive, days } = req.body;

        const expert = await prisma.user.findUnique({ where: { id: Number(id) } });
        if (!expert || expert.role !== 'EXPERT') {
           res.status(404).json({ error: 'Expert not found' });
           return;
        }

        let endDate = expert.subscriptionEndDate;
        if (subscriptionActive && days) {
            const today = new Date();
            today.setDate(today.getDate() + Number(days));
            endDate = today;
        }

        const updatedUser = await prisma.user.update({
            where: { id: Number(id) },
            data: { 
                subscriptionActive,
                subscriptionEndDate: endDate
            },
            select: {
                id: true,
                name: true,
                subscriptionActive: true,
                subscriptionEndDate: true
            }
        });

        res.status(200).json({
            message: `Subscription updated successfully`,
            expert: updatedUser
        });

    } catch (error) {
        console.error('updateSubscription error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
