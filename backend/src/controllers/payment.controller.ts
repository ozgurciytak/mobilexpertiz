import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getExpertSubscriptionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { subscriptionActive: true, subscriptionEndDate: true }
        });
        
        // Also get system settings for payment info
        const settings = await prisma.systemSetting.findMany();
        const settingsMap = settings.reduce((acc: any, s) => {
            acc[s.key] = s.value;
            return acc;
        }, {});

        res.json({ status: user, settings: settingsMap });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const initiatePayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.userId;
        const { method, amount, notes } = req.body;

        const payment = await prisma.payment.create({
            data: {
                userId,
                method, // CARD or TRANSFER
                amount: parseFloat(amount),
                status: method === 'CARD' ? 'APPROVED' : 'PENDING',
                notes: notes || (method === 'TRANSFER' ? 'Havale Bildirimi' : 'Kredi Kartı Ödemesi')
            }
        });

        if (method === 'CARD') {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            const newEndDate = user?.subscriptionEndDate && user.subscriptionEndDate > new Date()
                ? new Date(user.subscriptionEndDate.getTime() + 30 * 24 * 60 * 60 * 1000)
                : new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);

            await prisma.user.update({
                where: { id: userId },
                data: {
                    subscriptionActive: true,
                    subscriptionEndDate: newEndDate
                }
            });
        }

        res.status(201).json({ message: 'Success', payment });
    } catch (error) {
        console.error('initiatePayment error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMyPayments = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.userId;
        const payments = await prisma.payment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
