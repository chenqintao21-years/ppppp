// 城市搜索和自动导入UI组件
import citySearchService from '../services/citySearch.js';

class CitySearchImportUI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.isSearching = false;
        this.searchResults = null;
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
    }

    render() {
        this.container.innerHTML = `
            <div class="city-search-import">
                <div class="search-header">
                    <h2>城市搜索与自动导入</h2>
                    <p class="subtitle">搜索城市或使用定位，自动导入酒店、景点、美食信息</p>
                </div>

                <div class="search-controls">
                    <div class="search-input-group">
                        <input
                            type="text"
                            id="citySearchInput"
                            class="city-search-input"
                            placeholder="输入城市名称，如：北京、上海、杭州..."
                        />
                        <button id="searchCityBtn" class="btn-primary">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            搜索城市
                        </button>
                    </div>

                    <button id="locateCurrentBtn" class="btn-secondary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        使用当前定位
                    </button>
                </div>

                <div id="searchStatus" class="search-status"></div>

                <div id="cityResults" class="city-results"></div>

                <div id="importProgress" class="import-progress" style="display: none;">
                    <h3>正在导入数据...</h3>
                    <div class="progress-items">
                        <div class="progress-item">
                            <span class="progress-label">酒店</span>
                            <div class="progress-bar">
                                <div id="hotelsProgress" class="progress-fill"></div>
                            </div>
                            <span id="hotelsCount" class="progress-count">0</span>
                        </div>
                        <div class="progress-item">
                            <span class="progress-label">景点</span>
                            <div class="progress-bar">
                                <div id="attractionsProgress" class="progress-fill"></div>
                            </div>
                            <span id="attractionsCount" class="progress-count">0</span>
                        </div>
                        <div class="progress-item">
                            <span class="progress-label">美食</span>
                            <div class="progress-bar">
                                <div id="restaurantsProgress" class="progress-fill"></div>
                            </div>
                            <span id="restaurantsCount" class="progress-count">0</span>
                        </div>
                    </div>
                </div>

                <div id="importResults" class="import-results"></div>
            </div>
        `;

        this.addStyles();
    }

    addStyles() {
        if (document.getElementById('citySearchImportStyles')) return;

        const style = document.createElement('style');
        style.id = 'citySearchImportStyles';
        style.textContent = `
            .city-search-import {
                max-width: 1200px;
                margin: 0 auto;
                padding: 40px 20px;
            }

            .search-header {
                text-align: center;
                margin-bottom: 40px;
            }

            .search-header h2 {
                font-size: 32px;
                color: #333;
                margin-bottom: 10px;
            }

            .search-header .subtitle {
                font-size: 16px;
                color: #666;
            }

            .search-controls {
                display: flex;
                gap: 15px;
                margin-bottom: 30px;
                flex-wrap: wrap;
            }

            .search-input-group {
                flex: 1;
                display: flex;
                gap: 10px;
                min-width: 300px;
            }

            .city-search-input {
                flex: 1;
                padding: 12px 20px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 16px;
                transition: border-color 0.3s;
            }

            .city-search-input:focus {
                outline: none;
                border-color: #00aa6c;
            }

            .btn-primary, .btn-secondary {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s;
                white-space: nowrap;
            }

            .btn-primary {
                background: #00aa6c;
                color: white;
            }

            .btn-primary:hover {
                background: #008f5a;
            }

            .btn-secondary {
                background: #f0f0f0;
                color: #333;
            }

            .btn-secondary:hover {
                background: #e0e0e0;
            }

            .btn-primary:disabled, .btn-secondary:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .search-status {
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                display: none;
            }

            .search-status.info {
                display: block;
                background: #e3f2fd;
                color: #1976d2;
            }

            .search-status.success {
                display: block;
                background: #e8f5e9;
                color: #388e3c;
            }

            .search-status.error {
                display: block;
                background: #ffebee;
                color: #d32f2f;
            }

            .city-results {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }

            .city-card {
                padding: 20px;
                border: 2px solid #e0e0e0;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s;
            }

            .city-card:hover {
                border-color: #00aa6c;
                box-shadow: 0 4px 12px rgba(0, 170, 108, 0.15);
            }

            .city-card h3 {
                font-size: 20px;
                color: #333;
                margin-bottom: 8px;
            }

            .city-card p {
                font-size: 14px;
                color: #666;
                margin: 4px 0;
            }

            .import-progress {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 12px;
                margin-bottom: 30px;
            }

            .import-progress h3 {
                text-align: center;
                color: #333;
                margin-bottom: 30px;
            }

            .progress-items {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            .progress-item {
                display: grid;
                grid-template-columns: 80px 1fr 60px;
                align-items: center;
                gap: 15px;
            }

            .progress-label {
                font-size: 16px;
                font-weight: 500;
                color: #333;
            }

            .progress-bar {
                height: 24px;
                background: #e0e0e0;
                border-radius: 12px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #00aa6c, #00d084);
                width: 0%;
                transition: width 0.5s ease;
            }

            .progress-count {
                font-size: 16px;
                font-weight: 600;
                color: #00aa6c;
                text-align: right;
            }

            .import-results {
                background: white;
                border-radius: 12px;
                padding: 30px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .import-results h3 {
                font-size: 24px;
                color: #333;
                margin-bottom: 20px;
            }

            .results-summary {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }

            .summary-card {
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                color: white;
                text-align: center;
            }

            .summary-card.hotels {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }

            .summary-card.attractions {
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            }

            .summary-card.restaurants {
                background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
            }

            .summary-card .count {
                font-size: 48px;
                font-weight: bold;
                margin-bottom: 8px;
            }

            .summary-card .label {
                font-size: 16px;
                opacity: 0.9;
            }

            .results-tabs {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                border-bottom: 2px solid #e0e0e0;
            }

            .results-tab {
                padding: 12px 24px;
                background: none;
                border: none;
                border-bottom: 3px solid transparent;
                font-size: 16px;
                font-weight: 500;
                color: #666;
                cursor: pointer;
                transition: all 0.3s;
            }

            .results-tab.active {
                color: #00aa6c;
                border-bottom-color: #00aa6c;
            }

            .results-content {
                display: none;
            }

            .results-content.active {
                display: block;
            }

            .results-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 20px;
            }

            .result-card {
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                overflow: hidden;
                transition: all 0.3s;
            }

            .result-card:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }

            .result-card-image {
                width: 100%;
                height: 180px;
                background: #f0f0f0;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #999;
            }

            .result-card-content {
                padding: 15px;
            }

            .result-card-title {
                font-size: 16px;
                font-weight: 600;
                color: #333;
                margin-bottom: 8px;
            }

            .result-card-info {
                font-size: 14px;
                color: #666;
                margin: 4px 0;
            }

            .result-card-rating {
                color: #ff9800;
                font-weight: 500;
            }

            @media (max-width: 768px) {
                .search-controls {
                    flex-direction: column;
                }

                .search-input-group {
                    min-width: 100%;
                }

                .results-summary {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        const searchBtn = document.getElementById('searchCityBtn');
        const locateBtn = document.getElementById('locateCurrentBtn');
        const searchInput = document.getElementById('citySearchInput');

        searchBtn.addEventListener('click', () => this.handleSearch());
        locateBtn.addEventListener('click', () => this.handleLocate());

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
    }

    async handleSearch() {
        const input = document.getElementById('citySearchInput');
        const cityName = input.value.trim();

        if (!cityName) {
            this.showStatus('请输入城市名称', 'error');
            return;
        }

        this.showStatus('正在搜索城市...', 'info');
        this.disableButtons(true);

        try {
            const cities = await citySearchService.searchCity(cityName);
            this.displayCityResults(cities);
            this.showStatus(`找到 ${cities.length} 个城市`, 'success');
        } catch (error) {
            this.showStatus('搜索失败: ' + error.message, 'error');
        } finally {
            this.disableButtons(false);
        }
    }

    async handleLocate() {
        this.showStatus('正在定位当前城市...', 'info');
        this.disableButtons(true);

        try {
            const result = await citySearchService.autoImportCurrentLocation({
                pageSize: 30
            });

            this.showStatus(`定位成功: ${result.city.name}`, 'success');
            this.displayImportResults(result);
        } catch (error) {
            this.showStatus('定位失败: ' + error.message, 'error');
        } finally {
            this.disableButtons(false);
        }
    }

    displayCityResults(cities) {
        const resultsContainer = document.getElementById('cityResults');

        resultsContainer.innerHTML = cities.map(city => `
            <div class="city-card" data-city="${city.name}">
                <h3>${city.name}</h3>
                <p>行政区划: ${city.district || '未知'}</p>
                <p>区号: ${city.adcode || '未知'}</p>
                <p class="city-action">点击自动导入该城市数据</p>
            </div>
        `).join('');

        // 绑定城市卡片点击事件
        resultsContainer.querySelectorAll('.city-card').forEach(card => {
            card.addEventListener('click', () => {
                const cityName = card.dataset.city;
                this.importCityData(cityName);
            });
        });
    }

    async importCityData(cityName) {
        this.showStatus(`正在导入 ${cityName} 的数据...`, 'info');
        this.showImportProgress();

        try {
            const result = await citySearchService.searchAndImportCity(cityName, {
                pageSize: 30
            });

            this.updateProgress(result.data);
            this.displayImportResults(result);
            this.showStatus('导入完成!', 'success');
        } catch (error) {
            this.showStatus('导入失败: ' + error.message, 'error');
        } finally {
            setTimeout(() => this.hideImportProgress(), 1000);
        }
    }

    showImportProgress() {
        const progressContainer = document.getElementById('importProgress');
        progressContainer.style.display = 'block';

        // 重置进度
        document.getElementById('hotelsProgress').style.width = '0%';
        document.getElementById('attractionsProgress').style.width = '0%';
        document.getElementById('restaurantsProgress').style.width = '0%';
        document.getElementById('hotelsCount').textContent = '0';
        document.getElementById('attractionsCount').textContent = '0';
        document.getElementById('restaurantsCount').textContent = '0';
    }

    hideImportProgress() {
        const progressContainer = document.getElementById('importProgress');
        progressContainer.style.display = 'none';
    }

    updateProgress(data) {
        // 更新酒店进度
        document.getElementById('hotelsProgress').style.width = '100%';
        document.getElementById('hotelsCount').textContent = data.hotels.length;

        // 更新景点进度
        document.getElementById('attractionsProgress').style.width = '100%';
        document.getElementById('attractionsCount').textContent = data.attractions.length;

        // 更新餐厅进度
        document.getElementById('restaurantsProgress').style.width = '100%';
        document.getElementById('restaurantsCount').textContent = data.restaurants.length;
    }

    displayImportResults(result) {
        const resultsContainer = document.getElementById('importResults');
        const { data, summary } = result;

        resultsContainer.innerHTML = `
            <h3>导入结果 - ${result.city.name}</h3>

            <div class="results-summary">
                <div class="summary-card hotels">
                    <div class="count">${summary.hotels}</div>
                    <div class="label">酒店</div>
                </div>
                <div class="summary-card attractions">
                    <div class="count">${summary.attractions}</div>
                    <div class="label">景点</div>
                </div>
                <div class="summary-card restaurants">
                    <div class="count">${summary.restaurants}</div>
                    <div class="label">美食</div>
                </div>
            </div>

            <div class="results-tabs">
                <button class="results-tab active" data-tab="hotels">酒店 (${summary.hotels})</button>
                <button class="results-tab" data-tab="attractions">景点 (${summary.attractions})</button>
                <button class="results-tab" data-tab="restaurants">美食 (${summary.restaurants})</button>
            </div>

            <div class="results-content active" data-content="hotels">
                ${this.renderResultsGrid(data.hotels, 'hotel')}
            </div>
            <div class="results-content" data-content="attractions">
                ${this.renderResultsGrid(data.attractions, 'attraction')}
            </div>
            <div class="results-content" data-content="restaurants">
                ${this.renderResultsGrid(data.restaurants, 'restaurant')}
            </div>
        `;

        // 绑定标签切换事件
        resultsContainer.querySelectorAll('.results-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;

                // 切换标签状态
                resultsContainer.querySelectorAll('.results-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // 切换内容
                resultsContainer.querySelectorAll('.results-content').forEach(c => c.classList.remove('active'));
                resultsContainer.querySelector(`[data-content="${tabName}"]`).classList.add('active');
            });
        });
    }

    renderResultsGrid(items, type) {
        if (!items || items.length === 0) {
            return '<p style="text-align: center; color: #666; padding: 40px;">暂无数据</p>';
        }

        return `
            <div class="results-grid">
                ${items.map(item => `
                    <div class="result-card">
                        <div class="result-card-image">
                            ${item.photos && item.photos.length > 0
                                ? `<img src="${item.photos[0].url}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">`
                                : '暂无图片'}
                        </div>
                        <div class="result-card-content">
                            <div class="result-card-title">${item.name}</div>
                            ${item.rating ? `<div class="result-card-info result-card-rating">⭐ ${item.rating}</div>` : ''}
                            <div class="result-card-info">📍 ${item.address}</div>
                            ${item.tel ? `<div class="result-card-info">📞 ${item.tel}</div>` : ''}
                            ${item.price ? `<div class="result-card-info">💰 ${item.price}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    showStatus(message, type) {
        const statusEl = document.getElementById('searchStatus');
        statusEl.textContent = message;
        statusEl.className = `search-status ${type}`;
    }

    disableButtons(disabled) {
        document.getElementById('searchCityBtn').disabled = disabled;
        document.getElementById('locateCurrentBtn').disabled = disabled;
    }
}

// 导出
export default CitySearchImportUI;
