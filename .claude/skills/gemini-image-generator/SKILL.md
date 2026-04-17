---
name: gemini-image-generator
description: 使用 Gemini AI 生成游戏美术素材（角色头像、UI界面图、场景图等）。当用户需要生成角色头像、游戏UI设计图、场景背景图、或任何游戏美术素材时使用此skill。支持批量生成、风格参照、自动下载和保存到项目目录。
---

# Gemini 图片生成器

通过 Gemini AI 生成游戏美术素材，自动下载并保存到项目目录。

## 使用场景

- 生成角色头像/立绘
- 生成UI界面设计图
- 生成场景背景图
- 生成游戏图标/素材

## 工作流程

### 1. 确保Chrome调试模式已启动

用户需要先启动Chrome调试模式：

```bash
google-chrome --remote-debugging-port=9222 --user-data-dir=~/.chrome-debug
```

首次使用需要在Chrome中登录Gemini，之后登录状态会保存在 `~/.chrome-debug`。

### 2. 连接Chrome并生成图片

使用 `agent-browser` 工具操作Gemini：

```bash
# 验证Chrome调试端口
curl -s http://localhost:9222/json/version

# 连接并打开Gemini
agent-browser connect 9222
agent-browser open https://gemini.google.com/app

# 点击制作图片工具
agent-browser snapshot -i  # 找到"制作图片"按钮ref
agent-browser click <ref>  # 点击按钮

# 输入提示词
agent-browser fill <textbox_ref> "<prompt>"
agent-browser click <发送按钮ref>

# 等待生成完成（约20-30秒）
agent-browser wait 25000

# 下载图片
agent-browser click <下载按钮ref>
agent-browser wait 8000
```

### 3. 保存图片到项目目录

下载的图片在 `~/Downloads/` 目录，需要复制到项目：

```bash
# 查看最新下载的图片
ls -lat ~/Downloads/ | head -3

# 复制到项目目录（根据图片类型选择目录）
cp ~/Downloads/<filename> docs/assets/<subdirectory>/<final-name>.png
```

## 目录结构

根据图片类型保存到对应目录：

| 类型 | 目录路径 |
|------|----------|
| 角色头像 | `docs/assets/characters/portraits/` |
| 角色立绘 | `docs/assets/characters/fullbody/` |
| UI界面图 | `docs/assets/` |
| 场景图 | `docs/assets/scenes/` |

## 角色头像提示词模板

参考 `references/portrait-prompt-template.md` 获取完整的风格提示词模板。

### 基础模板

```
Generate game character portrait: [角色名], [身份/称号].

Visual Style & Medium:
- Wuxia art style, vintage Chinese illustration, retro Manhua style
- Ink wash drawing with clean outlines
- Traditional Chinese aesthetic
- Muted color palette, earthy tones, historical atmosphere

Character Details:
- [年龄段] Chinese [身份类型]
- [面容特征]
- [发型/胡须特征]
- [服装描述]

Composition & Lighting:
- Character portrait, headshot
- Neutral beige background
- Soft lighting with subtle shading
- Flat cell shading with detailed textures
- Circular portrait frame, 512x512 pixels, game UI asset style
```

## 批量生成

当需要生成多个图片时，按顺序逐个生成：

1. 发起新对话
2. 输入提示词
3. 等待生成
4. 下载并保存
5. 重复步骤1-4

每生成5张图片，让用户确认风格是否满意。

## 注意事项

- 不需要上传参考图片，直接使用提示词模板
- 每张图片生成约需20-30秒
- 下载后需要手动复制到项目目录（Chrome下载可能需要用户确认）
- 如果下载按钮点击后无新文件，让用户在浏览器中手动下载

## 故障排查

### Chrome调试端口无法连接

检查Chrome是否正确启动：

```bash
curl -s http://localhost:9222/json/version
```

如果失败，确保使用了 `--user-data-dir` 参数：

```bash
google-chrome --remote-debugging-port=9222 --user-data-dir=~/.chrome-debug
```

### 图片下载失败

点击下载按钮后，检查浏览器窗口是否有下载确认弹窗需要手动点击。