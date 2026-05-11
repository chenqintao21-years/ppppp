// 景点详情页交互脚本
import mapUtil from '../../utils/map.js';

// 景点数据配置
const attractionData = {
    id: 'forbidden-city',
    name: '北京故宫博物院',
    location: [116.3972, 39.9163], // 经度, 纬度
    address: '北京市东城区景山前街4号'
};

// 图片轮播功能
let currentImageIndex = 0;
const totalImages = 12;

const prevBtn = document.querySelector('.gallery-nav.prev');
const nextBtn = document.querySelector('.gallery-nav.next');
const imageCounter = document.querySelector('.image-counter');
const thumbnails = document.querySelectorAll('.thumbnail:not(.more)');

function updateImageCounter() {
    imageCounter.textContent = `${currentImageIndex + 1} / ${totalImages}`;
}

function updateThumbnails() {
    thumbnails.forEach((thumb, index) => {
        thumb.classList.toggle('active', index === currentImageIndex);
    });
}

if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + totalImages) % totalImages;
        updateImageCounter();
        updateThumbnails();
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % totalImages;
        updateImageCounter();
        updateThumbnails();
    });
}

thumbnails.forEach((thumb, index) => {
    thumb.addEventListener('click', () => {
        currentImageIndex = index;
        updateImageCounter();
        updateThumbnails();
    });
});

// 收藏按钮
const favoriteBtn = document.querySelector('.favorite-btn-detail');
if (favoriteBtn) {
    favoriteBtn.addEventListener('click', () => {
        const svg = favoriteBtn.querySelector('svg');
        const isFavorited = svg.getAttribute('fill') === 'currentColor';

        if (isFavorited) {
            svg.setAttribute('fill', 'none');
            favoriteBtn.textContent = '保存';
            favoriteBtn.prepend(svg);
        } else {
            svg.setAttribute('fill', 'currentColor');
            svg.style.fill = '#ff385c';
            favoriteBtn.textContent = '已保存';
            favoriteBtn.prepend(svg);
        }
    });
}

// 阅读更多功能
const readMoreBtn = document.querySelector('.read-more');
const aboutText = document.querySelector('.about-text');

if (readMoreBtn && aboutText) {
    let isExpanded = false;
    const originalText = aboutText.textContent;
    const shortText = originalText.substring(0, 200) + '...';

    aboutText.textContent = shortText;

    readMoreBtn.addEventListener('click', () => {
        isExpanded = !isExpanded;
        aboutText.textContent = isExpanded ? originalText : shortText;
        readMoreBtn.textContent = isExpanded ? '收起' : '阅读更多';
    });
}

// 旅行者数量选择器
const minusBtn = document.querySelector('.qty-btn.minus');
const plusBtn = document.querySelector('.qty-btn.plus');
const qtyInput = document.querySelector('.qty-input');

if (minusBtn && plusBtn && qtyInput) {
    minusBtn.addEventListener('click', () => {
        const currentValue = parseInt(qtyInput.value);
        if (currentValue > 1) {
            qtyInput.value = currentValue - 1;
        }
    });

    plusBtn.addEventListener('click', () => {
        const currentValue = parseInt(qtyInput.value);
        qtyInput.value = currentValue + 1;
    });
}

// 预订按钮
const bookNowBtn = document.querySelector('.book-now-btn');
if (bookNowBtn) {
    bookNowBtn.addEventListener('click', async () => {
        const date = document.getElementById('booking-date').value;
        const travelers = document.getElementById('travelers-count').value;

        if (!date) {
            alert('请选择日期');
            return;
        }

        const bookingData = {
            attractionId: 'forbidden-city',
            attractionName: '北京故宫博物院门票',
            date: date,
            travelers: parseInt(travelers),
            price: 60.00
        };

        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookingData)
            });

            if (response.ok) {
                alert('预订成功！');
            } else {
                alert('预订失败，请稍后重试');
            }
        } catch (error) {
            console.error('预订错误:', error);
            alert('预订失败，请稍后重试');
        }
    });
}

// 有用按钮
const helpfulBtns = document.querySelectorAll('.helpful-btn');
helpfulBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        const countText = this.textContent.match(/\d+/);
        if (countText) {
            const currentCount = parseInt(countText[0]);
            const newCount = currentCount + 1;
            this.innerHTML = this.innerHTML.replace(/\d+/, newCount);
        }

        this.style.background = '#e8f5e9';
        this.style.borderColor = '#00aa6c';
        this.style.color = '#00aa6c';
        this.disabled = true;
    });
});

// 加载更多评论
const loadMoreBtn = document.querySelector('.load-more-reviews');
if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/reviews?attractionId=forbidden-city&offset=2');
            const reviews = await response.json();

            console.log('加载更多评论:', reviews);
            // 这里可以动态添加更多评论到页面
        } catch (error) {
            console.error('加载评论失败:', error);
        }
    });
}

// 相关推荐卡片点击
const relatedCards = document.querySelectorAll('.related-card');
relatedCards.forEach(card => {
    card.addEventListener('click', function() {
        const title = this.querySelector('h3').textContent;
        console.log('点击相关推荐:', title);
        // 可以跳转到对应的详情页
    });
});

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
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

// 侧边栏固定效果优化
window.addEventListener('scroll', () => {
    const bookingCard = document.querySelector('.booking-card.sticky');
    const footer = document.querySelector('.footer');

    if (bookingCard && footer) {
        const footerTop = footer.getBoundingClientRect().top;
        const cardHeight = bookingCard.offsetHeight;

        if (footerTop < cardHeight + 40) {
            bookingCard.style.position = 'absolute';
            bookingCard.style.bottom = '0';
        } else {
            bookingCard.style.position = 'sticky';
            bookingCard.style.bottom = 'auto';
        }
    }
});

// 设置默认日期为明天
const dateInput = document.getElementById('booking-date');
if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    dateInput.value = dateString;
    dateInput.min = dateString;
}

// 图片懒加载
const images = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
        }
    });
});

images.forEach(img => imageObserver.observe(img));

// ========== 地图功能 ==========

// 初始化地图
async function initAttractionMap() {
    try {
        // 初始化地图
        await mapUtil.initMap('attraction-map', {
            center: attractionData.location,
            zoom: 15
        });

        // 添加景点标记
        const marker = mapUtil.addMarker(attractionData.location, {
            title: attractionData.name,
            icon: new AMap.Icon({
                size: new AMap.Size(40, 50),
                image: 'data:image/svg+xml;base64,' + btoa(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
                        <path d="M20 0C9 0 0 9 0 20c0 15 20 30 20 30s20-15 20-30C40 9 31 0 20 0z" fill="#00aa6c"/>
                        <circle cx="20" cy="20" r="8" fill="white"/>
                    </svg>
                `),
                imageSize: new AMap.Size(40, 50)
            })
        });

        // 添加信息窗体
        mapUtil.addInfoWindow(marker, `
            <div style="padding: 12px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #333;">${attractionData.name}</h3>
                <p style="margin: 0; color: #666; font-size: 13px;">${attractionData.address}</p>
            </div>
        `);

        console.log('地图初始化成功');
    } catch (error) {
        console.error('地图初始化失败:', error);
        document.getElementById('attraction-map').innerHTML =
            '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999;">地图加载失败，请刷新重试</div>';
    }
}

// 显示附近景点
async function showNearbyAttractions() {
    try {
        const btn = document.getElementById('show-nearby-btn');
        btn.disabled = true;
        btn.textContent = '加载中...';

        // 清除之前的标记（保留主景点）
        const mainMarker = mapUtil.markers[0];
        mapUtil.clearMarkers();
        if (mainMarker) {
            mapUtil.markers.push(mainMarker);
            mainMarker.setMap(mapUtil.map);
        }

        // 搜索附近景点
        const places = await mapUtil.searchNearby(
            attractionData.location,
            '景点',
            {
                radius: 2000,
                pageSize: 10,
                type: '风景名胜'
            }
        );

        // 在地图上显示附近景点
        places.forEach(place => {
            const marker = mapUtil.addMarker(
                [place.location.lng, place.location.lat],
                {
                    title: place.name,
                    icon: new AMap.Icon({
                        size: new AMap.Size(30, 38),
                        image: 'data:image/svg+xml;base64,' + btoa(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
                                <path d="M15 0C7 0 0 7 0 15c0 11 15 23 15 23s15-12 15-23C30 7 23 0 15 0z" fill="#ff6b6b"/>
                                <circle cx="15" cy="15" r="6" fill="white"/>
                            </svg>
                        `),
                        imageSize: new AMap.Size(30, 38)
                    })
                }
            );

            // 计算距离
            const distance = mapUtil.calculateDistance(
                attractionData.location,
                [place.location.lng, place.location.lat]
            );

            // 添加信息窗体
            mapUtil.addInfoWindow(marker, `
                <div style="padding: 10px; min-width: 180px;">
                    <h4 style="margin: 0 0 5px 0; font-size: 14px;">${place.name}</h4>
                    <p style="margin: 0; color: #666; font-size: 12px;">${place.address || '暂无地址'}</p>
                    <p style="margin: 5px 0 0 0; color: #00aa6c; font-size: 12px; font-weight: 500;">
                        距离: ${mapUtil.formatDistance(distance)}
                    </p>
                </div>
            `);
        });

        // 自适应显示所有标记
        mapUtil.fitView();

        btn.disabled = false;
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
            附近景点 (${places.length})
        `;

        console.log(`找到 ${places.length} 个附近景点`);
    } catch (error) {
        console.error('显示附近景点失败:', error);
        const btn = document.getElementById('show-nearby-btn');
        btn.disabled = false;
        btn.textContent = '附近景点';
        alert('加载附近景点失败，请稍后重试');
    }
}

// 路线规划
async function planRoute() {
    try {
        // 获取用户当前位置
        if (!navigator.geolocation) {
            alert('您的浏览器不支持定位功能');
            return;
        }

        const btn = document.getElementById('plan-route-btn');
        btn.disabled = true;
        btn.textContent = '定位中...';

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const userLocation = [position.coords.longitude, position.coords.latitude];

                try {
                    // 规划路线
                    const result = await mapUtil.planRoute(userLocation, attractionData.location);

                    if (result.routes && result.routes.length > 0) {
                        const route = result.routes[0];
                        const distance = mapUtil.formatDistance(route.distance);
                        const duration = Math.round(route.time / 60);

                        alert(`路线规划成功！\n距离: ${distance}\n预计时间: ${duration}分钟`);
                    }

                    btn.disabled = false;
                    btn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                        路线规划
                    `;
                } catch (error) {
                    console.error('路线规划失败:', error);
                    btn.disabled = false;
                    btn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                        路线规划
                    `;
                    alert('路线规划失败，请稍后重试');
                }
            },
            (error) => {
                console.error('定位失败:', error);
                btn.disabled = false;
                btn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                    路线规划
                `;
                alert('无法获取您的位置，请检查定位权限');
            }
        );
    } catch (error) {
        console.error('路线规划错误:', error);
    }
}

// 绑定地图按钮事件
document.addEventListener('DOMContentLoaded', () => {
    // 初始化地图
    initAttractionMap();

    // 附近景点按钮
    const nearbyBtn = document.getElementById('show-nearby-btn');
    if (nearbyBtn) {
        nearbyBtn.addEventListener('click', showNearbyAttractions);
    }

    // 路线规划按钮
    const routeBtn = document.getElementById('plan-route-btn');
    if (routeBtn) {
        routeBtn.addEventListener('click', planRoute);
    }
});

console.log('景点详情页加载完成');
