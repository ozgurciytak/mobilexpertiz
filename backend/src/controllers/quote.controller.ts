import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const submitQuote = async (req: Request, res: Response): Promise<void> => {
    try {
        const expertId = req.user?.userId;
        const { requestId, price, message } = req.body;

        if (!requestId || !price) {
           res.status(400).json({ error: 'requestId and price are required' });
           return;
        }

        const expert = await prisma.user.findUnique({ where: { id: expertId } });
        if (!expert?.isApproved) {
            res.status(403).json({ error: 'Your account is not approved yet' });
            return;
        }

        if (!expert.subscriptionActive || (expert.subscriptionEndDate && new Date() > expert.subscriptionEndDate)) {
             res.status(403).json({ error: 'Active subscription is required to submit quotes' });
             return;
        }

        const request = await prisma.expertiseRequest.findUnique({ where: { id: Number(requestId) } });
        if (!request) {
            res.status(404).json({ error: 'Request not found' });
            return;
        }

        if (request.status !== 'PENDING') {
            res.status(400).json({ error: 'This request is no longer accepting quotes' });
            return;
        }

        const existingQuote = await prisma.quote.findFirst({
            where: { requestId: Number(requestId), expertId }
        });

        if (existingQuote) {
             res.status(400).json({ error: 'You have already submitted a quote for this request' });
             return;
        }

        // Check expert subscription status
    if (!expert || expert.role !== 'EXPERT') {
      res.status(403).json({ error: 'Sadece uzmanlar teklif verebilir.' });
      return;
    }

    const now = new Date();
    const isSubscriptionValid = expert.subscriptionActive && expert.subscriptionEndDate && expert.subscriptionEndDate > now;

    if (!isSubscriptionValid) {
      res.status(403).json({ 
        error: 'Aboneliğiniz sona ermiş veya aktif değil. Teklif verebilmek için lütfen ödeme yapın.',
        requiresPayment: true 
      });
      return;
    }

    const quote = await prisma.quote.create({
      data: {
        requestId: Number(requestId),
        expertId: expertId as number,
        price: Number(price),
        message,
        status: 'PENDING', // Added status field
      },
    });

        // Update request status to QUOTED if it was PENDING
        await prisma.expertiseRequest.update({
            where: { id: Number(requestId) },
            data: { status: 'QUOTED' }
        });

        res.status(201).json({ message: 'Quote submitted successfully', quote });
    } catch (error) {
        console.error('submitQuote error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getRequestQuotes = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        const request = await prisma.expertiseRequest.findUnique({
            where: { id: Number(id) }
        });

        if (!request) {
            res.status(404).json({ error: 'Request not found' });
            return;
        }

        if (request.userId !== userId && req.user?.role !== 'ADMIN') {
             res.status(403).json({ error: 'Access denied' });
             return;
        }

        const quotes = await prisma.quote.findMany({
            where: { requestId: Number(id) },
            include: {
                expert: { select: { id: true, name: true, phone: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.status(200).json(quotes);
    } catch (error) {
        console.error('getRequestQuotes error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const acceptQuote = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { quoteId } = req.params;

        const quote = await prisma.quote.findUnique({
            where: { id: Number(quoteId) },
            include: { request: true }
        });

        if (!quote) {
            res.status(404).json({ error: 'Quote not found' });
            return;
        }

        if (quote.request.userId !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        if (quote.request.status !== 'PENDING' && quote.request.status !== 'QUOTED') {
            res.status(400).json({ error: 'Cannot accept quotes for this request status' });
            return;
        }

        // Run in transaction:
        // 1. Mark quote as ACCEPTED
        // 2. Mark other quotes for this request as REJECTED
        // 3. Mark request as ACCEPTED and assign the expert
        const transaction = await prisma.$transaction([
            prisma.quote.updateMany({
                where: { requestId: quote.requestId, id: { not: Number(quoteId) } },
                data: { status: 'REJECTED' }
            }),
            prisma.quote.update({
                where: { id: Number(quoteId) },
                data: { status: 'ACCEPTED' }
            }),
            prisma.expertiseRequest.update({
                where: { id: quote.requestId },
                data: { 
                    status: 'ACCEPTED',
                    selectedExpertId: quote.expertId
                }
            })
        ]);

        res.status(200).json({ message: 'Quote accepted successfully', request: transaction[2] });
    } catch (error) {
         console.error('acceptQuote error', error);
         res.status(500).json({ error: 'Internal server error' });
    }
}
