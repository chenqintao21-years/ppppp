// 城市搜索和自动导入模态框组件
import { cityAutoImportService } from '../services/cityAutoImport.js';

class CitySearchModal {
    constructor() {
        this.modal = null;
        this.isImporting = false;
        this.onCitySelected = null;
        this.init();
    }

    init() {
        this.createModal();
        this.attachEventListeners();
    }

    createModal() {
        const modalHTML = `
            <div id="citySearchModal" class="city-search-modal" style="display: none;">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>选择城市</h2>
                        <button class="modal-close-btn">&times;</button>
                    </div>

                    <div class="modal-body">
                        <!-- 搜索框 -->
                        <div class="search-section">
                            <div class="search-input-wrapper">
                                <input type="text"
                                       id="citySearchInput"
                                       class="city-search-input"
                                       placeholder="搜索城市名称...">
                                <button class="search-icon-btn">🔍</button>
                            </div>
                            <button id="useCurrentLocation" class="location-btn">
                                📍 使用当前位置
                            </button>
                        </div>

                        <!-- 搜索结果 -->
                        <div id="citySearchResults" class="search-results">
                            <div class="results-placeholder">
                                <div class="placeholder-icon">🔍</div>
                                <p>请输入城市名称进行搜索</p>
                                <p class="placeholder-hint">点击搜索结果即可自动导入该城市的酒店、景点、美食数据</p>
                            </div>
                        </div>

                        <!-- 导入进度 -->
                        <div id="importProgress" class="import-progress" style="display: none;">
                            <div class="progress-header">
                                <h3>正在导入数据...</h3>
                                <div class="spinner"></div>
                            </div>
                            <div class="progress-details">
                                <p id="importStatus">正在搜索城市数据...</p>
                                <div class="progress-stats">
                                    <div class="stat-item">
                                        <span class="stat-label">酒店:</span>
                                        <span id="hotelCount" class="stat-value">0</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">景点:</span>
                                        <span id="attractionCount" class="stat-value">0</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">餐厅:</span>
                                        <span id="restaurantCount" class="stat-value">0</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 导入成功 -->
                        <div id="importSuccess" class="import-success" style="display: none;">
                            <div class="success-icon">✓</div>
                            <h3>导入成功！</h3>
                            <p id="successMessage"></p>
                            <button id="viewDataBtn" class="primary-btn">查看数据</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('citySearchModal');
    }

    attachEventListeners() {
        // 关闭按钮
        this.modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            this.close();
        });

        // 点击遮罩关闭
        this.modal.querySelector('.modal-overlay').addEventListener('click', () => {
            this.close();
        });

        // 搜索输入
        const searchInput = document.getElementById('citySearchInput');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();

            if (query.length < 2) {
                this.showPlaceholder();
                return;
            }

            searchTimeout = setTimeout(() => {
                this.searchCities(query);
            }, 500);
        });

        // 使用当前位置
        document.getElementById('useCurrentLocation').addEventListener('click', () => {
            this.useCurrentLocation();
        });

        // 查看数据按钮
        document.getElementById('viewDataBtn').addEventListener('click', () => {
            this.close();
        });
    }

    async searchCities(query) {
        const resultsContainer = document.getElementById('citySearchResults');
        resultsContainer.innerHTML = '<div class="loading">搜索中...</div>';

        try {
            const response = await cityAutoImportService.searchCity(query);

            if (response.success && response.data.length > 0) {
                this.displaySearchResults(response.data);
            } else {
                resultsContainer.innerHTML = '<div class="no-results">未找到相关城市</div>';
            }
        } catch (error) {
            console.error('搜索城市失败:', error);
            resultsContainer.innerHTML = '<div class="error">搜索失败，请重试</div>';
        }
    }

    displaySearchResults(cities) {
        const resultsContainer = document.getElementById('citySearchResults');

        const resultsHTML = `
            <div class="results-header">
                <span>找到 ${cities.length} 个城市</span>
                <span class="results-hint">点击城市卡片即可自动导入数据</span>
            </div>
        ` + cities.map(city => `
            <div class="city-result-item" data-city="${city.name}" data-location="${city.location}">
                <div class="city-info">
                    <h4>${city.name}</h4>
                    <p>${city.district || ''}</p>
                </div>
                <div class="city-arrow">→</div>
            </div>
        `).join('');

        resultsContainer.innerHTML = resultsHTML;

        // 绑定点击事件 - 点击整个卡片即可导入
        resultsContainer.querySelectorAll('.city-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const cityName = item.dataset.city;
                const location = item.dataset.location;
                this.importCityData(cityName, location);
            });
        });
    }

    async useCurrentLocation() {
        const resultsContainer = document.getElementById('citySearchResults');
        resultsContainer.innerHTML = '<div class="loading">正在获取位置...</div>';

        try {
            const response = await cityAutoImportService.getCurrentLocation();

            if (response.success && response.data.city) {
                const city = response.data.city;
                this.importCityData(city);
            } else {
                resultsContainer.innerHTML = '<div class="error">无法获取当前位置</div>';
            }
        } catch (error) {
            console.error('获取位置失败:', error);
            resultsContainer.innerHTML = '<div class="error">获取位置失败，请重试</div>';
        }
    }

    async importCityData(cityName, location = null) {
        if (this.isImporting) return;

        this.isImporting = true;

        // 隐藏搜索结果，显示进度
        document.getElementById('citySearchResults').style.display = 'none';
        document.getElementById('importProgress').style.display = 'block';
        document.getElementById('importStatus').textContent = `正在搜索 ${cityName} 的数据...`;

        try {
            const params = { city: cityName };
            if (location) {
                const [lng, lat] = location.split(',');
                params.location = { lng: parseFloat(lng), lat: parseFloat(lat) };
            }

            const response = await cityAutoImportService.autoImportCity(params);

            if (response.success) {
                const { imported } = response.data;

                // 更新统计数据
                document.getElementById('hotelCount').textContent = imported.hotels;
                document.getElementById('attractionCount').textContent = imported.attractions;
                document.getElementById('restaurantCount').textContent = imported.restaurants;

                // 显示成功消息
                setTimeout(() => {
                    document.getElementById('importProgress').style.display = 'none';
                    document.getElementById('importSuccess').style.display = 'block';
                    document.getElementById('successMessage').textContent =
                        `成功导入 ${cityName} 的 ${response.data.total} 条数据`;

                    // 触发回调
                    if (this.onCitySelected) {
                        this.onCitySelected(response.data);
                    }
                }, 1000);
            } else {
                throw new Error(response.message || '导入失败');
            }
        } catch (error) {
            console.error('导入城市数据失败:', error);
            document.getElementById('importStatus').textContent = '导入失败: ' + error.message;

            setTimeout(() => {
                this.resetModal();
            }, 2000);
        } finally {
            this.isImporting = false;
        }
    }

    showPlaceholder() {
        const resultsContainer = document.getElementById('citySearchResults');
        resultsContainer.innerHTML = `
            <div class="results-placeholder">
                <div class="placeholder-icon">🔍</div>
                <p>请输入城市名称进行搜索</p>
                <p class="placeholder-hint">点击搜索结果即可自动导入该城市的酒店、景点、美食数据</p>
            </div>
        `;
    }

    resetModal() {
        document.getElementById('citySearchResults').style.display = 'block';
        document.getElementById('importProgress').style.display = 'none';
        document.getElementById('importSuccess').style.display = 'none';
        document.getElementById('citySearchInput').value = '';
        this.showPlaceholder();
    }

    open(callback) {
        this.onCitySelected = callback;
        this.resetModal();
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        this.resetModal();
    }
}

// 导出单例
export const citySearchModal = new CitySearchModal();
