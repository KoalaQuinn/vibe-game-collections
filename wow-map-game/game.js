/**
 * 魔兽世界艾泽拉斯大地图 - 2D点击探索游戏
 * Version: 1.0.0
 * Updated: 2026-03-30 11:58 (GMT+8)
 */

// 艾泽拉斯区域数据
const WORLD_REGIONS = {
    stormwind: {
        name: "暴风城",
        description: "人类联盟的骄傲，位于艾泽拉斯大陆的东部王国。这座雄伟的城市由石匠精心建造，狂风暴雨也无法撼动它的城墙。作为联盟的核心，暴风城见证了无数英雄的崛起与传奇的诞生。",
        faction: "联盟",
        level: "1-60",
        location: {x: 780, y: 280, radius: 35},
        actions: [
            {text: "进入暴风城", action: "enter"},
            {text: "查看任务", action: "quests"}
        ]
    },
    ironforge: {
        name: "铁炉堡",
        description: "矮人的家园，这座壮观的城市开凿在巨石山中，炉火熊熊燃烧，锻造之声不绝于耳。铁炉堡的地铁连接着暴风城，是联盟重要的经济与文化中心。",
        faction: "联盟",
        level: "1-60",
        location: {x: 720, y: 220, radius: 30},
        actions: [
            {text: "进入铁炉堡", action: "enter"},
            {text: "学习锻造", action: "profession"}
        ]
    },
    orgrimmar: {
        name: "奥格瑞玛",
        description: "兽人部落的首都，建立在杜隆塔尔的干旱土地上。由巨大的峡谷改建而成，城墙上飘扬着部落的战旗。力量与荣誉在这里被每一个兽人所传颂。",
        faction: "部落",
        level: "1-60",
        location: {x: 260, y: 420, radius: 40},
        actions: [
            {text: "进入奥格瑞玛", action: "enter"},
            {text: "接到酋长的任务", action: "quests"}
        ]
    },
    thunderbluff: {
        name: "雷霆崖",
        description: "牛头人崇高的家园，建立在莫高雷高高的悬崖之上。在这里可以眺望无尽的草原，风速牛群漫步，空气弥漫着自然的芬芳。",
        faction: "部落",
        level: "1-60",
        location: {x: 180, y: 480, radius: 35},
        actions: [
            {text: "与长者对话", action: "enter"},
            {text: "学习采药", action: "profession"}
        ]
    },
    darnassus: {
        name: "达纳苏斯",
        description: "暗夜精灵的首都，位于泰达希尔世界之树的树冠上。月光洒落在古老的森林中，永恒的平静守护着这片神秘的土地。",
        faction: "联盟",
        level: "1-60",
        location: {x: 80, y: 120, radius: 38},
        actions: [
            {text: "进入达纳苏斯", action: "enter"},
            {text: "参拜月神", action: "quests"}
        ]
    },
    undercity: {
        name: "幽暗城",
        description: "被遗忘者的城市，建立在洛丹伦废墟之下。蛛网密布的通道，瘟疫的迷雾笼罩着这片区域。希尔瓦娜斯女王的追随者在这里寻找着自己的命运。",
        faction: "部落",
        level: "1-60",
        location: {x: 700, y: 180, radius: 28},
        actions: [
            {text: "进入幽暗城", action: "enter"},
            {text: "接下女王的命令", action: "quests"}
        ]
    },
    bootybay: {
        name: "藏宝海湾",
        description: "中立的港口城市，黑水公司的大本营。来自世界各地的冒险者、海盗、商人聚集在这里，美酒与谣言随处可见。",
        faction: "中立",
        level: "30-40",
        location: {x: 860, y: 450, radius: 25},
        actions: [
            {text: "找船长接任务", action: "quests"},
            {text: "去酒吧喝酒", action: "enter"}
        ]
    },
    silithus: {
        name: "希利苏斯",
        description: "这片沙漠埋藏着古神克苏恩的遗迹，安其拉帝国的门户在这里被英雄们再次封印。风沙下依然涌动着黑暗的力量。",
        faction: "双方",
        level: "55-60",
        location: {x: 120, y: 620, radius: 45},
        actions: [
            {text: "讨伐克苏恩", action: "raid"},
            {text: "收集塞纳里奥材料", action: "quests"}
        ]
    }
};

// 游戏状态
const gameState = {
    canvas: null,
    ctx: null,
    mapImage: null,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    selectedRegion: null
};

// 初始化游戏
function initGame() {
    gameState.canvas = document.getElementById('map-canvas');
    gameState.ctx = gameState.canvas.getContext('2d');
    
    resizeCanvas();
    loadMapImage();
    setupEventListeners();
    render();
}

// 调整画布尺寸
function resizeCanvas() {
    const container = document.getElementById('map-container');
    gameState.canvas.width = container.clientWidth;
    gameState.canvas.height = container.clientHeight;
}

// 加载地图图片（使用公共领域的艾泽拉斯地图）
function loadMapImage() {
    // 使用一张支持CORS的艾泽拉斯大地图
    gameState.mapImage = new Image();
    gameState.mapImage.crossOrigin = 'anonymous';
    // 使用 imgur 托管的地图图片
    gameState.mapImage.src = 'https://i.imgur.com/8qXZ7yH.jpg';
    gameState.mapImage.onload = function() {
        // 初始居中
        const mapWidth = gameState.mapImage.width;
        const mapHeight = gameState.mapImage.height;
        const canvasWidth = gameState.canvas.width;
        const canvasHeight = gameState.canvas.height;
        
        // 计算合适的初始缩放
        const scaleX = canvasWidth / mapWidth;
        const scaleY = canvasHeight / mapHeight;
        gameState.scale = Math.min(scaleX, scaleY) * 0.9;
        centerMap();
        render();
    };
    gameState.mapImage.onerror = function() {
        // 如果加载失败，用渐变背景代替
        console.log('地图图片加载失败，使用默认背景');
        render();
    };
}

// 地图居中
function centerMap() {
    if (!gameState.mapImage || !gameState.mapImage.complete) return;
    
    const canvasWidth = gameState.canvas.width;
    const canvasHeight = gameState.canvas.height;
    const mapWidth = gameState.mapImage.width * gameState.scale;
    const mapHeight = gameState.mapImage.height * gameState.scale;
    
    gameState.offsetX = (canvasWidth - mapWidth) / 2;
    gameState.offsetY = (canvasHeight - mapHeight) / 2;
}

// 渲染地图
function render() {
    const ctx = gameState.ctx;
    const canvas = gameState.canvas;
    
    // 清空画布
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制地图
    if (gameState.mapImage && gameState.mapImage.complete && gameState.mapImage.naturalWidth > 0) {
        ctx.save();
        ctx.translate(gameState.offsetX, gameState.offsetY);
        ctx.scale(gameState.scale, gameState.scale);
        ctx.drawImage(gameState.mapImage, 0, 0);
        
        // 绘制可点击区域高亮
        drawRegionHotspots(ctx);
        ctx.restore();
    } else {
        // 显示加载提示
        ctx.fillStyle = '#e8dca8';
        ctx.font = '24px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('地图加载中...', canvas.width / 2, canvas.height / 2);
    }
}

// 绘制可点击区域
function drawRegionHotspots(ctx) {
    Object.values(WORLD_REGIONS).forEach(region => {
        const loc = region.location;
        
        // 半透明圆圈
        ctx.beginPath();
        ctx.arc(loc.x, loc.y, loc.radius, 0, Math.PI * 2);
        ctx.fillStyle = getFactionColor(region.faction) + '40';
        ctx.fill();
        ctx.strokeStyle = getFactionColor(region.faction);
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

// 根据阵营获取颜色
function getFactionColor(faction) {
    switch(faction) {
        case '联盟': return '#3a6ea5';
        case '部落': return '#cc3333';
        case '中立': return '#66aa55';
        default: return '#aaaaaa';
    }
}

// 设置事件监听
function setupEventListeners() {
    const canvas = gameState.canvas;
    const container = document.getElementById('map-container');
    
    // 鼠标按下 - 开始拖拽
    canvas.addEventListener('mousedown', (e) => {
        gameState.isDragging = true;
        gameState.lastX = e.clientX;
        gameState.lastY = e.clientY;
        container.classList.add('grabbing');
    });
    
    // 鼠标移动 - 拖拽地图
    canvas.addEventListener('mousemove', (e) => {
        if (gameState.isDragging) {
            const dx = e.clientX - gameState.lastX;
            const dy = e.clientY - gameState.lastY;
            gameState.offsetX += dx;
            gameState.offsetY += dy;
            gameState.lastX = e.clientX;
            gameState.lastY = e.clientY;
            render();
        } else {
            // 检测悬停
            checkHover(e);
        }
    });
    
    // 鼠标松开
    window.addEventListener('mouseup', () => {
        if (gameState.isDragging) {
            gameState.isDragging = false;
            container.classList.remove('grabbing');
        }
    });
    
    // 鼠标点击
    canvas.addEventListener('click', handleClick);
    
    // 滚轮缩放
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        zoomAt(e.offsetX, e.offsetY, delta);
    });
    
    // 缩放按钮
    document.getElementById('zoom-in').addEventListener('click', () => {
        zoomAt(gameState.canvas.width / 2, gameState.canvas.height / 2, 1.2);
    });
    document.getElementById('zoom-out').addEventListener('click', () => {
        zoomAt(gameState.canvas.width / 2, gameState.canvas.height / 2, 0.8);
    });
    document.getElementById('reset-zoom').addEventListener('click', () => {
        centerMap();
        if (gameState.mapImage) {
            const mapWidth = gameState.mapImage.width;
            const mapHeight = gameState.mapImage.height;
            const canvasWidth = gameState.canvas.width;
            const canvasHeight = gameState.canvas.height;
            const scaleX = canvasWidth / mapWidth;
            const scaleY = canvasHeight / mapHeight;
            gameState.scale = Math.min(scaleX, scaleY) * 0.9;
        }
        render();
    });
    
    // 关闭面板
    document.getElementById('close-panel').addEventListener('click', closeInfoPanel);
    
    // 窗口大小改变
    window.addEventListener('resize', () => {
        resizeCanvas();
        render();
    });
    
    // 移动端触摸支持
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        gameState.isDragging = true;
        gameState.lastX = touch.clientX;
        gameState.lastY = touch.clientY;
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (gameState.isDragging) {
            const touch = e.touches[0];
            const dx = touch.clientX - gameState.lastX;
            const dy = touch.clientY - gameState.lastY;
            gameState.offsetX += dx;
            gameState.offsetY += dy;
            gameState.lastX = touch.clientX;
            gameState.lastY = touch.clientY;
            render();
        }
    });
    
    canvas.addEventListener('touchend', () => {
        gameState.isDragging = false;
    });
    
    canvas.addEventListener('touchcancel', () => {
        gameState.isDragging = false;
    });
}

// 定点缩放
function zoomAt(x, y, factor) {
    const newScale = gameState.scale * factor;
    if (newScale < 0.1 || newScale > 4) return; // 限制缩放范围
    
    // 保持鼠标点不动缩放
    const scaleRatio = newScale / gameState.scale;
    gameState.offsetX = x - (x - gameState.offsetX) * scaleRatio;
    gameState.offsetY = y - (y - gameState.offsetY) * scaleRatio;
    gameState.scale = newScale;
    
    render();
}

// 检测悬停
function checkHover(e) {
    const rect = gameState.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - gameState.offsetX) / gameState.scale;
    const y = (e.clientY - rect.top - gameState.offsetY) / gameState.scale;
    
    let foundRegion = null;
    for (const [id, region] of Object.entries(WORLD_REGIONS)) {
        const loc = region.location;
        const dist = Math.sqrt(Math.pow(x - loc.x, 2) + Math.pow(y - loc.y, 2));
        if (dist <= loc.radius) {
            foundRegion = region;
            break;
        }
    }
    
    if (foundRegion) {
        document.getElementById('location-info').textContent = `发现区域：${foundRegion.name}`;
        gameState.canvas.style.cursor = 'pointer';
    } else {
        document.getElementById('location-info').textContent = '点击地图探索区域';
        gameState.canvas.style.cursor = 'default';
    }
}

// 处理点击
function handleClick(e) {
    if (gameState.isDragging) return; // 拖拽中不处理点击
    
    const rect = gameState.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - gameState.offsetX) / gameState.scale;
    const y = (e.clientY - rect.top - gameState.offsetY) / gameState.scale;
    
    for (const [id, region] of Object.entries(WORLD_REGIONS)) {
        const loc = region.location;
        const dist = Math.sqrt(Math.pow(x - loc.x, 2) + Math.pow(y - loc.y, 2));
        if (dist <= loc.radius) {
            showRegionInfo(id, region);
            return;
        }
    }
    
    // 点击空白关闭
    closeInfoPanel();
}

// 显示区域信息
function showRegionInfo(id, region) {
    gameState.selectedRegion = id;
    
    document.getElementById('region-name').textContent = region.name;
    let desc = region.description + `<br><br>`;
    desc += `<strong>阵营：</strong> <span style="color: ${getFactionColor(region.faction)}">${region.faction}</span><br>`;
    desc += `<strong>适合等级：</strong> ${region.level}`;
    document.getElementById('region-description').innerHTML = desc;
    
    const actionsContainer = document.getElementById('region-actions');
    actionsContainer.innerHTML = '';
    region.actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = 'action-btn';
        btn.textContent = action.text;
        btn.addEventListener('click', () => {
            handleRegionAction(action.action, id, region);
        });
        actionsContainer.appendChild(btn);
    });
    
    document.getElementById('info-panel').classList.remove('hidden');
}

// 关闭信息面板
function closeInfoPanel() {
    document.getElementById('info-panel').classList.add('hidden');
    gameState.selectedRegion = null;
}

// 处理区域动作
function handleRegionAction(action, regionId, region) {
    switch(action) {
        case 'enter':
            alert(`你进入了${region.name}，新的冒险等待着你！`);
            break;
        case 'quests':
            alert(`${region.name}的任务专员给了你新的任务！快去完成吧！`);
            break;
        case 'raid':
            alert(`你组建了冒险团队，准备挑战${region.name}的最终Boss！`);
            break;
        case 'profession':
            alert(`你在这里找到了专业训练师，技能等级提高了！`);
            break;
        default:
            console.log('Unknown action', action);
    }
}

// 页面加载完成初始化
window.addEventListener('DOMContentLoaded', initGame);
