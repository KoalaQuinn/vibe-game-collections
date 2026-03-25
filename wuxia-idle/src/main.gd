extends Control

# 主界面控制器

@onready var stats_panel = $StatsPanel
@onready var tabs = $Tabs
@onready var cultivation_tab = $Tabs/Cultivation
@onready var meridians_tab = $Tabs/Meridians
@onready var skills_tab = $Tabs/Skills
@onready var adventure_tab = $Tabs/Adventure
@onready var inventory_tab = $Tabs/Inventory

@onready var level_label = $StatsPanel/LevelLabel
@onready var xiuwei_label = $StatsPanel/XiuweiLabel
@onready var hp_label = $StatsPanel/HpLabel
@onready var qi_label = $StatsPanel/QiLabel
@onready var attack_label = $StatsPanel/AttackLabel
@onready var defense_label = $StatsPanel/DefenseLabel
@onready var wuxing_label = $StatsPanel/WuxingLabel

@onready var level_up_button = $StatsPanel/LevelUpButton

var game_data: Node
var definitions: Node

func _ready():
	# 获取自动加载的全局数据
	game_data = get_node("/root/GameData")
	definitions = get_node("/root/Definitions")
	
	# 初始化数据
	definitions.get_default_meridians()
	game_data.init_default_meridians(definitions.get_default_meridians())
	
	# 学习初始技能
	for skill_id in definitions.get_default_skills():
		game_data.learn_skill(skill_id)
	
	# 计算离线奖励
	var reward = game_data.calculate_offline_reward()
	if reward.xiuwei > 0:
		game_data.add_xiuwei(reward.xiuwei)
		# 这里之后可以弹个提示框显示离线收益
	
	# 更新UI
	update_stats()
	
	# 初始化经脉界面
	refresh_meridians_ui()
	
	# 初始化技能界面
	refresh_skills_ui()

# 更新所有属性显示
func update_stats():
	var pd = game_data.player_data
	level_label.text = "等级: %d" % pd.level
	xiuwei_label.text = "修为: %d/%d" % [pd.cultivation_xiuwei, pd.exp_to_next_level]
	hp_label.text = "气血: %d/%d" % [pd.current_hp, pd.max_hp]
	qi_label.text = "内力: %d/%d" % [pd.current_qi, pd.max_qi]
	attack_label.text = "攻击: %d" % pd.attack
	defense_label.text = "防御: %d" % pd.defense
	wuxing_label.text = "悟性: %d" % pd.wuxing
	
	# 升级按钮状态
	level_up_button.disabled = not game_data.can_level_up()

# 点击升级按钮
func _on_level_up_pressed():
	if game_data.do_level_up():
		update_stats()
		refresh_meridians_ui()
		game_data.save_game()

# 刷新经脉界面
func refresh_meridians_ui():
	# 先清除旧节点
	for child in meridians_tab.get_children():
		if child.name != "Title":
			child.queue_free()
	
	var all_meridians = definitions.get_default_meridians()
	var box = VBoxContainer.new()
	box.name = "MeridiansBox"
	box.size_flags_vertical = Control.SIZE_EXPAND_FILL
	meridians_tab.add_child(box)
	
	for m in all_meridians:
		var hbox = HBoxContainer.new()
		var name_label = Label.new()
		name_label.text = m.name + " - " + m.description
		name_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		
		var is_unlocked = game_data.meridians.get(m.name, false)
		var button = Button.new()
		button.text = "打通 (%d修为)" % m.cost
		button.disabled = is_unlocked or game_data.player_data.cultivation_xiuwei < m.cost
		
		if is_unlocked:
			button.text = "已打通"
			button.modulate = Color(0.3, 0.8, 0.3)
		
		button.connect("pressed", callable_mp(self, _on_unlock_meridian).bind(m.name, m.cost))
		
		hbox.add_child(name_label)
		hbox.add_child(button)
		box.add_child(hbox)
	
	# 绘制可视化丹田经脉图
	var drawing = ColorRect.new()
	drawing.name = "MeridianDrawing"
	drawing.size = Vector2(400, 400)
	drawing.color = Color(0.1, 0.1, 0.15)
	drawing.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	drawing.custom_minimum_size = Vector2(400, 400)
	box.add_child(drawing)
	
	# 用CanvasItem绘制
	var canvas = draw_meridians(drawing.size, all_meridians)
	drawing.add_child(canvas)

func draw_meridians(size: Vector2, all_meridians: Array) -> Control:
	var center = size / 2
	var canvas = Control.new()
	canvas.size = size
	
	for m in all_meridians:
		var is_unlocked = game_data.meridians.get(m.name, false)
		var pos = center + m.position * 2
		var circle = CircleShape2D.new()
		circle.radius = 15
		
		var color = is_unlocked ? Color(0.2, 0.8, 0.3) : Color(0.3, 0.3, 0.3)
		var rect = ColorRect.new()
		rect.size = Vector2(30, 30)
		rect.position = pos - Vector2(15, 15)
		rect.color = color
		rect.border_color = Color.WHITE
		rect.border_width = 2
		canvas.add_child(rect)
		
		# 绘制连接线
		if m.has("connect_to"):
			var connected_m = find_meridian(all_meridians, m.connect_to)
			if connected_m:
				var connected_pos = center + connected_m.position * 2
				var line = Line2D.new()
				line.add_point(pos)
				line.add_point(connected_pos)
				line.width = 6
				if is_unlocked && game_data.meridians.get(connected_m.name, false):
					line.default_color = Color(0.2, 0.8, 0.3)
				else:
					line.default_color = Color(0.3, 0.3, 0.3)
				canvas.add_child(line)
	
	return canvas

func find_meridian(all_meridians: Array, name: String) -> Dictionary:
	for m in all_meridians:
		if m.name == name:
			return m
	return null

func _on_unlock_meridian(meridian_name: String, cost: int):
	if game_data.unlock_meridian(meridian_name, cost):
		update_stats()
		refresh_meridians_ui()
		game_data.save_game()

# 刷新技能界面
func refresh_skills_ui():
	# 清除旧节点
	for child in skills_tab.get_children():
		if child.name != "Title":
			child.queue_free()
	
	var all_skills = definitions.get_default_skills()
	var box = VBoxContainer.new()
	box.name = "SkillsBox"
	box.size_flags_vertical = Control.SIZE_EXPAND_FILL
	skills_tab.add_child(box)
	
	for skill_id, skill_def in all_skills:
		var skill_data = game_data.skills.get(skill_id, null)
		var level = skill_data.level if skill_data else 0
		
		var hbox = HBoxContainer.new()
		var name_label = Label.new()
		name_label.text = "%s (%s) - Lv.%d - %s" % [skill_def.name, skill_def.type, level, skill_def.description]
		name_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		
		var cost_xiuwei = int(skill_def.base_cost_xiuwei * pow(skill_def.cost_multiplier, level))
		var button = Button.new()
		button.text = "升级 (%d修为)" % cost_xiuwei
		button.disabled = game_data.player_data.cultivation_xiuwei < cost_xiuwei
		
		button.connect("pressed", callable_mp(self, _on_upgrade_skill).bind(skill_id, cost_xiuwei))
		
		hbox.add_child(name_label)
		hbox.add_child(button)
		box.add_child(hbox)

func _on_upgrade_skill(skill_id: String, cost: int):
	if game_data.upgrade_skill(skill_id, cost):
		refresh_skills_ui()
		update_stats()
		game_data.save_game()

# 保存游戏（定时和手动）
func _on_save_pressed():
	game_data.save_game()
	# 这里可以弹个提示

func _process(delta):
	# 自动恢复气血和内力（每秒钟）
	# 受内功等级影响，简化处理
	var pd = game_data.player_data
	if pd.current_hp < pd.max_hp:
		pd.current_hp = min(pd.max_hp, pd.current_hp + 0.5)
	if pd.current_qi < pd.max_qi:
		pd.current_qi = min(pd.max_qi, pd.current_qi + 0.3)
	
	# 每秒更新UI
	if int(OS.get_unix_time()) % 5 == 0:
		update_stats()
