extends Node

# 游戏数据存储 - 存盘文件也存在这里

# 玩家基础数据
var player_data = {
	"level": 1,
	"exp": 0,
	"exp_to_next_level": 100,
	"cultivation_xiuwei": 0,  # 离线积累的修为
	"current_qi": 100,       # 当前内力
	"max_qi": 100,          # 最大内力
	"current_hp": 100,      # 当前气血
	"max_hp": 100,          # 最大气血
	"attack": 10,           # 攻击
	"defense": 5,           # 防御
	"wuxing": 10,           #悟性
}

# 经脉数据 - key: 经脉名称, value: 是否打通
var meridians = {}

# 武学数据 - key: 武学ID, value: {level: 1, exp: 0}
var skills = {}

# 背包物品
var inventory = {}

# 装备
var equipment = {
	"Weapon": null,
	"Armor": null,
	"Accessory": null,
}

# 离线挂机数据
var afk_data = {
	"last_check_time": OS.get_unix_time(),
	"current_area": "新手村",
	"is_adventuring": false,
}

# 全局游戏状态
var game_state = {
	"last_save_time": OS.get_unix_time(),
}

# 计算离线收益
func calculate_offline_reward():
	var current_time = OS.get_unix_time()
	var elapsed_seconds = current_time - afk_data.last_check_time
	var elapsed_minutes = int(elapsed_seconds / 60)
	
	# 每分钟基础修为收益，受悟性影响
	var xiuwei_per_minute = 1 * player_data.wuxing
	var total_xiuwei = elapsed_minutes * xiuwei_per_minute
	
	# 如果在闯荡中，额外获得材料和经验
	var rewards = {
		"xiuwei": total_xiuwei,
		"items": {},
		"exp": 0,
	}
	
	# 更新最后检查时间
	afk_data.last_check_time = current_time
	
	return rewards

# 获得修为
func add_xiuwei(amount):
	player_data.cultivation_xiuwei += amount
	return player_data.cultivation_xiuwei

# 检查是否可以升级
func can_level_up():
	return player_data.cultivation_xiuwei >= player_data.exp_to_next_level

# 升级
func do_level_up():
	if not can_level_up():
		return false
	
	player_data.level += 1
	player_data.cultivation_xiuwei -= player_data.exp_to_next_level
	# 升级需要更多经验，指数增长
	player_data.exp_to_next_level = int(player_data.exp_to_next_level * 1.5)
	
	# 全属性提升
	player_data.max_qi += int(player_data.max_qi * 0.1)
	player_data.max_hp += int(player_data.max_hp * 0.1)
	player_data.attack += 2
	player_data.defense += 1
	player_data.current_qi = player_data.max_qi
	player_data.current_hp = player_data.max_hp
	
	return true

# 打通经脉
func unlock_meridian(meridian_name, cost_xiuwei):
	if player_data.cultivation_xiuwei >= cost_xiuwei and not meridians.has(meridian_name):
		player_data.cultivation_xiuwei -= cost_xiuwei
		meridians[meridian_name] = true
		# 根据经脉名称加属性
		if "qi" in meridian_name:
			player_data.max_qi += 50
		elif "hp" in meridian_name:
			player_data.max_hp += 50
		elif "attack" in meridian_name:
			player_data.attack += 3
		elif "defense" in meridian_name:
			player_data.defense += 2
		elif "wuxing" in meridian_name:
			player_data.wuxing += 1
		return true
	return false

# 初始化默认经脉
 func init_default_meridians(meridian_list):
	 for m in meridian_list:
		 if not meridians.has(m.name):
			 meridians[m.name] = false

# 学习技能
func learn_skill(skill_id):
	if not skills.has(skill_id):
		skills[skill_id] = {
			"level": 0,
			"exp": 0,
		}
		return true
	return false

# 升级技能
func upgrade_skill(skill_id, cost_xiuwei):
	if not skills.has(skill_id):
		return false
	if player_data.cultivation_xiuwei >= cost_xiuwei:
		player_data.cultivation_xiuwei -= cost_xiuwei
		skills[skill_id].level += 1
		return true
	return false

# 保存游戏
func save_game():
	var save_data = {
		"player_data": player_data,
		"meridians": meridians,
		"skills": skills,
		"inventory": inventory,
		"equipment": equipment,
		"afk_data": afk_data,
		"game_state": game_state,
	}
	
	var file = FileAccess.open("user://savegame.json", FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(save_data))
		file.close()
		print("游戏保存成功")
		return true
	else:
		print("保存失败")
		return false

# 加载游戏
func load_game():
	if not FileAccess.file_exists("user://savegame.json"):
		print("没有存档，开始新游戏")
		afk_data.last_check_time = OS.get_unix_time()
		return false
	
	var file = FileAccess.open("user://savegame.json", FileAccess.READ)
	if file:
		var content = file.get_as_text()
		file.close()
		var save_data = JSON.parse_string(content)
		
		if save_data.has("player_data"):
			player_data = save_data.player_data
		if save_data.has("meridians"):
			meridians = save_data.meridians
		if save_data.has("skills"):
			skills = save_data.skills
		if save_data.has("inventory"):
			inventory = save_data.inventory
		if save_data.has("equipment"):
			equipment = save_data.equipment
		if save_data.has("afk_data"):
			afk_data = save_data.afk_data
		if save_data.has("game_state"):
			game_state = save_data.game_state
		
		print("游戏加载成功")
		return true
	else:
		print("加载失败")
		return false

func _ready():
	load_game()
