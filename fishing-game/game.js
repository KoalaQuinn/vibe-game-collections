// 🎣 即时钓鱼游戏 - 核心逻辑
// 设计：长按蓄力抛竿 → 即时拉杆 → 收集成长

const game = {
    // === 画布尺寸 ===
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,

    // === 游戏状态 ===
    state: 'idle', // idle:空闲 / charging:蓄力中 / casting:抛竿中 / waiting:等待咬钩 / reeling:拉杆中
    power: 0,
    powerDirection: 1, // 1增 -1减
    powerInterval: null,

    // === 浮漂状态 ===
    floatX: 0,
    floatY: 0,
    floatVelocity: 0,
    biteTimer: 0,
    biteReady: false,

    // === 玩家数据 ===
    gold: 0,
    rodLevel: 1,
    currentLocationId: 'pond',
    currentBaitId: 'worm',
    fishCaught: {}, // {fishId: {count: n, maxWeight: w}}

    // === 定义数据 ===
    // 钓点
    locations: [
        {
            id: 'pond',
            name: '池塘',
            description: '乡间小池塘，杂鱼多',
            unlockCost: 0,
            unlocked: true,
            fishRate: {common: 70, rare: 25, epic: 4, legendary: 1}
        },
        {
            id: 'river',
            name: '河流',
            description: '水流湍急，大鱼多',
            unlockCost: 1000,
            unlocked: false,
            fishRate: {common: 50, rare: 40, epic: 9, legendary: 1}
        },
        {
            id: 'lake',
            name: '湖泊',
            description: '开阔平静，藏龙卧虎',
            unlockCost: 5000,
            unlocked: false,
            fishRate: {common: 30, rare: 50, epic: 15, legendary: 5}
        },
        {
            id: 'sea',
            name: '大海',
            description: '无边无际，传说之地',
            unlockCost: 20000,
            unlocked: false,
            fishRate: {common: 20, rare: 40, epic: 30, legendary: 10}
        }
    ],

    // 鱼饵
    baits: [
        {
            id: 'worm',
            name: '蚯蚓',
            description: '万能饵，通用',
            price: 5,
            count: 10,
            bonus: {}
        },
        {
            id: 'corn',
            name: '玉米',
            description: '吸引大鱼',
            price: 10,
            count: 0,
            bonus: {'common': 0, 'rare': 10}
        },
        {
            id: 'lure',
            name: '拟饵',
            description: '吸引掠食鱼',
            price: 20,
            count: 0,
            bonus: {'rare': 10, 'epic': 5}
        },
        {
            id: 'shrimp',
            name: '鲜虾',
            description: '海鱼最爱',
            price: 30,
            count: 0,
            bonus: {'epic': 10, 'legendary': 5}
        }
    ],

    // 鱼类数据
    fishData: [
        {id: 'crucian', name: '鲫鱼', icon: '🐟', minWeight: 100, maxWeight: 500, rarity: 'common', pricePer100g: 2, location: 'pond', difficulty: 1},
        {id: 'carp', name: '鲤鱼', icon: '🐠', minWeight: 300, maxWeight: 1000, rarity: 'rare', pricePer100g: 4, location: 'pond', difficulty: 2},
        {id: 'catfish', name: '鲶鱼', icon: '🐡', minWeight: 500, maxWeight: 2000, rarity: 'rare', pricePer100g: 6, location: 'river', difficulty: 3},
        {id: 'grasscarp', name: '草鱼', icon: '🐟', minWeight: 400, maxWeight: 1500, rarity: 'rare', pricePer100g: 5, location: 'river', difficulty: 2},
        {id: 'blackcarp', name: '青鱼', icon: '🐟', minWeight: 800, maxWeight: 3000, rarity: 'epic', pricePer100g: 8, location: 'lake', difficulty: 4},
        {id: 'salmon', name: '三文鱼', icon: '🐟', minWeight: 2000, maxWeight: 5000, rarity: 'epic', pricePer100g: 12, location: 'sea', difficulty: 5},
        {id: 'tuna', name: '金枪鱼', icon: '🐟', minWeight: 5000, maxWeight: 15000, rarity: 'legendary', pricePer100g: 20, location: 'sea', difficulty: 8},
        {id: 'whale', name: '小鲸鱼', icon: '🐳', minWeight: 20000, maxWeight: 50000, rarity: 'legendary', pricePer100g: 30, location: 'sea', difficulty: 10},
        {id: 'pike', name: '狗鱼', icon: '🦈', minWeight: 1000, maxWeight: 4000, rarity: 'epic', pricePer100g: 10, location: 'lake', difficulty: 5},
        {id: 'eel', name: '鳗鱼', icon: '🐍', minWeight: 300, maxWeight: 1000, rarity: 'rare', pricePer100g: 7, location: 'river', difficulty: 3},
        {id: 'tilapia', name: '罗非鱼', icon: '🐟', minWeight: 200, maxWeight: 600, rarity: 'common', pricePer100g: 3, location: 'pond', difficulty: 1},
        {id: 'snakehead', name: '黑鱼', icon: '🐍', minWeight: 400, maxWeight: 1500, rarity: 'rare', pricePer100g: 6, location: 'pond', difficulty: 2},
        {id: 'bass', name: '鲈鱼', icon: '🐟', minWeight: 500, maxWeight: 2000, rarity: 'epic', pricePer100g: 9, location: 'river', difficulty: 4},
        {id: 'crab', name: '螃蟹', icon: '🦀', minWeight: 100, maxWeight: 300, rarity: 'common', pricePer100g: 5, location: 'pond', difficulty: 1},
        {id: 'lobster', name: '龙虾', icon: '🦞', minWeight: 300, maxWeight: 800, rarity: 'epic', pricePer100g: 15, location: 'sea', difficulty: 4},
    ],

    // 特殊收获（非鱼）
    specialLoot: [
        {id: 'box', name: '木箱', icon: '📦', minGold: 50, maxGold: 200, rarity: 'common'},
        {id: 'chest', name: '宝箱', icon: '💎', minGold: 200, maxGold: 1000, rarity: 'rare'},
        {id: 'boot', name: '旧靴子', icon: '🥾', minGold: 1, maxGold: 10, rarity: 'common'},
        {id: 'bottle', name: '漂流瓶', icon: '🍶', minGold: 30, maxGold: 100, rarity: 'rare'},
        {id: 'monster', name: '水怪', icon: '👹', minGold: 1000, maxGold: 3000, rarity: 'epic'},
    ],

    // 鱼竿等级
    rodLevels: [
        {level: 1, name: '竹竿', power: 5000, hitChance: 0.8},
        {level: 2, name: '玻璃钢竿', power: 10000, hitChance: 0.85},
        {level: 3, name: '碳素竿', power: 30000, hitChance: 0.9},
        {level: 4, name: '神器钓竿', power: 100000, hitChance: 0.95},
    ],

    // === 初始化 ===
    init: function() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.load();
        this.renderLocations();
        this.renderBaits();
        this.renderBook();
        this.renderSettings();
        this.updateUI();
        this.draw();

        // 绑定长按事件
        const btn = document.getElementById('actionBtn');
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startCharging();
        }, {passive: false});
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.endCharging();
        }, {passive: false});
        btn.addEventListener('mousedown', (e) => this.startCharging());
        btn.addEventListener('mouseup', (e) => this.endCharging());
        btn.addEventListener('mouseleave', (e) => this.endCharging());

        // 点击拉杆
        this.canvas.addEventListener('click', (e) => {
            if (this.state === 'waiting' && this.biteReady) {
                this.tryReel();
            }
        });
    },

    resizeCanvas: function() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.draw();
    },

    // === 存档 ===
    save: function() {
        const data = {
            gold: this.gold,
            rodLevel: this.rodLevel,
            currentLocationId: this.currentLocationId,
            currentBaitId: this.currentBaitId,
            fishCaught: this.fishCaught,
            baits: this.baits.map(b => ({id: b.id, count: b.count})),
            locations: this.locations.map(l => ({id: l.id, unlocked: l.unlocked})),
        };
        localStorage.setItem('fishing-game', JSON.stringify(data));
    },

    load: function() {
        const save = localStorage.getItem('fishing-game');
        if (save) {
            const data = JSON.parse(save);
            this.gold = data.gold || 0;
            this.rodLevel = data.rodLevel || 1;
            this.currentLocationId = data.currentLocationId || 'pond';
            this.currentBaitId = data.currentBaitId || 'worm';
            this.fishCaught = data.fishCaught || {};
            if (data.baits) {
                data.baits.forEach(sb => {
                    const b = this.baits.find(b => b.id === sb.id);
                    if (b) b.count = sb.count;
                });
            }
            if (data.locations) {
                data.locations.forEach(sl => {
                    const l = this.locations.find(l => l.id === sl.id);
                    if (l) l.unlocked = sl.unlocked;
                });
            }
        }
    },

    resetGame: function() {
        if (confirm('确定要重置游戏吗？所有进度都会丢失。')) {
            localStorage.removeItem('fishing-game');
            location.reload();
        }
    },

    // === 蓄力阶段 ===
    startCharging: function() {
        if (this.state !== 'idle') return;
        // 检查鱼饵数量
        const bait = this.getCurrentBait();
        if (bait.count <= 0) {
            this.showToast('鱼饵用完了，先买点鱼饵！');
            return;
        }
        this.state = 'charging';
        this.power = 0;
        this.powerDirection = 1;
        document.getElementById('actionBtn').textContent = '松开抛竿';
        this.powerInterval = setInterval(() => this.updatePower(), 30);
    },

    updatePower: function() {
        this.power += 2 * this.powerDirection;
        if (this.power >= 100) {
            this.power = 100;
            this.powerDirection = -1;
        } else if (this.power <= 0) {
            this.power = 0;
            this.powerDirection = 1;
        }
        document.getElementById('powerBar').style.width = this.power + '%';
        document.getElementById('powerText').textContent = Math.round(this.power) + '%';
    },

    endCharging: function() {
        if (this.state !== 'charging') return;
        clearInterval(this.powerInterval);
        this.startCast();
    },

    // === 抛竿动画 ===
    startCast: function() {
        // 消耗鱼饵
        const bait = this.getCurrentBait();
        bait.count--;
        this.save();
        this.updateUI();

        this.state = 'casting';
        document.getElementById('actionBtn').disabled = true;
        document.getElementById('actionBtn').textContent = '抛竿中...';

        // 计算浮漂终点：根据力度决定距离岸边多远
        const startX = this.width * 0.2;
        const endX = this.width * 0.2 + (this.width * 0.6 * (this.power / 100));
        const startY = this.height * 0.1;
        this.floatY = this.height * 0.3;
        const steps = 30;
        let step = 0;

        const animate = () => {
            step++;
            this.floatX = startX + (endX - startX) * (step / steps);
            this.floatY = startY + (this.height * 0.3 - startY) * Math.pow(step / steps, 2);
            this.draw();
            if (step >= steps) {
                this.startWaiting();
                return;
            }
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    },

    // === 等待咬钩 ===
    startWaiting: function() {
        this.state = 'waiting';
        this.biteReady = false;
        document.getElementById('actionBtn').textContent = '等待咬钩...';

        // 随机等待几秒后咬钩
        const waitTime = 1000 + Math.random() * 4000;
        setTimeout(() => {
            if (this.state === 'waiting') {
                this.startBite();
            }
        }, waitTime);
    },

    startBite: function() {
        this.biteReady = true;
        // 震动手机
        if (navigator.vibrate) {
            navigator.vibrate([10, 30, 10]);
        }
        let bobCount = 0;
        // 浮漂晃动动画
        const bobInterval = setInterval(() => {
            if (this.state !== 'waiting') {
                clearInterval(bobInterval);
                return;
            }
            this.floatVelocity = (Math.random() - 0.5) * 4;
            // 3秒后如果还没拉杆，鱼逃走
            bobCount++;
            if (bobCount > 90) { // 3s at 30fps
                clearInterval(bobInterval);
                if (this.state === 'waiting') {
                    this.showToast('鱼逃走了...');
                    this.resetToIdle();
                }
            }
        }, 33);
        this.biteStartTime = Date.now();
    },

    // === 拉杆 ===
    tryReel: function() {
        if (!this.biteReady) {
            this.showToast('还没咬钩呢！');
            return;
        }
        // 计算是否成功
        const fish = this.rollFish();
        const rod = this.getCurrentRod();
        const difficulty = fish.difficulty || 1;
        const baseChance = rod.hitChance;
        // 反应窗口：咬钩后 0~800ms 内拉杆成功率高
        const now = Date.now();
        const delay = now - this.biteStartTime;
        let success = false;

        if (delay < 300) {
            // 完美时机！必定成功
            success = true;
        } else if (delay < 800) {
            success = Math.random() < baseChance;
        } else {
            // 太晚了，成功率减半
            success = Math.random() < baseChance * 0.5;
        }

        if (success) {
            if (fish.special) {
                this.catchSpecial(fish);
            } else {
                this.catchFish(fish);
            }
        } else {
            this.showToast(`${fish.name}挣脱了鱼钩...`);
            this.resetToIdle();
        }
    },

    // === 鱼生成 ===
    rollFish: function() {
        // 5%概率特殊收获
        if (Math.random() < 0.05) {
            const special = this.rollSpecial();
            return {special: true, ...special};
        }

        const location = this.getCurrentLocation();
        // 按稀有度roll
        const rand = Math.random() * 100;
        let rarityRolled;
        if (rand < location.fishRate.common) {
            rarityRolled = 'common';
        } else if (rand < location.fishRate.common + location.fishRate.rare) {
            rarityRolled = 'rare';
        } else if (rand < location.fishRate.common + location.fishRate.rare + location.fishRate.epic) {
            rarityRolled = 'epic';
        } else {
            rarityRolled = 'legendary';
        }

        // 鱼饵加成
        const bait = this.getCurrentBait();
        if (bait.bonus && bait.bonus[rarityRolled]) {
            if (Math.random() * 100 < bait.bonus[rarityRolled]) {
                // 重新roll更高一级
                if (rarityRolled === 'common') rarityRolled = 'rare';
                else if (rarityRolled === 'rare') rarityRolled = 'epic';
                else if (rarityRolled === 'epic') rarityRolled = 'legendary';
            }
        }

        // 筛选当前钓点对应稀有度的鱼
        let available = this.fishData.filter(f =>
            f.location === location.id && f.rarity === rarityRolled
        );
        if (available.length === 0) {
            available = this.fishData.filter(f => f.location === location.id);
        }
        const fish = available[Math.floor(Math.random() * available.length)];
        return {special: false, ...fish};
    },

    rollSpecial: function() {
        // 按稀有roll
        const weights = {common: 60, rare: 30, epic: 10};
        const rand = Math.random() * 100;
        let rarity;
        if (rand < weights.common) {
            rarity = 'common';
        } else if (rand < weights.common + weights.rare) {
            rarity = 'rare';
        } else {
            rarity = 'epic';
        }
        const available = this.specialLoot.filter(s => s.rarity === rarity);
        return available[Math.floor(Math.random() * available.length)];
    },

    catchSpecial: function(special) {
        const gold = Math.floor(special.minGold + Math.random() * (special.maxGold - special.minGold));
        this.gold += gold;
        this.save();
        this.updateUI();

        let html = `
            <div style="font-size: 48px;">${special.icon}</div>
            <p style="font-size: 20px; margin: 10px 0;">你钓到了 ${special.name}！</p>
            <p>获得 ${gold} 金币</p>
        `;
        this.showResultModal('收获！', html);
        this.resetToIdle();
    },

    catchFish: function(fish) {
        const weight = Math.floor(fish.minWeight + Math.random() * (fish.maxWeight - fish.minWeight));
        const rod = this.getCurrentRod();
        // 检查鱼竿能不能hold住
        if (weight > rod.power) {
            this.showToast(`太大了！鱼竿断了，${fish.name}跑了...`);
            // 鱼竿降级？不，只是跑掉，不减级
            this.resetToIdle();
            return;
        }

        // 计算价格
        const price = Math.floor((weight / 100) * fish.pricePer100g);
        this.gold += price;

        // 记录到图鉴
        if (!this.fishCaught[fish.id]) {
            this.fishCaught[fish.id] = {count: 0, maxWeight: 0};
        }
        this.fishCaught[fish.id].count++;
        if (weight > this.fishCaught[fish.id].maxWeight) {
            this.fishCaught[fish.id].maxWeight = weight;
        }

        this.save();
        this.updateUI();
        this.renderBook();

        const rarityText = {
            common: '普通', rare: '稀有', epic: '史诗', legendary: 'legendary'
        };
        let html = `
            <div style="font-size: 48px;">${fish.icon}</div>
            <p style="font-size: 22px; margin: 10px 0 0;">${fish.name} <span class="rarity-tag ${fish.rarity}">${rarityText[fish.rarity]}</span></p>
            <p>重量: ${(weight / 1000).toFixed(2)} kg</p>
            <p>卖价: ${price} 金币</p>
        `;
        if (!this.fishCaught[fish.id].count || this.fishCaught[fish.id].count === 1) {
            html += `<p style="color: #FF5722; font-weight: bold;">首次钓到！</p>`;
        }
        this.showResultModal('钓到了！', html);
        this.resetToIdle();
    },

    resetToIdle: function() {
        this.state = 'idle';
        this.power = 0;
        document.getElementById('powerBar').style.width = '0%';
        document.getElementById('powerText').textContent = '0%';
        document.getElementById('actionBtn').disabled = false;
        document.getElementById('actionBtn').textContent = '长按抛竿';
        this.draw();
        this.updateUI();
    },

    // === 绘制 Canvas ===
    draw: function() {
        if (!this.ctx) return;
        const w = this.width;
        const h = this.height;

        // 清空
        const gradient = this.ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#4FC3F7');
        gradient.addColorStop(1, '#0277BD');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, w, h);

        // 画水波纹
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const y = h * 0.2 + i * 30;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            for (let x = 0; x < w; x += 10) {
                this.ctx.lineTo(x, y + Math.sin((x + Date.now() * 0.001 + i * 10) * 0.05) * 5);
            }
            this.ctx.stroke();
        }

        // 画鱼竿
        this.ctx.fillStyle = '#8D6E63';
        this.ctx.fillRect(0, h * 0.8, w * 0.25, 10);
        // 鱼竿弯度根据蓄力
        const bend = this.state === 'charging' ? (this.power / 100) * 20 : 5;
        this.ctx.beginPath();
        this.ctx.moveTo(w * 0.25, h * 0.8 + 5);
        this.ctx.quadraticCurveTo(
            this.floatX / 2, h * 0.8 + bend,
            this.floatX, this.floatY - 20
        );
        this.ctx.strokeStyle = '#5D4037';
        this.ctx.lineWidth = 6;
        this.ctx.stroke();

        // 画鱼线
        this.ctx.beginPath();
        this.ctx.moveTo(w * 0.25, h * 0.8 + 5);
        this.ctx.lineTo(this.floatX, this.floatY - 10);
        this.ctx.strokeStyle = '#AAAAAA';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // 画浮漂
        const bobSize = this.biteReady ? 12 : 10;
        this.ctx.fillStyle = '#FF5722';
        this.ctx.beginPath();
        this.ctx.arc(this.floatX, this.floatY + this.floatVelocity, bobSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(this.floatX, this.floatY + this.floatVelocity, bobSize * 0.6, 0, Math.PI * 2);
        this.ctx.fill();

        // 如果准备咬钩，浮漂变红提示
        if (this.biteReady) {
            this.ctx.strokeStyle = '#FF0000';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(this.floatX, this.floatY + this.floatVelocity, bobSize + 5, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        requestAnimationFrame(() => this.draw());
    },

    // === UI 更新 ===
    updateUI: function() {
        document.getElementById('goldText').textContent = this.gold;
        const rod = this.getCurrentRod();
        document.getElementById('rodInfo').textContent = `${rod.name} Lv.${this.rodLevel}`;
        const bait = this.getCurrentBait();
        document.getElementById('baitInfo').textContent = `${bait.name} (${bait.count}个)`;
        const loc = this.getCurrentLocation();
        document.getElementById('currentLocation').textContent = loc.name;
    },

    // === 标签页切换 ===
    switchTab: function(tabId) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector(`.tab[onclick*="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
    },

    // === 钓点渲染 ===
    renderLocations: function() {
        const container = document.getElementById('locations');
        let html = '';
        this.locations.forEach(loc => {
            const isActive = loc.id === this.currentLocationId;
            html += `
                <div class="location-item ${isActive ? 'location-active' : ''}">
                    <div class="location-info">
                        <div class="location-name">${loc.name}</div>
                        <div class="location-desc">${loc.description}</div>
                    </div>
                    ${!loc.unlocked
                        ? `<button class="location-unlock" onclick="game.unlockLocation('${loc.id}')" ${this.gold >= loc.unlockCost ? '' : 'disabled'}>解锁 ${loc.unlockCost} 金</button>`
                        : isActive
                            ? `<span style="color: #FF5722; font-weight: bold;">当前</span>`
                            : `<button class="location-unlock" style="background: #4CAF50;" onclick="game.switchLocation('${loc.id}')">切换</button>`
                    }
                </div>
            `;
        });
        container.innerHTML = html;
    },

    switchLocation: function(id) {
        this.currentLocationId = id;
        this.save();
        this.renderLocations();
        this.updateUI();
    },

    unlockLocation: function(id) {
        const loc = this.locations.find(l => l.id === id);
        if (this.gold >= loc.unlockCost) {
            this.gold -= loc.unlockCost;
            loc.unlocked = true;
            this.currentLocationId = id;
            this.save();
            this.renderLocations();
            this.updateUI();
            this.showToast(`解锁了 ${loc.name}！`);
        } else {
            this.showToast('金币不够');
        }
    },

    // === 鱼饵渲染 ===
    renderBaits: function() {
        const container = document.getElementById('baits');
        let html = '';
        this.baits.forEach(bait => {
            const isActive = bait.id === this.currentBaitId;
            html += `
                <div class="bait-item ${isActive ? 'active' : ''}" onclick="game.selectBait('${bait.id}')">
                    <div class="bait-name">${bait.name}</div>
                    <div class="bait-desc">${bait.description} | 剩余: ${bait.count}</div>
                </div>
            `;
        });
        html += `
            <div style="margin-top: 10px; text-align: center;">
                <button onclick="game.buyBait()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer;">购买 10个 当前鱼饵 × ${this.getCurrentBait().price} 金</button>
            </div>
        `;
        container.innerHTML = html;
    },

    selectBait: function(id) {
        this.currentBaitId = id;
        this.save();
        this.renderBaits();
        this.updateUI();
    },

    buyBait: function() {
        const bait = this.getCurrentBait();
        const cost = bait.price * 10;
        if (this.gold >= cost) {
            this.gold -= cost;
            bait.count += 10;
            this.save();
            this.renderBaits();
            this.updateUI();
            this.showToast(`购买了 10个 ${bait.name}！`);
        } else {
            this.showToast('金币不够');
        }
    },

    // === 图鉴渲染 ===
    renderBook: function() {
        const container = document.getElementById('book');
        // 按位置分组
        const groups = {
            pond: [], river: [], lake: [], sea: []
        };
        this.fishData.forEach(fish => {
            groups[fish.location].push(fish);
        });
        let html = '';
        Object.keys(groups).forEach(locId => {
            const loc = this.locations.find(l => l.id === locId);
            if (!loc.unlocked) return;
            html += `<h4 style="margin: 10px 0 5px; color: #333;">${loc.name}</h4>`;
            html += `<div class="fish-list">`;
            groups[locId].forEach(fish => {
                const caught = this.fishCaught[fish.id];
                const className = caught ? 'fish-item caught' : 'fish-item';
                let info = caught ? `最大: ${(this.fishCaught[fish.id].maxWeight / 1000).toFixed(2)} kg` : '未钓到';
                html += `
                    <div class="${className}">
                        <div class="fish-name">
                            ${fish.icon} ${fish.name}
                            <span class="fish-rarity-${fish.rarity}">●</span>
                        </div>
                        <div class="fish-max">${info}</div>
                    </div>
                `;
            });
            html += `</div>`;
        });
        const total = this.fishData.length;
        const caughtCount = Object.keys(this.fishCaught).length;
        html += `<div style="margin-top: 10px; text-align: center; color: #666;">收集进度: ${caughtCount} / ${total}</div>`;
        container.innerHTML = html;
    },

    // === 设置渲染 ===
    renderSettings: function() {
        const container = document.getElementById('settings');
        container.innerHTML = `
            <div class="settings-container">
                <p>版本: v1.0.0 (2026-03-20)</p>
                <p>即时操作钓鱼游戏，长按抛竿，抓时机拉杆。</p>
                <button class="reset-btn" onclick="game.resetGame()">重置游戏</button>
            </div>
        `;
    },

    // === 弹窗 ===
    showResultModal: function(title, content) {
        document.getElementById('resultTitle').text