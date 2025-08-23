"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveUploads = exports.deleteUploadedFiles = exports.handleUploadError = exports.uploadMultiple = exports.uploadSingle = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        // Create subdirectories for different types of uploads
        const subDir = path_1.default.join(uploadDir, 'receipts');
        if (!fs_1.default.existsSync(subDir)) {
            fs_1.default.mkdirSync(subDir, { recursive: true });
        }
        cb(null, subDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path_1.default.extname(file.originalname);
        cb(null, `receipt-${uniqueSuffix}${extension}`);
    }
});
// File filter to allow only images
const fileFilter = (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files are allowed!'));
    }
};
// Configure multer
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 10 // Maximum 10 files per request
    }
});
// Middleware for single file upload
exports.uploadSingle = upload.single('image');
// Middleware for multiple file uploads
exports.uploadMultiple = upload.array('images', 10);
// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer_1.default.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files. Maximum is 10 files.' });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ error: 'Unexpected field name for file upload.' });
        }
    }
    if (error.message === 'Only image files are allowed!') {
        return res.status(400).json({ error: 'Only image files are allowed.' });
    }
    next(error);
};
exports.handleUploadError = handleUploadError;
// Utility function to delete uploaded files (for cleanup on error)
const deleteUploadedFiles = (files) => {
    files.forEach(file => {
        if (fs_1.default.existsSync(file.path)) {
            fs_1.default.unlinkSync(file.path);
        }
    });
};
exports.deleteUploadedFiles = deleteUploadedFiles;
// Middleware to serve uploaded files
const serveUploads = (req, res, next) => {
    const filePath = path_1.default.join(uploadDir, req.params.filename);
    // Check if file exists
    if (!fs_1.default.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    // Check file extension for security
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = path_1.default.extname(filePath).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
        return res.status(403).json({ error: 'File type not allowed' });
    }
    res.sendFile(path_1.default.resolve(filePath));
};
exports.serveUploads = serveUploads;
//# sourceMappingURL=upload.middleware.js.map