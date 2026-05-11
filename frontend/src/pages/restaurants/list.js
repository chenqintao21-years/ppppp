// 搜索框交互
const searchInput = document.getElementById('searchInput');
const searchBox = document.getElementById('searchBox');
const searchSuggestions = document.getElementById('searchSuggestions');

// 点击搜索框显示建议
searchBox.addEventListener('click', () => {
    searchBox.classList.add('active');
    searchSuggestions.classList.add('active');
});

// 输入时显示建议
searchInput.addEventListener('focus', () => {
    searchBox.classList.add('active');
    searchSuggestions.classList.add('active');
});

// 点击页面其他地方关闭建议
document.addEventListener('click', (e) => {
    if (!searchBox.contains(e.target) && !searchSuggestions.contains(e.target)) {
        searchBox.classList.remove('active');
        searchSuggestions.classList.remove('active');
    }
});

// 建议项点击事件
const suggestionItems = document.querySelectorAll('.suggestion-item');
suggestionItems.forEach(item => {
    item.addEventListener('click', () => {
        const location = item.getAttribute('data-location');
        if (location) {
            // 跳转到搜索结果页
            window.location.href = `restaurant-search.html?location=${encodeURIComponent(location)}`;
        } else {
            const title = item.querySelector('.suggestion-title').textContent;
            searchInput.value = title;
            searchBox.classList.remove('active');
            searchSuggestions.classList.remove('active');
            console.log('搜索:', title);
        }
    });
});

// 餐厅卡片点击跳转
document.querySelectorAll('.restaurant-card, .featured-card').forEach(card => {
    card.addEventListener('click', function(e) {
        if (!e.target.closest('.favorite-btn-card')) {
            const title = this.querySelector('h3')?.textContent;
            if (title) {
                const id = title.toLowerCase().replace(/\s+/g, '-').substring(0, 50);
                window.location.href = `restaurant-detail.html?id=${encodeURIComponent(id)}`;
            }
        }
    });
});

// Logo点击返回首页
document.querySelectorAll('.logo a, .logo').forEach(logo => {
    logo.style.cursor = 'pointer';
    if (!logo.href || logo.href.includes('#')) {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }
});

// 搜索输入框回车事件
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const location = searchInput.value.trim();
        if (location) {
            window.location.href = `restaurant-search.html?location=${encodeURIComponent(location)}`;
        }
    }
});

// 页脚展开按钮
const footerExpandBtn = document.querySelector('.footer-expand');
const footerNote = document.querySelector('.footer-note');

footerExpandBtn.addEventListener('click', () => {
    if (footerNote.style.maxHeight) {
        footerNote.style.maxHeight = null;
        footerExpandBtn.textContent = '阅读更多';
    } else {
        footerNote.style.maxHeight = 'none';
        footerExpandBtn.textContent = '收起';
    }
});

// 导航链接点击事件
document.querySelectorAll('.sub-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        // 如果链接有 href 且不是 #，则允许默认跳转
        if (link.getAttribute('href') && link.getAttribute('href') !== '#') {
            return;
        }
        e.preventDefault();
        document.querySelectorAll('.sub-nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});
