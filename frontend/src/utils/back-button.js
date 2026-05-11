/**
 * 返回按钮工具函数
 * 提供统一的返回功能
 */

/**
 * 创建返回按钮元素
 * @param {Object} options - 配置选项
 * @param {string} options.text - 按钮文本，默认为"返回"
 * @param {string} options.className - 额外的CSS类名
 * @param {Function} options.onClick - 自定义点击处理函数
 * @returns {HTMLElement} 返回按钮元素
 */
function createBackButton(options = {}) {
    const {
        text = '返回',
        className = '',
        onClick = null
    } = options;

    const button = document.createElement('button');
    button.className = `back-button ${className}`.trim();
    button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>${text}</span>
    `;

    button.addEventListener('click', onClick || handleBackClick);

    return button;
}

/**
 * 默认的返回处理函数
 * 优先使用浏览器历史记录，如果没有历史记录则返回首页
 */
function handleBackClick() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'index.html';
    }
}

/**
 * 在指定容器中插入返回按钮
 * @param {string|HTMLElement} container - 容器选择器或元素
 * @param {Object} options - 配置选项
 * @param {string} options.position - 插入位置: 'prepend' | 'append'，默认为'prepend'
 */
function insertBackButton(container, options = {}) {
    const {
        position = 'prepend',
        ...buttonOptions
    } = options;

    const containerElement = typeof container === 'string'
        ? document.querySelector(container)
        : container;

    if (!containerElement) {
        console.warn('返回按钮容器未找到:', container);
        return null;
    }

    const backButton = createBackButton(buttonOptions);

    if (position === 'append') {
        containerElement.appendChild(backButton);
    } else {
        containerElement.insertBefore(backButton, containerElement.firstChild);
    }

    return backButton;
}

/**
 * 初始化返回按钮
 * 自动在页面中查找并添加返回按钮
 */
function initBackButton() {
    // 检查是否是首页，首页不需要返回按钮
    const isHomePage = window.location.pathname.endsWith('index.html') ||
                       window.location.pathname === '/' ||
                       window.location.pathname.endsWith('/');

    if (isHomePage) {
        return;
    }

    // 尝试在面包屑导航中添加返回按钮
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) {
        insertBackButton(breadcrumb, { position: 'prepend' });
        return;
    }

    // 尝试在页面头部添加返回按钮
    const pageHeader = document.querySelector('.detail-header, .hotel-header, .page-header');
    if (pageHeader) {
        insertBackButton(pageHeader, { position: 'prepend' });
        return;
    }

    // 如果都没有，在主容器顶部添加
    const mainContainer = document.querySelector('main .container');
    if (mainContainer) {
        insertBackButton(mainContainer, { position: 'prepend' });
    }
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createBackButton,
        handleBackClick,
        insertBackButton,
        initBackButton
    };
}
