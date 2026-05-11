// Attractions Page JavaScript - Dynamic Data Loading Version

// ==================== 数据渲染函数 ====================

// 渲染评分气泡
function renderRatingBubbles(rating) {
    let html = '';
    const fullBubbles = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;

    for (let i = 0; i < fullBubbles; i++) {
        html += '<span class="bubble filled"></span>';
    }

    if (hasHalf) {
        html += '<span class="bubble half"></span>';
    }

    const emptyBubbles = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyBubbles; i++) {
        html += '<span class="bubble"></span>';
    }

    return html;
}

// 渲染热门讲座
function renderTrendingLectures(data) {
    const container = document.querySelector('.trending-carousel');
    if (!container) return;

    container.innerHTML = data.map(item => `
        <div class="trending-card" data-id="${item.id}">
            <div class="trending-image" style="background: ${item.image.gradient}, ${item.image.color};"></div>
            <div class="trending-content">
                <h3>${item.title}</h3>
                <div class="rating-line">
                    <div class="rating-bubbles">
                        ${renderRatingBubbles(item.rating)}
                    </div>
                    <span class="review-text">(${item.reviews})</span>
                </div>
            </div>
        </div>
    `).join('');
}

// 渲染推荐景点
function renderRecommendations(data) {
    const container = document.querySelector('.recommendations-grid');
    if (!container) return;

    container.innerHTML = data.map(item => `
        <div class="recommendation-card" data-id="${item.id}">
            <button class="favorite-btn-card">
                ${svgIcons.heart}
            </button>
            <div class="rec-image" style="background: ${item.image.gradient}, ${item.image.color};"></div>
            <div class="rec-badge">${item.badge}</div>
            <div class="rec-content">
                <h3>${item.title}</h3>
                <div class="rating-line">
                    <div class="rating-bubbles">
                        ${renderRatingBubbles(item.rating)}
                    </div>
                    <span class="review-text">${item.reviews ? item.reviews.toLocaleString() : 'US$' + item.price}</span>
                </div>
                <p class="rec-description">${item.description}</p>
                <div class="price-line">
                    <span class="from-text">低至</span>
                    <span class="price-amount">US$${item.price}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// 渲染热门地点
function renderPopularDestinations(data) {
    const container = document.querySelector('.popular-destinations-grid');
    if (!container) return;

    container.innerHTML = data.map(item => `
        <div class="popular-dest-card">
            <div class="popular-dest-image" style="background: ${item.image.gradient}, url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22${encodeURIComponent(item.image.color)}%22 width=%22400%22 height=%22300%22/%3E%3C/svg%3E') center/cover;"></div>
            <button class="favorite-btn-card">
                ${svgIcons.heart}
            </button>
            <div class="popular-dest-content">
                <h3>${item.name}</h3>
                <div class="popular-dest-tags">
                    ${item.tags.map(tag => `<span class="dest-tag">${tag}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

// 渲染分类
function renderCategories(data) {
    const container = document.querySelector('.categories-grid');
    if (!container) return;

    container.innerHTML = data.map(item => `
        <div class="category-card">
            <div class="category-image" style="background: ${item.image.gradient}, url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22${encodeURIComponent(item.image.color)}%22 width=%22400%22 height=%22300%22/%3E%3C/svg%3E') center/cover;"></div>
            <h3>${item.name}</h3>
        </div>
    `).join('');
}

// 渲染旅行者之选奖
function renderTravelersChoice(data) {
    const container = document.querySelector('.travelers-choice-grid');
    if (!container) return;

    container.innerHTML = data.map(item => `
        <div class="tc-card">
            <div class="tc-badge">
                ${svgIcons.badge}
            </div>
            <div class="tc-content">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
            </div>
        </div>
    `).join('');
}

// 渲染优势特点
function renderBenefits(data) {
    const container = document.querySelector('.benefits-grid');
    if (!container) return;

    container.innerHTML = data.map(item => `
        <div class="benefit-item">
            <div class="benefit-icon">
                ${svgIcons[item.icon]}
            </div>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
        </div>
    `).join('');
}

// 从API获取数据
async function fetchAttractionData() {
    try {
        // 获取热门景点（用于热门讲座）
        const trendingResponse = await fetch('http://localhost:3000/api/attractions/trending');
        const trendingData = await trendingResponse.json();

        // 获取推荐景点
        const recommendationsResponse = await fetch('http://localhost:3000/api/attractions/recommendations');
        const recommendationsData = await recommendationsResponse.json();

        // 获取热门目的地
        const destinationsResponse = await fetch('http://localhost:3000/api/attractions/destinations');
        const destinationsData = await destinationsResponse.json();

        return {
            trending: trendingData.success ? trendingData.data : [],
            recommendations: recommendationsData.success ? recommendationsData.data : [],
            destinations: destinationsData.success ? destinationsData.data : [],
            // 保留静态数据
            categories: attractionsData.categories,
            travelersChoice: attractionsData.travelersChoice,
            benefits: attractionsData.benefits
        };
    } catch (error) {
        console.error('获取景点数据失败:', error);
        // 失败时使用静态数据
        return {
            trending: attractionsData.trendingLectures,
            recommendations: attractionsData.recommendations,
            destinations: attractionsData.popularDestinations,
            categories: attractionsData.categories,
            travelersChoice: attractionsData.travelersChoice,
            benefits: attractionsData.benefits
        };
    }
}

// 初始化所有数据
async function initializeData() {
    console.log('🔥🔥🔥 使用数据库数据版本 - 开始初始化数据...');

    const data = await fetchAttractionData();
    console.log('✅ 从API获取到的数据:', data);

    // 转换数据库数据格式以匹配前端渲染
    console.log('📊 原始trending数据:', data.trending);
    console.log('📊 原始recommendations数据:', data.recommendations);
    console.log('📊 原始destinations数据:', data.destinations);

    const trendingFormatted = data.trending.slice(0, 6).map(attr => ({
        id: attr.id,
        title: attr.name,
        image: {
            gradient: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4))',
            color: getRandomColor()
        },
        rating: parseFloat(attr.rating),
        reviews: attr.review_count
    }));

    const recommendationsFormatted = data.recommendations.slice(0, 8).map((attr, index) => ({
        id: attr.id,
        badge: attr.rank || (index + 1),
        title: attr.name,
        image: {
            gradient: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.3))',
            color: getRandomColor()
        },
        rating: parseFloat(attr.rating),
        reviews: attr.review_count,
        description: `${attr.location_city} • ${attr.duration || '2-3小时'}`,
        price: parseFloat(attr.price)
    }));

    const destinationsFormatted = data.destinations.slice(0, 8).map(dest => ({
        id: dest.location_city,
        name: dest.location_city,
        image: {
            gradient: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4))',
            color: getRandomColor()
        },
        tags: [`${dest.attraction_count}个景点`, `平均${parseFloat(dest.avg_rating).toFixed(1)}⭐`, `${dest.total_reviews}条评论`]
    }));

    console.log('✨ 格式化后的trending:', trendingFormatted);
    console.log('✨ 格式化后的recommendations:', recommendationsFormatted);
    console.log('✨ 格式化后的destinations:', destinationsFormatted);

    renderTrendingLectures(trendingFormatted);
    renderRecommendations(recommendationsFormatted);
    renderPopularDestinations(destinationsFormatted);
    renderCategories(data.categories);
    renderTravelersChoice(data.travelersChoice);
    renderBenefits(data.benefits);

    console.log('✅ 数据渲染完成');

    // 检查DOM中是否有卡片
    const checkCards = () => {
        const trendingCards = document.querySelectorAll('.trending-card');
        const recCards = document.querySelectorAll('.recommendation-card');
        const destCards = document.querySelectorAll('.popular-dest-card');
        console.log(`🔍 DOM中的卡片数量: trending=${trendingCards.length}, recommendations=${recCards.length}, destinations=${destCards.length}`);
    };

    checkCards();

    // 等待DOM更新后再初始化事件监听器
    setTimeout(() => {
        checkCards();
        initializeEventListeners();
    }, 100);
}

// 生成随机颜色
function getRandomColor() {
    const colors = ['#e76f51', '#2a9d8f', '#f4a261', '#264653', '#e9c46a', '#457b9d', '#e63946', '#06d6a0', '#118ab2'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// ==================== Header Scroll Effect ====================
let lastScroll = 0;
const header = document.querySelector('.header-attractions');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// ==================== Hero Carousel Auto-Play ====================
const dots = document.querySelectorAll('.dot');
let currentSlide = 0;
const slideInterval = 5000;

function changeSlide(index) {
    dots.forEach(dot => dot.classList.remove('active'));
    dots[index].classList.add('active');
    currentSlide = index;
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % dots.length;
    changeSlide(currentSlide);
}

// Auto-play carousel
let carouselTimer = setInterval(nextSlide, slideInterval);

// Manual dot click
dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        clearInterval(carouselTimer);
        changeSlide(index);
        carouselTimer = setInterval(nextSlide, slideInterval);
    });
});

// ==================== Event Listeners Initialization ====================
function initializeEventListeners() {
    // Favorite Button Interactions
    const favoriteButtons = document.querySelectorAll('.favorite-btn-card');

    favoriteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const svg = btn.querySelector('svg path');

            if (btn.classList.contains('favorited')) {
                btn.classList.remove('favorited');
                svg.setAttribute('fill', 'none');
                svg.setAttribute('stroke', '#fff');
            } else {
                btn.classList.add('favorited');
                svg.setAttribute('fill', '#ff385c');
                svg.setAttribute('stroke', '#ff385c');

                // Add bounce animation
                btn.style.animation = 'heartBeat 0.5s ease';
                setTimeout(() => {
                    btn.style.animation = '';
                }, 500);

                // Create heart particles
                createHeartParticles(btn);
            }
        });
    });

    // Scroll Reveal Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all cards
    const cards = document.querySelectorAll('.trending-card, .recommendation-card, .popular-dest-card, .category-card, .tc-card, .benefit-item');

    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s`;
        observer.observe(card);
    });

    // Card Click Handlers with Ripple Effect
    const allCards = document.querySelectorAll('.trending-card, .recommendation-card, .popular-dest-card, .category-card, .tc-card');

    allCards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.favorite-btn-card')) {
                // Add ripple effect
                const ripple = document.createElement('div');
                ripple.style.position = 'absolute';
                ripple.style.borderRadius = '50%';
                ripple.style.background = 'rgba(0, 170, 108, 0.4)';
                ripple.style.width = '20px';
                ripple.style.height = '20px';
                ripple.style.pointerEvents = 'none';

                const rect = card.getBoundingClientRect();
                ripple.style.left = (e.clientX - rect.left - 10) + 'px';
                ripple.style.top = (e.clientY - rect.top - 10) + 'px';

                card.style.position = 'relative';
                card.style.overflow = 'hidden';
                card.appendChild(ripple);

                ripple.animate([
                    { transform: 'scale(0)', opacity: 1 },
                    { transform: 'scale(15)', opacity: 0 }
                ], {
                    duration: 600,
                    easing: 'ease-out'
                }).onfinish = () => {
                    ripple.remove();

                    // 根据卡片类型跳转到不同页面
                    if (card.classList.contains('popular-dest-card')) {
                        const destination = card.querySelector('h3').textContent;
                        window.location.href = `destination.html?name=${encodeURIComponent(destination)}`;
                    } else if (card.classList.contains('recommendation-card') || card.classList.contains('trending-card')) {
                        const id = card.dataset.id;
                        if (id) {
                            window.location.href = `attraction-detail.html?id=${id}`;
                        }
                    } else if (card.classList.contains('category-card')) {
                        const category = card.querySelector('h3').textContent;
                        window.location.href = `attractions-search.html?category=${encodeURIComponent(category)}`;
                    }
                };
            }
        });
    });

    // Rating Bubbles Animation
    const ratingBubbles = document.querySelectorAll('.rating-bubbles');

    ratingBubbles.forEach(bubbleGroup => {
        const bubbles = bubbleGroup.querySelectorAll('.bubble');

        bubbleGroup.addEventListener('mouseenter', () => {
            bubbles.forEach((bubble, index) => {
                setTimeout(() => {
                    bubble.style.transition = 'transform 0.2s ease';
                    bubble.style.transform = 'scale(1.3)';
                    setTimeout(() => {
                        bubble.style.transform = 'scale(1)';
                    }, 150);
                }, index * 50);
            });
        });
    });

    // Tag Hover Effects
    const tags = document.querySelectorAll('.dest-tag');

    tags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.stopPropagation();

            // Add click feedback
            tag.style.transition = 'all 0.2s ease';
            tag.style.transform = 'scale(0.95)';

            setTimeout(() => {
                tag.style.transform = 'scale(1)';
            }, 150);
        });
    });
}

// Heart particles effect
function createHeartParticles(button) {
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        const angle = (Math.PI * 2 * i) / 8;
        const velocity = 60 + Math.random() * 20;

        particle.style.cssText = `
            position: fixed;
            width: 6px;
            height: 6px;
            background: #ff385c;
            border-radius: 50%;
            left: ${centerX}px;
            top: ${centerY}px;
            pointer-events: none;
            z-index: 9999;
        `;

        document.body.appendChild(particle);

        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
        ], {
            duration: 800,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }).onfinish = () => particle.remove();
    }
}

// Add heartbeat animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes heartBeat {
        0%, 100% { transform: scale(1); }
        25% { transform: scale(1.3); }
        50% { transform: scale(1.1); }
        75% { transform: scale(1.25); }
    }

    .favorited svg path {
        fill: #ff385c !important;
        stroke: #ff385c !important;
    }
`;
document.head.appendChild(style);

// ==================== Parallax Effect for Hero Section ====================
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroImage = document.querySelector('.hero-image-bg');

    if (heroImage && scrolled < 600) {
        heroImage.style.transform = `translateY(${scrolled * 0.5}px) scale(${1 + scrolled * 0.0002})`;
    }
});

// ==================== Search Input Focus Effect ====================
const searchInputs = document.querySelectorAll('.search-input-header, .search-input-attractions');

searchInputs.forEach(input => {
    input.addEventListener('focus', () => {
        const parent = input.closest('.search-bar-header, .search-box-attractions');
        if (parent) {
            parent.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            parent.style.transform = 'scale(1.02)';
        }
    });

    input.addEventListener('blur', () => {
        const parent = input.closest('.search-bar-header, .search-box-attractions');
        if (parent) {
            parent.style.transform = 'scale(1)';
        }
    });
});

// ==================== Keyboard Navigation for Carousel ====================
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        currentSlide = (currentSlide - 1 + dots.length) % dots.length;
        changeSlide(currentSlide);
        clearInterval(carouselTimer);
        carouselTimer = setInterval(nextSlide, slideInterval);
    } else if (e.key === 'ArrowRight') {
        nextSlide();
        clearInterval(carouselTimer);
        carouselTimer = setInterval(nextSlide, slideInterval);
    }
});

// ==================== Touch Swipe Support for Mobile ====================
let touchStartX = 0;
let touchEndX = 0;

const hero = document.querySelector('.hero-attractions');

if (hero) {
    hero.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    hero.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
}

function handleSwipe() {
    if (touchEndX < touchStartX - 50) {
        // Swipe left
        nextSlide();
        clearInterval(carouselTimer);
        carouselTimer = setInterval(nextSlide, slideInterval);
    }
    if (touchEndX > touchStartX + 50) {
        // Swipe right
        currentSlide = (currentSlide - 1 + dots.length) % dots.length;
        changeSlide(currentSlide);
        clearInterval(carouselTimer);
        carouselTimer = setInterval(nextSlide, slideInterval);
    }
}

// ==================== Page Load Animation ====================
document.addEventListener('DOMContentLoaded', () => {
    // 初始化数据
    initializeData();
});

window.addEventListener('load', () => {
    document.body.classList.add('loaded');

    // Trigger initial animations with stagger
    setTimeout(() => {
        const cards = document.querySelectorAll('.trending-card, .recommendation-card, .popular-dest-card, .category-card, .tc-card, .benefit-item');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 30);
        });
    }, 100);
});

// ==================== Smooth Scroll for Navigation ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==================== Dynamic Background Gradient Animation ====================
const heroImageBg = document.querySelector('.hero-image-bg');
if (heroImageBg) {
    let hue = 0;
    setInterval(() => {
        hue = (hue + 0.5) % 360;
        // Subtle color shift effect
    }, 50);
}

// ==================== Cursor Trail Effect (Optional) ====================
let cursorTrail = [];
const maxTrailLength = 10;

document.addEventListener('mousemove', (e) => {
    if (window.innerWidth > 768) { // Only on desktop
        cursorTrail.push({ x: e.clientX, y: e.clientY, time: Date.now() });

        if (cursorTrail.length > maxTrailLength) {
            cursorTrail.shift();
        }
    }
});

// ==================== Performance Optimization ====================
// Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to scroll handler
const debouncedScroll = debounce(() => {
    // Additional scroll logic here if needed
}, 100);

window.addEventListener('scroll', debouncedScroll);

// ==================== Console Welcome Message ====================
console.log('%c🎉 Attractions Page Loaded Successfully!', 'color: #00aa6c; font-size: 16px; font-weight: bold;');
console.log('%cEnjoy exploring amazing destinations!', 'color: #666; font-size: 12px;');
