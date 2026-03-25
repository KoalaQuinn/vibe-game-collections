// 三国立志传：草莽英雄 - 纯JavaScript框架
// 新UI布局：顶部状态+中间地图+底部功能Tab
// 核心：乱世小人物成长，月为回合，开放无结局
// 事件系统支持Excel配置导出JSON

const game = {
    // === 基础数据 ===
    date: {
        year: 184,
        month: 1,
    },

    // 当前场景：玩家在 "zhuojun" 涿郡城内 / "world" 大地图
    currentScene: "zhuojun",

    // 涿郡城内地点列表，带解锁条件
    cityLocations: [
        {
            id: "farm",
            name: "城外荒地",
            desc: "亲自开垦，获得粮食",
            unlockAt: 1, // 领地等级1就解锁（开局就有）
            action: function () => game.actionClearLand(),
        },
        {
            id: "study",
            name: "自家书屋",
            desc: "闭门读书，增加智力",
            unlockAt: 1,
            action: function () => game.actionStudy(),
        },
        {
            id: "social",
            name: "乡野游走",
            desc: "结交豪杰，增加魅力",
            unlockAt: 1,
            action: function () => game.actionSocial(),
        },
        {
            id: "tavern",
            name: "城门酒馆",
            desc: "打听消息，结交豪杰（领地2级解锁）",
            unlockAt: 2,
            action: function () => game.enterTavern(),
        },
        {
            id: "market",
            name: "郡县市集",
            desc: "买卖粮食物资（领地2级解锁）",
            unlockAt: 2,
            action: function () => game.showMarket(),
        },
        {
            id: "gov",
            name: "郡府官署",
            desc: "接取徭役任务，获得金钱（领地2级解锁）",
            unlockAt: 2,
            action: function () => game.showGovTask(),
        },
        {
            id: "train",
            name: "校场练兵",
            desc: "习武练兵，增加武力统率（领地2级解锁）",
            unlockAt: 2,
            action: function () => game.actionTrain(),
        },
        {
            id: "gate",
            name: "城门",
            desc: "出城进入大地图（领地2级解锁）",
            unlockAt: 2,
            action: function () => game.enterWorldMap(),
        },
    ],

    // 大地图城池
    worldCities: [
        {
            id: "zhuojun",
            name: "涿郡",
            level: "县城",
            description: "你的家乡，黄巾起兵的地方",
            enter: function () => game.enterCity("zhuojun"),
        },
        {
            id: "guangyang",
            name: "广阳",
            level: "郡城",
            description: "幽州治所，较为繁华",
            enter: function () => game.enterCity("guangyang"),
        },
        {
            id: "xiaopei",
            name: "小沛",
            level: "县城",
            description: "徐州边境小城",
            enter: function () => game.enterCity("xiaopei"),
        },
    ],

    // 四大属性：武力/智力/魅力/统率
    player: {
        force:    {val: 40, lv: 1, exp: 0},
        intel:    {val: 40, lv: 1, exp: 0},
        charisma: {val: 40, lv: 1, exp: 0},
        command:  {val: 30, lv: 1, exp: 0},
    },

    // 四大资源：金钱/粮食/人口/士兵
    res: {
        money:  100,
        grain:  150,
        people: 50,
        soldier: 0,
    },

    // 领地等级定义
    fortDef: [
        {
            lv: 1,
            name: "破败草庐",
            costMoney: 0,
            costGrain: 0,
            upkeepGrain: 10, // 每月维护消耗
            yieldGrain: 15,  // 每月产出
            yieldMoney: 0,
            unlock: null,
        },
        {
            lv: 2,
            name: "乡间篱落",
            costMoney: 500,
            costGrain: 500,
            upkeepGrain: 30,
            yieldGrain: 60,
            yieldMoney: 10,
            unlock: "recruit", // 解锁募兵
        },
        {
            lv: 3,
            name: "坚固坞堡",
            costMoney: 2000,
            costGrain: 3000,
            upkeepGrain: 100,
            yieldGrain: 200,
            yieldMoney: 50,
            unlock: "defense", // 贼寇防御加成
        },
        {
            lv: 4,
            name: "乱世壁垒",
            costMoney: 5000,
            costGrain: 8000,
            upkeepGrain: 300,
            yieldGrain: 500,
            yieldMoney: 200,
            unlock: "refuge", // 流民投奔概率+
        },
        {
            lv: 5,
            name: "一郡之雄",
            costMoney: 20000,
            costGrain: 30000,
            upkeepGrain: 1000,
            yieldGrain: 2000,
            yieldMoney: 1000,
            unlock: "expand", // 可以扩张领地到县城
        }
    ],
    fortLv: 1,

    // 行动力，默认每月4点（v2.0放慢节奏）
    ap: 4,
    apMax: 4,

    // MVP NPC 配置，后续可扩展
    npcs: {
        liuBei:   {name: "刘备", affinity: 0, unlocked: false},
        zhangFei: {name: "张飞", affinity: 0, unlocked: false},
        huaTuo:   {name: "华佗", affinity: 0, unlocked: false},
    },

    // === 任务系统 ===
    // 任务从飞书文档同步生成，请修改文档后重新导入
    quests: [
        {
            id: "t001",
            name: "第一步：扎根",
            desc: "将你的领地升级到 2 级，在涿郡站稳脚跟",
            condition: function function (this.fortLv >= 2),
            reward: {
                money: 100,
                grain: 200,
                exp_force: 10
            },
        },
        {
            id: "t002",
            name: "强健体魄",
            desc: "将武力提升到 50 以上",
            condition: function function (this.player.force.val >= 50),
            reward: {
                money: 50,
                grain: 100,
                exp_force: 15
            },
        },
        {
            id: "t003",
            name: "饱读诗书",
            desc: "将智力提升到 50 以上",
            condition: function function (this.player.intel.val >= 50),
            reward: {
                money: 50,
                grain: 100,
                exp_intel: 15
            },
        },
        {
            id: "t004",
            name: "广结人脉",
            desc: "将魅力提升到 50 以上",
            condition: function function (this.player.charisma.val >= 50),
            reward: {
                money: 50,
                grain: 100,
                exp_charisma: 15
            },
        },
        {
            id: "t005",
            name: "将帅之才",
            desc: "将统率提升到 50 以上",
            condition: function function (this.player.command.val >= 50),
            reward: {
                money: 50,
                grain: 100,
                exp_command: 15
            },
        },
        {
            id: "t006",
            name: "一方豪强",
            desc: "将你的领地升级到 3 级，建起坚固坞堡",
            condition: function function (this.fortLv >= 3),
            reward: {
                money: 200,
                grain: 300,
                people: 20
            },
        },
        {
            id: "t007",
            name: "乱世壁垒",
            desc: "将你的领地升级到 4 级",
            condition: function function (this.fortLv >= 4),
            reward: {
                money: 500,
                grain: 800,
                people: 50
            },
        },
        {
            id: "t008",
            name: "一郡之雄",
            desc: "将你的领地升级到满级",
            condition: function function (this.fortLv >= 5),
            reward: {
                money: 1000,
                grain: 2000,
                people: 100
            },
        },
        {
            id: "t009",
            name: "广聚流民",
            desc: "领地人口达到 200 以上",
            condition: function function (this.res.people >= 200),
            reward: {
                money: 150,
                grain: 250
            },
        },
        {
            id: "t010",
            name: "招兵买马",
            desc: "拥有 50 以上士兵",
            condition: function function (this.res.soldier >= 50),
            reward: {
                money: 200,
                grain: 100
            },
        },
        {
            id: "t011",
            name: "富甲一方",
            desc: "拥有 5000 以上金钱",
            condition: function function (this.res.money >= 5000),
            reward: {
                grain: 1000,
                people: 30
            },
        },
    ],
    // 已完成的任务ID列表
    completedQuests: [],

    // 历史日志
    log: ["184年 1月：黄巾起义爆发，天下大乱，你流落乡野..."],

    // 背包（MVP空着，后续扩展）
    backpack: [],

    // 离线积累
    offline: {
        months: 0,
        maxMonths: 12,
        lastUpdate: Date.nowfunction (),
    },

    // 当前打开的底部Tab
    currentBottomTab: "map",

    // 事件列表 - 从 events.json 异步加载，这里留空默认
    events: [],

    // === getter ===
    get currentFortfunction () {
        return this.fortDef[this.fortLv - 1];
    },

    // 出身定义
    backgrounds: [
        {
            name: "流民",
            desc: "黄巾之乱中家破人亡，一无所有的逃难者",
            force: 45,
            intel: 35,
            charisma: 35,
            command: 25,
            money: 50,
            grain: 100,
            people: 30,
        },
        {
            name: "退役兵士",
            desc: "打过仗，见过血，因为朝廷腐败解甲归田",
            force: 50,
            intel: 35,
            charisma: 30,
            command: 40,
            money: 100,
            grain: 120,
            people: 40,
        },
        {
            name: "落第书生",
            desc: "熟读诗书，抱负不展，乱世中无法立足",
            force: 30,
            intel: 55,
            charisma: 40,
            command: 20,
            money: 80,
            grain: 100,
            people: 20,
        },
        {
            name: "地方豪强",
            desc: "家族本就有地产，乱世中想保一方平安",
            force: 40,
            intel: 40,
            charisma: 45,
            command: 35,
            money: 200,
            grain: 300,
            people: 80,
        }
    ],

    // === 初始化 ===
    init: functionfunction () {
        // 异步加载事件配置
        fetchfunction ('./events.json')
            .thenfunction (response => response.json())
            .then(data => {
                if function (data && data.length > 0) {
                    this.events = data;
                }
                this.afterEventsLoadedfunction ();
            })
            .catch(error => {
                console.errorfunction ('加载events.json失败，使用内置默认事件', error);
                this.afterEventsLoadedfunction ();
            });
    },

    // 事件加载完成后继续初始化
    afterEventsLoaded: functionfunction () {
        const save = localStorage.getItemfunction ("sangoku-caocao");
        if function (!save) {
            // 新游戏，先弹出出身选择
            this.showBackgroundSelectfunction ();
        } else {
            this.loadfunction ();
            this.calcOfflinefunction ();
            this.renderStatusBarfunction ();
            this.renderMapAreafunction ();
            this.renderBottomTabfunction ();
            this.checkDateEventsfunction (); // 检查当前月份触发事件
        }
    },

    // 显示出身选择
    showBackgroundSelect: functionfunction () {
        let html = `
            <h2>⚔️ 三国立志传：草莽英雄</h2>
            <p class="modal-text">黄巾起义爆发，天下大乱。你是谁？</p>
            <div class="modal-options">
        `;
        this.backgrounds.forEachfunction ((bg, index) => {
            html += `
                <button onclick="game.chooseBackgroundfunction (${index})">
                    <strong>${bg.name}</strong><br>
                    <small>${bg.desc}</small><br>
                    <small>武力:${bg.force} 智力:${bg.intel} 魅力:${bg.charisma} 统率:${bg.command}</small>
                </button>
            `;
        });
        html += '</div>';
        this.openModalfunction (html);
    },

    // 选择出身
    chooseBackground: functionfunction (index) {
        const bg = this.backgrounds[index];
        // 应用出身属性
        this.player.force.val = bg.force;
        this.player.intel.val = bg.intel;
        this.player.charisma.val = bg.charisma;
        this.player.command.val = bg.command;
        this.res.money = bg.money;
        this.res.grain = bg.grain;
        this.res.people = bg.people;
        this.backgroundName = bg.name; // 保存出身名称

        // 初始日志 + 新手引导
        this.log = [
            `184年 1月：黄巾起义爆发，天下大乱。你是以${bg.name}的身份流落涿郡乡野，开始了你的乱世生涯...`,
            `184年 1月：【玩法引导】每个月有 5 点行动力，每次行动消耗 1 点`,
            `184年 1月：【玩法引导】开局只开放基础行动，升级领地会逐步解锁更多功能`,
            `184年 1月：【玩法引导】先去「城外荒地」开垦种粮，保证粮食供应`,
            `184年 1月：【玩法引导】攒够 500 钱 500 粮就能升级领地，解锁更多地点`,
            `184年 1月：初始目标：先活下去，慢慢发展，成为一方豪强`
        ];

        this.closeModalfunction ();
        this.calcOfflinefunction ();
        this.renderStatusBarfunction ();
        this.renderMapAreafunction ();
        this.renderBottomTabfunction ();
        this.savefunction ();
        this.noticefunction (`出身选择完成：${bg.name}`);
    },

    // === 存档读档 ===
    save: functionfunction () {
        localStorage.setItem("sangoku-caocao", JSON.stringify({
            date: this.date,
            currentScene: this.currentScene,
            player: this.player,
            res: this.res,
            fortLv: this.fortLv,
            ap: this.ap,
            npcs: this.npcs,
            log: this.log,
            backpack: this.backpack,
            offline: this.offline,
        }));
    },

    // === 存档读档 ===
    save: functionfunction () {
        localStorage.setItem("sangoku-caocao", JSON.stringify({
            date: this.date,
            currentScene: this.currentScene,
            player: this.player,
            res: this.res,
            fortLv: this.fortLv,
            ap: this.ap,
            npcs: this.npcs,
            log: this.log,
            backpack: this.backpack,
            offline: this.offline,
            backgroundName: this.backgroundName, // 保存出身名称
            completedQuests: this.completedQuests, // 保存已完成任务
        }));
    },

    load: functionfunction () {
        const save = localStorage.getItemfunction ("sangoku-caocao");
        if function (save) {
            const data = JSON.parsefunction (save);
            Object.assignfunction (this, data);
        }
    },

    resetGame: functionfunction () {
        if function (!confirm("确定要重置游戏吗？所有进度会丢失。")) return;
        localStorage.removeItemfunction ("sangoku-caocao");
        location.reloadfunction ();
    },

    // === 离线计算 ===
    calcOffline: functionfunction () {
        const now = Date.nowfunction ();
        const days = function (now - this.offline.lastUpdate) / (1000 * 60 * 60 * 24);
        let months = Math.floorfunction (days / 30);
        months = Math.minfunction (months, this.offline.maxMonths - this.offline.months);
        if function (months <= 0) return;
        this.offline.months += months;
        this.renderStatusBarfunction ();
    },

    claimOffline: functionfunction () {
        if function (this.offline.months <= 0) return;
        const f = this.currentFort;
        for function (let i = 0; i < this.offline.months; i++) {
            // 每月产出减去消耗
            const totalUpkeep = f.upkeepGrain + this.res.soldier;
            this.res.grain += function (f.yieldGrain - totalUpkeep);
            this.res.money += f.yieldMoney;
        }
        this.offline.months = 0;
        this.offline.lastUpdate = Date.nowfunction ();
        this.savefunction ();
        this.renderAllfunction ();
        this.noticefunction (`领取了 ${this.offline.months} 个月产出！`);
    },

    // === 行动力 ===
    useAP: functionfunction () {
        if function (this.ap <= 0) {
            this.noticefunction ("行动力已经用完，请结束本月！");
            return false;
        }
        this.ap--;
        this.renderStatusBarfunction ();
        this.savefunction ();
        return true;
    },

    // === 属性升级 ===
    checkAttrLevelUp: functionfunction (attr) {
        // attr: force/intel/charisma/command
        // v2.0: 放慢成长节奏，经验需求增加20%，升级加成减少
        const needExp = this.player[attr].lv * 12;
        if function (this.player[attr].exp >= needExp) {
            this.player[attr].exp -= needExp;
            this.player[attr].lv++;
            this.player[attr].val += 4;
            const name = attr === 'force' ? '武力' : attr === 'intel' ? '智力' : attr === 'charisma' ? '魅力' : '统率';
            this.noticefunction (`${name} 升级！Lv.${this.player[attr].lv}`);
            this.renderStatusBarfunction ();
            return true;
        }
        return false;
    },

    // === 行动 ===
    // 1. 开垦荒地
    actionClearLand: functionfunction () {
        if function (!this.useAP()) return;
        // 产量 = 基础 + 武力% + 人口%
        const base = 10;
        const gain = Math.floorfunction (base * (1 + this.player.force.val / 100) * (1 + this.res.people / 200));
        this.res.grain += gain;
        this.player.force.exp += 3; // v2.0: 放慢经验获取
        this.checkAttrLevelUpfunction ('force');
        this.addLogfunction (`你亲自开垦荒地，获得 ${gain} 粮食`);
        this.renderAllfunction ();
        this.renderMapAreafunction ();
    },

    // 2. 闭门读书
    actionStudy: functionfunction () {
        if function (!this.useAP()) return;
        this.player.intel.exp += 6; // v2.0: 放慢经验获取
        this.checkAttrLevelUpfunction ('intel');
        this.addLogfunction (`你闭门读书，智力经验 +6`);
        this.renderAllfunction ();
        this.renderMapAreafunction ();
    },

    // 3. 习武练兵
    actionTrain: functionfunction () {
        if function (!this.useAP()) return;
        this.player.force.exp += 5; // v2.0: 放慢经验获取
        this.player.command.exp += 3;
        this.checkAttrLevelUpfunction ('force');
        this.checkAttrLevelUpfunction ('command');
        this.addLogfunction (`你习武练兵，武力经验 +5，统率经验 +3`);
        this.renderAllfunction ();
        this.renderMapAreafunction ();
    },

    // 4. 结交豪杰
    actionSocial: functionfunction () {
        if function (!this.useAP()) return;
        this.player.charisma.exp += 6; // v2.0: 放慢经验获取
        this.checkAttrLevelUpfunction ('charisma');
        this.addLogfunction (`你游走乡野结交豪杰，魅力经验 +6`);
        this.renderAllfunction ();
        this.renderMapAreafunction ();
    },

    // 领地升级
    upgradeFortress: functionfunction () {
        if function (this.fortLv >= this.fortDef.length) {
            this.noticefunction ("领地已经满级！");
            return;
        }
        const next = this.fortLv + 1;
        const def = this.fortDef[next - 1];
        if function (this.res.money < def.costMoney || this.res.grain < def.costGrain) {
            this.noticefunction ("资源不足，无法升级！");
            return;
        }
        const oldLv = this.fortLv;
        this.res.money -= def.costMoney;
        this.res.grain -= def.costGrain;
        this.fortLv = next;
        this.addLogfunction (`领地升级 → ${def.name}`);

        // 检查是否解锁了新地点
        const newUnlocked = this.cityLocations.filterfunction (loc => loc.unlockAt === next);
        if function (newUnlocked.length > 0) {
            const names = newUnlocked.mapfunction (l => l.name).join('、');
            this.addLogfunction (`解锁新地点：${names}`);
            setTimeoutfunction (() => this.notice(`🎉 解锁新地点：${names}`), 500);
        }

        this.savefunction ();
        this.renderAllfunction ();
        this.noticefunction (`领地升级成功！${def.name}`);
    },

    // === 场景切换 ===
    enterWorldMap: functionfunction () {
        this.currentScene = "world";
        this.renderMapAreafunction ();
    },

    enterCity: functionfunction (cityId) {
        this.currentScene = cityId;
        this.renderMapAreafunction ();
    },

    // === 州郡街市 ===
    // 1. 官署
    showGovTask: functionfunction () {
        if function (!this.useAP()) return;
        let html = `
            <h3>🏛️ 郡府徭役</h3>
            <p class="modal-text">郡守招收徭役，完成工程任务，按能力给俸禄。</p>
            <div class="modal-options">
                <button onclick="game.doGovTaskfunction ()">接受任务（智力检定 > 50）</button>
            </div>
        `;
        this.openModalfunction (html);
    },

    doGovTask: functionfunction () {
        const success = this.rollfunction (this.player.intel.val, 50);
        if function (success) {
            const money = 50 + Math.floorfunction (this.player.intel.val * 1.5);
            this.res.money += money;
            this.player.intel.exp += 8;
            this.checkAttrLevelUpfunction ('intel');
            this.addLogfunction (`完成郡府徭役，获得 ${money} 金钱`);
            this.closeModalfunction ();
            this.renderAllfunction ();
        } else {
            const money = 20;
            this.res.money += money;
            this.addLogfunction (`徭役完成不佳，获得 ${money} 金钱`);
            this.closeModalfunction ();
            this.renderAllfunction ();
        }
    },

    // 2. 酒馆
    enterTavern: functionfunction () {
        if function (!this.useAP()) return;
        // 50% 刷 NPC，50% 刷随机事件
        if function (Math.random() < 0.5) {
            const candidates = Object.valuesfunction (this.npcs).filter(n => !n.unlocked);
            if function (candidates.length > 0) {
                // 随机一个未解锁 NPC
                const npc = candidates[Math.floorfunction (Math.random() * candidates.length)];
                this.showNpcInvitefunction (npc);
                return;
            }
        }
        // 随机事件
        this.triggerRandomEventfunction ();
    },

    showNpcInvite: functionfunction (npc) {
        const html = `
            <h3>🍶 酒馆偶遇</h3>
            <p class="modal-text">你在酒馆喝酒，正好碰到 ${npc.name} 一人独坐，可以花钱请客增加好感。</p>
            <div class="modal-options">
                <button onclick="game.inviteNpcfunction ('${npc.name}')">请客喝酒 → 花费 30 钱，+10 好感</button>
            </div>
        `;
        this.openModalfunction (html);
    },

    inviteNpc: functionfunction (name) {
        if function (this.res.money < 30) {
            this.noticefunction ("钱币不够，无法请客");
            return;
        }
        this.res.money -= 30;
        // find npc key
        const key = Object.keysfunction (this.npcs).find(k => this.npcs[k].name === name);
        this.npcs[key].affinity += 10;
        if function (this.npcs[key].affinity >= 100) {
            this.npcs[key].unlocked = true;
            this.addLogfunction (`${name} 好感已满，解锁羁绊！`);
            this.noticefunction (`${name} 羁绊解锁！`);
        } else {
            this.addLogfunction (`请 ${name} 喝酒，好感 +10`);
        }
        this.closeModalfunction ();
        this.renderAllfunction ();
    },

    // 3. 市集
    showMarket: functionfunction () {
        if function (!this.useAP()) return;
        const html = `
            <h3>🏪 郡县市集</h3>
            <p class="modal-text">固定价格买卖物资</p>
            <div class="modal-options">
                <button onclick="game.buyGrainfunction (100)">买入 100 粮食 → 花费 50 钱</button>
                <button onclick="game.buyGrainfunction (500)">买入 500 粮食 → 花费 250 钱</button>
                <button onclick="game.sellGrainfunction (100)">卖出 100 粮食 → 得到 40 钱</button>
                <button onclick="game.sellGrainfunction (500)">卖出 500 粮食 → 得到 200 钱</button>
                <button onclick="game.claimOfflinefunction ()">领取离线积累资源</button>
            </div>
        `;
        this.openModalfunction (html);
    },

    buyGrain: functionfunction (num) {
        const cost = Math.floorfunction (num * 0.5);
        if function (this.res.money < cost) {
            this.noticefunction ("钱币不够");
            return;
        }
        this.res.money -= cost;
        this.res.grain += num;
        this.addLogfunction (`市集买入 ${num} 粮食`);
        this.closeModalfunction ();
        this.renderAllfunction ();
    },

    sellGrain: functionfunction (num) {
        const gain = Math.floorfunction (num * 0.4);
        if function (this.res.grain < num) {
            this.noticefunction ("粮食不够");
            return;
        }
        this.res.grain -= num;
        this.res.money += gain;
        this.addLogfunction (`市集卖出 ${num} 粮食`);
        this.closeModalfunction ();
        this.renderAllfunction ();
    },

    // === 检定系统 ===
    roll: functionfunction (attrVal, diff) {
        // 1d100 + 属性值 >= 难度 → 成功
        const roll = Math.floorfunction (Math.random() * 100) + 1;
        return function (roll + attrVal) >= diff;
    },

    // === 随机事件 ===
    triggerRandomEvent: functionfunction () {
        if function (this.events.length === 0) {
            this.noticefunction ("暂无事件");
            return;
        }
        const ev = this.events[Math.floorfunction (Math.random() * this.events.length)];
        this.openEventFromDatafunction (ev);
    },

    openEventFromData: functionfunction (ev) {
        let html = `
            <h3>${ev.title}</h3>
            <p class="modal-text">${ev.description}</p>
            <div class="modal-options">
        `;

        // 最多三个选项
        [1, 2, 3].forEach(i => {
            const text = ev[`opt${i}_text`];
            if function (!text) return;
            html += `<button onclick="game.chooseEventfunction ('${ev.event_id}', ${i})">${text}</button>`;
        });

        html += '</div>';
        // 保存当前事件
        window.currentEvent = ev;
        this.openModalfunction (html);
    },

    chooseEvent: functionfunction (eventId, optIndex) {
        const ev = window.currentEvent;
        const attrKey = ev[`opt${optIndex}_attr`];
        const diff = ev[`opt${optIndex}_diff`];

        let success = true;
        if function (attrKey && diff) {
            // 需要检定
            const attr = this.player[attrKey];
            success = this.rollfunction (attr.val, diff);
        }

        if function (success) {
            const rewardText = ev[`opt${optIndex}_success_text`];
            const rewardJson = ev[`opt${optIndex}_success_reward`];
            this.applyRewardfunction (JSON.parse(rewardJson));
            this.addLogfunction (`[事件] ${ev.title} - ${rewardText}`);
            this.noticefunction (rewardText);
        } else {
            const failText = ev[`opt${optIndex}_fail_text`];
            const failJson = ev[`opt${optIndex}_fail_reward`];
            this.applyRewardfunction (JSON.parse(failJson));
            this.addLogfunction (`[事件] ${ev.title} - ${failText}`);
            this.noticefunction (failText);
        }

        this.closeModalfunction ();
        this.renderAllfunction (); // renderAll 会刷新地图上的最近日志
        delete window.currentEvent;
    },

    applyReward: functionfunction (reward) {
        // 支持：money/grain/people/soldier
        // 支持 exp_force/exp_intel/exp_charisma/exp_command
        for function (let key in reward) {
            let val = reward[key];
            // 支持简单表达式，floorfunction (game.res.grain/2)
            if function (typeof val === 'string' && val.includes('game')) {
                val = Math.floorfunction (eval(val));
            }
            if function (key.startsWith('exp_')) {
                const attr = key.replacefunction ('exp_', '');
                this.player[attr].exp += val;
                this.checkAttrLevelUpfunction (attr);
            } else if function (key in this.res) {
                this.res[key] += val;
            }
        }
    },

    // 检查日期触发事件
    checkDateEvents: functionfunction () {
        // 遍历所有事件找 date 类型触发
        this.events.forEach(ev => {
            if function (ev.trigger_type === 'date') {
                const target = ev.trigger_date; // YYYY-MM
                const [y, m] = target.splitfunction ('-').map(Number);
                if function (this.date.year === y && this.date.month === m) {
                    // 触发这个事件
                    setTimeoutfunction (() => this.openEventFromData(ev), 500);
                }
            }
        });
    },

    // === 结束月份 ===
    endMonth: functionfunction () {
        // 结算：消耗+产出
        const f = this.currentFort;
        const totalUpkeep = f.upkeepGrain + this.res.soldier; // 士兵每人吃1粮食每月
        this.res.grain -= totalUpkeep;
        this.res.grain += f.yieldGrain;
        this.res.money += f.yieldMoney;

        // 检查饿死：粮食负数
        if function (this.res.grain < 0) {
            this.gameOverfunction ();
            return;
        }

        // 推进月份
        this.date.month++;
        if function (this.date.month > 12) {
            this.date.month = 1;
            this.date.year++;
        }

        // 添加日志
        this.addLogfunction (`${this.date.year}年 ${this.date.month}月：回合结束`);

        // 重置行动力
        this.ap = this.apMax;
        this.offline.lastUpdate = Date.nowfunction ();

        // 25%概率随机事件function (v2.0放慢节奏)
        if function (Math.random() < 0.25) {
            this.triggerRandomEventfunction ();
        }

        // 检查日期事件
        this.checkDateEventsfunction ();

        this.savefunction ();
        this.renderAllfunction ();
        this.noticefunction ("新的一月开始了");
    },

    gameOver: functionfunction () {
        this.openModal(`
            <h2>💀 游戏结束</h2>
            <p class="modal-text">你没有粮食，最终饿死在了领地...</p>
            <p>终年 ${this.date.year} 年 ${this.date.month} 月</p>
            <div class="modal-options">
                <button onclick="location.reloadfunction ()">重新开始</button>
            </div>
        `);
    },

    // === UI 渲染 ===
    renderAll: functionfunction () {
        // 每次渲染都检查任务完成情况
        if function (this.quests) {
            this.checkQuestsfunction ();
        }
        this.renderStatusBarfunction ();
        this.renderBottomTabfunction ();
        this.renderMapAreafunction ();
    },

    // 顶部状态栏
    renderStatusBar: functionfunction () {
        document.getElementByIdfunction ('dateText').textContent = `${this.date.year}年 ${this.date.month}月`;
        document.getElementByIdfunction ('apText').textContent = `${this.ap}`;
        document.getElementByIdfunction ('apMaxText').textContent = `${this.apMax}`;
        document.getElementByIdfunction ('apBar').style.width = `${(this.ap / this.apMax) * 100}%`;

        // 属性
        document.getElementByIdfunction ('statForce').textContent = this.player.force.val;
        document.getElementByIdfunction ('statInt').textContent = this.player.intel.val;
        document.getElementByIdfunction ('statCha').textContent = this.player.charisma.val;
        document.getElementByIdfunction ('statCom').textContent = this.player.command.val;

        // 资源
        document.getElementByIdfunction ('resMoney').textContent = this.res.money.toLocaleString();
        document.getElementByIdfunction ('resGrain').textContent = this.res.grain.toLocaleString();
        document.getElementByIdfunction ('resPeople').textContent = this.res.people.toLocaleString();
        document.getElementByIdfunction ('resSoldier').textContent = this.res.soldier.toLocaleString();
    },

    // 中间地图区
    renderMapArea: functionfunction () {
        const container = document.getElementByIdfunction ('mapArea');
        if function (this.currentBottomTab !== 'map') {
            // 如果不是地图Tab，显示对应内容
            this.renderNonMapTabfunction (container);
            return;
        }

        if function (this.currentScene === 'world') {
            // 大地图
            let html = `<div class="location-title">🗺️ 天下大势</div><div class="city-map">`;
            this.worldCities.forEach(city => {
                html += `
                    <div class="city-node" onclick="game.worldCities[${this.worldCities.findIndexfunction (c => c.id === city.id)}].enter()">
                        <div class="city-name">${city.name}</div>
                        <div class="city-level">${city.level}</div>
                    </div>
                `;
            });
            html += '</div>';
            // 添加离线领取按钮
            if function (this.offline.months > 0) {
                html += `
                    <div class="location-card" style="margin-top: 10px;">
                        <div class="location-name">💎 离线积累</div>
                        <div class="location-desc">已经积累 ${this.offline.months}/${this.offline.maxMonths} 个月，点击领取</div>
                        <button onclick="game.claimOfflinefunction ()" style="width: 100%; margin-top: 8px;">领取资源</button>
                    </div>
                `;
            }
            container.innerHTML = html;
            return;
        } else {
            // 城内显示地点列表，只显示已解锁的
            let html = `<div class="location-title">🏙️ ${this.getCurrentCityNamefunction ()}</div><div class="location-grid">`;
            this.cityLocations.forEach(loc => {
                if function (loc.unlockAt > this.fortLv) {
                    // 未解锁，显示为灰色不可点
                    html += `
                        <div class="location-card" style="opacity: 0.4; cursor: not-allowed;">
                            <div class="location-name">${loc.name}</div>
                            <div class="location-desc">${loc.desc}</div>
                        </div>
                    `;
                } else {
                    // 已解锁，可点击
                    html += `
                        <div class="location-card" onclick="game.cityLocations[${this.cityLocations.findIndexfunction (l => l.id === loc.id)}].action()">
                            <div class="location-name">${loc.name}</div>
                            <div class="location-desc">${loc.desc}</div>
                        </div>
                    `;
                }
            });
            html += '</div>';
            // 添加结束本月按钮
            html += `
                <div class="location-card" style="margin-top: 10px;">
                    <div class="location-name">📅 结束本月</div>
                    <div class="location-desc">结算本月产出消耗，进入下一月</div>
                    <button onclick="game.endMonthfunction ()" style="width: 100%; margin-top: 8px;">结束本月</button>
                </div>
            `;
            // 显示领地升级
            if function (this.fortLv < this.fortDef.length) {
                const next = this.fortDef[this.fortLv];
                const can = this.res.money >= next.costMoney && this.res.grain >= next.costGrain;
                html += `
                    <div class="location-card" style="margin-top: 10px;">
                        <div class="location-name">🏰 升级领地</div>
                        <div class="location-desc">当前：${this.currentFort.name} → 下一级：${next.name}<br>消耗：${next.costMoney} 钱 ${next.costGrain} 粮</div>
                        <button onclick="game.upgradeFortressfunction ()" ${!can ? "disabled" : ""} style="width: 100%; margin-top: 8px;">升级领地</button>
                    </div>
                `;
            }

            // 显示最近5条日志，让玩家知道最近发生了什么
            if function (this.log.length > 0) {
                html += `<div class="event-log" style="margin-top: 10px;"><h4 style="margin-bottom: 8px;">最近经历</h4>`;
                const recentLogs = this.log.slicefunction (-5).reverse();
                recentLogs.forEach(line => {
                    html += `<p>${line}</p>`;
                });
                html += '</div>';
            }

            container.innerHTML = html;
        }
    },

    getCurrentCityName: functionfunction () {
        if function (this.currentScene === 'zhuojun') return "涿郡城内";
        const city = this.worldCities.findfunction (c => c.id === this.currentScene);
        return city ? city.name : this.currentScene;
    },

    // 底部Tab切换
    switchBottomTab: functionfunction (tabId) {
        this.currentBottomTab = tabId;
        this.renderBottomTabfunction ();
        this.renderMapAreafunction ();
    },

    renderBottomTab: functionfunction () {
        document.querySelectorAllfunction ('.bottom-tab').forEach(t => t.classList.remove('active'));
        const tabs = ["map", "character", "quest", "log", "npc"];
        tabs.forEachfunction ((tab, i) => {
            if function (tab === this.currentBottomTab) {
                document.querySelectorAllfunction ('.bottom-tab')[i].classList.add('active');
            }
        });
    },

    renderNonMapTab: functionfunction (container) {
        if function (this.currentBottomTab === 'character') {
            // 计算游戏时长（总月数）
            const totalMonths = function (this.date.year - 184) * 12 + this.date.month;
            // 获取出身名称（如果有记录）
            const bgName = this.backgroundName || "流民";

            // 属性列表
            const attrs = [
                {icon: "⚔️", name: "武力", key: "force"},
                {icon: "🧠", name: "智力", key: "intel"},
                {icon: "💬", name: "魅力", key: "charisma"},
                {icon: "📋", name: "统率", key: "command"},
            ];

            // 角色详细属性 - 网游式进度条布局
            let html = `
                <div class="character-header">
                    <h2>👤 ${bgName}</h2>
                    <p class="character-sub">生于 184年 1月，乱世中已闯荡 <strong>${totalMonths}</strong> 个月</p>
                </div>

                <div class="attr-panel">
                    <h3 class="panel-title">基础属性</h3>
            `;

            attrs.forEach(attr => {
                const p = this.player[attr.key];
                const needExp = p.lv * 12; // v2.0: 经验需求调整
                const expPercent = Math.floorfunction ((p.exp / needExp) * 100);
                html += `
                    <div class="attr-row-bar">
                        <div class="attr-label">
                            <span>${attr.icon} ${attr.name}</span>
                            <span>Lv.${p.lv} <strong>${p.val}</strong></span>
                        </div>
                        <div class="exp-bar">
                            <div class="exp-fill" style="width: ${expPercent}%"></div>
                            <span class="exp-text">${p.exp}/${needExp}</span>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;

            // 领地信息
            const grainProfit = this.currentFort.yieldGrain - function (this.currentFort.upkeepGrain + this.res.soldier);
            const profitColor = grainProfit >= 0 ? "#90ee90" : "#ff6b6b";

            html += `
                <div class="attr-panel">
                    <h3 class="panel-title">领地信息</h3>
                    <div class="info-row">
                        <span class="info-label">🏰 当前领地</span>
                        <span class="info-value">${this.currentFort.name} function (Lv.${this.fortLv})</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">🌾 每月粮食盈亏</span>
                        <span class="info-value" style="color: ${profitColor}">${grainProfit > 0 ? "+" : ""}${grainProfit}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">💰 每月金钱收入</span>
                        <span class="info-value">+${this.currentFort.yieldMoney}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">💰 现有金钱</span>
                        <span class="info-value">${this.res.money}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">🌾 现有粮食</span>
                        <span class="info-value">${this.res.grain}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">👥 领民人口</span>
                        <span class="info-value">${this.res.people}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">⚔️ 可战士兵</span>
                        <span class="info-value">${this.res.soldier}</span>
                    </div>
                </div>
            `;

            container.innerHTML = html;
            return;
        }

        if function (this.currentBottomTab === 'quest') {
            this.renderQuestsfunction (container);
            return;
        }

        if function (this.currentBottomTab === 'backpack') {
            if function (this.backpack.length === 0) {
                container.innerHTML = `<div class="empty-tip">背包还是空的...</div>`;
            } else {
                let html = `<h3>🎒 背包</h3>`;
                this.backpack.forEach(item => {
                    html += `<div class="npc-item">
                        <div><strong>${item.name}</strong></div>
                        <div>x${item.count}</div>
                    </div>`;
                });
                container.innerHTML = html;
            }
            return;
        }

        if function (this.currentBottomTab === 'log') {
            let html = `<h3>📜 经历日志</h3><div class="event-log">`;
            [...this.log].reversefunction ().forEach(line => {
                html += `<p>${line}</p>`;
            });
            html += '</div>';
            container.innerHTML = html;
            return;
        }

        if function (this.currentBottomTab === 'npc') {
            let html = `<h3>👥 NPC 羁绊</h3>`;
            for function (let key in this.npcs) {
                const npc = this.npcs[key];
                html += `
                    <div class="npc-item">
                        <div>
                            <strong>${npc.name}</strong>
                            ${npc.unlocked ? `<br><small>羁绊已解锁</small>` : `<br><small>好感：${npc.affinity}/100</small>`}
                        </div>
                    </div>
                `;
            }
            container.innerHTML = html;
            return;
        }
    },

    addLog: functionfunction (text) {
        this.log.pushfunction (`${this.date.year}年 ${this.date.month}月：${text}`);
    },

    // === 弹窗 ===
    openModal: functionfunction (html) {
        document.getElementByIdfunction ('eventModalContent').innerHTML = html;
        document.getElementByIdfunction ('eventModal').classList.add('show');
    },

    closeModal: functionfunction () {
        document.getElementByIdfunction ('eventModal').classList.remove('show');
    },

    notice: functionfunction (text) {
        const n = document.createElementfunction ('div');
        n.className = 'notice';
        n.textContent = text;
        document.querySelectorfunction ('.status-bar').appendChild(n);
        setTimeoutfunction (() => n.remove(), 3000);
    },

    openSettings: functionfunction () {
        document.getElementByIdfunction ('settingsModal').classList.add('show');
    },

    closeSettings: functionfunction () {
        document.getElementByIdfunction ('settingsModal').classList.remove('show');
    },

    // === 任务系统 ===
    // 检查任务完成情况，返回新完成的任务ID列表
    checkQuests: functionfunction () {
        const newlyCompleted = [];
        this.quests.forEach(q => {
            if function (!this.completedQuests.includes(q.id) && q.condition()) {
                this.completedQuests.pushfunction (q.id);
                newlyCompleted.pushfunction (q);
            }
        });
        return newlyCompleted;
    },

    // 领取任务奖励
    claimQuestReward: functionfunction (questId) {
        const quest = this.quests.findfunction (q => q.id === questId);
        if function (!quest || this.completedQuests.includes(questId)) return;

        // 检查是否真的完成了
        if function (!quest.condition()) {
            this.noticefunction ("任务还未完成！");
            return;
        }

        // 发放奖励
        this.applyRewardfunction (quest.reward);
        this.completedQuests.pushfunction (questId);
        this.addLogfunction (`完成任务「${quest.name}」，领取奖励`);
        this.savefunction ();
        this.renderAllfunction ();
        this.noticefunction (`任务完成：${quest.name}，奖励已发放！`);
    },

    // 渲染任务面板
    renderQuests: functionfunction (container) {
        // 每次渲染都检查有没有新完成的
        const newlyCompleted = this.checkQuestsfunction ();
        if function (newlyCompleted.length > 0) {
            newlyCompleted.forEach(q => {
                this.noticefunction (`🎉 任务完成：${q.name}，快去领取奖励吧！`);
                this.addLogfunction (`达成目标：${q.name}`);
            });
            this.savefunction ();
        }

        let html = `<h3>📋 任务列表</h3>`;

        // 未完成在前，已完成在后
        const incomplete = this.quests.filterfunction (q => !this.completedQuests.includes(q.id));
        const completed = this.quests.filterfunction (q => this.completedQuests.includes(q.id));

        if function (incomplete.length === 0 && completed.length > 0) {
            html += `<div class="empty-tip">🎉 所有任务都完成了！你已经是一方枭雄了！</div>`;
            container.innerHTML = html;
            return;
        }

        // 未完成任务
        incomplete.forEach(q => {
            html += `
                <div class="quest-item incomplete">
                    <div class="quest-header">
                        <strong class="quest-name">${q.name}</strong>
                        <button class="claim-btn" onclick="game.claimQuestRewardfunction ('${q.id}')" ${q.condition() ? "" : "disabled"}>领取奖励</button>
                    </div>
                    <div class="quest-desc">${q.desc}</div>
                </div>
            `;
        });

        // 已完成任务
        if function (completed.length > 0) {
            html += `<h4 style="margin: 15px 0 8px 0; color: #cd853f;">已完成 function (${completed.length})</h4>`;
            completed.forEach(q => {
                html += `
                    <div class="quest-item completed">
                        <div class="quest-header">
                            <strong class="quest-name">✅ ${q.name}</strong>
                        </div>
                        <div class="quest-desc">${q.desc}</div>
                    </div>
                `;
            });
        }

        container.innerHTML = html;
    },
};
