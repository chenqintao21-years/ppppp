const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// 配置存储
const storage = multer.memoryStorage();

// 文件过滤器
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('只支持 JPEG, PNG, WebP 和 GIF 格式的图片'), false);
    }
};

// Multer 配置
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// 生成唯一文件名
function generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    return `${timestamp}_${randomString}${ext}`;
}

// 图片处理和保存函数
async function processAndSaveImage(buffer, type, filename, options = {}) {
    const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 85,
        thumbnailWidth = 400,
        thumbnailHeight = 300,
        createThumbnail = true
    } = options;

    const uploadDir = path.join(__dirname, '../public/uploads', type);
    const thumbnailDir = path.join(uploadDir, 'thumbnails');

    // 确保目录存在
    await fs.mkdir(uploadDir, { recursive: true });
    if (createThumbnail) {
        await fs.mkdir(thumbnailDir, { recursive: true });
    }

    const uniqueFilename = generateUniqueFilename(filename);
    const imagePath = path.join(uploadDir, uniqueFilename);

    // 获取图片元数据
    const metadata = await sharp(buffer).metadata();

    // 处理原图 - 压缩并限制尺寸
    await sharp(buffer)
        .resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
        })
        .jpeg({ quality })
        .toFile(imagePath);

    const result = {
        url: `/uploads/${type}/${uniqueFilename}`,
        filename: uniqueFilename,
        size: (await fs.stat(imagePath)).size,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format
    };

    // 生成缩略图
    if (createThumbnail) {
        const thumbnailName = `thumb_${uniqueFilename}`;
        const thumbnailPath = path.join(thumbnailDir, thumbnailName);

        await sharp(buffer)
            .resize(thumbnailWidth, thumbnailHeight, {
                fit: 'cover'
            })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);

        result.thumbnail = `/uploads/${type}/thumbnails/${thumbnailName}`;
    }

    return result;
}

// 上传头像
const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '请选择要上传的图片'
            });
        }

        const userId = req.user.id;
        const result = await processAndSaveImage(
            req.file.buffer,
            'avatars',
            `avatar_${userId}.jpg`,
            {
                maxWidth: 500,
                maxHeight: 500,
                quality: 90,
                thumbnailWidth: 150,
                thumbnailHeight: 150
            }
        );

        res.json({
            success: true,
            message: '头像上传成功',
            data: result
        });
    } catch (error) {
        console.error('上传头像失败:', error);
        res.status(500).json({
            success: false,
            message: '上传失败',
            error: error.message
        });
    }
};

// 上传点评图片
const uploadReviewImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '请选择要上传的图片'
            });
        }

        const userId = req.user.id;
        const result = await processAndSaveImage(
            req.file.buffer,
            'reviews',
            `review_${userId}.jpg`,
            {
                maxWidth: 1920,
                maxHeight: 1080,
                quality: 85
            }
        );

        res.json({
            success: true,
            message: '图片上传成功',
            data: result
        });
    } catch (error) {
        console.error('上传点评图片失败:', error);
        res.status(500).json({
            success: false,
            message: '上传失败',
            error: error.message
        });
    }
};

// 上传景点图片
const uploadAttractionImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '请选择要上传的图片'
            });
        }

        const userId = req.user.id;
        const result = await processAndSaveImage(
            req.file.buffer,
            'attractions',
            `attraction_${userId}.jpg`,
            {
                maxWidth: 1920,
                maxHeight: 1080,
                quality: 85
            }
        );

        res.json({
            success: true,
            message: '图片上传成功',
            data: result
        });
    } catch (error) {
        console.error('上传景点图片失败:', error);
        res.status(500).json({
            success: false,
            message: '上传失败',
            error: error.message
        });
    }
};

// 上传城市封面图片
const uploadDestinationImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '请选择要上传的图片'
            });
        }

        const { destinationId } = req.body;
        if (!destinationId) {
            return res.status(400).json({
                success: false,
                message: '缺少城市ID'
            });
        }

        const result = await processAndSaveImage(
            req.file.buffer,
            'destinations',
            `destination_${destinationId}.jpg`,
            {
                maxWidth: 1920,
                maxHeight: 1080,
                quality: 90,
                thumbnailWidth: 600,
                thumbnailHeight: 400
            }
        );

        res.json({
            success: true,
            message: '城市封面上传成功',
            data: result
        });
    } catch (error) {
        console.error('上传城市封面失败:', error);
        res.status(500).json({
            success: false,
            message: '上传失败',
            error: error.message
        });
    }
};

// 批量上传图片
const uploadMultipleImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请选择要上传的图片'
            });
        }

        const { type = 'reviews' } = req.body;
        const userId = req.user.id;

        const results = await Promise.all(
            req.files.map((file, index) =>
                processAndSaveImage(
                    file.buffer,
                    type,
                    `${type}_${userId}_${index}.jpg`,
                    {
                        maxWidth: 1920,
                        maxHeight: 1080,
                        quality: 85
                    }
                )
            )
        );

        res.json({
            success: true,
            message: `成功上传 ${results.length} 张图片`,
            data: results
        });
    } catch (error) {
        console.error('批量上传图片失败:', error);
        res.status(500).json({
            success: false,
            message: '上传失败',
            error: error.message
        });
    }
};

// 获取图片信息
const getImageInfo = async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: '缺少图片URL'
            });
        }

        const filePath = path.join(__dirname, '../public', url);

        // 检查文件是否存在
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({
                success: false,
                message: '图片不存在'
            });
        }

        // 获取文件信息
        const stats = await fs.stat(filePath);
        const metadata = await sharp(filePath).metadata();

        res.json({
            success: true,
            data: {
                url,
                size: stats.size,
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                created: stats.birthtime,
                modified: stats.mtime
            }
        });
    } catch (error) {
        console.error('获取图片信息失败:', error);
        res.status(500).json({
            success: false,
            message: '获取失败',
            error: error.message
        });
    }
};

// 删除图片
const deleteImage = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: '缺少图片URL'
            });
        }

        // 构建文件路径
        const filePath = path.join(__dirname, '../public', url);

        // 删除原图
        try {
            await fs.unlink(filePath);
        } catch (err) {
            console.error('删除原图失败:', err);
        }

        // 删除缩略图
        const thumbnailPath = filePath.replace(/\/([^/]+)$/, '/thumbnails/thumb_$1');
        try {
            await fs.unlink(thumbnailPath);
        } catch (err) {
            console.error('删除缩略图失败:', err);
        }

        res.json({
            success: true,
            message: '图片删除成功'
        });
    } catch (error) {
        console.error('删除图片失败:', error);
        res.status(500).json({
            success: false,
            message: '删除失败',
            error: error.message
        });
    }
};

module.exports = {
    upload,
    uploadAvatar,
    uploadReviewImage,
    uploadAttractionImage,
    uploadDestinationImage,
    uploadMultipleImages,
    getImageInfo,
    deleteImage
};
