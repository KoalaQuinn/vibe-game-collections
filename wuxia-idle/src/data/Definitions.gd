extends Node

# 经脉定义数据库
func get_default_meridians():
	return [
		{
			"name": "丹田初开",
			"description": "打开丹田气海",
			"cost": 100,
			"position": Vector2(0, 0),
			"bonus_type": "max_qi",
			"bonus_value": 100,
		},
		{
			"name": "手太阴肺经",
			"description": "增加气血上限",
			"cost": 200,
			"position": Vector2(-80, -40),
			"connect_to": "丹田初开",
			"bonus_type": "max_hp",
			"bonus_value": 100,
		},
		{
			"name": "手阳明大肠经",
			"description": "提升攻击力",
			"cost": 300,
			"position": Vector2(-40, -80),
			"connect_to": "丹田初开",
			"bonus_type": "attack",
			"bonus_value": 10,
		},
		{
			"name": "足阳明胃经",
			"description": "提升防御力",
			"cost": 300,
			"position": Vector2(40, -80),
			"connect_to": "丹田初开",
			"bonus_type": "defense",
			"bonus_value": 8,
		},
		{
			"name": "足太阴脾经",
			"description": "增加悟性，提升修炼速度",
			"cost": 500,
			"position": Vector2(80, -40),
			"connect_to": "丹田初开",
			"bonus_type": "wuxing",
			"bonus_value": 5,
		},
		{
			"name": "手少阴心经",
			"description": "增加内力上限",
			"cost": 600,
			"position": Vector2(-80, 40),
			"connect_to": "丹田初开",
			"bonus_type": "max_qi",
			"bonus_value": 200,
		},
		{
			"name": "手太阳小肠经",
			"description": "提升攻击力",
			"cost": 800,
			"position": Vector2(-40, 80),
			"connect_to": "丹田初开",
			"bonus_type": "attack",
			"bonus_value": 15,
		},
		{
			"name": "足太阳膀胱经",
			"description": "提升防御力",
			"cost": 800,
			"position": Vector2(40, 80),
			"connect_to": "丹田初开",
			"bonus_type": "defense",
			"bonus_value": 12,
			},
		{
			"name": "足少阴肾经",
			"description": "气血内力双提升",
			"cost": 1000,
			"position": Vector2(80, 40),
			"connect_to": "丹田初开",
			"bonus_type": "all",
			"bonus_value": 5,
		},
	]

# 基础武学定义
func get_default_skills():
	return {
		"basic_punch": {
			"name": "太祖长拳",
			"type": "外功",
			"description": "基础拳法，初学者必备",
			"base_damage": 10,
			"damage_per_level": 2,
			"qi_cost": 5,
			"base_cost_xiuwei": 10,
			"cost_multiplier": 1.5,
		},
		"basic_sword": {
			"name": "基础剑法",
			"type": "外功",
			"description": "入门剑法，简洁实用",
			"base_damage": 15,
			"damage_per_level": 3,
			"qi_cost": 8,
			"base_cost_xiuwei": 20,
			"cost_multiplier": 1.6,
		},
		"common_inner": {
			"name": "吐纳法",
			"type": "内功",
			"description": "基础内功心法，缓慢恢复内力",
			"base_qi_recovery": 1,
			"recovery_per_level": 0.5,
			"qi_cost": 0,
			"base_cost_xiuwei": 15,
			"cost_multiplier": 1.4,
		},
		"lightfoot": {
			"name": "踏雪寻踪",
			"type": "轻功",
			"description": "提升闪避几率",
			"base_dodge": 5,
			"dodge_per_level": 2,
			"qi_cost": 0,
			"base_cost_xiuwei": 12,
			"cost_multiplier": 1.5,
		},
	}

# 闯荡区域定义
func get_adventure_areas():
	return {
		"newbie_village": {
			"name": "新手村",
			"description": "村口野猪林，适合练手",
			"min_level": 1,
			"enemy_hp_min": 50,
			"enemy_hp_max": 100,
			"enemy_attack_min": 5,
			"enemy_attack_max": 10,
			"exp_per_minute": 2,
			"xiuwei_per_minute": 1,
			"drop_items": {
				"herb": 0.3,
				"iron_ore": 0.1,
			},
		},
		"green_wolf_forest": {
			"name": "青狼林",
			"description": "野狼出没，危机四伏",
			"min_level": 5,
			"enemy_hp_min": 150,
			"enemy_hp_max": 250,
			"enemy_attack_min": 15,
			"enemy_attack_max": 25,
			"exp_per_minute": 5,
			"xiuwei_per_minute": 3,
			"drop_items": {
				"herb": 0.4,
				"iron_ore": 0.2,
				"wolf_pelt": 0.15,
			},
		},
	}

# 物品定义
func get_item_definitions():
	return {
		"herb": {
			"name": "草药",
			"type": "material",
			"description": "普通草药，可以炼制丹药",
		},
		"iron_ore": {
			"name": "铁矿石",
			"type": "material",
			"description": "可以锻造武器装备",
		},
		"wolf_pelt": {
			"name": "狼皮",
			"type": "material",
			"description": "完整的狼皮，可以制作皮衣",
		},
		"small_pill": {
			"name": "小还丹",
			"type": "consumable",
			"description": "恢复50点气血",
			"effect": "restore_hp",
			"value": 50,
		},
	}

# 计算战斗伤害
func calculate_damage(attacker_attack, defender_defense):
	var base_damage = max(1, attacker_attack - defender_defense)
	# 随机波动 0.8 ~ 1.2
	var random_factor = randf_range(0.8, 1.2)
	return int(base_damage * random_factor)
