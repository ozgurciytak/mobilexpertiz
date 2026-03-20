import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { RequestStatus } from '@prisma/client';

export const createRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
       res.status(401).json({ error: 'Unauthorized' });
       return;
    }

    const { title, description, vehicleInfo, location, plate, chassisNumber } = req.body;

    if (!title || !description || !location) {
       res.status(400).json({ error: 'Title, description and location are required' });
       return;
    }

    const expertiseRequest = await prisma.expertiseRequest.create({
      data: {
        title,
        description,
        vehicleInfo,
        location,
        plate,
        chassisNumber,
        userId
      }
    });

    res.status(201).json({
      message: 'Expertise request created successfully',
      request: expertiseRequest
    });
  } catch (error) {
    console.error('createRequest error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;
        
        if (!userId) {
           res.status(401).json({ error: 'Unauthorized' });
           return;
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let whereClause: any = {};
        
        if (role === 'USER') {
            whereClause = { userId };
        } else if (role === 'EXPERT') {
            whereClause = { selectedExpertId: userId };
        }

        const requests = await prisma.expertiseRequest.findMany({
            where: whereClause,
            include: {
                user: { select: { id: true, name: true, phone: true }},
                selectedExpert: { select: { id: true, name: true, phone: true }},
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(requests);
    } catch (error) {
        console.error('getMyRequests error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAvailableRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const expertId = req.user?.userId;
        if (!expertId) {
           res.status(401).json({ error: 'Unauthorized' });
           return;
        }

        // Only Experts can view this
        if (req.user?.role !== 'EXPERT') {
            res.status(403).json({ error: 'Only experts can view available requests pool' });
            return;
        }

        const expert = await prisma.user.findUnique({ where: { id: expertId } });
        if (!expert?.isApproved) {
            res.status(403).json({ error: 'Your account is not approved yet' });
            return;
        }

        // Fetch requests that are PENDING and in the same city as the expert
        // If expert has no city set, we could show all or none. Let's show none or only those without location for safety.
        // Assuming expert.city is set:
        const whereClause: any = { status: 'PENDING' };
        if (expert.city) {
            // We use 'contains' to allow flexibility (e.g. 'İstanbul' vs 'istanbul' vs 'İstanbul - Kadıköy')
            whereClause.location = {
                contains: expert.city,
                mode: 'insensitive' // Requires PostgreSQL, which is used here
            };
        }

        const requests = await prisma.expertiseRequest.findMany({
            where: whereClause,
            include: {
                user: { select: { id: true, name: true }},
                quotes: { 
                    select: { 
                        id: true, price: true, status: true, expertId: true,
                        expert: {
                            select: {
                                id: true,
                                name: true,
                                reviewsReceived: {
                                    select: { rating: true }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate average rating for each quote's expert and sort quotes for the frontend to show highest rated first
        const formattedRequests = requests.map(req => {
            const sortedQuotes = req.quotes.map(q => {
                const reviews = q.expert?.reviewsReceived || [];
                const avgRating = reviews.length > 0 
                  ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
                  : 0;

                return {
                    id: q.id,
                    price: q.price,
                    status: q.status,
                    expertId: q.expertId,
                    expertName: q.expert?.name,
                    expertRating: avgRating,
                    reviewCount: reviews.length
                };
            }).sort((a, b) => b.expertRating - a.expertRating); // Sort descending by rating

            // Hide quotes from other experts if they shouldn't see them? 
            // In a competitive marketplace, they might only see their own.
            // But per requirements "İşler puanı yüksek olan olanlara göre verilsin/sıralansın"
            // We'll return the ranked quotes.

            return {
                ...req,
                quotes: sortedQuotes
            };
        });

        res.status(200).json(formattedRequests);
    } catch (error) {
        console.error('getAvailableRequests error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Admin route to see ALL requests regardless of status
export const getAllRequestsAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const requests = await prisma.expertiseRequest.findMany({
            include: {
                user: { select: { id: true, name: true }},
                selectedExpert: { select: { id: true, name: true }},
                quotes: { select: { id: true, price: true, expertId: true, status: true }}
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(requests);
    } catch (error) {
        console.error('getAllRequestsAdmin error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
export const getRequestDetail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const role = req.user?.role;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const requestId = Number(id);
        if (isNaN(requestId)) {
            res.status(400).json({ error: 'Invalid request ID' });
            return;
        }

        const request = await prisma.expertiseRequest.findUnique({
            where: { id: requestId },
            include: {
                user: { select: { id: true, name: true, phone: true, email: true, tcNo: true } },
                selectedExpert: { select: { id: true, name: true, phone: true, email: true, tcNo: true } },
                quotes: {
                    include: {
                        expert: { select: { id: true, name: true, phone: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!request) {
            res.status(404).json({ error: 'Request not found' });
            return;
        }

        // Access Control
        // Users can only see their own requests
        if (role === 'USER' && request.userId !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Hide sensitive user info from experts if the request is not ACCEPTED by them
        // If status is PENDING/QUOTED, experts shouldn't see phone/email/tcNo
        if (role === 'EXPERT' && request.selectedExpertId !== userId) {
            request.user.phone = 'Gizli';
            request.user.email = 'Gizli';
            request.user.tcNo = 'Gizli';
            // Only show first letter and stars for name to maintain some privacy until approval
            if (request.user.name) {
                const nameParts = request.user.name.split(' ');
                request.user.name = nameParts.map(part => part.charAt(0) + '***').join(' ');
            }
        }

        res.status(200).json(request);
    } catch (error) {
        console.error('getRequestDetail error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const redirectRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { redirectedTo, redirectReason } = req.body;
        const userId = req.user?.userId;
        const role = req.user?.role;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!redirectedTo) {
            res.status(400).json({ error: 'Redirection location (redirectedTo) is required' });
            return;
        }

        const requestId = Number(id);
        if (isNaN(requestId)) {
            res.status(400).json({ error: 'Invalid request ID' });
            return;
        }

        const request = await prisma.expertiseRequest.findUnique({
            where: { id: requestId }
        });

        if (!request) {
            res.status(404).json({ error: 'Request not found' });
            return;
        }

        // Only assigned expert or admin can redirect
        if (role !== 'ADMIN' && request.selectedExpertId !== userId) {
            res.status(403).json({ error: 'Access denied. Only assigned expert or admin can redirect.' });
            return;
        }

        const updatedRequest = await (prisma.expertiseRequest as any).update({
            where: { id: requestId },
            data: {
                status: 'REDIRECTED',
                isRedirected: true,
                redirectedTo,
                redirectReason
            }
        });

        res.status(200).json({
            message: 'Request redirected successfully',
            request: updatedRequest
        });
    } catch (error) {
        console.error('redirectRequest error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
