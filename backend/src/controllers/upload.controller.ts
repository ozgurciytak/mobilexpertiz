import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary if environment variables exist
const isCloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

// Local upload dir setup (used when Cloudinary is not configured)
const uploadDir = 'uploads';
if (!isCloudinaryConfigured && process.env.VERCEL !== '1') {
    if (!fs.existsSync(uploadDir)) {
        try {
            fs.mkdirSync(uploadDir);
        } catch (e) {
            console.warn('[Upload] Could not create local uploads directory:', e);
        }
    }
}

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Çift uzantı engelleme (örn: shell.php.jpg)
    const baseName = path.basename(file.originalname, ext);
    if (baseName.includes('.')) {
        return cb(new Error('Güvenlik ihlali: Çoklu dosya uzantılarına izin verilmez!'));
    }

    if (!ALLOWED_EXTENSIONS.has(ext)) {
        return cb(new Error('Yalnızca JPG, PNG, WEBP ve PDF dosyaları yüklenebilir!'));
    }

    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Desteklenmeyen dosya türü!'));
    }
};

export const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadStreamToCloudinary = (file: Express.Multer.File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'mobilexpertiz',
                resource_type: 'auto'
            },
            (error, result) => {
                if (error) {
                    console.error('[Cloudinary Upload Error]', error);
                    return reject(error);
                }
                resolve(result?.secure_url || '');
            }
        );
        stream.end(file.buffer);
    });
};

export const uploadImages = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            res.status(400).json({ error: 'No files uploaded' });
            return;
        }

        const files = req.files as Express.Multer.File[];
        const fileUrls: string[] = [];

        if (isCloudinaryConfigured) {
            // Cloudinary CDN Upload
            for (const file of files) {
                const url = await uploadStreamToCloudinary(file);
                fileUrls.push(url);
            }
        } else {
            // Local disk fallback (e.g. offline local development)
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            for (const file of files) {
                const rawExt = path.extname(file.originalname).toLowerCase();
                const safeExt = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : '.jpg';
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const filename = `${file.fieldname}-${uniqueSuffix}${safeExt}`;
                const filePath = path.join(uploadDir, filename);

                fs.writeFileSync(filePath, file.buffer);
                fileUrls.push(`/uploads/${filename}`);
            }
        }

        res.status(200).json({
            message: 'Files uploaded successfully',
            urls: fileUrls
        });
    } catch (error: any) {
        console.error('[Upload Error]', error);
        res.status(500).json({ error: 'Dosya yükleme başarısız oldu', details: error.message });
    }
};
