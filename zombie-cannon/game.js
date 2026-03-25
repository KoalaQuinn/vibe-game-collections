// 💥 向僵尸开炮 - 网页版
// 改版：自动射击，敌人从上方下来，玩家升级

const game = {
    // Canvas - 竖屏适配手机
    canvas: null,
    ctx: null,
    width: 400,
    height: 700,

    // 游戏状态
    state: 'fighting', // aiming / fighting / waiting
    wave: 1,
    baseHp: 10,
    skillOrbs: 0,
    totalKills: 0,
    exp: 0,
    expToNext: 10,
    playerLevel: 1,
    money: 0,

    // 自动射击 - 底部中央发射
    startX: 200,
    startY: 680,
    lastFireTime: Date.now(),

    // 炮弹
    bullets: [],

    // 僵尸
    zombies: [],
    zombiesSpawned: 0,

    // 技能球
    orbs: [],

    // 技能列表
    skills: [],

    // 技能数据定义
    skillData: [
        {id: 'split', name: '子弹分裂', description: '击中僵尸后分裂出2个小子弹', rarity: 'common', damageMul: 1},
        {id: 'fire', name: '燃烧', description: '僵尸持续燃烧伤害', rarity: 'common', damagePerSecond: 5},
        {id: 'bounce', name: '超级弹跳', description: '+2 弹跳次数', rarity: 'common', extraBounces: 2},
        {id: 'pierce', name: '穿甲', description: '炮弹可以穿透僵尸', rarity: 'rare', pierce: +3},
        {id: 'explosion', name: '爆炸', description: '击中产生范围爆炸', rarity: 'rare', explosionRadius: 30},
        {id: 'poison', name: '剧毒', description: '中毒的僵尸受到额外伤害', rarity: 'rare', poisonDamage: 0.3},
        {id: 'double-shot', name: '双发', description: '每次发射两颗炮弹', rarity: 'rare', extraBullets: 1},
        {id: 'triple-shot', name: '三发', description: '每次发射三颗炮弹', rarity: 'epic', extraBullets: 2},
        {id: 'lightning', name: '闪电链', description: '击杀后闪电跳跃到其他僵尸', rarity: 'epic', jumpCount: 3},
        {id: 'large-bullet', name: '大炮弹', description: '炮弹更大，伤害更高', rarity: 'epic', damageMul: 1.8, sizeMul: 1.5},
        {id: 'heal', name: '基地维修', description: '回复基地3点血量', rarity: 'common', healAmount: 3},
        {id: 'money', name: '高能电池', description: '直接获得一个技能球', rarity: 'common', extraOrb: 1},
        {id: 'attack-speed', name: '快速填装', description: '提高射击速度', rarity: 'common', fireRateMul: 1.2},
        {id: 'nuke', name: '核弹', description: '一发清空全屏僵尸', rarity: 'legendary'},
        {id: 'pierce-all', name: '绝对穿透', description: '炮弹无限穿透', rarity: 'legendary', infinitePierce: true},
    ],

    // 定义僵尸
    zombieTypes: [
        {name: '普通僵尸', hp: 10, speed: 0.5, size: 20, rewardExp: 2, rewardMoney: 1, color: '#4CAF50'},
        {name: '快鬼', hp: 8, speed: 1.2, size: 18, rewardExp: 3, rewardMoney: 2, color: '#FF9800'},
        {name: '大胖', hp: 30, speed: 0.2, size: 35, rewardExp: 5, rewardMoney: 3, color: '#F44336'},
        {name: '坦克', hp: 100, speed: 0.1, size: 50, rewardExp: 10, rewardMoney: 10, color: '#9C27B0'},
    ],

    // === 初始化 ===
    init: function() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.startNewGame();
        this.startFighting();
        this.gameLoop();
    },

    startNewGame: function() {
        this.wave = 1;
        this.baseHp = 10;
        this.skillOrbs = 0;
        this.totalKills = 0;
        this.exp = 0;
        this.expToNext = 10;
        this.playerLevel = 1;
        this.money = 0;
        this.state = 'fighting';
        this.bullets = [];
        this.zombies = [];
        this.orbs = [];
        this.skills = [];
        this.spawnWave();
        this.updateUI();
        this.renderSkills();
        this.hideGameOver();
    },

    // 自动射击，玩家只需要选升级，不用手动瞄准
    startFighting: function() {
        this.state = 'fighting';
        this.updateAutoFire();
    },

    // 自动射击，子弹从底部中心自动向上发射
    updateAutoFire: function() {
        if (this.state !== 'fighting') return;

        // 每秒发射 2 / speedBoost 发
        if (!this.lastFireTime) this.lastFireTime = Date.now();
        const now = Date.now();
        if (now - this.lastFireTime >= 500 / (this.getFireRateBoost())) {
            this.autoFireOne();
            this.lastFireTime = now;
        }

        requestAnimationFrame(() => this.updateAutoFire());
    },

    getFireRateBoost: function() {
        let boost = 1;
        this.skills.forEach(s => {
            if (s.fireRateMul) boost *= s.fireRateMul;
        });
        return boost;
    },

    autoFireOne: function() {
        // 随机角度扩散，从底部中心向上发射
        const spread = (Math.random() - 0.5) * 0.8;
        const angle = Math.PI/2 + spread; // 向上
        this.spawnBullet(angle);

        // 多连发
        const extraBullets = this.getExtraBulletCount();
        for (let i = 0; i < extraBullets; i++) {
            const spreadExtra = (Math.random() - 0.5) * 0.8;
            this.spawnBullet(angle + spreadExtra);
        }
    },

    // === 刷僵尸 ===
    spawnWave: function() {
        this.zombiesSpawned = 0;
        const count = Math.min(5 + this.wave * 1.5, 20);
        let spawnInterval = setInterval(() => {
            if (this.zombiesSpawned >= count || this.state === 'gameover') {
                clearInterval(spawnInterval);
                return;
            }
            this.spawnZombie();
            this.zombiesSpawned++;
        }, 800);
    },

    spawnZombie: function() {
        // 随机类型，波数越高越容易出高级僵尸
        let rand = Math.random() * 100;
        let type;
        if (rand < 50 - this.wave * 2 || this.wave === 1) {
            type = this.zombieTypes[0];
        } else if (rand < 75 - this.wave || this.wave < 3) {
            type = this.zombieTypes[1];
        } else if (rand < 92 || this.wave < 5) {
            type = this.zombieTypes[2];
        } else {
            type = this.zombieTypes[3];
        }

        // 敌人从上方出生往下走
        const x = 50 + Math.random() * (this.width - 100);
        this.zombies.push({
            x: x,
            y: -30,
            hp: type.hp * (1 + this.wave * 0.1),
            maxHp: type.hp * (1 + this.wave * 0.1),
            speed: type.speed * 0.2, // 减慢 80% 速度
            size: type.size,
            color: type.color,
            rewardExp: type.rewardExp,
            rewardMoney: type.rewardMoney,
            burning: 0,
            poison: 0
        });
    },

    // === 更新 ===
    update: function() {
        if (this.state !== 'fighting') return;

        // 更新炮弹
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.vx;
            b.y += b.vy;

            // 边界弹跳
            let bounced = false;
            if (b.x - b.radius <= 0) {
                b.x = b.radius + 1;
                b.vx = -b.vx;
                bounced = true;
            }
            if (b.x + b.radius >= this.width) {
                b.x = this.width - b.radius - 1;
                b.vx = -b.vx;
                bounced = true;
            }
            // 顶部边界反弹
            if (b.y - b.radius <= 0) {
                b.y = b.radius + 1;
                b.vy = -b.vy;
                bounced = true;
            }
            // 炮弹飞出底部自动消失
            if (b.y - b.radius > this.height) {
                this.bullets.splice(i, 1);
                continue;
            }

            if (bounced) {
                b.bounces++;
                if (b.bounces > b.maxBounces) {
                    this.bullets.splice(i, 1);
                    continue;
                }
            }

            // 碰撞检测僵尸
            for (let i = this.zombies.length - 1; i >= 0; i--) {
                const z = this.zombies[i];
                const dx = b.x - z.x;
                const dy = b.y - z.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < b.radius + z.size) {
                    // 击中了！
                    this.hitZombie(z, b);

                    // 爆炸
                    if (this.hasExplosion()) {
                        this.explode(b.x, b.y, this.getExplosionRadius());
                    }

                    // 分裂
                    if (this.hasSplit()) {
                        this.splitBullet(b);
                    }

                    // 穿透
                    b.pierceLeft--;
                    if (b.pierceLeft <= 0) {
                        this.bullets.splice(i, 1);
                        break;
                    }
                }
            }
        }

        // 更新僵尸
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const z = this.zombies[i];
            // 燃烧伤害
            if (z.burning > 0) {
                z.hp -= this.getBurningDPS() / 60;
                z.burning--;
            }
            // 毒伤害
            if (z.poison > 0) {
                const poisonPercent = this.getPoisonPercent();
                z.hp -= z.maxHp * poisonPercent / 60;
                z.poison--;
            }

            z.y += z.speed;

            // 走到基地了（底部），扣血
            if (z.y - z.size > this.startY) {
                this.baseHp--;
                this.zombies.splice(i, 1);
                this.updateUI();
                if (this.baseHp <= 0) {
                    this.gameOver();
                }
                continue;
            }
        }

        // 更新技能球
        for (let i = this.orbs.length - 1; i >= 0; i--) {
            const o = this.orbs[i];
            o.y += 1; // 慢慢飘向底部
            // 玩家捡到了吗？距离基地起点近
            const dx = o.x - this.startX;
            const dy = o.y - this.startY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 30) {
                this.skillOrbs++;
                this.orbs.splice(i, 1);
                this.updateUI();
                // 如果够了，弹出选择
                if (this.skillOrbs >= 1) {
                    this.state = 'waiting';
                    this.openSkillSelect();
                }
            }
        }

        // 检查本波僵尸是否都死了
        if (this.zombies.length === 0 && this.state === 'fighting') {
            this.wave++;
            this.spawnWave();
        }
    },

    getFireRateBoost: function() {
        let mul = 1;
        this.skills.forEach(s => {
            if (s.fireRateMul) mul *= s.fireRateMul;
        });
        return mul;
    },

    // 击中僵尸
    hitZombie: function(zombie, bullet) {
        zombie.hp -= bullet.damage;
        // 燃烧效果
        if (this.hasFire()) {
            zombie.burning = 120; // 2秒
        }
        // 毒效果
        if (this.hasPoison()) {
            zombie.poison = 180; // 3秒
        }

        // 死了
        if (zombie.hp <= 0) {
            // 给经验金币
            this.exp += zombie.rewardExp;
            this.money += zombie.rewardMoney;
            this.totalKills++;

            // 检查升级
            if (this.exp >= this.expToNext) {
                this.levelUp();
            }

            // 几率掉技能球
            if (Math.random() < (1 / (5 + this.wave * 0.2))) {
                this.spawnOrb(zombie.x, zombie.y);
            }

            // 闪电链
            if (this.hasLightning()) {
                this.lightningJump(zombie, this.getLightningJumps());
            }

            // 核弹技能直接清屏
            if (this.skills.find(s => s.id === 'nuke')) {
                this.zombies = [];
            }

            this.zombies = this.zombies.filter(z => z !== zombie);
        }
    },

    levelUp: function() {
        this.exp = this.exp - this.expToNext;
        this.playerLevel++;
        this.expToNext = Math.floor(this.expToNext * 1.5);
        this.updateUI();
        // 弹出三个选项选一个
        this.state = 'waiting';
        this.openLevelUpSelect();
    },

    // 爆炸伤害
    explode: function(x, y, radius) {
        this.zombies.forEach(z => {
            const dx = x - z.x;
            const dy = y - z.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius + z.size) {
                const damage = 20 * this.getDamageMul();
                z.hp -= damage;
            }
        });
    },

    // 子弹分裂
    splitBullet: function(parent) {
        for (let i = 0; i < 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.sqrt(parent.vx * parent.vx + parent.vy * parent.vy) * 0.7;
            this.bullets.push({
                x: parent.x,
                y: parent.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: parent.radius * 0.5,
                damage: parent.damage * 0.5,
                maxBounces: parent.maxBounces,
                bounces: parent.bounces,
                pierceLeft: parent.pierceLeft,
                exploded: parent.exploded
            });
        }
    },

    // 闪电链
    lightningJump: function(deadZombie, jumpsLeft) {
        if (jumpsLeft <= 0) return;
        // 找最近的其他僵尸跳过去
        let closest = null;
        let minDist = 150;
        this.zombies.forEach(z => {
            if (z === deadZombie) return;
            const dx = z.x - deadZombie.x;
            const dy = z.y - deadZombie.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                closest = z;
            }
        });
        if (closest) {
            closest.hp -= 50;
            this.lightningJump(closest, jumpsLeft - 1);
        }
    },

    spawnOrb: function(x, y) {
        this.orbs.push({x: x, y: y, radius: 12});
    },

    // === 绘制 ===
    render: function() {
        if (!this.ctx) return;
        const w = this.width;
        const h = this.height;

        // 清空
        const gradient = this.ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#0d1b2a');
        gradient.addColorStop(1, '#1b263b');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, w, h);

        // 画玩家基地底线
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0, 0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.startY);
        this.ctx.lineTo(this.width, this.startY);
        this.ctx.stroke();

        // 画僵尸
        this.zombies.forEach(z => {
            // 血条
            const barWidth = z.size * 2;
            const barHeight = 4;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0, 0.5)';
            this.ctx.fillRect(z.x - barWidth/2, z.y - z.size - 8, barWidth, barHeight);
            this.ctx.fillStyle = '#f44336';
            this.ctx.fillRect(z.x - barWidth/2, z.y - z.size - 8, barWidth * (z.hp / z.maxHp), barHeight);

            // 僵尸身体
            this.ctx.fillStyle = z.color;
            this.ctx.beginPath();
            this.ctx.arc(z.x, z.y, z.size, 0, Math.PI * 2);
            this.ctx.fill();
            // 边框
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });

        // 画炮弹
        this.ctx.fillStyle = '#00d4ff';
        this.bullets.forEach(b => {
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // 画技能球
        this.orbs.forEach(o => {
            const gradient = this.ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius);
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(1, '#FFA000');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
    },

    // === 捡技能球 => 三选一升级
    openLevelUpSelect: function() {
        this.openSkillSelect();
    },

    openSkillSelect: function() {
        // 随机三个不同技能
        const options = this.pickSkillOptions(3);
        const container = document.getElementById('skill-options');
        let html = '';
        options.forEach(skill => {
            const rarityClass = `rarity-${skill.rarity}`;
            html += `
                <div class="skill-option" onclick="game.selectSkill('${skill.id}')">
                    <span class="skill-rarity ${rarityClass}">${skill.rarity}</span>
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-desc">${skill.description}</div>
                </div>
            `;
        });
        container.innerHTML = html;
        document.getElementById('skill-modal').classList.add('show');
    },

    // 打开技能选择弹窗（捡球或者升级都用）
    pickSkillOptions: function(count) {
        // 按稀有度权重随机
        const weights = {common: 50, rare: 30, epic: 15, legendary: 5};
        const available = this.skillData.filter(s => {
            // 可以重复选，但是几率降低
            const has = this.skills.find(s => s.id === s.id);
            if (has) return Math.random() < 0.2; // 20% 概率可以重复选
            return true;
        });
        const picked = [];
        let totalWeight = 0;
        available.forEach(s => totalWeight += weights[s.rarity]);

        for (let i = 0; i < count; i++) {
            let rand = Math.random() * totalWeight;
            let cumulative = 0;
            for (let j = 0; j < available.length; j++) {
                const s = available[j];
                cumulative += weights[s.rarity];
                if (rand <= cumulative) {
                    picked.push(s);
                    available.splice(j, 1);
                    totalWeight -= weights[s.rarity];
                    break;
                }
            }
        }
        return picked;
    },

    selectSkill: function(skillId) {
        const skill = this.skillData.find(s => s.id === skillId);
        if (skill.id === 'heal') {
            this.baseHp += skill.healAmount;
        } else if (skill.id === 'money') {
            this.skillOrbs += skill.extraOrb;
        } else {
            this.skills.push(skill);
        }
        // 升级用掉一个技能球
        this.skillOrbs--;
        document.getElementById('skill-modal').classList.remove('show');
        this.state = 'fighting';
        this.updateUI();
    },

    // === 技能获取帮助函数 ===
    hasSplit: function() { return this.skills.some(s => s.id === 'split'); },
    hasFire: function() { return this.skills.some(s => s.id === 'fire'); },
    hasPoison: function() { return this.skills.some(s => s.id === 'poison'); },
    hasExplosion: function() { return this.skills.some(s => s.id === 'explosion'); },
    hasLightning: function() { return this.skills.some(s => s.id === 'lightning'); },
    getExtraBulletCount: function() {
        let extra = 0;
        this.skills.forEach(s => {
            if (s.extraBullets) extra += s.extraBullets;
        });
        return extra;
    },
    getTotalExtraBounces: function() {
        let extra = 0;
        this.skills.forEach(s => {
            if (s.extraBounces) extra += s.extraBounces;
        });
        return extra;
    },
    getTotalPierce: function() {
        let p = 0;
        this.skills.forEach(s => {
            if (s.pierce) p += s.pierce;
        });
        return p;
    },
    getDamageMul: function() {
        let mul = 1;
        this.skills.forEach(s => {
            if (s.damageMul) mul *= s.damageMul;
        });
        return mul;
    },
    getSizeMul: function() {
        let mul = 1;
        this.skills.forEach(s => {
            if (s.sizeMul) mul *= s.sizeMul;
        });
        return mul;
    },
    getBurningDPS: function() {
        let dps = 0;
        this.skills.forEach(s => {
            if (s.damagePerSecond) dps += s.damagePerSecond;
        });
        return dps;
    },
    getPoisonPercent: function() {
        let pct = 0;
        this.skills.forEach(s => {
            if (s.poisonDamage) pct += s.poisonDamage;
        });
        return pct;
    },
    getExplosionRadius: function() {
        let r = 30;
        this.skills.forEach(s => {
            if (s.explosionRadius) r = s.explosionRadius;
        });
        return r;
    },
    getLightningJumps: function() {
        let j = 3;
        this.skills.forEach(s => {
            if (s.jumpCount) j = s.jumpCount;
        });
        return j;
    },
    getInfinitePierce: function() {
        return this.skills.some(s => s.infinitePierce);
    },

    // === 计算子弹参数，发射 ===
    spawnBullet: function(angle) {
        const speed = (this.power / 100) * 15;
        const maxBounces = 3 + this.getTotalExtraBounces();
        const pierce = this.getInfinitePierce() ? 999 : (1 + this.getTotalPierce());
        const damageMul = this.getDamageMul();
        const sizeMul = this.getSizeMul();
        const size = 6 * sizeMul;
        const damage = 10 * damageMul;
        this.bullets.push({
            x: this.startX,
            y: this.startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: size,
            damage: damage,
            maxBounces: maxBounces,
            bounces: 0,
            pierceLeft: pierce,
            exploded: false
        });
    },

    // === UI ===
    updateUI: function() {
        document.getElementById('playerLevel').textContent = this.playerLevel;
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('hp').textContent = Math.max(0, Math.floor(this.baseHp));
        document.getElementById('skill-orbs').textContent = this.skillOrbs;
        // 更新经验条
        const pct = (this.exp / this.expToNext) * 100;
        document.getElementById('exp-fill').style.width = pct + '%';
        document.getElementById('exp-text').textContent = `${Math.floor(this.exp)}/${this.expToNext}`;
    },

    renderSkills: function() {
        // unused now
    },

    hideGameOver: function() {
        document.getElementById('game-over-modal').classList.remove('show');
    },

    gameOver: function() {
        this.state = 'gameover';
        document.getElementById('final-wave').textContent = this.wave;
        document.getElementById('total-kills').textContent = this.totalKills;
        document.getElementById('game-over-modal').classList.add('show');
    },

    // === 弹窗 ===
    openSkillSelect: function() {
        // 随机三个不同技能
        const options = this.pickSkillOptions(3);
        const container = document.getElementById('skill-options');
        let html = '';
        options.forEach(skill => {
            const rarityClass = `rarity-${skill.rarity}`;
            html += `
                <div class="skill-option" onclick="game.selectSkill('${skill.id}')">
                    <span class="skill-rarity ${rarityClass}">${skill.rarity}</span>
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-desc">${skill.description}</div>
                </div>
            `;
        });
        container.innerHTML = html;
        document.getElementById('skill-modal').classList.add('show');
    },

    hideSkillSelect: function() {
        document.getElementById('skill-modal').classList.remove('show');
    },

    showToast: function(text) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0, 0.8);
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

    gameLoop: function() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
};

// 重启游戏
function restartGame() {
    game.startNewGame();
    game.startFighting();
}
