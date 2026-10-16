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

const validateCardDetails = (cardNumber?: string, expiry?: string, cvc?: string): boolean => {
    if (!cardNumber || !expiry || !cvc) return false;
    const cleanNum = cardNumber.replace(/\D/g, '');
    if (cleanNum.length !== 16) return false;
    if (!/^\d{3,4}$/.test(cvc.trim())) return false;

    // Luhn Algoritması kontrolü
    let sum = 0;
    let shouldDouble = false;
    for (let i = cleanNum.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNum.charAt(i), 10);
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    if (sum % 10 !== 0) return false;

    // Son kullanma tarihi kontrolü (AA/YY)
    const parts = expiry.split('/');
    if (parts.length !== 2) return false;
    const month = parseInt(parts[0], 10);
    const year = parseInt(parts[1].length === 2 ? '20' + parts[1] : parts[1], 10);
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) return false;
    const now = new Date();
    const expDate = new Date(year, month, 0, 23, 59, 59);
    if (expDate < now) return false;

    return true;
};

export const initiatePayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.userId;
        const { method, amount, notes, receiptUrl, cardNumber, expiry, cvc, cardHolder } = req.body;

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            res.status(400).json({ error: 'Geçersiz ödeme tutarı.' });
            return;
        }

        if (method === 'CARD') {
            if (!validateCardDetails(cardNumber, expiry, cvc)) {
                res.status(400).json({ error: 'Geçersiz kart bilgileri! Lütfen kart numarası, son kullanma tarihi ve CVC kodunu kontrol ediniz.' });
                return;
            }
        } else if (method === 'TRANSFER') {
            if (!receiptUrl) {
                res.status(400).json({ error: 'Havale/EFT ödemeleri için dekont görseli zorunludur.' });
                return;
            }
        } else {
            res.status(400).json({ error: 'Geçersiz ödeme yöntemi.' });
            return;
        }

        const authCode = method === 'CARD' ? `POS-${Date.now().toString(36).toUpperCase()}` : null;

        const payment = await prisma.payment.create({
            data: {
                userId,
                method, // CARD or TRANSFER
                amount: numAmount,
                status: method === 'CARD' ? 'APPROVED' : 'PENDING',
                notes: notes || (method === 'TRANSFER' ? 'Havale Bildirimi' : `Kredi Kartı Ödemesi (Onay Kodu: ${authCode})`),
                receiptUrl: receiptUrl || null
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
