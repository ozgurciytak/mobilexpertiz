import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const createSupportRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { subject, message } = req.body;

    if (!userId || !subject || !message) {
      res.status(400).json({ error: 'UserID, subject and message are required' });
      return;
    }

    const supportRequest = await prisma.supportRequest.create({
      data: {
        userId: Number(userId),
        subject,
        status: 'OPEN',
        messages: {
          create: {
            senderId: Number(userId),
            message
          }
        }
      },
      include: {
        messages: true
      }
    });

    res.status(201).json({ message: 'Support request created successfully', supportRequest });
  } catch (error) {
    console.error('Create support request error', error);
    res.status(500).json({ error: 'Internal server error during support request creation' });
  }
};

export const addSupportMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params; // SupportRequest ID
    const { message } = req.body;

    if (!userId || !message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const request = await prisma.supportRequest.findUnique({
      where: { id: Number(id) }
    });

    if (!request) {
      res.status(404).json({ error: 'Support request not found' });
      return;
    }

    // Role check: Only the owner of the request or an Admin can message
    if (req.user?.role !== 'ADMIN' && request.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const newMessage = await prisma.supportMessage.create({
      data: {
        requestId: Number(id),
        senderId: Number(userId),
        message
      },
      include: { sender: { select: { name: true, role: true } } }
    });

    // If Admin replies, set status to IN_PROGRESS if it was OPEN
    if (req.user?.role === 'ADMIN' && request.status === 'OPEN') {
      await prisma.supportRequest.update({
        where: { id: Number(id) },
        data: { status: 'IN_PROGRESS' }
      });
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Add support message error', error);
    res.status(500).json({ error: 'Internal server error while adding message' });
  }
};

export const getSupportRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    const whereClause = role === 'ADMIN' ? {} : { userId: Number(userId) };

    const requests = await prisma.supportRequest.findMany({
      where: whereClause,
      include: { 
        user: { select: { name: true, role: true } },
        _count: { select: { messages: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.status(200).json(requests);
  } catch (error) {
    console.error('Get support requests error', error);
    res.status(500).json({ error: 'Internal server error while fetching support requests' });
  }
};

export const getSupportRequestDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const request = await prisma.supportRequest.findUnique({
      where: { id: Number(id) },
      include: {
        user: { select: { name: true, role: true } },
        messages: {
          include: { sender: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!request) {
      res.status(404).json({ error: 'Support request not found' });
      return;
    }

    if (req.user?.role !== 'ADMIN' && request.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.status(200).json(request);
  } catch (error) {
    console.error('Get support request detail error', error);
    res.status(500).json({ error: 'Internal server error while fetching details' });
  }
};

export const updateSupportStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await prisma.supportRequest.update({
      where: { id: Number(id) },
      data: { status }
    });

    res.status(200).json({ message: 'Support request status updated' });
  } catch (error) {
    console.error('Update support status error', error);
    res.status(500).json({ error: 'Internal server error during status update' });
  }
};
