// 武侠放置游戏 - 纯JavaScript网页版

const game = {
    // 玩家数据
    player: {
        level: 1,
        xiuwei: 0,
        expToNext: 100,
        currentHp: 100,
        maxHp: 100,
        currentQi: 100,
        maxQi: 100,
        baseAttack: 10,
        baseDefense: 5,
        wuxing: 10,
    },
    // 装备的武学: 只能装备一个内功一个外功一个轻功
    equippedSkills: {
        inner: null,
        outer: null,
        light: null,
    },
    meridians: {}, // 经脉: key -> bool 是否打通
    skills: {},    // 技能: key -> {level: 0}
    inventory: {}, // 物品: key -> count
    adventure: {
        currentArea: null,
        isAdventuring: false,
        lastCheckTime: Date.now(),
        // 当前战斗
        currentEnemy: null,
        // 寻怪倒计时
        searchTimer: 0,
        searching: false,
    },
    // 离线修炼积累池
    offlineAccumulation: {
        accumulatedXiuwei: 0,
        lastOfflineUpdate: Date.now(),
        maxAccumulateHours: 24, // 最多积累24小时
    },
    lastSaveTime: Date.now(),

    // 数据定义
    definitions: {
        meridians: [
            {name: "丹田初开", desc: "打开丹田气海", baseCost: 100, costMult: 1.5, position: {x: 0, y: 0}, connectTo: null, bonus: {type: "maxQi", value: 20}},
            {name: "手太阴肺经", desc: "增加气血上限", baseCost: 100, costMult: 1.5, position: {x: -80, y: -40}, connectTo: "丹田初开", bonus: {type: "maxHp", value: 20}},
            {name: "手阳明大肠经", desc: "提升攻击力", baseCost: 150, costMult: 1.5, position: {x: -40, y: -80}, connectTo: "丹田初开", bonus: {type: "attack", value: 2}},
            {name: "足阳明胃经", desc: "提升防御力", baseCost: 150, costMult: 1.5, position: {x: 40, y: -80}, connectTo: "丹田初开", bonus: {type: "defense", value: 2}},
            {name: "足太阴脾经", desc: "增加悟性", baseCost: 250, costMult: 1.5, position: {x: 80, y: -40}, connectTo: "丹田初开", bonus: {type: "wuxing", value: 1}},
            {name: "手少阴心经", desc: "增加内力上限", baseCost: 300, costMult: 1.5, position: {x: -80, y: 40}, connectTo: "丹田初开", bonus: {type: "maxQi", value: 40}},
            {name: "手太阳小肠经", desc: "提升攻击力", baseCost: 400, costMult: 1.5, position: {x: -40, y: 80}, connectTo: "丹田初开", bonus: {type: "attack", value: 3}},
            {name: "足太阳膀胱经", desc: "提升防御力", baseCost: 400, costMult: 1.5, position: {x: 40, y: 80}, connectTo: "丹田初开", bonus: {type: "defense", value: 2.5}},
            {name: "足少阴肾经", desc: "气血内力双提升", baseCost: 500, costMult: 1.5, position: {x: 80, y: 40}, connectTo: "丹田初开", bonus: {type: "all", value: 1}},
        ],
        skills: {
            commonQi: {name: "引气诀", type: "内功", desc: "基础引气入体法门，所有修真者入门必修", baseRecover: 1, recoverPerLevel: 0.5, qiCost: 0, baseCost: 10, costMult: 1.4},
            fireball: {name: "火球术", type: "法术", desc: "基础攻击法术，杀伤力不俗", baseDamage: 12, damagePerLevel: 3, qiCost: 8, baseCost: 15, costMult: 1.5},
            windStep: {name: "踏风步", type: "身法", desc: "提升闪避，增加行动力", baseDodge: 5, dodgePerLevel: 2, qiCost: 0, baseCost: 12, costMult: 1.5},
            stoneSkin: {name: "石肤术", type: "防御功法", desc: "化为石肤，提升防御", baseDefense: 4, defensePerLevel: 2, qiCost: 0, baseCost: 18, costMult: 1.6},
        },
        areas: {
            qingyunRange: {name: "青云山 - 外围", desc: "青云山脉外围，妖兽横行，适合新手历练", minLevel: 1, hpMin: 40, hpMax: 60, atkMin: 3, atkMax: 6, expPerMin: 2, xiuweiPerMin: 2, drops: {lowGrass: 0.4, magicCrystal: 0.15}},
            blackWindValley: {name: "黑风谷", desc: "邪恶妖兽盘踞，盛产魔晶，危险与机遇并存", minLevel: 5, hpMin: 100, hpMax: 180, atkMin: 10, atkMax: 20, expPerMin: 5, xiuweiPerMin: 5, drops: {lowGrass: 0.4, magicCrystal: 0.2, demonBone: 0.15}},
        },
        items: {
            lowGrass: {name: "一阶灵草", type: "material", desc: "普通灵草，可以炼制低阶丹药"},
            magicCrystal: {name: "魔晶", type: "material", desc: "妖兽内丹蕴含魔力，可用于炼器刻阵"},
            demonBone: {name: "妖骨", type: "material", desc: "蕴含少量灵力，可以制作法器"},
            qiPill: {name: "聚气丹", type: "consumable", desc: "恢复50点气血，补充10点内力", effect: "restoreHpQi", valueHp: 50, valueQi: 10},
        }
    },

    init: function() {
        // 如果刚重置过，确保所有数据都是默认的
        this.resetAllData();
        this.load();
        this.initDefaultData();
        this.recalculateAllMeridianBonuses(); // 重新计算所有经脉等级的属性加成
        this.calculateOfflineReward();
        this.renderAll();
        this.drawMeridians();
    },

    // 重新计算所有经脉属性（从存档加载后调用）
    recalculateAllMeridianBonuses: function() {
        // 重置基础属性
        this.player.baseAttack = 10;
        this.player.baseDefense = 5;
        this.player.maxHp = 100;
        this.player.maxQi = 100;
        this.player.wuxing = 10;
        this.player.currentHp = this.player.maxHp;
        this.player.currentQi = this.player.maxQi;

        // 根据每个经脉等级重新加属性
        for (let name in this.meridians) {
            const level = this.meridians[name];
            if (level <= 0) continue;
            const m = this.definitions.meridians.find(m => m.name === name);
            for (let i = 0; i < level; i++) {
                this.applyBonus(m.bonus);
            }
        }
    },

    // 完全重置所有数据为默认
    resetAllData: function() {
        // 玩家数据
        this.player = {
            level: 1,
            xiuwei: 0,
            expToNext: 100,
            currentHp: 100,
            maxHp: 100,
            currentQi: 100,
            maxQi: 100,
            baseAttack: 10,
            baseDefense: 5,
            wuxing: 10,
        };
        // 装备的武学: 只能装备一个内功一个外功一个轻功
        this.equippedSkills = {
            inner: null,
            outer: null,
            light: null,
        };
        this.meridians = {}; // 经脉: key -> bool 是否打通
        this.skills = {};    // 技能: key -> {level: 0}
        this.inventory = {}; // 物品: key -> count
        this.adventure = {
            currentArea: null,
            isAdventuring: false,
            lastCheckTime: Date.now(),
            currentEnemy: null,
            searchTimer: 0,
            searching: false,
        };
        // 重置离线积累池
        this.offlineAccumulation = {
            accumulatedXiuwei: 0,
            lastOfflineUpdate: Date.now(),
            maxAccumulateHours: 24,
        };
        this.lastSaveTime = Date.now();
    },

    initDefaultData: function() {
        // 初始化经脉
        this.definitions.meridians.forEach(m => {
            if (!this.meridians.hasOwnProperty(m.name)) {
                this.meridians[m.name] = 0;
            }
        });
        // 初学基础技能
        for (let id in this.definitions.skills) {
            if (!this.skills.hasOwnProperty(id)) {
                this.skills[id] = {level: 0};
            }
        }
        // 默认装备基础技能
        if (!this.equippedSkills.outer) this.equippedSkills.outer = 'fireball';
        if (!this.equippedSkills.inner) this.equippedSkills.inner = 'commonQi';
        if (!this.equippedSkills.light) this.equippedSkills.light = 'windStep';
        this.adventure.lastCheckTime = Date.now();
        // 初始化战斗计时器用于连续进度
        if (!this.adventure.searchStartTime) this.adventure.searchStartTime = null;
        // 初始化离线积累
        if (!this.offlineAccumulation) {
            this.offlineAccumulation = {
                accumulatedXiuwei: 0,
                lastOfflineUpdate: Date.now(),
                maxAccumulateHours: 24,
            };
        }
        if (!this.adventure.fightStartTime) this.adventure.fightStartTime = null;
    },

    // 计算离线收益，修为累积到积累池
    calculateOfflineReward: function() {
        const now = Date.now();
        const elapsedMs = now - this.offlineAccumulation.lastOfflineUpdate;
        const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
        if (elapsedMinutes <= 0) return;

        const xiuweiPerMin = 1 * this.player.wuxing;
        const newXiuwei = elapsedMinutes * xiuweiPerMin;

        let totalExp = 0;
        let drops = {};

        // 如果在闯荡，额外收益（经验和掉落还是直接在弹窗领取，修为还是去积累池）
        if (this.adventure.isAdventuring && this.adventure.currentArea) {
            const area = this.definitions.areas[this.adventure.currentArea];
            totalExp += elapsedMinutes * area.expPerMin;
            newXiuwei += elapsedMinutes * area.xiuweiPerMin;

            // 随机掉落
            for (let itemId in area.drops) {
                const dropChance = area.drops[itemId] * elapsedMinutes;
                const count = Math.floor(dropChance);
                const extra = Math.random() < (dropChance - count) ? 1 : 0;
                const totalCount = count + extra;
                if (totalCount > 0) {
                    drops[itemId] = totalCount;
                }
            }
        }

        // 添加修为到积累池，不超过最大容量
        const maxCapacity = this.getOfflineMaxCapacity();
        this.offlineAccumulation.accumulatedXiuwei = Math.min(
            this.offlineAccumulation.accumulatedXiuwei + newXiuwei,
            maxCapacity
        );

        // 经验和掉落仍然在弹窗显示领取（只有闯荡才有）
        if (totalExp > 0 || Object.keys(drops).length > 0) {
            this.offlineReward = {
                xiuwei: 0, // 修为去积累池了
                exp: totalExp,
                drops: drops
            };
            document.getElementById('offlineReward').classList.add('show');
            let html = `<ul>`;
            if (totalExp > 0) html += `<li>经验 +${totalExp}</li>`;
            for (let item in drops) {
                const name = this.definitions.items[item].name;
                html += `<li>${name} +${drops[item]}</li>`;
            }
            html += `</ul>`;
            document.getElementById('offlineRewardText').innerHTML = html;
        }

        // 更新最后离线时间
        this.offlineAccumulation.lastOfflineUpdate = now;
        this.save();
    },

    claimOfflineReward: function() {
        if (!this.offlineReward) return;
        // 修为去积累池了，这里只领经验和掉落
        // 经验直接加到升级
        this.player.xiuwei += this.offlineReward.xiuwei;
        for (let item in this.offlineReward.drops) {
            this.addItem(item, this.offlineReward.drops[item]);
        }
        document.getElementById('offlineReward').classList.remove('show');
        this.offlineReward = null;
        this.adventure.lastCheckTime = Date.now();
        this.save();
        this.renderAll();
    },

    // 获取离线积累池最大容量
    getOfflineMaxCapacity: function() {
        // 最大容量 = 每小时产量 * 最大积累小时数
        return this.xiuweiPerHour * this.offlineAccumulation.maxAccumulateHours;
    },

    // 获取每小时离线修为产量
    get xiuweiPerHour() {
        // 在线是每5秒一次，一小时 = 12 * 60 = 720 次
        return this.xiuweiPerCultivate * 12 * 60;
    },

    // 领取离线积累的修为
    claimOfflineAccumulated: function() {
        if (this.offlineAccumulation.accumulatedXiuwei <= 0) return;
        
        // 把积累的修为加到玩家
        this.player.xiuwei += this.offlineAccumulation.accumulatedXiuwei;
        // 清空池子
        this.offlineAccumulation.accumulatedXiuwei = 0;
        // 更新最后时间
        this.offlineAccumulation.lastOfflineUpdate = Date.now();
        
        this.save();
        this.renderAll();
    },

    // 计算每分钟/每五秒修为产量
    get xiuweiPerCultivate() {
        // 基础 10点每5秒
        let base = 10;
        // 悟性加成
        base = base * (this.player.wuxing / 10);
        // 内功加成：每一级内功增加10%
        if (this.equippedSkills.inner) {
            const level = this.skills[this.equippedSkills.inner].level;
            base = base * (1 + level * 0.1);
        }
        return Math.floor(base);
    },

    startLoop: function() {
        // 每5秒增加一次离线修为（即使不闯荡也给），用时间戳计算连续进度
        this.lastCultivateTime = Date.now();
        this.lastAdventureXiuweiTime = Date.now();
        // 10fps 更新（每100ms），进度条足够平滑，性能也ok
        setInterval(() => {
            this.autoRecover();
            // 检查是否到 5 秒，增加离线基础修为（连续进度条用时间计算）
            const now = Date.now();
            const elapsed = (now - this.lastCultivateTime) / 1000;
            if (elapsed >= 5) {
                // 受悟性+内功影响
                const addXiuwei = this.xiuweiPerCultivate;
                this.player.xiuwei += addXiuwei;
                this.lastCultivateTime = now;
            }
            // 闯荡中每秒自动给修为
            if (this.adventure.isAdventuring && this.adventure.currentArea) {
                const advElapsed = (now - this.lastAdventureXiuweiTime) / 1000;
                if (advElapsed >= 1) {
                    const area = this.definitions.areas[this.adventure.currentArea];
                    this.player.xiuwei += area.xiuweiPerMin * advElapsed;
                    this.player.exp += area.expPerMin * advElapsed;
                    this.lastAdventureXiuweiTime = now;
                }
            }
            this.renderStats();
            if (this.adventure.isAdventuring) {
                this.adventureTick();
                // 重新渲染战斗进度条
                this.renderAdventure();
            }
            this.renderInventory(); // 背包物品数量更新
            this.save();
        }, 100); // 每 100ms 更新一次 → 10fps，足够平滑了
    },

    autoRecover: function() {
        // 自动恢复气血内力
        const recoverHp = 0.5;
        const recoverQi = this.qiRecoveryPerSecond;
        if (this.player.currentHp < this.player.maxHp) {
            this.player.currentHp = Math.min(this.player.maxHp, this.player.currentHp + recoverHp);
        }
        if (this.player.currentQi < this.player.maxQi) {
            this.player.currentQi = Math.min(this.player.maxQi, this.player.currentQi + recoverQi);
        }
    },

    // 生成敌人
    spawnEnemy: function() {
        const area = this.definitions.areas[this.adventure.currentArea];
        const hp = Math.floor(Math.random() * (area.hpMax - area.hpMin + 1)) + area.hpMin;
        const attack = Math.floor(Math.random() * (area.atkMax - area.atkMin + 1)) + area.atkMin;
        // 根据区域给敌人不同名字
        let name = "野猪";
        if (area.name === "青狼林") {
            name = "青狼";
        }
        this.adventure.currentEnemy = {
            name: name,
            hp: hp,
            maxHp: hp,
            attack: attack,
        };
    },

    adventureTick: function() {
        // 如果正在寻怪，倒计时（连续进度）
        if (this.adventure.searching) {
            if (!this.adventure.searchStartTime) {
                this.adventure.searchStartTime = Date.now();
            }
            const elapsed = (Date.now() - this.adventure.searchStartTime) / 1000;
            const totalTime = 2; // 寻敌 2 秒
            if (elapsed >= totalTime) {
                this.adventure.searching = false;
                this.adventure.searchStartTime = null;
                this.spawnEnemy();
                this.adventure.fightStartTime = Date.now();
            }
            this.updateCombatHeader();
            return;
        }
        
        // 如果没有敌人，开始寻怪
        if (!this.adventure.currentEnemy) {
            this.adventure.searching = true;
            this.adventure.searchStartTime = Date.now();
            this.updateCombatHeader();
            return;
        }

        const enemy = this.adventure.currentEnemy;
        // 简化战斗：每3秒打一次（连续进度）
        if (!this.adventure.fightStartTime) {
            this.adventure.fightStartTime = Date.now();
        }
        const elapsed = (Date.now() - this.adventure.fightStartTime) / 1000;
        const fightInterval = 3; // 每3秒一回合
        
        if (elapsed >= fightInterval) {
            this.adventure.fightStartTime = Date.now();
            
            // 计算我们的伤害，用装备外功，消耗内力
            let playerDamage = 0;
            let usedSkill = null;
            
            if (this.equippedSkills.outer) {
                const skillDef = this.definitions.skills[this.equippedSkills.outer];
                // 检查内力够不够
                if (this.player.currentQi >= skillDef.qiCost) {
                    this.player.currentQi -= skillDef.qiCost;
                    usedSkill = skillDef.name;
                    const baseDamage = this.totalAttack + (skillDef.baseDamage + skillDef.damagePerLevel * this.skills[this.equippedSkills.outer].level);
                    playerDamage = this.calculateDamage(baseDamage, enemy.attack);
                } else {
                    // 内力不够，平A
                    playerDamage = this.calculateDamage(this.totalAttack, enemy.attack);
                }
            } else {
                // 没装备外功，平A
                playerDamage = this.calculateDamage(this.totalAttack, enemy.attack);
            }
            
            enemy.hp -= playerDamage;
            // 显示伤害飘字
            this.showDamage(playerDamage, usedSkill, 'enemy');
            
            // 敌人反击
            if (enemy.hp > 0) {
                const enemyDamage = this.calculateDamage(enemy.attack, this.totalDefense);
                this.player.currentHp -= enemyDamage;
                // 显示敌人伤害飘字
                this.showDamage(enemyDamage, null, 'player');
            }
            
            // 敌人死了，掉落奖励，开始寻下一个
            if (enemy.hp <= 0) {
                enemy.hp = 0; // 防止显示负数
                // 飘击败提示
                this.showDamage(0, "击败！", "enemy");
                
                const area = this.definitions.areas[this.adventure.currentArea];
                // 奖励修为经验：新手村每个敌人 10修为，青狼林每个敌人 50修为
                let rewardXiuwei = area.name === "新手村 - 野猪林" ? 10 : 50;
                let rewardExp = area.xiuweiPerMin * 5;
                this.player.xiuwei += rewardXiuwei;
                this.player.exp += Math.floor(rewardExp);
                
                // 随机掉落
                for (let itemId in area.drops) {
                    if (Math.random() < area.drops[itemId]) {
                        this.addItem(itemId, 1);
                    }
                }
                
                // 先清空敌人，再延迟开始寻敌，防止显示负数血量
                this.adventure.currentEnemy = null;
                this.adventure.fightStartTime = null;
                this.adventure.searching = true;
                this.adventure.searchStartTime = Date.now();
                // 更新状态栏，现在敌人没了，开始寻敌进度
                this.updateCombatHeader();
                // 延迟一秒给用户看击败提示，已经开始正常走进度了
                // 这次tick已经处理完，直接返回不做后续更新
                return;
            }
            
            // 如果气血没了，停止闯荡
            if (this.player.currentHp <= 0) {
                this.showDamage(0, "战败！", "player");
                this.player.currentHp = 1; // 留一点血
                this.stopAdventure();
                this.updateCombatHeader();
                return;
            }
        }
        
        this.updateCombatHeader();
    },

    // 获取总属性（包含武学加成）
    get totalAttack() {
        let total = this.player.baseAttack;
        // 外功加成
        if (this.equippedSkills.outer) {
            const def = this.definitions.skills[this.equippedSkills.outer];
            const level = this.skills[this.equippedSkills.outer].level;
            total += def.baseDamage + def.damagePerLevel * level;
        }
        return total;
    },

    get totalDefense() {
        let total = this.player.baseDefense;
        // 轻功加少量防御，或者闪避（简化直接加防御）
        if (this.equippedSkills.light) {
            const def = this.definitions.skills[this.equippedSkills.light];
            const level = this.skills[this.equippedSkills.light].level;
            total += def.baseDodge + def.dodgePerLevel * level / 2;
        }
        return total;
    },

    get qiRecoveryPerSecond() {
        let base = 0.3;
        if (this.equippedSkills.inner) {
            const def = this.definitions.skills[this.equippedSkills.inner];
            const level = this.skills[this.equippedSkills.inner].level;
            base += def.baseRecover + def.recoverPerLevel * level;
        }
        return base;
    },

    // 计算伤害，随机波动 0.8-1.2
    calculateDamage: function(attack, defense) {
        const baseDamage = Math.max(1, attack - defense);
        const randomFactor = Math.random() * 0.4 + 0.8;
        return Math.floor(baseDamage * randomFactor);
    },

    // 升级
    canLevelUp: function() {
        return this.player.xiuwei >= this.player.expToNext;
    },

    levelUp: function() {
        if (!this.canLevelUp()) return;
        const addMaxHp = Math.floor(this.player.maxHp * 0.1);
        const addMaxQi = Math.floor(this.player.maxQi * 0.1);
        const addAttack = 2;
        const addDefense = 1;
        this.player.xiuwei -= this.player.expToNext;
        this.player.level += 1;
        this.player.expToNext = Math.floor(this.player.expToNext * 1.5);
        // 属性提升
        this.player.maxHp += addMaxHp;
        this.player.maxQi += addMaxQi;
        this.player.baseAttack += addAttack;
        this.player.baseDefense += addDefense;
        this.player.currentHp = this.player.maxHp;
        this.player.currentQi = this.player.maxQi;
        
        // 弹出升级提示
        let bonusText = `等级提升！Lv.${this.player.level}\n气血上限 +${addMaxHp}\n内力上限 +${addMaxQi}\n攻击 +${addAttack}\n防御 +${addDefense}`;
        const noticeDiv = document.createElement('div');
        noticeDiv.textContent = bonusText;
        noticeDiv.style.position = 'absolute';
        noticeDiv.style.left = '50%';
        noticeDiv.style.top = '50%';
        noticeDiv.style.transform = 'translate(-50%, -50%)';
        noticeDiv.style.fontSize = '20px';
        noticeDiv.style.fontWeight = 'bold';
        noticeDiv.style.color = '#ffdd33';
        noticeDiv.style.background = 'rgba(0, 0, 0, 0.8)';
        noticeDiv.style.padding = '20px 30px';
        noticeDiv.style.borderRadius = '10px';
        noticeDiv.style.zIndex = '50';
        noticeDiv.style.whiteSpace = 'pre-line';
        document.querySelector('.combat-header').appendChild(noticeDiv);
        // 三秒后自动移除
        setTimeout(() => noticeDiv.remove(), 3000);

        this.save();
        this.renderAll();
        this.drawMeridians();
    },

    // 打通/升级经脉
    unlockMeridian: function(name) {
        // 获取当前经脉等级
        const currentLevel = this.meridians[name] || 0;
        // 计算当前等级的消耗
        const m = this.definitions.meridians.find(m => m.name === name);
        const cost = Math.floor(m.baseCost * Math.pow(m.costMult, currentLevel));
        
        if (this.player.xiuwei >= cost) {
            this.player.xiuwei -= cost;
            // 升级经脉等级
            this.meridians[name] = currentLevel + 1;
            // 应用属性加成（每次升级都加一次）
            this.applyBonus(m.bonus);
            let bonusText = `冲穴成功！${m.name} Lv.${this.meridians[name]}`;
            // 显示升级提示
            const noticeDiv = document.createElement('div');
            noticeDiv.textContent = bonusText;
            noticeDiv.style.position = 'absolute';
            noticeDiv.style.left = '50%';
            noticeDiv.style.top = '50%';
            noticeDiv.style.transform = 'translate(-50%, -50%)';
            noticeDiv.style.fontSize = '20px';
            noticeDiv.style.fontWeight = 'bold';
            noticeDiv.style.color = '#dda0dd';
            noticeDiv.style.background = 'rgba(0, 0, 0, 0.8)';
            noticeDiv.style.padding = '20px 30px';
            noticeDiv.style.borderRadius = '10px';
            noticeDiv.style.zIndex = '50';
            noticeDiv.style.whiteSpace = 'pre-line';
            document.querySelector('.combat-header').appendChild(noticeDiv);
            // 三秒后自动移除
            setTimeout(() => noticeDiv.remove(), 3000);

            this.save();
            this.renderMeridianList(); // 刷新按钮
            this.renderAll();
            this.drawMeridians();
        }
    },

    applyBonus: function(bonus) {
        switch (bonus.type) {
            case "maxHp": this.player.maxHp += bonus.value; this.player.currentHp += bonus.value; break;
            case "maxQi": this.player.maxQi += bonus.value; this.player.currentQi += bonus.value; break;
            case "attack": this.player.baseAttack += bonus.value; break;
            case "defense": this.player.baseDefense += bonus.value; break;
            case "wuxing": this.player.wuxing += bonus.value; break;
            case "all": 
                this.player.maxHp += bonus.value * 50;
                this.player.maxQi += bonus.value * 50;
                this.player.baseAttack += bonus.value * 2;
                this.player.baseDefense += bonus.value;
                this.player.currentHp = this.player.maxHp;
                this.player.currentQi = this.player.maxQi;
                break;
        }
    },

    // 技能升级
    getSkillLevel: function(id) {
        return this.skills[id] ? this.skills[id].level : 0;
    },

    upgradeSkill: function(id) {
        const def = this.definitions.skills[id];
        const currentLevel = this.getSkillLevel(id);
        const cost = Math.floor(def.baseCost * Math.pow(def.costMult, currentLevel));
        if (this.player.xiuwei >= cost) {
            this.player.xiuwei -= cost;
            this.skills[id].level += 1;
            // 计算新增属性，弹出升级提示
            let bonusText = `升级成功！${def.name} Lv.${this.skills[id].level}`;
            if (def.type === '外功' || def.type === 'outer') {
                bonusText += `\n伤害 +${def.damagePerLevel}`;
            } else if (def.type === '内功' || def.type === 'inner') {
                bonusText += `\n内力恢复 +${def.recoverPerLevel.toFixed(1)}/秒`;
            } else if (def.type === '轻功' || def.type === 'light') {
                bonusText += `\n闪避防御 +${(def.dodgePerLevel/2).toFixed(1)}`;
            }
            // 在战斗栏居中弹出黄色提示
            const noticeDiv = document.createElement('div');
            noticeDiv.textContent = bonusText;
            noticeDiv.style.position = 'absolute';
            noticeDiv.style.left = '50%';
            noticeDiv.style.top = '50%';
            noticeDiv.style.transform = 'translate(-50%, -50%)';
            noticeDiv.style.fontSize = '20px';
            noticeDiv.style.fontWeight = 'bold';
            noticeDiv.style.color = '#ffdd33';
            noticeDiv.style.background = 'rgba(0, 0, 0, 0.8)';
            noticeDiv.style.padding = '15px 25px';
            noticeDiv.style.borderRadius = '10px';
            noticeDiv.style.zIndex = '50';
            noticeDiv.style.whiteSpace = 'pre-line';
            document.querySelector('.combat-header').appendChild(noticeDiv);
            // 两秒后自动移除
            setTimeout(() => noticeDiv.remove(), 2000);

            this.save();
            this.renderSkillList(); // 立即刷新技能按钮，更新禁用状态
            this.renderAll();
        }
    },

    // 物品操作
    addItem: function(id, count) {
        this.inventory[id] = (this.inventory[id] || 0) + count;
    },

    // 闯荡
    startAdventure: function(areaId) {
        this.adventure.currentArea = areaId;
        this.adventure.isAdventuring = true;
        this.adventure.lastCheckTime = Date.now();
        this.adventure.fightTimer = 0;
        this.adventure.searching = true;
        this.adventure.searchTimer = 3;
        this.save();
        this.renderAdventure();
    },

    stopAdventure: function() {
        this.adventure.isAdventuring = false;
        this.adventure.currentEnemy = null;
        this.adventure.fightTimer = 0;
        this.adventure.searching = false;
        this.save();
        this.renderAdventure();
    },

    // 切换标签
    switchTab: function(tabId) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector(`.tab:nth-child(${this.tabIndex(tabId) + 1})`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
        // 切换到对应tab时刷新按钮状态，保证禁用正确
        if (tabId === 'meridians') {
            this.renderMeridianList();
            this.drawMeridians();
        }
        if (tabId === 'skills') {
            this.renderSkillList();
        }
    },

    tabIndex: function(tabId) {
        const tabs = ['cultivation', 'meridians', 'skills', 'adventure', 'inventory'];
        return tabs.indexOf(tabId);
    },

    // ========== 渲染 ==========
    renderAll: function() {
        this.renderStats();
        this.renderMeridianList();
        this.renderSkillList();
        this.renderAreaList();
        this.renderAdventure();
        this.renderInventory();
    },
    
    // 渲染背包
    renderInventory: function() {
        const container = document.getElementById('inventoryList');
        if (Object.keys(this.inventory).length === 0) {
            container.innerHTML = '<p>背包还是空的，去江湖闯荡打点材料吧。</p>';
            return;
        }
        
        let html = '';
        for (let itemId in this.inventory) {
            const def = this.definitions.items[itemId];
            const count = this.inventory[itemId];
            if (def.type === 'consumable') {
                html += `
                    <div class="skill-item">
                        <div class="skill-info">
                            <strong>${def.name}</strong><br>
                            <small>${def.description}</small>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <span style="font-size: 18px; padding: 0 10px;">x${count}</span>
                            <button onclick="game.useItem('${itemId}')">使用</button>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="skill-item">
                        <div class="skill-info">
                            <strong>${def.name}</strong><br>
                            <small>${def.description}</small>
                        </div>
                        <span style="font-size: 18px; padding: 0 10px;">x${count}</span>
                    </div>
                `;
            }
        }
        
        // 加炼丹界面：2一阶灵草 = 1聚气丹
        html += `
            <div style="margin-top: 20px; padding: 15px; background: rgba(60, 100, 30, 0.5); border-radius: 6px;">
                <h3>🧪 炼丹</h3>
                <p>2 一阶灵草 → 1 聚气丹 (恢复50气血 + 10内力)</p>
                <button onclick="game.makePill()" ${(this.inventory.lowGrass || 0) >= 2 ? '' : 'disabled'}>炼制聚气丹</button>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    // 使用物品
    useItem: function(itemId) {
        const def = this.definitions.items[itemId];
        if (def.type === 'consumable') {
            if (def.effect === 'restoreHp') {
                this.player.currentHp = Math.min(this.player.maxHp, this.player.currentHp + def.value);
            } else if (def.effect === 'restoreHpQi') {
                // 同时恢复气血和内力
                this.player.currentHp = Math.min(this.player.maxHp, this.player.currentHp + def.valueHp);
                this.player.currentQi = Math.min(this.player.maxQi, this.player.currentQi + def.valueQi);
            }
            this.inventory[itemId]--;
            if (this.inventory[itemId] <= 0) {
                delete this.inventory[itemId];
            }
            this.save();
            this.renderAll();
        }
    },
    
    // 炼制聚气丹
    makePill: function() {
        if ((this.inventory.lowGrass || 0) >= 2) {
            this.inventory.lowGrass -= 2;
            this.inventory.qiPill = (this.inventory.qiPill || 0) + 1;
            if (this.inventory.lowGrass <= 0) delete this.inventory.lowGrass;
            this.save();
            this.renderAll();
        }
    },

    // 根据等级获取境界名称
    getRealmName: function(level) {
        const realms = [
            "炼气", "筑基", "金丹", "元婴", "化神",
            "炼虚", "合体", "大乘", "渡劫", "飞升"
        ];
        const index = Math.floor((level - 1) / 10);
        const layer = ((level - 1) % 10) + 1;
        if (index >= realms.length) {
            return `${realms[realms.length - 1]} ${layer}`;
        }
        return `${realms[index]} ${layer}层`;
    },

    renderStats: function() {
        const p = this.player;
        // 修炼页的灵气信息
        document.getElementById('levelText').textContent = `${p.level} - ${this.getRealmName(p.level)}`;
        document.getElementById('expText').textContent = `${Math.floor(p.xiuwei)}/${p.expToNext}`;
        const expPercent = (p.xiuwei / p.expToNext) * 100;
        document.getElementById('expBar').style.width = expPercent + '%';
        document.getElementById('levelUpBtn').disabled = !this.canLevelUp();
        
        // 更新修炼进度条（连续计算，流畅动画）
        document.getElementById('xiuweiPerCultivate').textContent = this.xiuweiPerCultivate.toString();
        if (typeof this.lastCultivateTime !== 'undefined') {
            const now = Date.now();
            const elapsed = (now - this.lastCultivateTime) / 1000;
            const countdown = (5 - elapsed).toFixed(1);
            const percent = (elapsed / 5) * 100;
            document.getElementById('cultivateBar').style.width = percent + '%';
            document.getElementById('cultivateCountdown').textContent = countdown;
        }

        // 渲染离线积累池
        const maxCapacity = this.getOfflineMaxCapacity();
        const accumulated = this.offlineAccumulation.accumulatedXiuwei;
        const percent = (accumulated / maxCapacity) * 100;
        document.getElementById('offlineAccumulatedText').textContent = Math.floor(accumulated).toString();
        document.getElementById('offlineMaxCapacityText').textContent = Math.floor(maxCapacity).toString();
        document.getElementById('offlineAccumulatedBar').style.width = percent + '%';
        document.getElementById('offlineXiuweiPerHour').textContent = Math.floor(this.xiuweiPerHour).toString();
        document.getElementById('claimOfflineXiuweiBtn').disabled = accumulated <= 0;
        
        // 更新顶部战斗状态栏
        this.updateCombatHeader();
    },

    renderMeridianList: function() {
        const container = document.getElementById('meridianList');
        let html = '';
        this.definitions.meridians.forEach(m => {
            const currentLevel = this.meridians[m.name] || 0;
            const cost = Math.floor(m.baseCost * Math.pow(m.costMult, currentLevel));
            const unlocked = currentLevel > 0;
            const cls = unlocked ? 'meridian-item unlocked' : 'meridian-item';
            const disabled = this.player.xiuwei < cost;
            // 格式化属性加成（每级加成）
            let bonusText = '';
            const attrMap = {
                'maxHp': '气血上限',
                'maxQi': '内力上限',
                'attack': '攻击',
                'baseAttack': '攻击',
                'defense': '防御',
                'baseDefense': '防御',
                'wuxing': '悟性'
            };
            if (m.bonus && m.bonus.type && m.bonus.value) {
                if (m.bonus.type === 'all') {
                    bonusText = `<small>每级：全属性 +${m.bonus.value}</small>`;
                } else {
                    const name = attrMap[m.bonus.type] || m.bonus.type;
                    bonusText = `<small>每级：${name} +${m.bonus.value}</small>`;
                }
            }
            let buttonText = unlocked ? 
                `升级 (${cost}灵气) — 当前 Lv.${currentLevel}` : 
                `冲穴 (${cost}灵气)`;
            html += `
                <div class="${cls}">
                    <div>
                        <strong>${m.name} ${currentLevel > 0 ? `Lv.${currentLevel}` : ''}</strong><br>
                        <small>${m.desc}</small><br>
                        ${bonusText}
                    </div>
                    <button onclick="game.unlockMeridian('${m.name}')" ${disabled ? 'disabled' : ''}>
                        ${buttonText}
                    </button>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    renderSkillList: function() {
        const container = document.getElementById('skillList');
        let html = '';
        for (let id in this.definitions.skills) {
            const def = this.definitions.skills[id];
            const level = this.getSkillLevel(id);
            const cost = Math.floor(def.baseCost * Math.pow(def.costMult, level));
            const disabled = this.player.xiuwei < cost;
            
            // 计算当前属性加成
            let bonusText = '';
            if (def.type === '外功' || def.type === 'outer') {
                const totalBonus = def.baseDamage + def.damagePerLevel * level;
                bonusText = `伤害 +${totalBonus}`;
            } else if (def.type === '内功' || def.type === 'inner') {
                const totalBonus = (def.baseRecover + def.recoverPerLevel * level).toFixed(1);
                bonusText = `内力恢复 +${totalBonus}/秒`;
            } else if (def.type === '轻功' || def.type === 'light') {
                const totalBonus = def.baseDodge + def.dodgePerLevel * level;
                bonusText = `闪避防御 +${(totalBonus/2).toFixed(1)}`;
            }
            
            // 检查是否已经装备
            const isEquipped = Object.values(this.equippedSkills).includes(id);
            // 类型名称转换：不管type是中文还是英文都能匹配
            let typeName = def.type;
            const typeMap = {"inner": "内功", "outer": "外功", "light": "轻功"};
            if (typeMap[def.type]) typeName = typeMap[def.type];
            const descText = bonusText ? `${def.desc} | ${bonusText}` : def.desc;
            html += `
                <div class="skill-item" style="${isEquipped ? 'border: 2px solid #8bbd3e;' : ''}">
                    <div class="skill-info">
                        <strong>${def.name} (${typeName}) Lv.${level}</strong><br>
                        <small>${descText}</small>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        ${!isEquipped ? `<button onclick="game.equipSkill('${id}')">装备</button>` : `<button disabled style="background: #8bbd3e;">已装备</button>`}
                        <button onclick="game.upgradeSkill('${id}')" ${disabled ? 'disabled' : ''}>
                            升级 (${cost}修为)
                        </button>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    },
    
    // 装备武学
    equipSkill: function(skillId) {
        const def = this.definitions.skills[skillId];
        // 根据类型放到对应插槽
        if (def.type === '内功') {
            this.equippedSkills.inner = skillId;
        } else if (def.type === '外功') {
            this.equippedSkills.outer = skillId;
        } else if (def.type === '轻功') {
            this.equippedSkills.light = skillId;
        }
        this.save();
        this.renderSkillList();
        this.renderStats();
    },

    renderAreaList: function() {
        const container = document.getElementById('areaList');
        let html = '';
        console.log("Rendering areas, count: " + Object.keys(this.definitions.areas).length);
        for (let id in this.definitions.areas) {
            const area = this.definitions.areas[id];
            console.log("Area: " + id + " -> " + area.name);
            const isActive = this.adventure.currentArea === id && this.adventure.isAdventuring;
            const cls = isActive ? 'adventure-area active' : 'adventure-area';
            const disabled = this.player.level < area.minLevel;
            html += `
                <div class="${cls}">
                    <div>
                        <strong>${area.name}</strong><br>
                        <small>${area.desc}</small><br>
                        <small>要求等级: ${area.minLevel} | 修为/分钟: ${area.xiuweiPerMin}</small>
                    </div>
                    ${!isActive ? 
                        `<button onclick="game.startAdventure('${id}')" ${disabled ? 'disabled' : ''}>开始闯荡</button>` :
                        `<button onclick="game.stopAdventure()">停止闯荡</button>`
                    }
                </div>
            `;
        }
        container.innerHTML = html;
    },

    // 更新顶部战斗状态栏
    updateCombatHeader: function() {
        // 玩家信息
        document.getElementById('combatLevel').textContent = this.player.level;
        document.getElementById('combatHpText').textContent = `${Math.floor(this.player.currentHp)}/${this.player.maxHp}`;
        let hpPercent = (this.player.currentHp / this.player.maxHp) * 100;
        document.getElementById('combatHpBar').style.width = hpPercent + '%';
        document.getElementById('combatQiText').textContent = `${Math.floor(this.player.currentQi)}/${this.player.maxQi}`;
        let qiPercent = (this.player.currentQi / this.player.maxQi) * 100;
        document.getElementById('combatQiBar').style.width = qiPercent + '%';
        document.getElementById('combatAttack').textContent = this.totalAttack;
        document.getElementById('combatDefense').textContent = this.totalDefense;
        document.getElementById('combatWuxing').textContent = this.player.wuxing;
        
        // 敌人/状态信息
        const enemyInfoRow = document.getElementById('enemyRow');
        const timerRow = document.getElementById('fightTimerRow');
        
        if (!this.adventure.isAdventuring) {
            document.getElementById('combatStatus').textContent = '未在闯荡';
            enemyInfoRow.style.display = 'none';
            timerRow.style.display = 'none';
            return;
        }
        
        if (this.adventure.searching) {
            // 寻敌中，连续进度
            const elapsed = this.adventure.searchStartTime ? (Date.now() - this.adventure.searchStartTime) / 1000 : 0;
            const remaining = (2 - elapsed).toFixed(1);
            const percent = (elapsed / 2) * 100;
            document.getElementById('combatStatus').textContent = `寻敌中...`;
            enemyInfoRow.style.display = 'none';
            timerRow.style.display = 'block';
            document.getElementById('fightTimerText').textContent = `${remaining}秒`;
            document.getElementById('fightTimerBar').style.width = percent + '%';
            return;
        }
        
        if (!this.adventure.currentEnemy) {
            document.getElementById('combatStatus').textContent = '准备战斗';
            enemyInfoRow.style.display = 'none';
            timerRow.style.display = 'none';
            return;
        }
        
        const enemy = this.adventure.currentEnemy;
        // 战斗中，连续进度到下一回合
        const elapsed = this.adventure.fightStartTime ? (Date.now() - this.adventure.fightStartTime) / 1000 : 0;
        const remaining = (3 - elapsed).toFixed(1);
        const percent = (elapsed / 3) * 100;
        document.getElementById('combatStatus').textContent = '战斗中';
        enemyInfoRow.style.display = 'block';
        timerRow.style.display = 'block';
        document.getElementById('enemyName').textContent = enemy.name || '野猪';
        document.getElementById('enemyHpText').textContent = `${Math.floor(enemy.hp)}/${enemy.maxHp}`;
        hpPercent = (enemy.hp / enemy.maxHp) * 100;
        document.getElementById('enemyCombatBar').style.width = hpPercent + '%';
        document.getElementById('fightTimerText').textContent = `${remaining}秒`;
        document.getElementById('fightTimerBar').style.width = percent + '%';
    },

    renderAdventure: function() {
        const container = document.getElementById('adventureStatus');
        if (!this.adventure.isAdventuring) {
            container.innerHTML = '<p>当前没有在闯荡。选择一个区域开始挂机打怪吧。</p>';
            this.updateCombatHeader();
            return;
        }
        const area = this.definitions.areas[this.adventure.currentArea];
        container.innerHTML = `<p><strong>正在闯荡：${area.name}</strong></p><p>顶部状态栏实时显示战斗情况。</p>`;
        this.updateCombatHeader();
    },

    drawMeridians: function() {
        const canvas = document.getElementById('meridianCanvas');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        const ctx = canvas.getContext('2d');
        
        // 缩放到中心
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const scale = Math.min(canvas.width, canvas.height) / 220;

        ctx.fillStyle = 'rgba(20, 40, 10, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 先画线，后画节点
        this.definitions.meridians.forEach(m => {
            if (m.connectTo && this.meridians[m.name] && this.meridians[m.connectTo]) {
                const fromM = this.definitions.meridians.find(mm => mm.name === m.connectTo);
                const fromX = centerX + (fromM.position.x * scale);
                const fromY = centerY + (fromM.position.y * scale);
                const toX = centerX + (m.position.x * scale);
                const toY = centerY + (m.position.y * scale);
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(50, 150, 50, 0.8)';
                ctx.lineWidth = 6 * window.devicePixelRatio;
                ctx.moveTo(fromX, fromY);
                ctx.lineTo(toX, toY);
                ctx.stroke();
            } else if (m.connectTo) {
                // 未打通，画灰线
                const fromM = this.definitions.meridians.find(mm => mm.name === m.connectTo);
                if (fromM) {
                    const fromX = centerX + (fromM.position.x * scale);
                    const fromY = centerY + (fromM.position.y * scale);
                    const toX = centerX + (m.position.x * scale);
                    const toY = centerY + (m.position.y * scale);
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(60, 60, 60, 0.5)';
                    ctx.lineWidth = 3 * window.devicePixelRatio;
                    ctx.moveTo(fromX, fromY);
                    ctx.lineTo(toX, toY);
                    ctx.stroke();
                }
            }
        });

        // 画节点
        this.definitions.meridians.forEach(m => {
            const x = centerX + (m.position.x * scale);
            const y = centerY + (m.position.y * scale);
            const radius = 15 * window.devicePixelRatio;
            ctx.beginPath();
            if (this.meridians[m.name]) {
                ctx.fillStyle = 'rgba(50, 150, 50, 0.9)';
            } else {
                ctx.fillStyle = 'rgba(60, 60, 60, 0.7)';
            }
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2 * window.devicePixelRatio;
            ctx.stroke();
        });
    },

    // 显示伤害飘字
    showDamage: function(damage, skillName, target) {
        const damageDiv = document.createElement('div');
        let text = '';
        if (skillName !== null && skillName !== undefined) {
            text = `${skillName}`;
        } else {
            text = `${damage}`;
        }
        damageDiv.textContent = text;
        damageDiv.className = `damage-text ${target}-damage`;
        if (skillName === "击败！" || skillName === "战败！") {
            damageDiv.style.fontSize = "24px";
            damageDiv.style.color = "#ffdd33";
        }
        // 随机偏移一点位置
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 20;
        damageDiv.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        document.querySelector('.combat-header').appendChild(damageDiv);
        // 动画结束移除
        setTimeout(() => damageDiv.remove(), 1000);
    },

    // ========== 设置 ==========
    openSettings: function() {
        document.getElementById('settingsModal').classList.add('show');
    },

    closeSettings: function() {
        document.getElementById('settingsModal').classList.remove('show');
    },

    resetGame: function() {
        if (confirm('确定要清空存档重新开始吗？这个操作不可恢复！')) {
            localStorage.removeItem('wuxia-idle-save');
            this.closeSettings();
            // 清除所有数据重新初始化
            this.resetAllData();
            this.init();
            // 强制刷新确保完全重置
            setTimeout(() => window.location.reload(), 200);
        }
    },

    // ========== 存档读档 ==========
    save: function() {
        const data = {
            player: this.player,
            equippedSkills: this.equippedSkills,
            meridians: this.meridians,
            skills: this.skills,
            inventory: this.inventory,
            adventure: this.adventure,
            lastSaveTime: this.lastSaveTime
        };
        localStorage.setItem('wuxia-idle-save', JSON.stringify(data));
    },

    load: function() {
        const saved = localStorage.getItem('wuxia-idle-save');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.player) Object.assign(this.player, data.player);
            if (data.equippedSkills) Object.assign(this.equippedSkills, data.equippedSkills);
            if (data.meridians) this.meridians = data.meridians;
            if (data.skills) this.skills = data.skills;
            if (data.inventory) this.inventory = data.inventory;
            if (data.adventure) Object.assign(this.adventure, data.adventure);
            if (data.lastSaveTime) this.lastSaveTime = data.lastSaveTime;
        }
    }
};
