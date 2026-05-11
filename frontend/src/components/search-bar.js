/**
 * 统一搜索组件
 * 支持实时搜索建议、搜索历史、热门搜索、多类型搜索
 */

class SearchBar {
    constructor(options = {}) {
        this.options = {
            container: options.container || '.search-bar-component',
            placeholder: options.placeholder || '搜索餐厅、景点、酒店',
            type: options.type || 'all', // all, restaurants, attractions, hotels
            apiBaseUrl: options.apiBaseUrl || 'http://localhost:3000/api',
            debounceDelay: options.debounceDelay || 300,
            minSearchLength: options.minSearchLength || 2,
            maxHistoryItems: options.maxHistoryItems || 10,
            onSearch: options.onSearch || null,
            onSelect: options.onSelect || null,
            showHistory: options.showHistory !== false,
            showTrending: options.showTrending !== false,
            showTypeFilter: options.showTypeFilter !== false
        };

        this.state = {
            isOpen: false,
            isLoading: false,
            query: '',
            suggestions: {
                restaurants: [],
                attractions: [],
                hotels: []
            },
            trending: [],
            history: [],
            selectedIndex: -1,
            currentType: this.options.type
        };

        this.debounceTimer = null;
        this.container = null;
        this.input = null;
        this.dropdown = null;

        this.init();
    }

    init() {
        this.container = document.querySelector(this.options.container);
        if (!this.container) {
            console.error('搜索组件容器未找到:', this.options.container);
            return;
        }

        this.loadHistory();
        this.render();
        this.bindEvents();

        if (this.options.showTrending) {
            this.loadTrending();
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="search-bar-wrapper">
                <div class="search-input-container">
                    <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                        type="text"
                        class="search-input"
                        placeholder="${this.options.placeholder}"
                        autocomplete="off"
                        spellcheck="false"
                    >
                    <button class="search-clear-btn" style="display: none;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    ${this.options.showTypeFilter ? this.renderTypeFilter() : ''}
                </div>
                <div class="search-dropdown" style="display: none;"></div>
            </div>
        `;

        this.input = this.container.querySelector('.search-input');
        this.dropdown = this.container.querySelector('.search-dropdown');
        this.clearBtn = this.container.querySelector('.search-clear-btn');
    }

    renderTypeFilter() {
        return `
            <div class="search-type-filter">
                <select class="search-type-select">
                    <option value="all">全部</option>
                    <option value="restaurants">餐厅</option>
                    <option value="attractions">景点</option>
                    <option value="hotels">酒店</option>
                </select>
            </div>
        `;
    }

    bindEvents() {
        // 输入事件
        this.input.addEventListener('input', (e) => {
            this.handleInput(e.target.value);
        });

        // 聚焦事件
        this.input.addEventListener('focus', () => {
            this.handleFocus();
        });

        // 键盘事件
        this.input.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });

        // 清除按钮
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => {
                this.clearInput();
            });
        }

        // 类型筛选
        if (this.options.showTypeFilter) {
            const typeSelect = this.container.querySelector('.search-type-select');
            if (typeSelect) {
                typeSelect.value = this.state.currentType;
                typeSelect.addEventListener('change', (e) => {
                    this.state.currentType = e.target.value;
                    if (this.state.query.length >= this.options.minSearchLength) {
                        this.fetchSuggestions(this.state.query);
                    }
                });
            }
        }

        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }

    handleInput(value) {
        this.state.query = value;

        // 显示/隐藏清除按钮
        if (this.clearBtn) {
            this.clearBtn.style.display = value ? 'flex' : 'none';
        }

        // 防抖处理
        clearTimeout(this.debounceTimer);

        if (value.length < this.options.minSearchLength) {
            this.showDefaultDropdown();
            return;
        }

        this.state.isLoading = true;
        this.showLoadingState();

        this.debounceTimer = setTimeout(() => {
            this.fetchSuggestions(value);
        }, this.options.debounceDelay);
    }

    handleFocus() {
        if (this.state.query.length >= this.options.minSearchLength) {
            this.openDropdown();
        } else {
            this.showDefaultDropdown();
        }
    }

    handleKeydown(e) {
        if (!this.state.isOpen) return;

        const items = this.dropdown.querySelectorAll('.search-suggestion-item');
        const totalItems = items.length;

        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.state.selectedIndex = Math.min(this.state.selectedIndex + 1, totalItems - 1);
                this.updateSelection(items);
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.state.selectedIndex = Math.max(this.state.selectedIndex - 1, -1);
                this.updateSelection(items);
                break;

            case 'Enter':
                e.preventDefault();
                if (this.state.selectedIndex >= 0 && items[this.state.selectedIndex]) {
                    items[this.state.selectedIndex].click();
                } else if (this.state.query) {
                    this.performSearch(this.state.query);
                }
                break;

            case 'Escape':
                this.closeDropdown();
                this.input.blur();
                break;
        }
    }

    updateSelection(items) {
        items.forEach((item, index) => {
            if (index === this.state.selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    clearInput() {
        this.input.value = '';
        this.state.query = '';
        if (this.clearBtn) {
            this.clearBtn.style.display = 'none';
        }
        this.input.focus();
        this.showDefaultDropdown();
    }

    async fetchSuggestions(query) {
        try {
            const response = await fetch(
                `${this.options.apiBaseUrl}/search/suggestions?q=${encodeURIComponent(query)}&type=${this.state.currentType}&limit=10`
            );
            const result = await response.json();

            if (result.success) {
                this.state.suggestions = result.data;
                this.state.isLoading = false;
                this.renderSuggestions();
            }
        } catch (error) {
            console.error('获取搜索建议失败:', error);
            this.state.isLoading = false;
            this.showErrorState();
        }
    }

    async loadTrending() {
        try {
            const response = await fetch(
                `${this.options.apiBaseUrl}/search/trending?type=${this.state.currentType}&limit=10`
            );
            const result = await response.json();

            if (result.success) {
                this.state.trending = result.data;
            }
        } catch (error) {
            console.error('获取热门搜索失败:', error);
        }
    }

    loadHistory() {
        try {
            const history = localStorage.getItem('search_history');
            this.state.history = history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('加载搜索历史失败:', error);
            this.state.history = [];
        }
    }

    saveToHistory(query, type, item = null) {
        const historyItem = {
            query,
            type,
            item,
            timestamp: Date.now()
        };

        // 移除重复项
        this.state.history = this.state.history.filter(h =>
            !(h.query === query && h.type === type)
        );

        // 添加到开头
        this.state.history.unshift(historyItem);

        // 限制数量
        this.state.history = this.state.history.slice(0, this.options.maxHistoryItems);

        // 保存到 localStorage
        try {
            localStorage.setItem('search_history', JSON.stringify(this.state.history));
        } catch (error) {
            console.error('保存搜索历史失败:', error);
        }
    }

    clearHistory() {
        this.state.history = [];
        localStorage.removeItem('search_history');
        this.showDefaultDropdown();
    }

    showDefaultDropdown() {
        const hasHistory = this.options.showHistory && this.state.history.length > 0;
        const hasTrending = this.options.showTrending && this.state.trending.length > 0;

        if (!hasHistory && !hasTrending) {
            this.closeDropdown();
            return;
        }

        let html = '';

        // 搜索历史
        if (hasHistory) {
            html += `
                <div class="search-section">
                    <div class="search-section-header">
                        <span class="search-section-title">搜索历史</span>
                        <button class="search-clear-history-btn">清除</button>
                    </div>
                    <div class="search-section-content">
                        ${this.state.history.map(item => `
                            <div class="search-suggestion-item" data-query="${item.query}" data-type="${item.type}">
                                <svg class="search-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <span class="search-item-text">${this.escapeHtml(item.query)}</span>
                                <button class="search-remove-history-btn" data-query="${item.query}">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 热门搜索
        if (hasTrending) {
            html += `
                <div class="search-section">
                    <div class="search-section-header">
                        <span class="search-section-title">热门搜索</span>
                    </div>
                    <div class="search-section-content">
                        ${this.state.trending.map((item, index) => `
                            <div class="search-suggestion-item" data-query="${item.keyword}" data-type="${item.search_type}">
                                <span class="search-trending-rank">${index + 1}</span>
                                <span class="search-item-text">${this.escapeHtml(item.keyword)}</span>
                                <span class="search-trending-count">${item.search_count}次</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        this.dropdown.innerHTML = html;
        this.bindDropdownEvents();
        this.openDropdown();
    }

    renderSuggestions() {
        const { restaurants, attractions, hotels, total } = this.state.suggestions;

        if (total === 0) {
            this.showNoResultsState();
            return;
        }

        let html = '';

        // 餐厅建议
        if (restaurants.length > 0) {
            html += this.renderSuggestionSection('餐厅', restaurants, 'restaurant');
        }

        // 景点建议
        if (attractions.length > 0) {
            html += this.renderSuggestionSection('景点', attractions, 'attraction');
        }

        // 酒店建议
        if (hotels.length > 0) {
            html += this.renderSuggestionSection('酒店', hotels, 'hotel');
        }

        this.dropdown.innerHTML = html;
        this.bindDropdownEvents();
        this.openDropdown();
    }

    renderSuggestionSection(title, items, type) {
        return `
            <div class="search-section">
                <div class="search-section-header">
                    <span class="search-section-title">${title}</span>
                </div>
                <div class="search-section-content">
                    ${items.map(item => this.renderSuggestionItem(item, type)).join('')}
                </div>
            </div>
        `;
    }

    renderSuggestionItem(item, type) {
        const icon = this.getTypeIcon(type);
        const subtitle = this.getItemSubtitle(item, type);
        const rating = item.rating ? `<span class="search-item-rating">⭐ ${item.rating}</span>` : '';

        return `
            <div class="search-suggestion-item" data-id="${item.id}" data-type="${type}">
                <div class="search-item-icon">${icon}</div>
                <div class="search-item-content">
                    <div class="search-item-title">${this.highlightQuery(item.name)}</div>
                    ${subtitle ? `<div class="search-item-subtitle">${subtitle}</div>` : ''}
                </div>
                ${rating}
            </div>
        `;
    }

    getTypeIcon(type) {
        const icons = {
            restaurant: '🍽️',
            attraction: '🎡',
            hotel: '🏨'
        };
        return icons[type] || '📍';
    }

    getItemSubtitle(item, type) {
        switch(type) {
            case 'restaurant':
                return item.cuisine || item.address || '';
            case 'attraction':
                return item.location_city || item.location_country || '';
            case 'hotel':
                return item.address || item.location_city || '';
            default:
                return '';
        }
    }

    highlightQuery(text) {
        if (!this.state.query) return this.escapeHtml(text);

        const regex = new RegExp(`(${this.escapeRegex(this.state.query)})`, 'gi');
        return this.escapeHtml(text).replace(regex, '<mark>$1</mark>');
    }

    bindDropdownEvents() {
        // 建议项点击
        this.dropdown.querySelectorAll('.search-suggestion-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const id = item.dataset.id;
                const type = item.dataset.type;
                const query = item.dataset.query;

                if (query) {
                    // 历史或热门搜索
                    this.input.value = query;
                    this.state.query = query;
                    this.performSearch(query, type);
                } else if (id) {
                    // 具体项目
                    this.handleItemSelect(id, type, item);
                }
            });
        });

        // 清除历史按钮
        const clearHistoryBtn = this.dropdown.querySelector('.search-clear-history-btn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearHistory();
            });
        }

        // 删除单个历史项
        this.dropdown.querySelectorAll('.search-remove-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const query = btn.dataset.query;
                this.removeHistoryItem(query);
            });
        });
    }

    removeHistoryItem(query) {
        this.state.history = this.state.history.filter(h => h.query !== query);
        localStorage.setItem('search_history', JSON.stringify(this.state.history));
        this.showDefaultDropdown();
    }

    handleItemSelect(id, type, element) {
        const itemData = {
            id,
            type,
            name: element.querySelector('.search-item-title')?.textContent || ''
        };

        this.saveToHistory(itemData.name, type, itemData);
        this.closeDropdown();

        if (this.options.onSelect) {
            this.options.onSelect(itemData);
        } else {
            // 默认跳转行为
            this.navigateToDetail(id, type);
        }
    }

    performSearch(query, type = null) {
        const searchType = type || this.state.currentType;
        this.saveToHistory(query, searchType);
        this.closeDropdown();

        if (this.options.onSearch) {
            this.options.onSearch(query, searchType);
        } else {
            // 默认跳转到搜索结果页
            window.location.href = `/views/search-results.html?q=${encodeURIComponent(query)}&type=${searchType}`;
        }
    }

    navigateToDetail(id, type) {
        const urls = {
            restaurant: `/views/restaurant-detail.html?id=${id}`,
            attraction: `/views/attraction-detail.html?id=${id}`,
            hotel: `/views/hotel-detail.html?id=${id}`
        };

        if (urls[type]) {
            window.location.href = urls[type];
        }
    }

    showLoadingState() {
        this.dropdown.innerHTML = `
            <div class="search-loading">
                <div class="search-loading-spinner"></div>
                <span>搜索中...</span>
            </div>
        `;
        this.openDropdown();
    }

    showNoResultsState() {
        this.dropdown.innerHTML = `
            <div class="search-no-results">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <p>未找到相关结果</p>
                <span>试试其他关键词</span>
            </div>
        `;
        this.openDropdown();
    }

    showErrorState() {
        this.dropdown.innerHTML = `
            <div class="search-error">
                <p>搜索出错了</p>
                <span>请稍后重试</span>
            </div>
        `;
        this.openDropdown();
    }

    openDropdown() {
        this.state.isOpen = true;
        this.state.selectedIndex = -1;
        this.dropdown.style.display = 'block';
        this.container.classList.add('search-active');
    }

    closeDropdown() {
        this.state.isOpen = false;
        this.state.selectedIndex = -1;
        this.dropdown.style.display = 'none';
        this.container.classList.remove('search-active');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeRegex(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        clearTimeout(this.debounceTimer);
    }
}

// 导出为全局变量（兼容非模块环境）
if (typeof window !== 'undefined') {
    window.SearchBar = SearchBar;
}

// ES6 模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchBar;
}
