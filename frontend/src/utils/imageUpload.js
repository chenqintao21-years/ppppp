// 图片上传工具函数 - 前端集成示例

/**
 * 上传单张图片
 * @param {File} file - 图片文件对象
 * @param {string} type - 上传类型: 'avatar' | 'review' | 'attraction'
 * @param {string} token - JWT认证令牌
 * @returns {Promise<Object>} 上传结果
 */
export async function uploadImage(file, type = 'review', token) {
    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('只支持 JPEG, PNG 和 WebP 格式的图片');
    }

    // 验证文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        throw new Error('图片大小不能超过 5MB');
    }

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`http://localhost:3000/api/upload/${type}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.message || '上传失败');
    }

    return result.data;
}

/**
 * 批量上传图片
 * @param {File[]} files - 图片文件数组
 * @param {string} type - 上传类型: 'reviews' | 'attractions'
 * @param {string} token - JWT认证令牌
 * @returns {Promise<Array>} 上传结果数组
 */
export async function uploadMultipleImages(files, type = 'reviews', token) {
    // 验证文件数量
    if (files.length > 10) {
        throw new Error('最多只能上传 10 张图片');
    }

    // 验证每个文件
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
            throw new Error(`文件 ${file.name} 格式不支持`);
        }
        if (file.size > maxSize) {
            throw new Error(`文件 ${file.name} 大小超过 5MB`);
        }
    }

    const formData = new FormData();
    files.forEach(file => {
        formData.append('images', file);
    });
    formData.append('type', type);

    const response = await fetch(`http://localhost:3000/api/upload/${type}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.message || '上传失败');
    }

    return result.data;
}

/**
 * 删除图片
 * @param {string} imageUrl - 图片URL
 * @param {string} token - JWT认证令牌
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function deleteImage(imageUrl, token) {
    const response = await fetch('http://localhost:3000/api/upload/image', {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: imageUrl })
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.message || '删除失败');
    }

    return true;
}

/**
 * 图片预览
 * @param {File} file - 图片文件
 * @returns {Promise<string>} Base64 数据URL
 */
export function previewImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * 压缩图片（客户端压缩，可选）
 * @param {File} file - 原始图片文件
 * @param {number} maxWidth - 最大宽度
 * @param {number} maxHeight - 最大高度
 * @param {number} quality - 质量 (0-1)
 * @returns {Promise<Blob>} 压缩后的图片Blob
 */
export function compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // 计算缩放比例
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============ React 组件示例 ============

/**
 * React 图片上传组件示例
 */
export function ImageUploadExample() {
    const [selectedFile, setSelectedFile] = React.useState(null);
    const [preview, setPreview] = React.useState(null);
    const [uploading, setUploading] = React.useState(false);
    const [uploadedImage, setUploadedImage] = React.useState(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);

        // 生成预览
        const previewUrl = await previewImage(file);
        setPreview(previewUrl);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const result = await uploadImage(selectedFile, 'review', token);
            setUploadedImage(result);
            alert('上传成功！');
        } catch (error) {
            alert('上传失败: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
            />

            {preview && (
                <div>
                    <h3>预览:</h3>
                    <img src={preview} alt="预览" style={{ maxWidth: '300px' }} />
                </div>
            )}

            <button onClick={handleUpload} disabled={!selectedFile || uploading}>
                {uploading ? '上传中...' : '上传'}
            </button>

            {uploadedImage && (
                <div>
                    <h3>上传成功:</h3>
                    <img
                        src={`http://localhost:3000${uploadedImage.url}`}
                        alt="上传的图片"
                        style={{ maxWidth: '300px' }}
                    />
                </div>
            )}
        </div>
    );
}

// ============ Vue 组件示例 ============

/**
 * Vue 图片上传组件示例
 */
export const VueImageUploadExample = {
    template: `
        <div>
            <input
                type="file"
                accept="image/*"
                @change="handleFileSelect"
                :disabled="uploading"
            />

            <div v-if="preview">
                <h3>预览:</h3>
                <img :src="preview" alt="预览" style="max-width: 300px" />
            </div>

            <button @click="handleUpload" :disabled="!selectedFile || uploading">
                {{ uploading ? '上传中...' : '上传' }}
            </button>

            <div v-if="uploadedImage">
                <h3>上传成功:</h3>
                <img
                    :src="'http://localhost:3000' + uploadedImage.url"
                    alt="上传的图片"
                    style="max-width: 300px"
                />
            </div>
        </div>
    `,
    data() {
        return {
            selectedFile: null,
            preview: null,
            uploading: false,
            uploadedImage: null
        };
    },
    methods: {
        async handleFileSelect(e) {
            const file = e.target.files[0];
            if (!file) return;

            this.selectedFile = file;
            this.preview = await previewImage(file);
        },
        async handleUpload() {
            if (!this.selectedFile) return;

            this.uploading = true;
            try {
                const token = localStorage.getItem('token');
                const result = await uploadImage(this.selectedFile, 'review', token);
                this.uploadedImage = result;
                alert('上传成功！');
            } catch (error) {
                alert('上传失败: ' + error.message);
            } finally {
                this.uploading = false;
            }
        }
    }
};

// ============ 拖拽上传示例 ============

/**
 * 拖拽上传处理
 */
export class DragDropUploader {
    constructor(dropZoneElement, onFilesSelected) {
        this.dropZone = dropZoneElement;
        this.onFilesSelected = onFilesSelected;
        this.init();
    }

    init() {
        // 阻止默认拖拽行为
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        // 高亮效果
        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => {
                this.dropZone.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => {
                this.dropZone.classList.remove('drag-over');
            }, false);
        });

        // 处理文件
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = [...dt.files].filter(file => file.type.startsWith('image/'));

        if (files.length > 0) {
            this.onFilesSelected(files);
        }
    }
}

// 使用示例:
// const uploader = new DragDropUploader(
//     document.getElementById('drop-zone'),
//     async (files) => {
//         const token = localStorage.getItem('token');
//         const results = await uploadMultipleImages(files, 'reviews', token);
//         console.log('上传完成:', results);
//     }
// );
