// 🍜 异界小吃店 - 数据文件
// 角色、菜谱、对话数据

// === 角色数据 ===
const characters = [
    {
        id: 'elf-girl',
        name: '艾拉',
        race: '精灵弓箭手',
        emoji: '🧝',
        description: '来自森林的精灵弓箭手，偶然穿过传送门来到这里',
        firstMeet: '这里...是什么地方？好香的味道...',
        affinity: 0,
        unlockReputation: 0,
        dialogues: [
            {
                affinityReq: 0,
                text: '我在森林里打猎，突然一道光，我就到这里来了...',
                choices: [
                    {text: '要不要尝尝我们这里的蛋炒饭？', next: 'elf-1-1', affinityAdd: 5, foodUnlock: 'fried-rice'},
                    {text: '你先坐，我给你倒杯水', next: 'elf-1-2', affinityAdd: 3}
                ]
            },
            {
                id: 'elf-1-1',
                affinityReq: 0,
                text: '蛋...炒饭？这是什么，能吃吗？我们精灵只吃果实和露水...',
                choices: [
                    {text: '尝尝就知道了，超级香！', next: 'elf-1-1-1', affinityAdd: 10},
                    {text: '不爱吃那就算了...', next: 'elf-1-1-2', affinityAdd: -5}
                ]
            },
            {
                id: 'elf-1-1-1',
                affinityReq: 0,
                text: '(尝了一口)...哇！这个米粒好香，还有鸡蛋的味道！从来没吃过这么好吃的东西！',
                choices: [
                    {text: '喜欢就常来，我给你打折', next: 'end', affinityAdd: 15, moneyAdd: 10, reputationAdd: 5}
                ]
            },
            {
                id: 'elf-1-1-2',
                affinityReq: 0,
                text: '...好吧，那我走了...(看起来有点失落)',
                choices: [
                    {text: '别走，其实可以尝尝看嘛', next: 'elf-1-1-1', affinityAdd: 5}
                ]
            },
            {
                id: 'elf-1-2',
                affinityReq: 0,
                text: '谢谢你...水很清甜，你们这里人真好',
                choices: [
                    {text: '要不要试试招牌蛋炒饭？', next: 'elf-1-1', affinityAdd: 5}
                ]
            },
            {
                affinityReq: 20,
                text: '最近森林那边不太安稳，魔兽变多了，来你这里躲躲...',
                choices: [
                    {text: '那就多待几天，我每天给你做好吃的', next: 'end', affinityAdd: 10, reputationAdd: 3},
                    {text: '躲一天要交保护费哦', next: 'elf-2-2', affinityAdd: -5, moneyAdd: 20}
                ]
            },
            {
                id: 'elf-2-2',
                affinityReq: 20,
                text: '...你果然和那些贪婪的人类商人一样，我看错你了',
                choices: [
                    {text: '开玩笑的啦，我请你吃糖醋排骨', next: 'end', affinityAdd: 0, foodUnlock: 'sweet-sour-ribs'}
                ]
            },
            {
                affinityReq: 50,
                text: '我喜欢你做的饭...也喜欢你...这里比森林热闹多了',
                choices: [
                    {text: '那你以后就住在这里吧，我养你', next: 'end', affinityAdd: 20, reputationAdd: 10},
                    {text: '喜欢你做的饭 才不是喜欢你', next: 'end', affinityAdd: 5}
                ]
            },
            {
                affinityReq: 80,
                text: '昨天晚上我看到天上有星星，在这里看星星比在森林里清楚多了',
                choices: [
                    {text: '晚上我搬个椅子，我们一起看星星', next: 'end', affinityAdd: 15},
                    {text: '那是因为这里没有大树挡住嘛', next: 'end', affinityAdd: 5}
                ]
            }
        ]
    },
    {
        id: 'orc-warrior',
        name: '格鲁姆',
        race: '兽人战士',
        emoji: '👹',
        description: '从战场逃出来的兽人战士，食量很大',
        firstMeet: '......好香！哪里来的香味！',
        affinity: 0,
        unlockReputation: 10,
        dialogues: [
            {
                affinityReq: 0,
                text: '我是格鲁姆，战斗...饿了，给我来点吃的！',
                choices: [
                    {text: '来一碗红烧肉怎么样？管饱！', next: 'orc-1-1', affinityAdd: 8, foodUnlock: 'braised-pork'},
                    {text: '先给钱再吃', next: 'orc-1-2', affinityAdd: -3, moneyAdd: 0}
                ]
            },
            {
                id: 'orc-1-1',
                affinityReq: 0,
                text: '红烧肉！！！听起来就很棒！兽人就喜欢吃肉！',
                choices: [
                    {text: '拿好，慢慢吃', next: 'orc-1-1-1', affinityAdd: 10}
                ]
            },
            {
                id: 'orc-1-1-1',
                affinityReq: 0,
                text: '(狼吞虎咽)...太好吃了！！！比我们部落的烤半生肉好吃一万倍！',
                choices: [
                    {text: '喜欢就多来点，我这里管饱', next: 'end', affinityAdd: 15, moneyAdd: 15, reputationAdd: 8}
                ]
            },
            {
                id: 'orc-1-2',
                affinityReq: 0,
                text: '...哼，人类都这样贪心，算了，我走了',
                choices: [
                    {text: '回来回来，今天我请客', next: 'orc-1-1', affinityAdd: 5}
                ]
            },
            {
                affinityReq: 30,
                text: '我们部落和矮人打起来了，我看两边都没好处',
                choices: [
                    {text: '打什么仗，坐下吃饭不好吗', next: 'end', affinityAdd: 10, reputationAdd: 5},
                    {text: '打赢了有奖金吗', next: 'end', affinityAdd: -5}
                ]
            },
            {
                affinityReq: 60,
                text: '你的菜太好吃了，我以后不打仗了，就在这里给你当保镖！',
                choices: [
                    {text: '好啊，包吃住，每天有肉吃', next: 'end', affinityAdd: 20, reputationAdd: 15},
                    {text: '保镖要工资的，我可没钱', next: 'end', affinityAdd: -5}
                ]
            },
            {
                affinityReq: 100,
                text: '老板！门口有几个小毛贼找麻烦，我去解决他们！',
                choices: [
                    {text: '小心点，打完回来给你加个菜', next: 'end', affinityAdd: 20}
                ]
            }
        ]
    },
    {
        id: 'vampire',
        name: '德古拉',
        race: '吸血鬼伯爵',
        emoji: '🧛',
        description: '活了几千年的吸血鬼伯爵，偶尔迷路',
        firstMeet: '嗯？这里怎么会有这么香的味道...',
        affinity: 0,
        unlockReputation: 30,
        dialogues: [
            {
                affinityReq: 0,
                text: '我从棺材里醒过来，发现一切都变了，这里是哪里？',
                choices: [
                    {text: '这里是我的小吃店，要不要尝尝咖啡？', next: 'vamp-1-1', affinityAdd: 5, foodUnlock: 'coffee'},
                    {text: '吸血鬼？我这里不喝血哦', next: 'vamp-1-2', affinityAdd: -2}
                ]
            },
            {
                id: 'vamp-1-1',
                affinityReq: 0,
                text: '咖啡？我在古老的东方游记里见过...尝一口',
                choices: [
                    {text: '这是现磨的，加点奶', next: 'vamp-1-1-1', affinityAdd: 10}
                ]
            },
            {
                id: 'vamp-1-1-1',
                affinityReq: 0,
                text: '...苦味过后有回甘，还有奶的香气，不错不错，几千年没喝过这么舒服的东西了',
                choices: [
                    {text: '喜欢就常来坐，晚上我这里很安静', next: 'end', affinityAdd: 15, moneyAdd: 30, reputationAdd: 12}
                ]
            },
            {
                id: 'vamp-1-2',
                affinityReq: 0,
                text: '哈哈哈，放心，我早就改喝红酒不吃血了',
                choices: [
                    {text: '那来杯红酒牛排？', next: 'end', affinityAdd: 8, foodUnlock: 'steak'}
                ]
            },
            {
                affinityReq: 40,
                text: '现在的世界真奇怪，到处都是钢铁盒子在跑，我年纪大了跟不上咯',
                choices: [
                    {text: '那就多住几天，慢慢适应，我养你', next: 'end', affinityAdd: 15},
                    {text: '确实很奇怪，我也跟不上', next: 'end', affinityAdd: 5}
                ]
            },
            {
                affinityReq: 70,
                text: '年轻人总是急急忙忙，像你这样慢慢开一家小店，挺好的',
                choices: [
                    {text: '岁月静好，何必着急', next: 'end', affinityAdd: 10},
                    {text: '其实我也想快点发财...', next: 'end', affinityAdd: 3}
                ]
            },
            {
                affinityReq: 100,
                text: '我活了几千年，什么山珍海味都吃过，还是你这里的家常菜最让人安心',
                choices: [
                    {text: '那你就是我店里的常客，永远有位置', next: 'end', affinityAdd: 25}
                ]
            }
        ]
    },
    {
        id: 'dragon-girl',
        name: '妮娜',
        race: '金龙公主',
        emoji: '🐉',
        description: '离家出走的金龙公主，喜欢亮晶晶和好吃的',
        firstMeet: '哇！你这里好多亮晶晶的盘子！还有香味！',
        affinity: 0,
        unlockReputation: 50,
        dialogues: [
            {
                affinityReq: 0,
                text: '我从龙巢跑出来了，他们都不让我出来玩！你这里好有意思！',
                choices: [
                    {text: '要不要尝尝糖醋排骨？酸酸甜甜很好吃', next: 'dragon-1-1', affinityAdd: 10, foodUnlock: 'sweet-sour-ribs'},
                    {text: '龙不是喜欢金币吗，我这里可没有金币', next: 'dragon-1-2', affinityAdd: -5}
                ]
            },
            {
                id: 'dragon-1-1',
                affinityReq: 0,
                text: '酸酸甜甜！我最喜欢酸甜的东西啦！一定好吃！',
                choices: [
                    {text: '做好啦，快尝尝', next: 'dragon-1-1-1', affinityAdd: 12}
                ]
            },
            {
                id: 'dragon-1-1-1',
                affinityReq: 0,
                text: '好好吃！比龙巢里面的风干肉好吃一万倍！我能天天来吗？',
                choices: [
                    {text: '当然可以，你天天来我天天给你做', next: 'end', affinityAdd: 20, moneyAdd: 25, reputationAdd: 15}
                ]
            },
            {
                id: 'dragon-1-2',
                affinityReq: 0,
                text: '我才不要你的破金币，我自己有一大堆！我就要吃好吃的！',
                choices: [
                    {text: '那尝尝这个糖醋排骨好不好', next: 'dragon-1-1', affinityAdd: 8}
                ]
            },
            {
                affinityReq: 40,
                text: '你这里这个亮晶晶的灯泡是什么？晚上一直亮着，好神奇！',
                choices: [
                    {text: '这是电灯，晚上开店就靠它了', next: 'end', affinityAdd: 8},
                    {text: '你没见过电灯？', next: 'end', affinityAdd: 3}
                ]
            },
            {
                affinityReq: 80,
                text: '父王来找过我，让我回去嫁那个老矮王，我才不回去！',
                choices: [
                    {text: '那就一直住我这里，我保护你', next: 'end', affinityAdd: 25},
                    {text: '嫁给矮王有很多聘礼啊', next: 'end', affinityAdd: -10}
                ]
            },
            {
                affinityReq: 120,
                text: '我偷偷拿了龙巢的宝石给你，谢谢你收留我！',
                choices: [
                    {text: '哇，这么大宝石！我收下了，以后就是这里的老板女儿了', next: 'end', affinityAdd: 30, moneyAdd: 100, reputationAdd: 20}
                ]
            }
        ]
    },
    {
        id: 'adventurer',
        name: '莉娅',
        race: '人类冒险者',
        emoji: '🏃',
        description: '跑遍世界的冒险者，爱吃各地美食',
        firstMeet: '老板！还有位置吗？听说你这里能吃到奇怪的好吃的！',
        affinity: 0,
        unlockReputation: 80,
        dialogues: [
            {
                affinityReq: 0,
                text: '我从东边跨海过来，走了三个月，就想尝尝各种美食',
                choices: [
                    {text: '来一份麻婆豆腐怎么样？麻辣够劲', next: 'ad-1-1', affinityAdd: 8, foodUnlock: 'mapo-tofu'},
                    {text: '先坐，喝口茶休息一下', next: 'ad-1-2', affinityAdd: 5}
                ]
            },
            {
                id: 'ad-1-1',
                affinityReq: 0,
                text: '麻婆豆腐！早听说了！够不够辣？我很能吃辣！',
                choices: [
                    {text: '保证够辣，尝尝', next: 'ad-1-1-1', affinityAdd: 10}
                ]
            },
            {
                id: 'ad-1-1-1',
                affinityReq: 0,
                text: '哇！好辣！好过瘾！太久没吃到这么够劲的菜了！在外面天天吃干粮快吐了',
                choices: [
                    {text: '喜欢就多来，我这里家常菜很多', next: 'end', affinityAdd: 15, moneyAdd: 20, reputationAdd: 10}
                ]
            },
            {
                id: 'ad-1-2',
                affinityReq: 0,
                text: '谢谢你，走了一天确实累坏了',
                choices: [
                    {text: '休息够了推荐你试试麻婆豆腐', next: 'ad-1-1', affinityAdd: 3}
                ]
            },
            {
                affinityReq: 30,
                text: '听说你这里偶尔也会有异界客人，真的吗？我记冒险笔记要素材',
                choices: [
                    {text: '你自己都看见了，门口那个龙姑娘就是金龙', next: 'end', affinityAdd: 8, reputationAdd: 5},
                    {text: '哪有哪有，都是传言', next: 'end', affinityAdd: -3}
                ]
            },
            {
                affinityReq: 60,
                text: '下一站我想去北边的冰川，听说那里有冰原狼',
                choices: [
                    {text: '路上小心，给你做点便当带着', next: 'end', affinityAdd: 15},
                    {text: '那边很危险，注意安全', next: 'end', affinityAdd: 10}
                ]
            },
            {
                affinityReq: 100,
                text: '我回来了！这次带了好多新奇的食材给你，你可以试试做新菜！',
                choices: [
                    {text: '太感谢了！下次我们一起吃', next: 'end', affinityAdd: 25, reputationAdd: 20}
                ]
            }
        ]
    }
];

// === 菜谱数据 ===
const recipes = [
    {id: 'fried-rice', name: '蛋炒饭', price: 10, description: '最简单也最香', unlocked: true},
    {id: 'braised-pork', name: '红烧肉', price: 25, description: '肥而不腻，入口即化', unlocked: false},
    {id: 'sweet-sour-ribs', name: '糖醋排骨', price: 30, description: '酸甜开胃', unlocked: false},
    {id: 'steak', name: '红酒牛排', price: 50, description: '高级料理', unlocked: false},
    {id: 'coffee', name: '黑咖啡', price: 15, description: '提神醒脑', unlocked: false},
    {id: 'mapo-tofu', name: '麻婆豆腐', price: 20, description: '麻辣鲜香', unlocked: false}
];

// 从存档加载解锁状态
function loadUnlockedRecipes(saved) {
    recipes.forEach(r => {
        const sr = saved.find(sr => sr.id === r.id);
        if (sr) {
            r.unlocked = sr.unlocked;
        }
    });
}

// 获得菜谱
function unlockRecipe(id) {
    const r = recipes.find(r => r.id === id);
    if (r) r.unlocked = true;
}

// 获取可烹饪菜谱列表
function getUnlockedRecipes() {
    return recipes.filter(r => r.unlocked);
}
