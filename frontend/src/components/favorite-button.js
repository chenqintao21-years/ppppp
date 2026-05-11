/**
 * 收藏按钮组件
 * 支持心跳动画和粒子效果
 */

class FavoriteButton {
    constructor(options = {}) {
        this.entityType = options.entityType;
        this.entityId = options.entityId;
        this.container = options.container;
        this.size = options.size || 'medium'; // small, medium, large
        this.onToggle = options.onToggle || (() => {});

        this.isFavorited = false;
        this.isAnimating = false;

        this.init();
    }

    async init() {
        this.render();
        await this.checkStatus();
        this.attachEvents();
    }

    render() {
        const sizeClasses = {
            small: 'favorite-btn-small',
            medium: 'favorite-btn-medium',
            large: 'favorite-btn-large'
        };

        this.container.innerHTML = `
            <button class="favorite-btn ${sizeClasses[this.size]}"
                    data-entity-type="${this.entityType}"
                    data-entity-id="${this.entityId}"
                    aria-label="收藏">
                <svg class="favorite-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                          stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="favorite-text">收藏</span>
            </button>
            <div class="favorite-particles"></div>
        `;

        this.button = this.container.querySelector('.favorite-btn');
        this.icon = this.container.querySelector('.favorite-icon');
        this.text = this.container.querySelector('.favorite-text');
        this.particlesContainer = this.container.querySelector('.favorite-particles');
    }

    async checkStatus() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }

            const response = await fetch(
                `http://localhost:3000/api/favorites/check?type=${this.entityType}&id=${this.entityId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            const result = await response.json();
            if (result.success) {
                this.isFavorited = result.data.isFavorited;
                this.updateUI();
            }
        } catch (error) {
            console.error('检查收藏状态失败:', error);
        }
    }

    attachEvents() {
        this.button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
        });
    }

    async toggle() {
        if (this.isAnimating) return;

        const token = localStorage.getItem('token');
        if (!token) {
            alert('请先登录');
            return;
        }

        this.isAnimating = true;
        this.button.disabled = true;

        try {
            const response = await fetch('http://localhost:3000/api/favorites/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    entityType: this.entityType,
                    entityId: this.entityId
                })
            });

            const result = await response.json();

            if (result.success) {
                this.isFavorited = result.data.isFavorited;

                if (this.isFavorited) {
                    this.playHeartbeatAnimation();
                    this.createParticles();
                }

                this.updateUI();
                this.onToggle(this.isFavorited);
            } else {
                alert(result.message || '操作失败');
            }
        } catch (error) {
            console.error('Toggle收藏失败:', error);
            alert('操作失败，请重试');
        } finally {
            setTimeout(() => {
                this.isAnimating = false;
                this.button.disabled = false;
            }, 600);
        }
    }

    updateUI() {
        if (this.isFavorited) {
            this.button.classList.add('favorited');
            this.icon.style.fill = 'currentColor';
            this.text.textContent = '已收藏';
        } else {
            this.button.classList.remove('favorited');
            this.icon.style.fill = 'none';
            this.text.textContent = '收藏';
        }
    }

    playHeartbeatAnimation() {
        this.button.classList.add('heartbeat');
        setTimeout(() => {
            this.button.classList.remove('heartbeat');
        }, 600);
    }

    createParticles() {
        const particleCount = 12;
        const buttonRect = this.button.getBoundingClientRect();
        const centerX = buttonRect.width / 2;
        const centerY = buttonRect.height / 2;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 50 + Math.random() * 30;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;

            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.setProperty('--tx', tx + 'px');
            particle.style.setProperty('--ty', ty + 'px');

            this.particlesContainer.appendChild(particle);

            setTimeout(() => {
                particle.remove();
            }, 800);
        }
    }

    destroy() {
        if (this.button) {
            this.button.removeEventListener('click', this.toggle);
        }
    }
}

// 批量初始化收藏按钮
function initFavoriteButtons() {
    const buttons = document.querySelectorAll('[data-favorite-button]');

    buttons.forEach(container => {
        const entityType = container.dataset.entityType;
        const entityId = container.dataset.entityId;
        const size = container.dataset.size || 'medium';

        new FavoriteButton({
            container,
            entityType,
            entityId,
            size,
            onToggle: (isFavorited) => {
                console.log(`收藏状态变更: ${isFavorited ? '已收藏' : '已取消'}`);
            }
        });
    });
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FavoriteButton, initFavoriteButtons };
}
