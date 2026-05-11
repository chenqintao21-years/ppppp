// 自动定位和导入服务
import { amapLocationService } from '../utils/amapLocation.js';
import { cityAutoImportService } from '../services/cityAutoImport.js';

class AutoLocationImportService {
    constructor() {
        this.currentCity = null;
        this.isAutoImporting = false;
        this.hasAutoImported = false;
    }

    /**
     * 自动定位并导入当前城市数据
     * @param {Object} options - 配置选项
     * @param {boolean} options.silent - 静默模式（不显示提示）
     * @param {boolean} options.force - 强制重新导入
     */
    async autoLocationAndImport(options = {}) {
        const { silent = false, force = false } = options;

        // 检查是否已经导入过
        const cachedCity = this.getCachedCity();
        if (!force && cachedCity && this.hasAutoImported) {
            console.log('已导入过城市数据:', cachedCity);
            this.currentCity = cachedCity;
            return {
                success: true,
                cached: true,
                city: cachedCity,
                message: '使用缓存的城市数据'
            };
        }

        if (this.isAutoImporting) {
            console.log('正在导入中，请稍候...');
            return {
                success: false,
                message: '正在导入中'
            };
        }

        this.isAutoImporting = true;

        try {
            // 1. 获取当前位置
            if (!silent) {
                this.showNotification('正在获取您的位置...', 'info');
            }

            let city;
            try {
                // 尝试浏览器定位
                console.log('开始浏览器定位...');
                const location = await amapLocationService.getCurrentPosition();
                city = location.city;
                console.log('浏览器定位成功:', city, '完整信息:', location);
            } catch (error) {
                console.log('浏览器定位失败:', error);
                console.log('错误详情:', error.message);

                // 浏览器定位失败，提示用户手动选择城市
                if (!silent) {
                    this.showNotification('无法自动定位，请手动选择城市', 'error');
                }

                return {
                    success: false,
                    error: '需要手动选择城市',
                    needManualSelection: true
                };
            }

            // 2. 检查是否已经有该城市的数据
            const hasData = city ? await this.checkCityData(city) : false;
            if (hasData && !force) {
                console.log(`${city} 的数据已存在，跳过导入`);
                this.currentCity = city;
                this.cacheCity(city);
                this.hasAutoImported = true;

                if (!silent) {
                    this.showNotification(`欢迎来到 ${city}！`, 'success');
                }

                return {
                    success: true,
                    city: city,
                    cached: true,
                    message: '数据已存在'
                };
            }

            // 3. 自动导入城市数据
            if (!silent) {
                this.showNotification(`正在导入 ${city} 的数据...`, 'loading');
            }

            const response = await cityAutoImportService.autoImportCity({ city });

            if (response.success) {
                this.currentCity = city;
                this.cacheCity(city);
                this.hasAutoImported = true;

                if (!silent) {
                    this.showNotification(
                        `${city} 数据导入成功！\n酒店: ${response.data.imported.hotels}\n景点: ${response.data.imported.attractions}\n餐厅: ${response.data.imported.restaurants}`,
                        'success'
                    );
                }

                // 触发自定义事件，通知页面刷新数据
                this.dispatchCityChangeEvent(city, response.data);

                return {
                    success: true,
                    city: city,
                    data: response.data,
                    message: '导入成功'
                };
            } else {
                throw new Error(response.message || '导入失败');
            }

        } catch (error) {
            console.error('自动定位导入失败:', error);

            if (!silent) {
                this.showNotification('自动导入失败: ' + error.message, 'error');
            }

            return {
                success: false,
                error: error.message
            };
        } finally {
            this.isAutoImporting = false;
        }
    }

    /**
     * 检查城市数据是否已存在
     */
    async checkCityData(city) {
        try {
            const response = await cityAutoImportService.getCityStats(city);
            if (response.success) {
                const { hotels, attractions, restaurants } = response.data;
                // 如果有任意一种数据，认为已存在
                return hotels > 0 || attractions > 0 || restaurants > 0;
            }
            return false;
        } catch (error) {
            console.error('检查城市数据失败:', error);
            return false;
        }
    }

    /**
     * 缓存当前城市
     */
    cacheCity(city) {
        localStorage.setItem('currentCity', city);
        localStorage.setItem('cityImportTime', Date.now().toString());
    }

    /**
     * 获取缓存的城市
     */
    getCachedCity() {
        const city = localStorage.getItem('currentCity');
        const importTime = localStorage.getItem('cityImportTime');

        // 缓存7天有效
        if (city && importTime) {
            const daysPassed = (Date.now() - parseInt(importTime)) / (1000 * 60 * 60 * 24);
            if (daysPassed < 7) {
                return city;
            }
        }

        return null;
    }

    /**
     * 清除缓存
     */
    clearCache() {
        localStorage.removeItem('currentCity');
        localStorage.removeItem('cityImportTime');
        this.hasAutoImported = false;
        this.currentCity = null;
    }

    /**
     * 获取当前城市
     */
    getCurrentCity() {
        return this.currentCity || this.getCachedCity();
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `auto-import-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                ${type === 'loading' ? '<div class="notification-spinner"></div>' : ''}
                <div class="notification-message">${message.replace(/\n/g, '<br>')}</div>
            </div>
        `;

        document.body.appendChild(notification);

        // 添加样式（如果还没有）
        if (!document.getElementById('auto-import-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'auto-import-notification-styles';
            style.textContent = `
                .auto-import-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 16px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10000;
                    animation: slideInRight 0.3s ease;
                    max-width: 350px;
                }

                .auto-import-notification.success {
                    border-left: 4px solid #00aa6c;
                }

                .auto-import-notification.error {
                    border-left: 4px solid #e74c3c;
                }

                .auto-import-notification.info {
                    border-left: 4px solid #3498db;
                }

                .auto-import-notification.loading {
                    border-left: 4px solid #f39c12;
                }

                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .notification-spinner {
                    width: 20px;
                    height: 20px;
                    border: 3px solid #f0f0f0;
                    border-top-color: #f39c12;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .notification-message {
                    font-size: 14px;
                    color: #333;
                    line-height: 1.5;
                }

                @keyframes slideInRight {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        // 自动移除通知
        if (type !== 'loading') {
            setTimeout(() => {
                notification.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        } else {
            // loading通知需要手动移除
            notification.dataset.type = 'loading';
        }

        return notification;
    }

    /**
     * 移除loading通知
     */
    removeLoadingNotification() {
        const loadingNotifications = document.querySelectorAll('.auto-import-notification.loading');
        loadingNotifications.forEach(notification => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        });
    }

    /**
     * 触发城市变更事件
     */
    dispatchCityChangeEvent(city, data) {
        const event = new CustomEvent('cityDataImported', {
            detail: { city, data }
        });
        window.dispatchEvent(event);
    }
}

// 导出单例
export const autoLocationImportService = new AutoLocationImportService();

// 自动初始化函数
export async function initAutoLocationImport(options = {}) {
    const { autoStart = true, silent = false } = options;

    if (autoStart) {
        // 页面加载完成后自动执行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                autoLocationImportService.autoLocationAndImport({ silent });
            });
        } else {
            await autoLocationImportService.autoLocationAndImport({ silent });
        }
    }

    return autoLocationImportService;
}
