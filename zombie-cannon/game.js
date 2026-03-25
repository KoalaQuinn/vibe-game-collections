// 💥 向僵尸开炮 - 网页版
// 玩法：拖动瞄准，蓄力发射，炮弹反弹，击杀僵尸，捡技能球，选技能

const game = {
    // Canvas - 竖屏适配手机
    canvas: null,
    ctx: null,
    width: 400,
    height: 700,

    // 游戏状态
    state: 'aiming', // aiming / firing / waiting
    wave: 1,
    baseHp: 10,
    skillOrbs: 0,
    totalKills: 0,

    // 瞄准 - 左下角发射
    startX: 40,
    startY: 350,
    aimAngle: 0.785, // 45度 default
    power: 0,
    powerDirection: 1,
    powerInterval: null,

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
        {id: 'nuke', name: '核弹', description: '一发清空全屏僵尸', rarity: 'legendary'},
        {id: 'pierce-all', name: '绝对穿透', description: '炮弹无限穿透', rarity: 'legendary', infinitePierce: true},
    ],

    // 定义僵尸
    zombieTypes: [
        {name: '普通僵尸', hp: 10, speed: 0.5, size: 20, reward: 1, color: '#4CAF50'},
        {name: '快鬼', hp: 8, speed: 1.2, size: 18, reward: 2, color: '#FF9800'},
        {name: '大胖', hp: 30, speed: 0.2, size: 35, reward: 3, color: '#F44336'},
        {name: '坦克', hp: 100, speed: 0.1, size: 50, reward: 10, color: '#9C27B0'},
    ],

    // === 初始化 ===
    init: function() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // 绑定鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this.startAim(e));
        this.canvas.addEventListener('mousemove', (e) => this.updateAim(e));
        this.canvas.addEventListener('mouseup', (e) => this.fire(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startAim(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.updateAim(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.fire(e.changedTouches[0]);
        });

        this.startNewGame();
        this.gameLoop();
    },

    startNewGame: function() {
        this.wave = 1;
        this.baseHp = 10;
        this.skillOrbs = 0;
        this.totalKills = 0;
        this.state = 'aiming';
        this.bullets = [];
        this.zombies = [];
        this.orbs = [];
        this.skills = [];
        this.spawnWave();
        this.updateUI();
        this.renderSkills();
        this.hideGameOver();
    },

    // === 瞄准阶段 ===
    startAim: function(e) {
        if (this.state !== 'aiming') return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 计算角度
        const dx = x - this.startX;
        const dy = y - this.startY;
        this.aimAngle = Math.atan2(dy, dx);

        // 开始蓄力
        this.power = 0;
        this.powerDirection = 1;
        this.powerInterval = setInterval(() => this.updatePower(), 30);
    },

    updateAim: function(e) {
        if (this.state !== 'aiming' || !this.powerInterval) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const dx = x - this.startX;
        const dy = y - this.startY;
        this.aimAngle = Math.atan2(dy, dx);
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
        document.getElementById('power-fill').style.width = this.power + '%';
    },

    fire: function(e) {
        if (this.state !== 'aiming') return;
        clearInterval(this.powerInterval);
        this.powerInterval = null;

        if (this.power < 10) {
            this.power = 10;
        }

        // 发射炮弹
        this.spawnBullet();

        // 如果有多连发技能
        const extraBullets = this.getExtraBulletCount();
        for (let i = 0; i < extraBullets; i++) {
            // 稍微分散角度
            const spread = (Math.random() - 0.5) * 0.3;
            this.spawnBullet(this.aimAngle + spread);
        }

        this.state = 'firing';
        document.getElementById('power-fill').style.width = '0%';
    },

    spawnBullet: function(angleOffset = 0) {
        const speed = (this.power / 100) * 15;
        const maxBounces = this.getTotalExtraBounces() + 3;
        const pierce = this.getInfinitePierce() ? 999 : (this.getTotalPierce() + 1);

        let size = 6;
        let damage = 10;
        const sizeMul = this.getSizeMul();
        const damageMul = this.getDamageMul();
        size *= sizeMul;
        damage *= damageMul;

        this.bullets.push({
            x: this.startX,
            y: this.startY,
            vx: Math.cos(this.aimAngle + angleOffset) * speed,
            vy: Math.sin(this.aimAngle + angleOffset) * speed,
            radius: size,
            damage: damage,
            maxBounces: maxBounces,
            bounces: 0,
            pierceLeft: pierce,
            exploded: false
        });
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

        const y = 50 + Math.random() * (this.height - 100);
        this.zombies.push({
            x: this.width - 30,
            y: y,
            hp: type.hp * (1 + this.wave * 0.1),
            maxHp: type.hp * (1 + this.wave * 0.1),
            speed: type.speed,
            size: type.size,
            color: type.color,
            reward: type.reward,
            burning: 0,
            poison: 0
        });
    },

    // === 更新 ===
    update: function() {
        if (this.state !== 'firing') return;

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
            if (b.y - b.radius <= 0) {
                b.y = b.radius + 1;
                b.vy = -b.vy;
                bounced = true;
            }
            if (b.y + b.radius >= this.height) {
                b.y = this.height - b.radius - 1;
                b.vy = -b.vy;
                bounced = true;
            }

            if (bounced) {
                b.bounces++;
                if (b.bounces > b.maxBounces) {
                    this.bullets.splice(i, 1);
                    continue;
                }
            }

            // 出左边屏幕了，这颗子弹没了
            if (b.x < -b.radius * 2) {
                this.bullets.splice(i, 1);
                continue;
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

            z.x -= z.speed;

            // 走到基地了
            if (z.x + z.size < this.startX - 10) {
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
            o.x -= 0.5; // 慢慢飘向基地
            // 玩家捡到了吗？距离基地近
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
                continue;
            }
        }

        // 检查本波是否打完
        if (this.zombies.length === 0 && this.state === 'firing') {
            this.wave++;
            this.spawnWave();
            this.state = 'aiming';
            this.updateUI();
        }

        // 核弹技能直接清屏
        if (this.skills.find(s => s.id === 'nuke')) {
            // 用了就移除
            this.skills = this.skills.filter(s => s.id !== 'nuke');
            this.zombies.forEach(z => z.hp = 0);
        }
    },

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
            this.totalKills++;
            // 闪电链
            if (this.hasLightning()) {
                this.lightningJump(zombie, this.getLightningJumps());
            }
            // 几率掉技能球
            if (Math.random() < (1 / (5 + this.wave * 0.2))) {
                this.spawnOrb(zombie.x, zombie.y);
            }
            this.zombies = this.zombies.filter(z => z !== zombie);
        }
    },

    // 爆炸伤害
    explode: function(x, y, radius) {
        this.zombies.forEach(z => {
            const dx = x - z.x;
            const dy = y - z.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius + z.size) {
                const damage = 20 * (1 - dist / (radius + z.size));
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
                maxBounces: parent.maxBounces - parent.bounces,
                bounces: parent.bounces,
                pierceLeft: parent.pierceLeft
            });
        }
    },

    // 闪电链
    lightningJump: function(deadZombie, jumpsLeft) {
        if (jumpsLeft <= 0) return;
        // 找最近的其他僵尸
        let closest = null;
        let minDist = 10000;
        this.zombies.forEach(z => {
            if (z === deadZombie) return;
            const dx = z.x - deadZombie.x;
            const dy = z.y - deadZombie.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150 && dist < minDist) {
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

    // === 技能选择 ===
    openSkillSelect: function() {
        // 随机出3个技能选一个
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

    pickSkillOptions: function(count) {
        // 按稀有度权重随机
        const weights = {common: 50, rare: 30, epic: 15, legendary: 5};
        const available = this.skillData.filter(s => {
            // 如果已经有了同名，几率降低
            const has = this.skills.find(sk => sk.id === s.id);
            if (has) return Math.random() < 0.2; // 20% 概率可以重复选
            return true;
        });

        const picked = [];
        while (picked.length < count && available.length > 0) {
            let totalWeight = 0;
            available.forEach(s => totalWeight += weights[s.rarity]);
            let rand = Math.random() * totalWeight;
            let cumulative = 0;
            for (let i = 0; i < available.length; i++) {
                cumulative += weights[available[i].rarity];
                if (rand <= cumulative) {
                    picked.push(available[i]);
                    available.splice(i, 1);
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
            this.updateUI();
        } else if (skill.id === 'money') {
            this.skillOrbs += skill.extraOrb;
            this.updateUI();
        } else {
            this.skills.push(skill);
        }
        this.skillOrbs--;
        this.renderSkills();
        document.getElementById('skill-modal').classList.remove('show');
        this.state = 'aiming';
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
    getInfinitePierce: function() {
        return this.skills.some(s => s.infinitePierce);
    },
    getSizeMul: function() {
        let mul = 1;
        this.skills.forEach(s => {
            if (s.sizeMul) mul *= s.sizeMul;
        });
        return mul;
    },
    getDamageMul: function() {
        let mul = 1;
        this.skills.forEach(s => {
            if (s.damageMul) mul *= s.damageMul;
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
        let p = 0;
        this.skills.forEach(s => {
            if (s.poisonDamage) p += s.poisonDamage;
        });
        return p;
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

    // === 绘制 ===
    render: function() {
        const ctx = this.ctx;
        // 清空
        ctx.fillStyle = '#0d1b2a';
        ctx.fillRect(0, 0, this.width, this.height);

        // 画基地
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.startX, this.startY, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(this.startX, this.startY, 15, 0, Math.PI * 2);
        ctx.fill();

        // 画瞄准线
        if (this.state === 'aiming' && this.powerInterval) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.startX, this.startY);
            const endX = this.startX + Math.cos(this.aimAngle) * 50;
            const endY = this.startY + Math.sin(this.aimAngle) * 50;
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        // 画僵尸
        this.zombies.forEach(z => {
            // 阴影
            ctx.fillStyle = z.color;
            ctx.beginPath();
            ctx.arc(z.x, z.y, z.size, 0, Math.PI * 2);
            ctx.fill();
            // 血条
            const barWidth = z.size * 2;
            const barHeight = 4;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(z.x - barWidth / 2, z.y - z.size - 8, barWidth, barHeight);
            ctx.fillStyle = '#f44336';
            ctx.fillRect(z.x - barWidth / 2, z.y - z.size - 8, barWidth * (z.hp / z.maxHp), barHeight);
            // 特效
            if (z.burning > 0) {
                ctx.strokeStyle = '#FF5722';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(z.x, z.y, z.size + 5, 0, Math.PI * 2);
                ctx.stroke();
            }
            if (z.poison > 0) {
                ctx.strokeStyle = '#4CAF50';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(z.x, z.y, z.size + 5, 0, Math.PI * 2);
                ctx.stroke();
            }
        });

        // 画炮弹
        ctx.fillStyle = '#00d4ff';
        this.bullets.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // 画技能球
        this.orbs.forEach(o => {
            const gradient = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius);
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(1, '#FFA000');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
            ctx.fill();
            // 边框
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // 画瞄准预览
        if (this.state === 'aiming' && this.power > 0) {
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 + this.power / 100 * 0.4})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.startX, this.startY);
            ctx.arc(this.startX, this.startY, this.power * 2, 0, this.aimAngle);
            ctx.lineTo(this.startX + Math.cos(this.aimAngle) * this.power * 2, this.startY + Math.sin(this.aimAngle) * this.power * 2);
            ctx.stroke();
        }
    },

    gameLoop: function() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    },

    // === UI ===
    updateUI: function() {
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('hp').textContent = Math.max(0, Math.floor(this.baseHp));
        document.getElementById('skill-orbs').textContent = this.skillOrbs;
    },

    renderSkills: function() {
        const container = document.getElementById('skills-list');
        if (this.skills.length === 0) {
            container.innerHTML = '<span style="opacity: 0.5;">还没有技能...</span>';
            return;
        }
        let html = '';
        this.skills.forEach(s => {
            const rarityClass = `rarity-${s.rarity}`;
            html += `<span class="skill-tag ${rarityClass}">${s.name}</span>`;
        });
        container.innerHTML = html;
    },

    gameOver: function() {
        this.state = 'gameover';
        document.getElementById('final-wave').textContent = this.wave;
        document.getElementById('total-kills').textContent = this.totalKills;
        document.getElementById('game-over-modal').classList.add('show');
    },

    hideGameOver: function() {
        document.getElementById('game-over-modal').classList.remove('show');
    }
};

function restartGame() {
    game.startNewGame();
}
