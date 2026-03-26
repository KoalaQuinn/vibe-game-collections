/**
 * 💥 向僵尸开炮 - Phaser 版
 * Version: 1.0.0
 * Updated: 2026-03-27 00:20 (GMT+8)
 *
 * 规则：
 * 敌人从上方下来，自动射击，升级捡球选技能
 */

class ZombieCannonGame {
    constructor() {
        // 游戏配置 - 竖屏 400x700
        this.gameWidth = 400;
        this.gameHeight = 700;

        // 游戏状态
        this.gameState = {
            state: 'fighting',
            wave: 1,
            baseHp: 10,
            skillOrbs: 0,
            totalKills: 0,
            exp: 0,
            expToNext: 10,
            playerLevel: 1,
            money: 0,
        };

        // 自动射击配置
        this.startX = 200;   // 发射X（底部中心）
        this.startY = 680;
        this.lastFireTime = Date.now();

        // 技能数据（和原版保持一致
        this.skillData = [
            {id: 'split', name: '子弹分裂', description: '击中僵尸后分裂出2个小子弹', rarity: 'common', damageMul: 1},
            {id: 'fire', name: '燃烧', description: '僵尸持续燃烧伤害', rarity: 'common', damagePerSecond: 5},
            {id: 'bounce', name: '超级弹跳', description: '+2 弹跳次数', rarity: 'common', extraBounces: 2},
            {id: 'pierce', name: '穿甲', description: '炮弹可以穿透僵尸', rarity: 'rare', pierce: +3},
            {id: 'explosion', name: '爆炸', description: '击中产生范围爆炸', rarity: 'rare', explosionRadius: 30},
            {id: 'poison', name: '剧毒', description: '中毒僵尸受到额外伤害', rarity: 'rare', poisonDamage: 0.3},
            {id: 'double-shot', name: '双发', description: '每次发射两颗炮弹', rarity: 'rare', extraBullets: 1},
            {id: 'triple-shot', name: '三发', description: '每次发射三颗炮弹', rarity: 'epic', extraBullets: 2},
            {id: 'lightning', name: '闪电链', description: '击杀后闪电跳跃到其他僵尸', rarity: 'epic', jumpCount: 3},
            {id: 'large-bullet', name: '大炮弹', description: '炮弹更大，伤害更高', rarity: 'epic', damageMul: 1.8, sizeMul: 1.5},
            {id: 'heal', name: '基地维修', description: '回复基地3点血量', rarity: 'common', healAmount: 3},
            {id: 'money', name: '高能电池', description: '直接获得一个技能球', rarity: 'common', extraOrb: 1},
            {id: 'attack-speed', name: '快速填装', description: '提高射击速度', rarity: 'common', fireRateMul: 1.2},
            {id: 'nuke', name: '核弹', description: '一发清空全屏僵尸', rarity: 'legendary'},
            {id: 'pierce-all', name: '绝对穿透', description: '炮弹无限穿透', rarity: 'legendary', infinitePierce: true},
        ];

        // 僵尸类型
        this.zombieTypes = [
            {name: '普通僵尸', hp: 10, speed: 0.5, size: 20, rewardExp: 2, rewardMoney: 1, color: 0x4CAF50},
            {name: '快鬼', hp: 8, speed: 1.2, size: 18, rewardExp: 3, rewardMoney: 2, color: 0xFF9800},
            {name: '大胖', hp: 30, speed: 0.2, size: 35, rewardExp: 5, rewardMoney: 3, color: 0xF44336},
            {name: '坦克', hp: 100, speed: 0.1, size: 50, rewardExp: 10, rewardMoney: 10, color: 0x9C27B0},
        ];

        // Phaser 配置
        this.config = {
            type: Phaser.AUTO,
            width: this.gameWidth,
            height: this.gameHeight,
            parent: 'game-canvas',
            scene: {
                preload: this.preload.bind(this),
                create: this.create.bind(this),
                update: this.update.bind(this)
            },
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            input: {
                touch: true,
                mouse: true
            }
        };

        this.skills = [];
        this.bullets = [];
        this.zombies = [];
        this.orbs = [];
        this.zombiesSpawned = 0;

        this.game = new Phaser.Game(this.config);
    }

    preload() {
        // 不需要加载资源，都是图形绘制
    }

    create() {
        const scene = this.game.scene.scenes[0];
        this.scene = scene;

        // 绘制背景渐变 - Phaser 3 渐变
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x0d1b2a, 1);
        bg.fillRect(0, 0, this.gameWidth, this.gameHeight / 2);
        bg.fillStyle(0x1b263b, 1);
        bg.fillRect(0, this.gameHeight / 2, this.gameWidth, this.gameHeight / 2);
        this.bg = bg;

        // 画基地底线
        const baseLine = this.scene.add.graphics();
        baseLine.lineStyle(3, 0xFFD700, 0.5);
        baseLine.beginPath();
        baseLine.moveTo(0, this.startY);
        baseLine.lineTo(this.gameWidth, this.startY);
        baseLine.strokePath();

        // 画玩家炮塔
        const tower = this.scene.add.graphics();
        const gradientTower = this.scene.context.createRadialGradient(this.startX, this.startY, 0, this.startX, this.startY, 40);
        gradientTower.addColorStop(0, '#4CAF50');
        gradientTower.addColorStop(1, '#2E7D32');
        tower.fillGradient(gradientTower, 1);
        tower.fillCircle(this.startX, this.startY, 40);
        tower.lineStyle(3, 0xffffff, 1);
        tower.strokeCircle(this.startX, this.startY, 40);

        // 炮口
        const muzzle = this.scene.add.graphics();
        muzzle.fillStyle(0x1B5E20, 1);
        muzzle.fillCircle(this.startX, this.startY - 10, 15);
        muzzle.lineStyle(2, 0xffffff, 1);
        muzzle.strokeCircle(this.startX, this.startY - 10, 15);

        this.startNewWave();
        this.startAutoFire();
    }

    startNewGame() {
        this.gameState = {
            state: 'fighting',
            wave: 1,
            baseHp: 10,
            skillOrbs: 0,
            totalKills: 0,
            exp: 0,
            expToNext: 10,
            playerLevel: 1,
            money: 0,
        };
        this.skills = [];
        this.bullets = [];
        this.zombies = [];
        this.orbs = [];
        this.zombiesSpawned = 0;
        this.lastFireTime = Date.now();
        this.startNewWave();
        updateUI();
    }

    startNewWave() {
        this.zombiesSpawned = 0;
        const count = Math.min(5 + this.gameState.wave * 1.5, 20);
        const interval = setInterval(() => {
            if (this.zombiesSpawned >= count || this.gameState.state !== 'fighting') {
                clearInterval(interval);
                return;
            }
            this.spawnZombie();
            this.zombiesSpawned++;
        }, 800);
    }

    spawnZombie() {
        // 随机类型
        let rand = Math.random() * 100;
        let type;
        if (rand < 50 - this.gameState.wave * 2 || this.gameState.wave === 1) {
            type = this.zombieTypes[0];
        } else if (rand < 75 - this.gameState.wave || this.gameState.wave < 3) {
            type = this.zombieTypes[1];
        } else if (rand < 92 || this.gameState.wave < 5) {
            type = this.zombieTypes[2];
        } else {
            type = this.zombieTypes[3];
        }

        // 敌人从上方出生往下走
        const x = 50 + Math.random() * (this.gameWidth - 100);
        const zombie = this.scene.add.circle(x, -30, type.size, type.color);
        zombie.setStrokeStyle(2, 0xffffff);
        zombie.data = {
            x: x,
            y: -30,
            hp: type.hp * (1 + this.gameState.wave * 0.1),
            maxHp: type.hp * (1 + this.gameState.wave * 0.1),
            speed: type.speed * 0.2,
            size: type.size,
            color: type.color,
            rewardExp: type.rewardExp,
            rewardMoney: type.rewardMoney,
            burning: 0,
            poison: 0,
            type: type
        };
        zombie.setData(zombie.data);
        this.zombies.push(zombie);

        // 添加血条
        const barWidth = type.size * 2;
        const barHeight = 4;
        const barX = x - barWidth/2;
        const barY = -30 - type.size - 8;
        const barBg = this.scene.add.rectangle(barX + barWidth/2, barY + barHeight/2, barWidth, barHeight, 0x000000, 0.5);
        const barFg = this.scene.add.rectangle(barX + barWidth/2, barY + barHeight/2, barWidth * (zombie.data.hp / zombie.data.maxHp), barHeight, 0xf44336);
        zombie.data.hpBarBg = barBg;
        zombie.data.hpBarFg = barFg;
    }

    // 自动射击
    startAutoFire() {
        const autoFire = () => {
            if (this.gameState.state !== 'fighting') return;

            const now = Date.now();
            const interval = 500 / this.getFireRateBoost();
            const elapsed = now - this.lastFireTime;
            const pct = Math.min(100, (elapsed / interval) * 100);
            updateCooldown(pct);

            if (elapsed >= interval) {
                this.autoFireOne();
                this.lastFireTime = now;
            }

            requestAnimationFrame(() => this.startAutoFire());
        };
        autoFire();
    }

    getFireRateBoost() {
        let boost = 1;
        this.skills.forEach(s => {
            if (s.fireRateMul) boost *= s.fireRateMul;
        });
        return boost;
    }

    autoFireOne() {
        // 随机角度扩散，向上发射
        const spread = (Math.random() - 0.5) * 0.8;
        const angle = Math.PI/2 + spread;
        this.spawnBullet(angle);

        // 多连发
        const extraBullets = this.getExtraBulletCount();
        for (let i = 0; i < extraBullets; i++) {
            const spreadExtra = (Math.random() - 0.5) * 0.8;
            this.spawnBullet(angle + spreadExtra);
        }
    }

    spawnBullet(angle) {
        const speed = 15; // 满威力
        const maxBounces = 3 + this.getTotalExtraBounces();
        const pierce = this.getInfinitePierce() ? 999 : (1 + this.getTotalPierce());
        const damageMul = this.getDamageMul();
        const sizeMul = this.getSizeMul();
        const size = 6 * sizeMul;
        const damage = 10 * damageMul;

        const bullet = this.scene.add.circle(this.startX, this.startY, size, 0x00d4ff);
        bullet.setStrokeStyle(1, 0xffffff);
        bullet.data = {
            x: this.startX,
            y: this.startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: size,
            damage: damage,
            maxBounces: maxBounces,
            bounces: 0,
            pierceLeft: pierce,
            exploded: false,
            trail: [{x: this.startX, y: this.startY}]
        };
        bullet.setData(bullet.data);
        this.bullets.push(bullet);
    }

    getTotalExtraBounces() {
        let extra = 0;
        this.skills.forEach(s => {
            if (s.extraBounces) extra += s.extraBounces;
        });
        return extra;
    }

    getTotalPierce() {
        let p = 0;
        this.skills.forEach(s => {
            if (s.pierce) p += s.pierce;
        });
        return p;
    }

    getDamageMul() {
        let mul = 1;
        this.skills.forEach(s => {
            if (s.damageMul) mul *= s.damageMul;
        });
        return mul;
    }

    getSizeMul() {
        let mul = 1;
        this.skills.forEach(s => {
            if (s.sizeMul) mul *= s.sizeMul;
        });
        return mul;
    }

    getExtraBulletCount() {
        let extra = 0;
        this.skills.forEach(s => {
            if (s.extraBullets) extra += s.extraBullets;
        });
        return extra;
    }

    getInfinitePierce() {
        return this.skills.some(s => s.infinitePierce);
    }

    getBurningDPS() {
        let dps = 0;
        this.skills.forEach(s => {
            if (s.damagePerSecond) dps += s.damagePerSecond;
        });
        return dps;
    }

    getPoisonPercent() {
        let pct = 0;
        this.skills.forEach(s => {
            if (s.poisonDamage) pct += s.poisonDamage;
        });
        return pct;
    }

    getExplosionRadius() {
        let r = 30;
        this.skills.forEach(s => {
            if (s.explosionRadius) r = s.explosionRadius;
        });
        return r;
    }

    getLightningJumps() {
        let j = 3;
        this.skills.forEach(s => {
            if (s.jumpCount) j = s.jumpCount;
        });
        return j;
    }

    update() {
        if (this.gameState.state !== 'fighting') return;

        // 更新炮弹
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            const data = b.data;

            // 更新位置
            data.x += data.vx;
            data.y += data.vy;
            b.x = data.x;
            b.y = data.y;

            // 记录轨迹
            data.trail.push({x: data.x, y: data.y);
            if (data.trail.length > 100) {
                data.trail.shift();
            }

            // 边界弹跳
            let bounced = false;

            // 左右边界反弹
            if (data.x - data.radius <= 0) {
                data.x = data.radius + 1;
                data.vx = -data.vx;
                bounced = true;
            }
            if (data.x + data.radius >= this.gameWidth) {
                data.x = this.gameWidth - data.radius - 1;
                data.vx = -data.vx;
                bounced = true;
            }

            // 顶部反弹
            if (data.y - data.radius <= 0) {
                data.y = data.radius + 1;
                data.vy = -data.vy;
                bounced = true;
            }

            // 飞出底部移除
            if (data.y - data.radius > this.gameHeight) {
                b.destroy();
                this.bullets.splice(i, 1);
                continue;
            }

            if (bounced) {
                data.bounces++;
                if (data.bounces > data.maxBounces) {
                    b.destroy();
                    this.bullets.splice(i, 1);
                    continue;
                }
            }

            // 碰撞检测僵尸
            for (let j = this.zombies.length - 1; j >= 0; j--) {
                const z = this.zombies[j];
                const zData = z.data;
                const dx = data.x - zData.x;
                const dy = data.y - zData.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < data.radius + zData.size) {
                    this.hitZombie(z, b);

                    // 爆炸
                    if (this.hasExplosion()) {
                        this.explode(data.x, data.y, this.getExplosionRadius());
                    }

                    // 分裂
                    if (this.hasSplit()) {
                        this.splitBullet(b);
                    }

                    // 穿透
                    data.pierceLeft--;
                    if (data.pierceLeft <= 0) {
                        b.destroy();
                        this.bullets.splice(i, 1);
                        break;
                    }
                }
            }
        }

        // 更新僵尸
        for (let k = this.zombies.length - 1; k >= 0; k--) {
            const z = this.zombies[k];
            const zData = z.data;

            // 燃烧伤害
            if (zData.burning > 0) {
                zData.hp -= this.getBurningDPS() / 60;
                zData.burning--;
            }
            // 毒伤害
            if (zData.poison > 0) {
                const poisonPercent = this.getPoisonPercent();
                zData.hp -= zData.maxHp * poisonPercent / 60;
                zData.poison--;
            }

            // 下移
            zData.y += zData.speed;
            z.y = zData.y;
            // 更新血条位置
            zData.hpBarBg.y = zData.y - zData.size - 8;
            zData.hpBarFg.y = zData.y - zData.size - 8;
            zData.hpBarFg.displayWidth = (zData.hp / zData.maxHp) * (zData.size * 2);

            // 走到基地，扣血
            if (zData.y - zData.size > this.startY) {
                this.gameState.baseHp--;
                z.destroy();
                zData.hpBarBg.destroy();
                zData.hpBarFg.destroy();
                this.zombies.splice(k, 1);
                updateUI();
                if (this.gameState.baseHp <= 0) {
                    this.gameOver();
                }
                continue;
            }

            // 更新血条显示
            zData.hpBarFg.setOrigin(0, 0.5);
        }

        // 更新技能球
        for (let m = this.orbs.length - 1; m >= 0; m--) {
            const o = this.orbs[m];
            o.data.y += 1;
            o.y = o.data.y;
            const dx = o.data.x - this.startX;
            const dy = o.data.y - this.startY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 30) {
                // 捡到了
                this.gameState.skillOrbs++;
                // 如果升级或捡球都可以选技能
                this.openSkillSelect();
                o.destroy();
                this.orbs.splice(m, 1);
                updateUI();
                continue;
            }
            if (o.data.y > this.gameHeight) {
                o.destroy();
                this.orbs.splice(m, 1);
            }
        }

        // 重绘轨迹必须在这里（Phaser 自动渲染，我们只需要更新位置）
    }

    hitZombie(z, b) {
        const zData = z.data;
        const bData = b.data;
        zData.hp -= bData.damage;

        // 燃烧效果
        if (this.hasFire()) {
            zData.burning = 120; // 持续 2 秒
        }
        // 毒效果
        if (this.hasPoison()) {
            zData.poison = 120;
        }

        // 更新血条
        zData.hpBarFg.displayWidth = (zData.hp / zData.maxHp) * (zData.size * 2);

        if (zData.hp <= 0) {
            // 击杀了
            this.gameState.totalKills++;
            this.gameState.exp += zData.type.rewardExp;
            this.gameState.money += zData.type.rewardMoney;

            // 检查升级
            if (this.gameState.exp >= this.gameState.expToNext) {
                this.gameState.playerLevel++;
                this.gameState.exp -= this.gameState.expToNext;
                this.gameState.expToNext = 10 + this.gameState.playerLevel * 5;
                // 升级给一个技能球
                this.gameState.skillOrbs++;
                this.openSkillSelect();
            }

            // 10% 概率掉技能球
            if (Math.random() < 0.1) {
                this.spawnOrb(zData.x, zData.y);
            }

            // 闪电链
            if (this.hasLightning()) {
                this.lightningJump(z, this.getLightningJumps());
            }

            // 核弹技能直接秒杀全屏
            if (this.hasNuke()) {
                // 核弹一发清空全屏
                this.zombies.forEach(zombie => {
                    zombie.destroy();
                    zombie.data.hpBarBg.destroy();
                    zombie.data.hpBarFg.destroy();
                });
                this.zombies = [];
                this.gameState.wave++;
                this.startNewWave();
            }

            // 掉落经验会生成新的一波
            if (this.zombies.length === 0 && this.zombiesSpawned >= (Math.min(5 + this.gameState.wave * 1.5, 20)) {
                this.gameState.wave++;
                this.startNewWave();
            }

            // 生成技能球掉落
            if (this.gameState.skillOrbs >= 1) {
                // 已经打开选技能了
            }

            z.destroy();
            zData.hpBarBg.destroy();
            zData.hpBarFg.destroy();
            this.zombies.splice(this.zombies.indexOf(z), 1);
            updateUI();
        }
    }

    // 技能分裂子弹
    splitBullet(parent) {
        const data = parent.data;
        // 两个小子弹向左右分叉
        this.spawnSplitBullet(parent, -0.3);
        this.spawnSplitBullet(parent, +0.3);
    }

    spawnSplitBullet(parent, angleOffset) {
        const pData = parent.data;
        const angle = Math.atan2(pData.vy, pData.vx) + angleOffset;
        const speed = Math.sqrt(pData.vx*pData.vx + pData.vy*pData.vy);
        const maxBounces = pData.maxBounces - pData.bounces;
        const size = pData.radius * 0.6;
        const damage = pData.damage * 0.5;

        const bullet = this.scene.add.circle(pData.x, pData.y, size, 0x00d4ff);
        bullet.setStrokeStyle(1, 0xffffff);
        bullet.data = {
            x: pData.x,
            y: pData.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: size,
            damage: damage,
            maxBounces: maxBounces,
            bounces: pData.bounces,
            pierceLeft: pData.pierceLeft,
            exploded: pData.exploded,
            trail: [{x: pData.x, y: pData.y}]
        };
        bullet.setData(bullet.data);
        this.bullets.push(bullet);
    }

    explode(x, y, radius) {
        // 范围伤害范围内所有僵尸受伤
        this.zombies.forEach(z => {
            const zData = z.data;
            const dx = x - zData.x;
            const dy = y - zData.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < radius + zData.size) {
                zData.hp -= 20;
                // 更新血条
                zData.hpBarFg.width = (zData.hp / zData.maxHp * (zData.size * 2));
                if (zData.hp <= 0) {
                    this.gameState.totalKills++;
                    this.gameState.exp += zData.type.rewardExp;
                    z.destroy();
                    zData.hpBarBg.destroy();
                    zData.hpBarFg.destroy();
                    this.zombies.splice(this.zombies.indexOf(z), 1);
                }
            }
        });
    }

    lightningJump(deadZombie, jumpsLeft) {
        if (jumpsLeft <= 0) return;
        // 找最近的其他僵尸跳过去
        let closest = null;
        let minDist = 150;
        const dzx = deadZombie.data.x;
        const dzy = deadZombie.data.y;
        this.zombies.forEach(z => {
            if (z === deadZombie) return;
            const dx = z.data.x - dzx;
            const dy = z.data.y - dzy;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < minDist) {
                minDist = dist;
                closest = z;
            }
        });
        if (closest) {
            closest.data.hp -= 50;
            this.lightningJump(closest, jumpsLeft - 1);
        }
    }

    spawnOrb(x, y) {
        const orb = this.scene.add.circle(x, y, 12);
        const gradient = this.scene.context.createRadialGradient(x, y, 0, x, y, 12);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#FFA000');
        orb.fillGradient(gradient, 1);
        orb.setStrokeStyle(2, 0xffffff);
        orb.data = {x: x, y: y, radius: 12};
        orb.setData(orb.data);
        this.orbs.push(orb);
    }

    lightningJump(deadZombie, jumpsLeft) {
        if (jumpsLeft <= 0) return;
        // 找最近的其他僵尸跳过去
        let closest = null;
        let minDist = 150;
        const dzx = deadZombie.data.x;
        const dzy = deadZombie.data.y;
        this.zombies.forEach(z => {
            if (z === deadZombie) return;
            const dx = z.data.x - dzx;
            const dy = z.data.y - dzy;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < minDist) {
                minDist = dist;
                closest = z;
            }
        });
        if (closest) {
            closest.data.hp -= 50;
            if (closest.data.hp <= 0) {
                this.gameState.totalKills++;
                this.gameState.exp += closest.data.type.rewardExp;
                closest.destroy();
                closest.data.hpBarBg.destroy();
                closest.data.hpBarFg.destroy();
                this.zombies.splice(this.zombies.indexOf(closest), 1);
                this.lightningJump(closest, jumpsLeft - 1);
                updateUI();
            }
        }
    }

    // 技能判断
    hasSplit() { return this.skills.some(s => s.id === 'split'); }
    hasFire() { return this.skills.some(s => s.id === 'fire'); }
    hasPoison() { return this.skills.some(s => s.id === 'poison'); }
    hasExplosion() { return this.skills.some(s => s.id === 'explosion'); }
    hasLightning() { return this.skills.some(s => s.id === 'lightning'); }
    hasNuke() { return this.skills.some(s => s.id === 'nuke'); }

    // 打开技能选择弹窗（捡球或升级）
    openSkillSelect() {
        this.gameState.state = 'select-skill';
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
    }

    // 随机选技能，权重稀有度
    pickSkillOptions(count) {
        const weights = {common: 50, rare: 30, epic: 15, legendary: 5};

        // 可以重复选但概率降低
        const available = this.skillData.filter(s => {
            const has = this.skills.find(ex => ex.id === s.id);
            if (has) return Math.random() < 0.2; // 20% 概率可以重复选
            return true;
        });

        let totalWeight = 0;
        available.forEach(s => totalWeight += weights[s.rarity]);

        const picked = [];
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
    }

    selectSkill(skillId) {
        const skill = this.skillData.find(s => s.id === skillId);
        if (skill.id === 'heal') {
            this.gameState.baseHp += skill.healAmount;
        } else if (skill.id === 'money') {
            this.gameState.skillOrbs += skill.extraOrb;
        } else {
            this.skills.push(skill);
        }
        // 用掉一个技能球
        this.gameState.skillOrbs--;
        document.getElementById('skill-modal').classList.remove('show');
        this.gameState.state = 'fighting';
        updateUI();
    }

    gameOver() {
        this.gameState.state = 'gameover';
        document.getElementById('final-wave').textContent = this.gameState.wave;
        document.getElementById('total-kills').textContent = this.gameState.totalKills;
        document.getElementById('game-over-modal').classList.add('show');
    }
}

// 让类可以在全局访问
window.ZombieCannonGame = ZombieCannonGame;
