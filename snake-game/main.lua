-- 贪吃蛇游戏 - LÖVE2D
-- 操作：方向键控制方向，空格键暂停/继续，R键重新开始

-- 游戏配置
local gridSize = 20
local gridCount = 25
local windowSize = gridSize * gridCount

-- 游戏状态
local snake = {}
local direction = {x = 1, y = 0}
local nextDirection = {x = 1, y = 0}
local food = {}
local score = 0
local gameOver = false
local paused = false
local moveTimer = 0
local moveSpeed = 0.15 -- 移动间隔（秒）

-- 初始化游戏
function love.load()
    love.window.setTitle("贪吃蛇")
    love.window.setMode(windowSize, windowSize, {
        x = 0,
        y = 0,
        resizable = false,
        minwidth = windowSize,
        minheight = windowSize,
        vsync = true
    })
    love.graphics.setBackgroundColor(0.1, 0.1, 0.1)
    
    -- 初始化蛇
    snake = {
        {x = 12, y = 12},
        {x = 11, y = 12},
        {x = 10, y = 12}
    }
    
    -- 生成食物
    spawnFood()
end

-- 生成食物
function spawnFood()
    local valid = false
    while not valid do
        food.x = love.math.random(gridCount - 1)
        food.y = love.math.random(gridCount - 1)
        valid = true
        -- 检查食物是否生成在蛇身上
        for _, segment in ipairs(snake) do
            if segment.x == food.x and segment.y == food.y then
                valid = false
                break
            end
        end
    end
end

-- 更新游戏
function love.update(dt)
    if gameOver or paused then return end
    
    moveTimer = moveTimer + dt
    if moveTimer >= moveSpeed then
        moveTimer = 0
        
        -- 更新方向
        direction = nextDirection
        
        -- 计算新头部位置
        local head = {x = snake[1].x + direction.x, y = snake[1].y + direction.y}
        
        -- 检查撞墙
        if head.x < 0 or head.x >= gridCount or head.y < 0 or head.y >= gridCount then
            gameOver = true
            return
        end
        
        -- 检查撞自己
        for _, segment in ipairs(snake) do
            if segment.x == head.x and segment.y == head.y then
                gameOver = true
                return
            end
        end
        
        -- 插入新头部
        table.insert(snake, 1, head)
        
        -- 检查是否吃到食物
        if head.x == food.x and head.y == food.y then
            score = score + 1
            spawnFood()
            -- 加快速度
            if moveSpeed > 0.08 then
                moveSpeed = moveSpeed - 0.005
            end
        else
            -- 移除尾部
            table.remove(snake)
        end
    end
end

-- 绘制游戏
function love.draw()
    -- 绘制网格
    love.graphics.setColor(0.2, 0.2, 0.2)
    for i = 0, gridCount do
        love.graphics.line(i * gridSize, 0, i * gridSize, windowSize)
        love.graphics.line(0, i * gridSize, windowSize, i * gridSize)
    end
    
    -- 绘制食物
    love.graphics.setColor(1, 0.2, 0.2)
    love.graphics.rectangle("fill", food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1)
    
    -- 绘制蛇
    love.graphics.setColor(0.2, 1, 0.2)
    for i, segment in ipairs(snake) do
        -- 头部颜色稍亮
        if i == 1 then
            love.graphics.setColor(0.3, 1, 0.3)
        else
            love.graphics.setColor(0.2, 0.8 + (i/#snake)*0.2, 0.2)
        end
        love.graphics.rectangle("fill", segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1)
    end
    
    -- 绘制分数
    love.graphics.setColor(1, 1, 1)
    love.graphics.print("得分: " .. score, 10, 10, 0, 1.2, 1.2)
    
    -- 绘制游戏状态
    if gameOver then
        love.graphics.setColor(0, 0, 0, 0.7)
        love.graphics.rectangle("fill", 0, windowSize/2 - 40, windowSize, 80)
        love.graphics.setColor(1, 1, 1)
        love.graphics.printf("游戏结束！得分: " .. score, 0, windowSize/2 - 25, windowSize, "center", 0, 1.5, 1.5)
        love.graphics.printf("按 R 键重新开始", 0, windowSize/2 + 5, windowSize, "center", 0, 1, 1)
    elseif paused then
        love.graphics.setColor(0, 0, 0, 0.7)
        love.graphics.rectangle("fill", 0, windowSize/2 - 40, windowSize, 80)
        love.graphics.setColor(1, 1, 1)
        love.graphics.printf("游戏暂停", 0, windowSize/2 - 25, windowSize, "center", 0, 1.5, 1.5)
        love.graphics.printf("按空格键继续", 0, windowSize/2 + 5, windowSize, "center", 0, 1, 1)
    end
end

-- 键盘输入处理
function love.keypressed(key)
    -- 方向控制
    if not gameOver and not paused then
        if key == "right" and direction.x ~= -1 then
            nextDirection = {x = 1, y = 0}
        elseif key == "left" and direction.x ~= 1 then
            nextDirection = {x = -1, y = 0}
        elseif key == "up" and direction.y ~= 1 then
            nextDirection = {x = 0, y = -1}
        elseif key == "down" and direction.y ~= -1 then
            nextDirection = {x = 0, y = 1}
        end
    end
    
    -- 暂停/继续
    if key == "space" and not gameOver then
        paused = not paused
    end
    
    -- 重新开始
    if key == "r" then
        -- 重置所有状态
        snake = {
            {x = 12, y = 12},
            {x = 11, y = 12},
            {x = 10, y = 12}
        }
        direction = {x = 1, y = 0}
        nextDirection = {x = 1, y = 0}
        score = 0
        gameOver = false
        paused = false
        moveTimer = 0
        moveSpeed = 0.15
        spawnFood()
    end
    
    -- 退出
    if key == "escape" then
        love.event.quit()
    end
end
