import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { createReportPDFBuffer } from '../services/pdf.service';

export const createReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const expertId = req.user?.userId;
        const { requestId, content, documentUrls, vehicleParts } = req.body;

        if (!requestId || !content) {
            res.status(400).json({ error: 'requestId and content are required' });
            return;
        }

        const request = await prisma.expertiseRequest.findUnique({
            where: { id: Number(requestId) }
        });

        if (!request || request.selectedExpertId !== expertId) {
            res.status(403).json({ error: 'Access denied. You are not the selected expert for this request' });
            return;
        }

        if (request.status !== 'ACCEPTED') {
            res.status(400).json({ error: 'Cannot create report. Request is not in ACCEPTED state' });
            return;
        }

        const existingReport = await prisma.report.findUnique({
            where: { requestId: Number(requestId) }
        });

        if (existingReport) {
             res.status(400).json({ error: 'Report already exists for this request. Use update route instead.' });
             return;
        }

        const report = await prisma.report.create({
            data: {
                requestId: Number(requestId),
                expertId: expertId as number,
                content,
                documentUrls,
                vehicleParts: vehicleParts || null // Optional detailed parts data
            }
        });

        // Update the request to COMPLETED once report is created
        await prisma.expertiseRequest.update({
            where: { id: Number(requestId) },
            data: { status: 'COMPLETED' }
        });

        res.status(201).json({ message: 'Report created successfully', report });
    } catch (error) {
        console.error('createReport error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const expertId = req.user?.userId;
        const { id } = req.params;
        const { content, documentUrls, vehicleParts } = req.body;

        const report = await prisma.report.findUnique({ where: { id: Number(id) } });

        if (!report || report.expertId !== expertId) {
             res.status(403).json({ error: 'Access denied or report not found' });
             return;
        }

        const updatedReport = await prisma.report.update({
            where: { id: Number(id) },
            data: { content, documentUrls, vehicleParts: vehicleParts !== undefined ? vehicleParts : report.vehicleParts }
        });

        res.status(200).json({ message: 'Report updated successfully', report: updatedReport });
    } catch (error) {
        console.error('updateReport error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const getReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;
        const { requestId } = req.params;

        const report = await prisma.report.findUnique({
            where: { requestId: Number(requestId) },
            include: {
                expert: { select: { id: true, name: true, phone: true } },
                request: { select: { userId: true, title: true } }
            }
        });

        if (!report) {
             res.status(404).json({ error: 'Report not found' });
             return;
        }

        // Only ADMIN, the EXPERT who created it, or the USER who requested it can see the report
        if (role !== 'ADMIN' && report.expertId !== userId && report.request.userId !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        res.status(200).json(report);
    } catch (error) {
        console.error('getReport error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getReportPDF = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;
        const { requestId } = req.params;

        const report = await prisma.report.findUnique({
            where: { requestId: Number(requestId) },
            include: {
                expert: { select: { name: true, phone: true } },
                request: { 
                  include: { 
                    user: { select: { name: true, phone: true } }
                  } 
                }
            }
        });

        if (!report) {
             res.status(404).json({ error: 'Report not found' });
             return;
        }

        if (role !== 'ADMIN' && report.expertId !== userId && report.request.userId !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const pdfBuffer = await createReportPDFBuffer(report);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=report_${requestId}.pdf`);
        res.send(pdfBuffer);
    } catch (error: any) {
        console.error('getReportPDF error', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
