import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed!'));
    }
};

export const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const uploadImages = (req: Request, res: Response): void => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        res.status(400).json({ error: 'No files uploaded' });
        return;
    }

    const files = req.files as Express.Multer.File[];
    const fileUrls = files.map(file => `/uploads/${file.filename}`);

    res.status(200).json({
        message: 'Files uploaded successfully',
        urls: fileUrls
    });
};
