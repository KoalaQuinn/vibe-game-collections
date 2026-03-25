    // === 任务系统 ===
    // 任务从飞书文档同步生成，请修改文档后重新导入
    quests: [
        {
            id: "t001",
            name: "第一步：扎根",
            desc: "将你的领地升级到 2 级，在涿郡站稳脚跟",
            condition: () => (this.fortLv >= 2),
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
            condition: () => (this.player.force.val >= 50),
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
            condition: () => (this.player.intel.val >= 50),
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
            condition: () => (this.player.charisma.val >= 50),
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
            condition: () => (this.player.command.val >= 50),
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
            condition: () => (this.fortLv >= 3),
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
            condition: () => (this.fortLv >= 4),
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
            condition: () => (this.fortLv >= 5),
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
            condition: () => (this.res.people >= 200),
            reward: {
                money: 150,
                grain: 250
            },
        },
        {
            id: "t010",
            name: "招兵买马",
            desc: "拥有 50 以上士兵",
            condition: () => (this.res.soldier >= 50),
            reward: {
                money: 200,
                grain: 100
            },
        },
        {
            id: "t011",
            name: "富甲一方",
            desc: "拥有 5000 以上金钱",
            condition: () => (this.res.money >= 5000),
            reward: {
                grain: 1000,
                people: 30
            },
        },
    ],
    // 已完成的任务ID列表
    completedQuests: [],
