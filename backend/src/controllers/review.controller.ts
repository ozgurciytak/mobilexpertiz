import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const createReview = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { requestId, rating, comment } = req.body;

        if (!requestId || rating === undefined) {
             res.status(400).json({ error: 'requestId and rating are required' });
             return;
        }

        const numericRating = Number(rating);
        if (numericRating < 1 || numericRating > 5) {
             res.status(400).json({ error: 'Rating must be between 1 and 5' });
             return;
        }

        const request = await prisma.expertiseRequest.findUnique({
             where: { id: Number(requestId) }
        });

        if (!request || request.userId !== userId) {
             res.status(403).json({ error: 'Access denied. You can only review your own requests' });
             return;
        }

        if (request.status !== 'COMPLETED') {
             res.status(400).json({ error: 'You can only review completed requests' });
             return;
        }
        
        if (!request.selectedExpertId) {
             res.status(400).json({ error: 'No expert was selected for this request' });
             return;
        }

        const existingReview = await prisma.review.findUnique({
             where: { requestId: Number(requestId) }
        });

        if (existingReview) {
             res.status(400).json({ error: 'You already submitted a review for this request' });
             return;
        }

        const review = await prisma.review.create({
             data: {
                 requestId: Number(requestId),
                 expertId: request.selectedExpertId,
                 userId: userId as number,
                 rating: numericRating,
                 comment
             }
        });

        res.status(201).json({ message: 'Review created successfully', review });
    } catch (error) {
        console.error('createReview error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const getExpertReviews = async (req: Request, res: Response): Promise<void> => {
    try {
        const { expertId } = req.params;

        const reviews = await prisma.review.findMany({
            where: { expertId: Number(expertId) },
            include: {
                user: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(reviews);
    } catch (error) {
        console.error('getExpertReviews error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
