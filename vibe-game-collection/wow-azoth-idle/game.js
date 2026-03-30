/**
 * 艾泽拉斯放置 - 魔兽世界风格放置RPG
 * 类似 Battle Without End (战斗无止境) 的玩法
 * Version: 1.0.0
 * Updated: 2026-03-30 12:08 (GMT+8)
 */

// ==================== 数据定义 ====================

// 怪物列表 - 魔兽世界常见怪物
const MONSTERS = [
    {
        name: "史莱姆",
        level: 1,
        hp: 30,
        attack: 5,
        exp: 10,
        gold: [2, 5],
        image: "https://picsum.photos/id/1025/200/200",
        zone: "新手区"
    },
    {
        name: "狼",
        level: 3,
        hp: 60,
        attack: 8,
        exp: 20,
        gold: [5, 12],
        image: "https://picsum.photos/id/582/200/200",
        zone: "艾尔文森林"
    },
    {
        name: "野猪人",
        level: 5,
        hp: 100,
        attack: 12,
        exp: 35,
        gold: [10, 20],
        image: "https://picsum.photos/id/1074/200/200",
        zone: "剃刀沼泽"
    },
    {
        name: "纳迦",
        level: 10,
        hp: 200,
        attack: 20,
        exp: 60,
        gold: [20, 40],
        image: "https://picsum.photos/id/1002/200/200",
        zone: "瓦斯琪尔"
    },
    {
        name: "兽人步兵",
        level: 15,
        hp: 350,
        attack: 32,
        exp: 100,
        gold: [35, 60],
        image: "https://picsum.photos/id/1033/200/200",
        zone: "杜隆塔尔"
    },
    {
        name: "食人魔",
        level: 20,
        hp: 500,
        attack: 45,
        exp: 150,
        gold: [50, 100],
        image: "https://picsum.photos/id/1024/200/200",
        zone: "诅咒之地"
    },
    {
        name: "萨特",
        level: 25,
        hp: 700,
        attack: 60,
        exp: 210,
        gold: [80, 150],
        image: "https://picsum.photos/id/1028/200/200",
        zone: "费伍德森林"
    },
    {
        name: "暮光龙人",
        level: 35,
        hp: 1200,
        attack: 85,
        exp: 300,
        gold: [120, 220],
        image: "https://picsum.photos/id/1040/200/200",
        zone: "暮光高地"
    },
    {
        name: "恶魔卫士",
        level: 45,
        hp: 2000,
        attack: 120,
        exp: 450,
        gold: [200, 350],
        image: "https://picsum.photos/id/1043/200/200",
        zone: "外域"
    },
    {
        name: "上古之神爪牙",
        level: 60,
        hp: 5000,
        attack: 200,
        exp: 1000,
        gold: [500, 1000],
        image: "https://picsum.photos/id/1059/200/200",
        zone: "希利苏斯"
    }
];

// 装备模板
const EQUIPMENT_TEMPLATES = {
    weapon: [
        { name: "破旧的匕首", slot: "weapon", quality: "poor", attack: 2, hp: 0 },
        { name: "钢铁长剑", slot: "weapon", quality: "common", attack: 5, hp: 0 },
        { name: "光芒利剑", slot: "weapon", quality: "uncommon", attack: 10, hp: 5 },
        { name: "血色十字军佩剑", slot: "weapon", quality: "rare", attack: 18, hp: 15 },
        { name: "阿什坎迪，兄弟会之剑", slot: "weapon", quality: "epic", attack: 35, hp: 30 },
        { name: "霜之哀伤", slot: "weapon", quality: "legendary", attack: 80, hp: 100 }
    ],
    head: [
        { name: "布甲头冠", slot: "head", quality: "common", attack: 1, hp: 5 },
        { name: "锁甲头盔", slot: "head", quality: "uncommon", attack: 2, hp: 12 },
        { name: "板甲头盔", slot: "head", quality: "rare", attack: 3, hp: 25 },
        { name: "毁灭王冠", slot: "head", quality: "epic", attack: 8, hp: 40 }
    ],
    neck: [
        { name: "粗项链", slot: "neck", quality: "common", attack: 1, hp: 3 },
        { name: "勇气项链", slot: "neck", quality: "uncommon", attack: 3, hp: 8 },
        { name: "流沙颈饰", slot: "neck", quality: "epic", attack: 6, hp: 20 }
    ],
    shoulder: [
        { name: "衬肩", slot: "shoulder", quality: "common", attack: 1, hp: 4 },
        { name: "T2肩甲", slot: "shoulder", quality: "rare", attack: 4, hp: 18 },
        { name: "T6肩甲", slot: "shoulder", quality: "epic", attack: 7, hp: 30 }
    ],
    chest: [
        { name: "布衣胸甲", slot: "chest", quality: "common", attack: 1, hp: 8 },
        { name: "锁甲胸甲", slot: "chest", quality: "uncommon", attack: 2, hp: 15 },
        { name: "板甲胸甲", slot: "chest", quality: "rare", attack: 4, hp: 30 },
        { name: "复活胸甲", slot: "chest", quality: "epic", attack: 8, hp: 50 }
    ],
    ring: [
        { name: "铜戒指", slot: "ring", quality: "common", attack: 1, hp: 2 },
        { name: "戒指", slot: "ring", quality: "uncommon", attack: 2, hp: 5 },
        { name: "硬化戒指", slot: "ring", quality: "rare", attack: 4, hp: 10 },
        { name: "纳鲁戒指", slot: "ring", quality: "epic", attack: 6, hp: 18 }
    ]
};

// 装备品质数据
const QUALITY_NAMES = {
    poor: "粗糙",
    common: "普通",
    uncommon: "优秀",
    rare: "稀有",
    epic: "史诗",
    legendary: "传说"
};

// ==================== 游戏状态 ====================

const game = {
    player: {
        name: "冒险者",
        level: 1,
        maxHp: 100,
        currentHp: 100,
        attack: 10,
        exp: 0,
        expToNext: 100,
        gold: 0,
        equipment: {
            head: null,
            neck: null,
            shoulder: null,
            chest: null,
            weapon: null,
            ring: null
        },
        inventory: []
    },
    currentEnemy: null,
    enemyCurrentHp: 0,
    autoBattle: true,
    lastAutoAttack: 0,
    autoAttackInterval: 1000 // 1秒一次自动攻击
};

// ==================== 游戏逻辑 ====================

// 初始化游戏
function initGame() {
    generateNewEnemy();
    updateUI();
    bindEvents();
    // 游戏循环
    requestAnimationFrame(gameLoop);
    loadGame();
}

// 游戏循环 - 处理自动战斗
function gameLoop(timestamp) {
    if (game.autoBattle && game.player.currentHp > 0 && game.currentEnemy) {
        if (timestamp - game.lastAutoAttack >= game.autoAttackInterval) {
            playerAttack();
            game.lastAutoAttack = timestamp;
        }
    }
    requestAnimationFrame(gameLoop);
}

// 生成新敌人
function generateNewEnemy() {
    // 根据玩家等级选择合适的敌人
    const playerLevel = game.player.level;
    let possibleMonsters = MONSTERS.filter(m => Math.abs(m.level - playerLevel) <= 10);
    if (possibleMonsters.length === 0) {
        possibleMonsters = MONSTERS;
    }
    
    const monster = possibleMonsters[Math.floor(Math.random() * possibleMonsters.length)];
    // 缩放属性
    const levelDiff = monster.level - playerLevel;
    const scaledHp = Math.floor(monster.hp * Math.pow(1.15, levelDiff));
    const scaledAttack = Math.floor(monster.attack * Math.pow(1.15, levelDiff));
    const scaledExp = Math.floor(monster.exp * Math.pow(1.1, levelDiff));
    
    game.currentEnemy = {
        ...monster,
        scaledHp,
        scaledAttack,
        scaledExp
    };
    game.enemyCurrentHp = scaledHp;
}

// 玩家攻击
function playerAttack() {
    if (!game.currentEnemy) return;
    if (game.player.currentHp <= 0) return;
    
    // 计算伤害
    const playerTotalAttack = getTotalAttack();
    const damage = Math.floor(playerTotalAttack * (0.9 + Math.random() * 0.2));
    
    game.enemyCurrentHp -= damage;
    addLog(`你攻击了${game.currentEnemy.name}，造成了<span class="log-damage">${damage}</span>点伤害`, "damage");
    
    if (game.enemyCurrentHp <= 0) {
        // 敌人死亡
        killEnemy();
    } else {
        // 敌人反击
        enemyAttack();
    }
    
    updateUI();
}

// 敌人攻击
function enemyAttack() {
    const damage = Math.floor(game.currentEnemy.scaledAttack * (0.9 + Math.random() * 0.2));
    game.player.currentHp = Math.max(0, game.player.currentHp - damage);
    addLog(`${game.currentEnemy.name}攻击了你，对你造成了<span class="log-damage">${damage}</span>点伤害`, "damage");
    
    if (game.player.currentHp <= 0) {
        addLog("你被打败了...回到复活点重新开始吧!", "damage");
        setTimeout(() => {
            playerRevive();
        }, 1000);
    }
}

// 击杀敌人
function killEnemy() {
    const exp = game.currentEnemy.scaledExp;
    const minGold = game.currentEnemy.gold[0];
    const maxGold = game.currentEnemy.gold[1];
    const gold = Math.floor((minGold + Math.random() * (maxGold - minGold)) * (1 + game.player.level * 0.05));
    
    game.player.gold += gold;
    addLog(`你击杀了${game.currentEnemy.name}，获得 <span class="log-exp">+${exp} 经验</span>，<span class="log-gold">+${gold} 金币</span>`);
    
    // 随机掉落装备
    if (Math.random() < 0.25) { // 25%掉率
        const item = generateRandomLoot();
        if (item) {
            addLog(`${game.currentEnemy.name}掉落了 <span class="${item.quality}">${item.name}</span>`);
            if (game.player.inventory.length < 20) {
                game.player.inventory.push(item);
            } else {
                addLog("你的背包已满，装备无法拾取");
            }
        }
    }
    
    // 给经验
    game.player.exp += exp;
    
    // 检查升级
    while (game.player.exp >= game.player.expToNext) {
        game.player.exp -= game.player.expToNext;
        levelUp();
    }
    
    // 生成新敌人
    generateNewEnemy();
    saveGame();
}

// 升级
function levelUp() {
    game.player.level++;
    game.player.maxHp += 20;
    game.player.attack += 5;
    game.player.expToNext = Math.floor(game.player.expToNext * 1.4);
    // 满血复活
    game.player.currentHp = game.player.maxHp;
    addLog(`恭喜升级! 现在是 ${game.player.level} 级，生命值和攻击提升了!`, "log-exp");
}

// 玩家复活
function playerRevive() {
    game.player.currentHp = game.player.maxHp;
    addLog("你在灵魂医者复活了，满血再战!", "log-heal");
    generateNewEnemy();
    updateUI();
}

// 生成随机掉落
function generateRandomLoot() {
    // 随机槽位
    const slots = Object.keys(EQUIPMENT_TEMPLATES);
    const slot = slots[Math.floor(Math.random() * slots.length)];
    const templates = EQUIPMENT_TEMPLATES[slot];
    
    // 根据玩家等级ROLL品质
    let roll = Math.random();
    let qualityIndex = 0;
    
    // 品质概率
    if (roll < 0.4) qualityIndex = 0; // 40% 低品质
    else if (roll < 0.7) qualityIndex = 1; // 30%
    else if (roll < 0.85) qualityIndex = 2; // 15%
    else if (roll < 0.95) qualityIndex = 3; // 10%
    else qualityIndex = 4 + Math.floor(Math.random() * 2); // 5% 紫/橙
    
    const template = templates[Math.min(qualityIndex, templates.length - 1)];
    
    // 根据等级缩放
    const levelBonus = Math.floor(game.player.level / 10);
    const attack = template.attack + levelBonus;
    const hp = template.hp + levelBonus * 5;
    
    return {
        ...template,
        attack,
        hp
    };
}

// 装备武器
function equipItem(itemIndex) {
    const item = game.player.inventory[itemIndex];
    if (!item) return;
    
    // 卸下当前装备到背包
    const current = game.player.equipment[item.slot];
    if (current) {
        game.player.inventory.push(current);
    }
    
    // 装备新装备，从背包移除
    game.player.equipment[item.slot] = item;
    game.player.inventory.splice(itemIndex, 1);
    
    updateUI();
    saveGame();
}

// 从背包移除物品（卖掉）
function sellItem(itemIndex) {
    const item = game.player.inventory[itemIndex];
    if (!item) return;
    
    // 卖价 = 品质系数 × (攻击 + 生命值/5)
    const qualityMultiplier = {
        poor: 1,
        common: 2,
        uncommon: 4,
        rare: 10,
        epic: 30,
        legendary: 100
    };
    const price = Math.floor((item.attack + item.hp / 5) * qualityMultiplier[item.quality]);
    game.player.gold += price;
    game.player.inventory.splice(itemIndex, 1);
    addLog(`卖掉了 ${item.name}，获得 ${price} 金币`, "log-gold");
    updateUI();
    saveGame();
}

// 手动升级属性
function upgradeAttack() {
    const cost = 10 * Math.pow(2, Math.floor(game.player.level / 5));
    if (game.player.gold >= cost) {
        game.player.gold -= cost;
        game.player.attack += 2;
        addLog(`攻击提升了 +2，花费了 ${cost} 金币`, "log-exp");
        updateUI();
        saveGame();
    }
}

function upgradeHp() {
    const cost = 10 * Math.pow(2, Math.floor(game.player.level / 5));
    if (game.player.gold >= cost) {
        game.player.gold -= cost;
        game.player.maxHp += 15;
        game.player.currentHp += 15;
        addLog(`生命值提升了 +15，花费了 ${cost} 金币`, "log-exp");
        updateUI();
        saveGame();
    }
}

// 计算总攻击力
function getTotalAttack() {
    let total = game.player.attack;
    Object.values(game.player.equipment).forEach(item => {
        if (item) total += item.attack;
    });
    return total;
}

// 计算总生命值
function getTotalHp() {
    let total = game.player.maxHp;
    Object.values(game.player.equipment).forEach(item => {
        if (item) total += item.hp;
    });
    return total;
}

// ==================== UI 更新 ====================

function updateUI() {
    // 玩家信息
    document.getElementById('player-level').textContent = game.player.level;
    document.getElementById('player-hp').textContent = Math.floor(game.player.currentHp);
    document.getElementById('player-maxhp').textContent = getTotalHp();
    document.getElementById('player-attack').textContent = getTotalAttack();
    document.getElementById('gold').textContent = game.player.gold;
    
    // 经验条
    const expPercent = (game.player.exp / game.player.expToNext) * 100;
    document.getElementById('exp-fill').style.width = expPercent + "%";
    document.getElementById('exp-text').textContent = `${game.player.exp}/${game.player.expToNext}`;
    
    // 敌人信息
    if (game.currentEnemy) {
        document.getElementById('enemy-name').textContent = game.currentEnemy.name;
        document.getElementById('enemy-level').textContent = game.currentEnemy.level;
        document.getElementById('enemy-hp').textContent = Math.floor(game.enemyCurrentHp);
        document.getElementById('enemy-maxhp').textContent = game.currentEnemy.scaledHp;
        document.getElementById('enemy-exp').textContent = game.currentEnemy.scaledExp;
        const enemyHpPercent = (game.enemyCurrentHp / game.currentEnemy.scaledHp) * 100;
        document.getElementById('enemy-hp-fill').style.width = enemyHpPercent + "%";
        if (game.currentEnemy.image) {
            document.getElementById('enemy-image').src = game.currentEnemy.image;
        }
    }
    
    // 更新装备槽
    Object.keys(game.player.equipment).forEach(slot => {
        const item = game.player.equipment[slot];
        const el = document.getElementById(`slot-${slot}`);
        el.innerHTML = "";
        el.className = "slot-item";
        if (item) {
            el.classList.add('has-item', `quality-${item.quality}`);
            el.textContent = item.name;
            el.addEventListener('click', () => {
                // 点击装备卸下到背包
                if (game.player.inventory.length < 20) {
                    game.player.inventory.push(item);
                    game.player.equipment[slot] = null;
                    updateUI();
                    saveGame();
                } else {
                    addLog("背包满了，无法卸下装备");
                }
            });
            el.addEventListener('mouseenter', (e) => showTooltip(e, item));
            el.addEventListener('mouseleave', hideTooltip);
        }
    });
    
    // 更新背包
    updateInventory();
    
    // 更新升级按钮状态
    const cost = 10 * Math.pow(2, Math.floor(game.player.level / 5));
    document.getElementById('upgrade-attack').disabled = game.player.gold < cost;
    document.getElementById('upgrade-hp').disabled = game.player.gold < cost;
}

function updateInventory() {
    const container = document.getElementById('inventory');
    container.innerHTML = "";
    document.getElementById('item-count').textContent = game.player.inventory.length;
    
    game.player.inventory.forEach((item, index) => {
        const slot = document.createElement('div');
        slot.className = `inventory-slot has-item quality-${item.quality}`;
        slot.innerHTML = `<div class="inventory-item-name ${item.quality}">${item.name}</div>`;
        
        slot.addEventListener('click', () => {
            if (confirm(`装备这件 ${item.name} 吗？(取消=卖掉)`)) {
                equipItem(index);
            } else {
                sellItem(index);
            }
        });
        slot.addEventListener('mouseenter', (e) => showTooltip(e, item));
        slot.addEventListener('mouseleave', hideTooltip);
        
        container.appendChild(slot);
    });
    
    // 填充空位
    const emptySlots = 20 - game.player.inventory.length;
    for (let i = 0; i < emptySlots; i++) {
        const slot = document.createElement('div');
        slot.className = "inventory-slot";
        container.appendChild(slot);
    }
}

function showTooltip(e, item) {
    const tooltip = document.getElementById('item-tooltip');
    let html = `<div class="tooltip-name ${item.quality}">${item.name}</div>`;
    html += `<div class="tooltip-stats">品质: ${QUALITY_NAMES[item.quality]}</div>`;
    if (item.attack > 0) html += `<div class="tooltip-stats">+${item.attack} 攻击力</div>`;
    if (item.hp > 0) html += `<div class="tooltip-stats">+${item.hp} 生命值</div>`;
    html += `<div class="tooltip-stats">部位: ${item.slot}</div>`;
    
    tooltip.innerHTML = html;
    tooltip.classList.remove('hidden');
    
    // 定位
    tooltip.style.left = (e.pageX + 10) + "px";
    tooltip.style.top = (e.pageY + 10) + "px";
}

function hideTooltip() {
    document.getElementById('item-tooltip').classList.add('hidden');
}

function addLog(text, className) {
    const logDiv = document.getElementById('battle-log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${className || ''}`;
    entry.innerHTML = text;
    logDiv.appendChild(entry);
    logDiv.scrollTop = logDiv.scrollHeight;
    
    // 保留最多50条日志
    const entries = logDiv.children;
    if (entries.length > 50) {
        entries[0].remove();
    }
}

// ==================== 事件绑定 ====================

function bindEvents() {
    document.getElementById('attack-btn').addEventListener('click', playerAttack);
    
    document.getElementById('upgrade-attack').addEventListener('click', upgradeAttack);
    document.getElementById('upgrade-hp').addEventListener('click', upgradeHp);
    
    document.getElementById('auto-battle').addEventListener('change', (e) => {
        game.autoBattle = e.target.checked;
    });
    
    // 提示框跟随鼠标
    document.addEventListener('mousemove', (e) => {
        const tooltip = document.getElementById('item-tooltip');
        if (!tooltip.classList.contains('hidden')) {
            tooltip.style.left = (e.pageX + 10) + "px";
            tooltip.style.top = (e.pageY + 10) + "px";
        }
    });
}

// ==================== 存储 ====================

function saveGame() {
    localStorage.setItem('wow-idle-game', JSON.stringify(game));
}

function loadGame() {
    const saved = localStorage.getItem('wow-idle-game');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            Object.assign(game, data);
            if (!game.autoAttackInterval) game.autoAttackInterval = 1000;
            updateUI();
            addLog("游戏进度已加载");
        } catch(e) {
            console.error("加载失败", e);
        }
    }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', initGame);
