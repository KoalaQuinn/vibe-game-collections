// 🎣 钓鱼场模拟经营 - 放置玩法
// 核心逻辑：解锁渔场 -> 雇员工人 -> 自动钓鱼 -> 出售赚钱 -> 升级

const game = {
    // 玩家数据
    money: 100, // 初始金币
    totalMoneyEarned: 0,
    totalFishCaught: 0,
    fishStock: {}, // {fishId: count}
    lastUpdate: Date.now(),

    // 渔场数据
    ponds: [
        {
            id: 'small-pond',
            name: '小池塘',
            level: 1,
            unlocked: true,
            baseCost: 0,
            upgradeCost: 50,
            fishPerMinute: 2, // 每分钟产出鱼基数
            fishTypes: {
                'small-fish': 70,
                'medium-fish': 25,
                'big-fish': 5
            }
        },
        {
            id: 'river',
            name: '小河',
            level: 0,
            unlocked: false,
            unlockCost: 200,
            upgradeCost: 150,
            fishPerMinute: 5,
            fishTypes: {
                'medium-fish': 50,
                'big-fish': 30,
                'large-fish': 15,
                'rare-fish': 5
            }
        },
        {
            id: 'lake',
            name: '大湖泊',
            level: 0,
            unlocked: false,
            unlockCost: 1000,
            upgradeCost: 500,
            fishPerMinute: 12,
            fishTypes: {
                'big-fish': 40,
                'large-fish': 35,
                'rare-fish': 20,
                'legendary-fish': 5
            }
        },
        {
            id: 'sea',
            name: '海边',
            level: 0,
            unlocked: false,
            unlockCost: 5000,
            upgradeCost: 2000,
            fishPerMinute: 30,
            fishTypes: {
                'large-fish': 30,
                'rare-fish': 40,
                'legendary-fish': 25,
                'king-fish': 5
            }
        }
    ],

    // 工人数据
    workers: [
        {
            id: 'apprentice',
            name: '学徒渔夫',
            level: 0,
            hireCost: 50,
            upgradeCost: 100,
            efficiency: 0.5, // 效率倍数
            canWork: true
        },
        {
            id: 'experienced',
            name: '老练渔夫',
            level: 0,
            hireCost: 300,
            upgradeCost: 500,
            efficiency: 1.2,
            canWork: false
        },
        {
            id: 'master',
            name: '钓鱼大师',
            level: 0,
            hireCost: 1500,
            upgradeCost: 2000,
            efficiency: 3.0,
            canWork: false
        },
        {
            id: 'fishing-boat',
            name: '渔船队',
            level: 0,
            hireCost: 8000,
            upgradeCost: 10000,
            efficiency: 10.0,
            canWork: false
        }
    ],

    // 全局升级
    upgrades: [
        {
            id: 'better-net',
            name: '更好的渔网',
            level: 0,
            maxLevel: 10,
            baseCost: 100,
            description: '所有渔场产量 +10%/级',
            multiplier: 1.1
        },
        {
            id: 'fish-bait',
            name: '高级鱼饵',
            level: 0,
            maxLevel: 10,
            baseCost: 200,
            description: '稀有鱼概率提高',
            rarityBonus: 0.05
        },
        {
            id: 'processing',
            name: '加工升级',
            level: 0,
            maxLevel: 10,
            baseCost: 500,
            description: '所有鱼售价 +15%/级',
            priceMultiplier: 1.15
        },
        {
            id: 'luck',
            name: '风水宝地',
            level: 0,
            maxLevel: 5,
            baseCost: 2000,
            description: '几率获得双倍鱼',
            doubleChance: 0.05
        }
    ],

    // 鱼价格表
    fishPrices: {
        'small-fish': {name: '小鱼', icon: '🐟', price: 2},
        'medium-fish': {name: '中等鱼', icon: '🐠', price: 10},
        'big-fish': {name: '大鱼', icon: '🐡', price: 30},
        'large-fish': {name: '超大鱼', icon: '🦈', price: 100},
        'rare-fish': {name: '稀有鱼', icon: '💎', price: 300},
        'legendary-fish': {name: '传说鱼', icon: '👑', price: 1000},
        'king-fish': {name: '鱼王', icon: '🐳', price: 5000}
    },

    // === 初始化 ===
    init: function() {
        this.load();
        this.lastUpdate = Date.now();
        this.renderAll();
        this.gameLoop();
    },

    // 游戏循环 - 离线收益计算
    gameLoop: function() {
        this.processOffline();
        this.renderAll();
        this.save();
        requestAnimationFrame(() => this.gameLoop());
    },

    // 处理离线时间
    processOffline: function() {
        const now = Date.now();
        const elapsedMs = now - this.lastUpdate;
        if (elapsedMs > 60000 * 60 * 24) {
            // 超过一天，只算一天
            this.afkIncome(60000 * 60 * 24);
        } else if (elapsedMs > 1000) {
            this.afkIncome(elapsedMs);
        }
        this.lastUpdate = now;
    },

    // 根据时间获得收益
    afkIncome: function(elapsedMs) {
        const minutes = elapsedMs / (1000 * 60);
        const totalFishPerMinute = this.getTotalFishPerMinute();

        // 计算总共产生多少鱼
        const totalFishToGenerate = totalFishPerMinute * minutes;
        const fullFish = Math.floor(totalFishToGenerate);
        const partialChance = totalFishToGenerate - fullFish;
        let fishToGenerate = fullFish;
        if (Math.random() < partialChance) {
            fishToGenerate++;
        }

        for (let i = 0; i < fishToGenerate; i++) {
            this.generateOneFish();
        }
    },

    // 生成一条鱼
    generateOneFish: function() {
        // 从所有解锁的渔场随机选一个，根据产量加权
        let totalWeight = 0;
        const possiblePonds = this.ponds.filter(p => p.unlocked);
        possiblePonds.forEach(p => {
            totalWeight += p.level * this.getPondFishPerMinute(p);
        });

        let rand = Math.random() * totalWeight;
        let selectedPond = null;
        for (const p of possiblePonds) {
            const weight = p.level * this.getPondFishPerMinute(p);
            rand -= weight;
            if (rand <= 0) {
                selectedPond = p;
                break;
            }
        }

        if (!selectedPond) selectedPond = possiblePonds[0];

        // 根据鱼权重随机鱼
        let fishType = this.rollFishType(selectedPond);
        if (!fishType) return;

        // 双倍概率
        const luckUpgrade = this.getUpgrade('luck');
        if (luckUpgrade && luckUpgrade.level > 0) {
            const doubleChance = luckUpgrade.level * 0.05;
            if (Math.random() < doubleChance) {
                // 双倍！
                this.addFish(fishType, 2);
                this.totalFishCaught += 2;
                return;
            }
        }

        this.addFish(fishType, 1);
        this.totalFishCaught++;
    },

    // 随机鱼
    rollFishType: function(pond) {
        let totalRate = 0;
        for (const [fishId, rate] of Object.entries(pond.fishTypes)) {
            totalRate += rate;
        }

        // 稀有度加成
        const baitUpgrade = this.getUpgrade('fish-bait');
        if (baitUpgrade && baitUpgrade.level > 0) {
            // 给稀有鱼加权重
            const bonus = baitUpgrade.level * 5;
            if (pond.fishTypes['rare-fish']) pond.fishTypes['rare-fish'] += bonus;
            if (pond.fishTypes['legendary-fish']) pond.fishTypes['legendary-fish'] += bonus;
            if (pond.fishTypes['king-fish']) pond.fishTypes['king-fish'] += bonus;
        }

        let rand = Math.random() * totalRate;
        for (const [fishId, rate] of Object.entries(pond.fishTypes)) {
            rand -= rate;
            if (rand <= 0) {
                return fishId;
            }
        }
        return Object.keys(pond.fishTypes)[0];
    },

    addFish: function(fishId, count) {
        if (!this.fishStock[fishId]) {
            this.fishStock[fishId] = 0;
        }
        this.fishStock[fishId] += count;
    },

    // 出售全部鱼
    sellAllFish: function() {
        let total = 0;
        const processingUpgrade = this.getUpgrade('processing');
        let priceMultiplier = 1;
        if (processingUpgrade) {
            priceMultiplier = Math.pow(1.15, processingUpgrade.level);
        }

        for (const [fishId, count] of Object.entries(this.fishStock)) {
            if (count > 0) {
                const fish = this.fishPrices[fishId];
                total += count * fish.price * priceMultiplier;
            }
        }

        if (total <= 0) {
            this.showToast('没有鱼可以出售！');
            return;
        }

        total = Math.floor(total);
        this.money += total;
        this.totalMoneyEarned += total;
        this.fishStock = {};
        this.save();
        this.renderAll();
        this.showToast(`出售成功！获得 ${total} 金币！`);
    },

    // 解锁渔场
    unlockPond: function(pondId) {
        const pond = this.ponds.find(p => p.id === pondId);
        if (this.money >= pond.unlockCost) {
            this.money -= pond.unlockCost;
            pond.unlocked = true;
            pond.level = 1;
            this.save();
            this.renderPonds();
            this.showToast(`解锁了 ${pond.name}！`);
        } else {
            this.showToast('金币不够');
        }
    },

    // 升级渔场
    upgradePond: function(pondId) {
        const pond = this.ponds.find(p => p.id === pondId);
        const cost = this.getPondUpgradeCost(pond);
        if (this.money >= cost) {
            this.money -= cost;
            pond.level++;
            this.save();
            this.renderPonds();
            this.showToast(`${pond.name} 升级到 Lv.${pond.level}！产量提高了！`);
        } else {
            this.showToast('金币不够');
        }
    },

    getPondUpgradeCost: function(pond) {
        return Math.floor(pond.upgradeCost * Math.pow(1.15, pond.level));
    },

    getPondFishPerMinute: function(pond) {
        let base = pond.fishPerMinute * pond.level;
        const netUpgrade = this.getUpgrade('better-net');
        if (netUpgrade && netUpgrade.level > 0) {
            base *= Math.pow(netUpgrade.multiplier, netUpgrade.level);
        }
        return base;
    },

    // 雇佣工人
    hireWorker: function(workerId) {
        const worker = this.workers.find(w => w.id === workerId);
        if (this.money >= worker.hireCost) {
            this.money -= worker.hireCost;
            worker.level = 1;
            worker.canWork = true;
            this.save();
            this.renderWorkers();
            this.showToast(`雇佣了 ${worker.name}！`);
        } else {
            this.showToast('金币不够');
        }
    },

    upgradeWorker: function(workerId) {
        const worker = this.workers.find(w => w.id === workerId);
        const cost = this.getWorkerUpgradeCost(worker);
        if (this.money >= cost) {
            this.money -= cost;
            worker.level++;
            worker.efficiency *= 1.2;
            this.save();
            this.renderWorkers();
            this.showToast(`${worker.name} 升级到 Lv.${worker.level}！效率提高了！`);
        } else {
            this.showToast('金币不够');
        }
    },

    getWorkerUpgradeCost: function(worker) {
        return Math.floor(worker.upgradeCost * Math.pow(1.3, worker.level));
    },

    // 升级全局
    buyUpgrade: function(upgradeId) {
        const upgrade = this.upgrades.find(u => u.id === upgradeId);
        if (upgrade.level >= upgrade.maxLevel) {
            this.showToast('已经满级了！');
            return;
        }
        const cost = this.getUpgradeCost(upgrade);
        if (this.money >= cost) {
            this.money -= cost;
            upgrade.level++;
            this.save();
            this.renderUpgrades();
            this.showToast(`升级了 ${upgrade.name} 到 Lv.${upgrade.level}！`);
        } else {
            this.showToast('金币不够');
        }
    },

    getUpgradeCost: function(upgrade) {
        return Math.floor(upgrade.baseCost * Math.pow(1.5, upgrade.level));
    },

    getUpgrade: function(id) {
        return this.upgrades.find(u => u.id === id);
    },

    // 计算总每分钟产量
    getTotalFishPerMinute: function() {
        let total = 0;
        const workerEfficiency = this.getTotalWorkerEfficiency();
        this.ponds.forEach(pond => {
            if (pond.unlocked) {
                total += this.getPondFishPerMinute(pond) * workerEfficiency;
            }
        });
        return total;
    },

    getTotalWorkerEfficiency: function() {
        let total = 1; // 基础产量
        this.workers.forEach(worker => {
            if (worker.canWork) {
                total += worker.efficiency * worker.level;
            }
        });
        return total;
    },

    getIncomePerSecond: function() {
        // 计算每秒金币收益期望
        const fishPerMinute = this.getTotalFishPerMinute();
        const fishPerSecond = fishPerMinute / 60;
        let expectedValue = 0;

        // 平均价值算一下
        this.ponds.filter(p => p.unlocked).forEach(pond => {
            let pondTotalRate = 0;
            let pondValue = 0;
            for (const [fishId, rate] of Object.entries(pond.fishTypes)) {
                pondTotalRate += rate;
                pondValue += rate * this.fishPrices[fishId].price;
            }
            expectedValue += (this.getPondFishPerMinute(pond) * pondValue / pondTotalRate);
        });

        return (expectedValue / 60) * this.getTotalWorkerEfficiency() * priceMultiplier;
    },

    // === 渲染 ===
    renderAll: function() {
        document.getElementById('money').textContent = Math.floor(this.money);
        const ips = this.getIncomePerSecond();
        document.getElementById('incomePerSecond').textContent = ips.toFixed(2);
        this.renderPonds();
        this.renderWorkers();
        this.renderUpgrades();
        this.renderFishStock();
        this.renderStats();
        this.updateSellButton();
    },

    renderPonds: function() {
        const container = document.getElementById('ponds-container');
        let html = '';
        this.ponds.forEach(pond => {
            if (!pond.unlocked) {
                html += `
                    <div class="pond-item">
                        <div class="pond-info">
                            <h4>${pond.name}</h4>
                            <p>解锁价格: ${pond.unlockCost} 金币</p>
                        </div>
                        <button class="upgrade-btn unlock-btn" onclick="game.unlockPond('${pond.id}')" ${this.money >= pond.unlockCost ? '' : 'disabled'}>解锁</button>
                    </div>
                `;
            } else {
                const cost = this.getPondUpgradeCost(pond);
                const fishPerMin = this.getPondFishPerMinute(pond).toFixed(1);
                html += `
                    <div class="pond-item unlocked">
                        <div class="pond-info">
                            <h4>${pond.name} Lv.${pond.level}</h4>
                            <p>每分钟产量: ${fishPerMin} 条鱼</p>
                        </div>
                        <button class="upgrade-btn" onclick="game.upgradePond('${pond.id}')" ${this.money >= cost ? '' : 'disabled'}>升级 ${cost} 金</button>
                    </div>
                `;
            }
        });
        container.innerHTML = html;
    },

    renderWorkers: function() {
        const container = document.getElementById('workers-container');
        let html = '';
        this.workers.forEach(worker => {
            if (!worker.canWork) {
                html += `
                    <div class="worker-item">
                        <div class="worker-info">
                            <h4>${worker.name}</h4>
                            <p class="worker-level">基础效率: ${worker.efficiency.toFixed(1)}x</p>
                        </div>
                        <button class="upgrade-btn unlock-btn" onclick="game.hireWorker('${worker.id}')" ${this.money >= worker.hireCost ? '' : 'disabled'}>雇佣 ${worker.hireCost} 金</button>
                    </div>
                `;
            } else {
                const cost = this.getWorkerUpgradeCost(worker);
                html += `
                    <div class="worker-item">
                        <div class="worker-info">
                            <h4>${worker.name} Lv.${worker.level}</h4>
                            <p class="worker-level">当前效率: ${(worker.efficiency * worker.level).toFixed(1)}x</p>
                        </div>
                        <button class="upgrade-btn" onclick="game.upgradeWorker('${worker.id}')" ${this.money >= cost ? '' : 'disabled'}>升级 ${cost} 金</button>
                    </div>
                `;
            }
        });
        container.innerHTML = html;
    },

    renderUpgrades: function() {
        const container = document.getElementById('upgrades-container');
        let html = '';
        this.upgrades.forEach(upgrade => {
            const cost = this.getUpgradeCost(upgrade);
            const isMax = upgrade.level >= upgrade.maxLevel;
            html += `
                <div class="pond-item">
                    <div class="pond-info">
                        <h4>${upgrade.name} Lv.${upgrade.level}/${upgrade.maxLevel}</h4>
                        <p>${upgrade.description}</p>
                    </div>
                    ${!isMax
                        ? `<button class="upgrade-btn unlock-btn" onclick="game.buyUpgrade('${upgrade.id}')" ${this.money >= cost ? '' : 'disabled'}>升级 ${cost} 金</button>`
                        : `<span style="color: #FFD700; font-weight: bold;">满级</span>`
                    }
                </div>
            `;
        });
        container.innerHTML = html;
    },

    renderFishStock: function() {
        const container = document.getElementById('fish-stock-list');
        let totalFish = 0;
        let html = '';
        for (const [fishId, count] of Object.entries(this.fishStock)) {
            if (count > 0) {
                const fish = this.fishPrices[fishId];
                totalFish += count;
                html += `
                    <div class="fish-stock-item">
                        ${fish.icon} ${fish.name} × ${count}
                    </div>
                `;
            }
        }
        if (totalFish === 0) {
            html = '<div style="opacity: 0.5; text-align: center; padding: 10px;">还没有钓到鱼...</div>';
        }
        container.innerHTML = html;
    },

    renderStats: function() {
        document.getElementById('stat-totalFish').textContent = this.totalFishCaught;
        document.getElementById('stat-totalMoney').textContent = Math.floor(this.totalMoneyEarned);
        const pondsUnlocked = this.ponds.filter(p => p.unlocked).length;
        document.getElementById('stat-pondsUnlocked').textContent = pondsUnlocked;
        const workersHired = this.workers.filter(w => w.canWork).length;
        document.getElementById('stat-workersHired').textContent = workersHired;
    },

    updateSellButton: function() {
        let hasFish = false;
        for (const count of Object.values(this.fishStock)) {
            if (count > 0) hasFish = true;
        }
        document.getElementById('sell-all-btn').disabled = !hasFish;
    },

    // === 存档 ===
    save: function() {
        const data = {
            money: this.money,
            totalMoneyEarned: this.totalMoneyEarned,
            totalFishCaught: this.totalFishCaught,
            fishStock: this.fishStock,
            ponds: this.ponds.map(p => ({id: p.id, level: p.level, unlocked: p.unlocked})),
            workers: this.workers.map(w => ({id: w.id, level: w.level, canWork: w.canWork)),
            upgrades: this.upgrades.map(u => ({id: u.id, level: u.level))
        };
        localStorage.setItem('fishing-idle', JSON.stringify(data));
    },

    // 读档
    load: function() {
        const save = localStorage.getItem('fishing-idle');
        if (save) {
            const data = JSON.parse(save);
            this.money = data.money || 100;
            this.totalMoneyEarned = data.totalMoneyEarned || 0;
            this.totalFishCaught = data.totalFishCaught || 0;
            this.fishStock = data.fishStock || {};
            if (data.ponds) {
                data.ponds.forEach(sp => {
                    const p = this.ponds.find(p => p.id === sp.id);
                    if (p) {
                        p.level = sp.level;
                        p.unlocked = sp.unlocked;
                    }
                });
            }
            if (data.workers) {
                data.workers.forEach(sw => {
                    const w = this.workers.find(w => w.id === sw.id);
                    if (w) {
                        w.level = sw.level;
                        w.canWork = sw.canWork;
                    }
                });
            }
            if (data.upgrades) {
                data.upgrades.forEach(su => {
                    const u = this.upgrades.find(u => u.id === su.id);
                    if (u) {
                        u.level = su.level;
                    }
                });
            }
        }
    },
};

// 标签页切换
function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`.tab-content[id="${tabId}"]`).classList.add('active');
    event.target.classList.add('active');
}

// 出售鱼暴露给全局
function sellAllFish() {
    game.sellAllFish();
}
