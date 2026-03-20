import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

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
