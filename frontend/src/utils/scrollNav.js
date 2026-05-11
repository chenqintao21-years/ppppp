/**
 * 通用滚动导航栏功能
 * 在页面滚动时显示/隐藏固定导航栏
 */

function initScrollNav() {
    let lastScrollTop = 0;
    const headerTop = document.querySelector('.header-top');
    const headerScrolled = document.querySelector('.header-scrolled');
    const scrollThreshold = 100;

    if (!headerScrolled) {
        console.warn('未找到 .header-scrolled 元素，滚动导航栏功能未启用');
        return;
    }

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > scrollThreshold) {
            if (scrollTop > lastScrollTop) {
                // 向下滚动
                if (headerTop) headerTop.classList.add('hidden');
                if (headerScrolled) headerScrolled.classList.add('visible');
            } else {
                // 向上滚动
                if (headerScrolled) headerScrolled.classList.add('visible');
            }
        } else {
            // 滚动到顶部
            if (headerTop) headerTop.classList.remove('hidden');
            if (headerScrolled) headerScrolled.classList.remove('visible');
        }

        lastScrollTop = scrollTop;
    });

    console.log('滚动导航栏已初始化');
}

// 自动初始化（如果DOM已加载）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollNav);
} else {
    initScrollNav();
}

// 导出供手动调用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initScrollNav };
}
