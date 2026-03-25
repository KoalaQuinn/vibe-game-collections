# 贪吃蛇游戏 - LÖVE2D

一个简单好玩的贪吃蛇游戏，用 LÖVE2D 引擎开发。

## 运行方法

1. 首先安装 LÖVE2D 引擎：
   - 官网下载：https://love2d.org/
   - macOS: `brew install love`
   - Ubuntu/Debian: `sudo apt install love`
   - Windows: 官网下载安装包

2. 运行游戏：
   ```bash
   # 进入游戏目录
   cd snake-game
   
   # 直接运行
   love .
   
   # 或者打包成 .love 文件运行
   zip -r snake.love *
   love snake.love
   ```

## 操作说明

- **方向键**：控制蛇的移动方向
- **空格键**：暂停/继续游戏
- **R键**：重新开始游戏
- **ESC键**：退出游戏

## 游戏规则

1. 用方向键控制蛇吃红色的食物
2. 每吃一个食物得分+1，蛇的长度+1，速度会稍微变快
3. 不能撞墙，也不能撞到自己的身体，否则游戏结束
4. 得分越高难度越大，看看你能得多少分！
