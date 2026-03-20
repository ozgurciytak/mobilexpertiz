import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { PaymentStatus, Role } from '@prisma/client';
import { createPDFBuffer, createUserProfilePDFBuffer, createRequestDetailPDFBuffer } from '../services/pdf.service';

export const getAllRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, role, status } = req.query;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userWhere: any = {};
    if (role) userWhere.role = role;
    if (q) {
      userWhere.OR = [
        { name: { contains: q as string, mode: 'insensitive' } },
        { email: { contains: q as string, mode: 'insensitive' } },
        { tcNo: { contains: q as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        tcNo: true,
        role: true,
        isApproved: true,
        isBlocked: true,
        blockedAt: true,
        blockedReason: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // Also fetch requests if relevant
    const requests = await prisma.expertiseRequest.findMany({
      where: q ? {
        OR: [
          { title: { contains: q as string, mode: 'insensitive' } },
          { user: { name: { contains: q as string, mode: 'insensitive' } } }
        ]
      } : {},
      include: {
        user: { select: { name: true, email: true } },
        selectedExpert: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ users, requests });
  } catch (error) {
    console.error('getAllRecords error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const blockUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isBlocked, reason } = req.body;

    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        isBlocked,
        blockedAt: isBlocked ? new Date() : null,
        blockedReason: isBlocked ? reason : null,
      }
    });

    res.status(200).json({
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        isBlocked: updatedUser.isBlocked
      }
    });
  } catch (error) {
    console.error('blockUser error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
   try {
     const { id } = req.params;
     
     // Note: In a production app, we might want to soft delete or handle relations.
     // For now, simple delete.
     await prisma.user.delete({ where: { id: Number(id) } });

     res.status(200).json({ message: 'User deleted successfully' });
   } catch (error) {
     console.error('deleteUser error', error);
     res.status(500).json({ error: 'Internal server error' });
   }
};

export const renewExpertSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({ where: { id: Number(id) } });
        if (!user || user.role !== 'EXPERT') {
            res.status(404).json({ error: 'Expert not found' });
            return;
        }

        const newEndDate = user.subscriptionEndDate && user.subscriptionEndDate > new Date()
            ? new Date(user.subscriptionEndDate.getTime() + 30 * 24 * 60 * 60 * 1000)
            : new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);

        const [updatedExpert] = await prisma.$transaction([
            prisma.user.update({
                where: { id: Number(id) },
                data: {
                    subscriptionActive: true,
                    subscriptionEndDate: newEndDate
                }
            }),
            prisma.payment.create({
                data: {
                    userId: Number(id),
                    amount: 0, // Manual renewal
                    status: 'APPROVED'
                }
            })
        ]);

        res.status(200).json({ 
            message: 'Expert subscription renewed for 30 days',
            expert: {
                id: updatedExpert.id,
                subscriptionActive: updatedExpert.subscriptionActive,
                subscriptionEndDate: updatedExpert.subscriptionEndDate
            }
        });
    } catch (error) {
        console.error('renewExpertSubscription error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const editUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, email, phone, tcNo } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: Number(id) },
            data: { name, email, phone, tcNo },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                tcNo: true,
                role: true
            }
        });

        res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        console.error('editUser error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const exportRecordsPDF = async (req: Request, res: Response): Promise<void> => {
    try {
        const { q, role } = req.query;
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userWhere: any = {};
        if (role) userWhere.role = role;
        if (q) {
          userWhere.OR = [
            { name: { contains: q as string, mode: 'insensitive' } },
            { email: { contains: q as string, mode: 'insensitive' } },
            { tcNo: { contains: q as string, mode: 'insensitive' } },
          ];
        }
    
        const users = await prisma.user.findMany({
          where: userWhere,
          select: { name: true, email: true, role: true, createdAt: true },
          orderBy: { createdAt: 'desc' }
        });

        const title = 'Sistem Kayitlari Raporu';
        let content = `Olusturulma Tarihi: ${new Date().toLocaleString('tr-TR')}\n\n`;
        content += 'KULLANICI LISTESI:\n';
        content += '--------------------------------------------------\n';
        
        users.forEach((u, i) => {
            content += `${i + 1}. ${u.name} (${u.email}) - Rol: ${u.role} - Kayit: ${u.createdAt.toLocaleDateString('tr-TR')}\n`;
        });

        const pdfBuffer = await createPDFBuffer(title, content);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=records.pdf');
        res.send(pdfBuffer);
    } catch (error) {
        console.error('exportRecordsPDF error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUserPDF = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: Number(id) }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const buffer = await createUserProfilePDFBuffer(user);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=user_${id}.pdf`);
        res.send(buffer);
    } catch (error) {
        console.error('getUserPDF error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getRequestPDF = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const request = await prisma.expertiseRequest.findUnique({
            where: { id: Number(id) },
            include: {
                user: true,
                selectedExpert: true
            }
        });

        if (!request) {
            res.status(404).json({ error: 'Request not found' });
            return;
        }

        const buffer = await createRequestDetailPDFBuffer(request);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=request_${id}.pdf`);
        res.send(buffer);
    } catch (error) {
        console.error('getRequestPDF error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const searchVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
        const { q } = req.query;
        if (!q) {
            res.status(200).json([]);
            return;
        }

        const query = q as string;
        const requests = await prisma.expertiseRequest.findMany({
            where: {
                OR: [
                    { plate: { contains: query, mode: 'insensitive' } },
                    { chassisNumber: { contains: query, mode: 'insensitive' } }
                ]
            },
            include: {
                user: { select: { name: true, phone: true } },
                selectedExpert: { select: { name: true, phone: true } },
                report: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(requests);
    } catch (error) {
        console.error('searchVehicle error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const getSystemSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const settings = await prisma.systemSetting.findMany();
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateSystemSetting = async (req: Request, res: Response): Promise<void> => {
    try {
        const { key, value } = req.body;
        const setting = await prisma.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
        res.status(200).json(setting);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAdminPayments = async (req: Request, res: Response): Promise<void> => {
    try {
        const payments = await prisma.payment.findMany({
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const approvePayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body; // APPROVED or REJECTED

        const payment = await prisma.payment.findUnique({ where: { id: Number(id) } });
        if (!payment) {
            res.status(404).json({ error: 'Payment not found' });
            return;
        }

        if (status === 'APPROVED' && payment.status !== 'APPROVED') {
            const user = await prisma.user.findUnique({ where: { id: payment.userId } });
            const newEndDate = user?.subscriptionEndDate && user.subscriptionEndDate > new Date()
                ? new Date(user.subscriptionEndDate.getTime() + 30 * 24 * 60 * 60 * 1000)
                : new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);

            await prisma.$transaction([
                prisma.payment.update({
                    where: { id: Number(id) },
                    data: { status: 'APPROVED' }
                }),
                prisma.user.update({
                    where: { id: payment.userId },
                    data: {
                        subscriptionActive: true,
                        subscriptionEndDate: newEndDate
                    }
                })
            ]);
        } else {
            await prisma.payment.update({
                where: { id: Number(id) },
                data: { status }
            });
        }

        res.status(200).json({ message: 'Payment status updated' });
    } catch (error) {
        console.error('approvePayment error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
