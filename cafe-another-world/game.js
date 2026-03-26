/**
 * 🍜 异界小吃店 - 游戏核心
 * Version: 1.2.0
 * Updated: 2026-03-27 01:10 (GMT+8)
 */

// 🍜 异界小吃店 - 游戏核心

const game = {
    // 游戏状态
    started: false,
    money: 50,
    reputation: 0,
    currentDialogue: null,
    currentCharacter: null,
    characters: [],
    currentCustomer: null,

    // 初始化
    init: function() {
        this.load();
        this.updateUI();
    },

    // 开始游戏
    startGame: function() {
        document.getElementById('start-screen').style.display = 'none';
        this.started = true;

        // 初始化角色数据
        this.characters = JSON.parse(JSON.stringify(characters));

        // 刷第一个客人
        this.spawnNextCustomer();
        this.render();
    },

    // 刷客人
    spawnNextCustomer: function() {
        // 根据声望解锁客人
        const available = this.characters.filter(c =>
            c.affinity <= 0 && this.reputation >= c.unlockReputation
        );

        // 如果没有解锁新客人，随机选一个已解锁的
        let customer;
        if (available.length > 0) {
            customer = available[Math.floor(Math.random() * available.length)];
        } else {
            const unlocked = this.characters.filter(c => this.reputation >= c.unlockReputation);
            customer = unlocked[Math.floor(Math.random() * unlocked.length)];
        }

        this.currentCustomer = customer;
        // 找第一个可显示的对话
        const firstDialogue = customer.dialogues.find(d => d.affinityReq <= customer.affinity);
        this.showDialogue(firstDialogue ? firstDialogue.text : customer.firstMeet, customer);
        this.showChoices(firstDialogue);
        this.renderCharacters();
    },

    // 显示对话框
    showDialogue: function(text, character) {
        document.getElementById('speaker-name').textContent = `${character.name} (${character.race})`;
        document.getElementById('dialog-text').textContent = text;
        this.currentCharacter = character;
    },

    // 显示选项
    showChoices: function(dialogue) {
        const container = document.getElementById('choices');
        if (!dialogue.choices) {
            container.innerHTML = '';
            return;
        }
        let html = '';
        dialogue.choices.forEach((choice, index) => {
            html += `<button class="choice-btn" onclick="game.selectChoice('${dialogue.id || index}', ${index})">${choice.text}</button>`;
        });
        container.innerHTML = html;
    },

    // 玩家选择
    selectChoice: function(dialogueId, choiceIndex) {
        // 从当前客人找到当前对话，获取选中的choice
        const currentDialogue = this.findDialogue(dialogueId, this.currentCustomer);
        if (!currentDialogue || !currentDialogue.choices) {
            // 找不到对话，直接下一个客人兜底
            this.updateUI();
            this.save();
            setTimeout(() => {
                this.spawnNextCustomer();
            }, 800);
            return;
        }
        const choice = currentDialogue.choices[choiceIndex];
        if (!choice) {
            // 找不到选项，直接下一个客人兜底
            this.updateUI();
            this.save();
            setTimeout(() => {
                this.spawnNextCustomer();
            }, 800);
            return;
        }

        // 应用效果
        if (choice.affinityAdd !== undefined) {
            this.currentCustomer.affinity += choice.affinityAdd;
            if (choice.affinityAdd > 0) {
                this.showFloatText(`+${choice.affinityAdd} 好感`, '#ff6b9d');
            } else {
                this.showFloatText(`${choice.affinityAdd} 好感', '#f44336');
            }
        }
        if (choice.moneyAdd !== undefined) {
            this.money += choice.moneyAdd;
            if (choice.moneyAdd > 0) {
                this.showFloatText(`+${choice.moneyAdd} 金币`, '#ffd700');
            }
        }
        if (choice.reputationAdd !== undefined) {
            this.reputation += choice.reputationAdd;
            if (choice.reputationAdd > 0) {
                this.showFloatText(`+${choice.reputationAdd} 声望', '#4CAF50');
            }
        }
        if (choice.foodUnlock !== undefined) {
            unlockRecipe(choice.foodUnlock);
            const recipeName = recipes.find(r => r.id === choice.foodUnlock)?.name || choice.foodUnlock;
            this.showFloatText(`解锁 ${recipeName}`, '#00d4ff');
        }

        // 找到下一个对话
        if (choice.next === 'end') {
            // 本轮结束，下一个客人
            this.updateUI();
            this.save();
            setTimeout(() => {
                this.spawnNextCustomer();
            }, 800);
            return;
        }

        const nextDialogue = this.findDialogue(choice.next, this.currentCustomer);
        if (nextDialogue) {
            this.showDialogue(nextDialogue.text, this.currentCustomer);
            this.showChoices(nextDialogue);
        }
    },

    // 找对话
    findDialogue: function(id, character) {
        // 如果id是数字（或数字字符串），说明是index
        const numId = Number(id);
        if (typeof id === 'number' || (typeof id === 'string' && id.trim() !== '' && !isNaN(numId))) {
            return character.dialogues[numId];
        }
        // 如果id就是对话本身
        if (!id) return character.dialogues[0];
        const found = character.dialogues.find(d => d.id === id);
        // 如果找不到，返回第一个对话做兜底
        return found || character.dialogues[0];
    },

    // 渲染角色立绘
    renderCharacters: function() {
        if (!this.currentCustomer) return;

        // 我们把当前客人放右边
        const rightName = document.getElementById('right-name');
        const rightAvatar = document.getElementById('right-avatar');
        const rightAffinity = document.getElementById('right-affinity');

        rightName.textContent = this.currentCustomer.name;
        rightAvatar.textContent = this.currentCustomer.emoji;
        rightAffinity.style.width = Math.min(this.currentCustomer.affinity, 100) + '%';

        // 左边空着
        document.getElementById('left-name').textContent = '';
        document.getElementById('left-avatar').textContent = '';
        document.getElementById('left-affinity').style.width = '0%';
    },

    // 打开菜谱界面
    openCooking: function() {
        const container = document.getElementById('menu-list');
        let html = '';
        recipes.forEach(recipe => {
            if (recipe.unlocked) {
                html += `
                    <div class="menu-item" onclick="game.cookRecipe('${recipe.id}')">
                        <div class="menu-name">${recipe.name}</div>
                        <div class="menu-price">售价 ${recipe.price} 金币 - ${recipe.description}</div>
                    </div>
                `;
            } else {
                html += `
                    <div class="menu-item locked">
                        <div class="menu-name">??? (未解锁)</div>
                        <div class="menu-price">需要在对话中解锁</div>
                    </div>
                `;
            }
        });
        container.innerHTML = html;
        document.getElementById('cooking-modal').classList.add('show');
    },

    closeCooking: function() {
        document.getElementById('cooking-modal').classList.remove('show');
    },

    // 做菜卖钱
    cookRecipe: function(id) {
        const recipe = recipes.find(r => r.id === id);
        if (!recipe || !recipe.unlocked) return;
        this.money += recipe.price;
        this.reputation += 1;
        this.updateUI();
        this.save();
        this.closeCooking();
        this.showToast(`做好了！卖掉赚了 ${recipe.price} 金币`);
    },

    // 更新UI
    updateUI: function() {
        document.getElementById('money').textContent = Math.floor(this.money);
        document.getElementById('reputation').textContent = this.reputation;
        const unlocked = getUnlockedRecipes().length;
        document.getElementById('unlocked-recipes').textContent = unlocked;
    },

    // 存档
    save: function() {
        const data = {
            money: this.money,
            reputation: this.reputation,
            characters: this.characters.map(c => ({
                id: c.id,
                affinity: c.affinity
            })),
            recipes: recipes.map(r => ({
                id: r.id,
                unlocked: r.unlocked
            }))
        };
        localStorage.setItem('cafe-another-world', JSON.stringify(data));
    },

    // 读档
    load: function() {
        const save = localStorage.getItem('cafe-another-world');
        if (save) {
            const data = JSON.parse(save);
            this.money = data.money || 50;
            this.reputation = data.reputation || 0;
            if (data.characters) {
                data.characters.forEach(sc => {
                    const c = this.characters.find(c => c.id === sc.id);
                    if (c) c.affinity = sc.affinity;
                });
            }
            if (data.recipes) {
                loadUnlockedRecipes(data.recipes);
            }
        }
    },

    render: function() {
        this.renderCharacters();
        if (this.currentCustomer && this.currentCustomer.dialogues && this.currentCustomer.dialogues[0]) {
            const first = this.currentCustomer.dialogues.find(d => d.affinityReq <= this.currentCustomer.affinity);
            if (first) {
                this.showDialogue(first.text, this.currentCustomer);
                this.showChoices(first);
            }
        }
        this.updateUI();
    },

    showToast: function(text) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            z-index: 9999;
        `;
        toast.textContent = text;
        document.body.appendChild(toast);
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 2000);
    },

    // 飘字效果 - 属性变化时弹出浮动文字
    showFloatText: function(text, color) {
        const scene = document.querySelector('.scene');
        const floatText = document.createElement('div');
        floatText.style.cssText = `
            position: absolute;
            bottom: 50%;
            left: 50%;
            transform: translateX(-50%);
            color: ${color};
            font-size: 1.5rem;
            font-weight: bold;
            text-shadow: 1px 1px 0 #000;
            pointer-events: none;
            z-index: 100;
            animation: floatUp 1s ease-out forwards;
        `;
        floatText.textContent = text;
        scene.appendChild(floatText);
        setTimeout(() => {
            if (scene.contains(floatText)) {
                scene.removeChild(floatText);
            }
        }, 1000);
    }
};

// 添加飘字动画
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-50px); }
    }
`;
document.head.appendChild(style);

