# AI 面试官 (AI Interviewer)

这是一个智能交互式 AI 面试官应用，拥有具备实时口型同步功能的 3D 数字人形象、自然逼真的语音合成（Edge TTS）以及基于大语言模型的智能对话能力。

![AI 面试官预览图](https://via.placeholder.com/800x450?text=AI+Interviewer+Preview)

## ✨ 功能亮点

*   **3D 数字人形象**:
    *   集成 [Ready Player Me](https://readyplayer.me/) 的高质量 3D 模型。
    *   **实时口型同步 (Lip-Sync)**：数字人的嘴部动作会根据语音内容自动同步，精准自然。
    *   **生动动画**: 包含随机眨眼、头部跟随等细节，让数字人栩栩如生。
    *   **高度可定制**: 支持通过 GLB 链接加载您自己创建的个性化数字人形象。
*   **智能对话**:
    *   接入 **阿里云通义千问 (DashScope/Qwen)** 大模型，提供专业、具备上下文理解能力的面试问答。
*   **自然语音交互**:
    *   **语音转文字 (STT)**: 使用 Google Speech Recognition 将您的语音实时转换为文本。
    *   **文字转语音 (TTS)**: 采用 **Edge TTS** (微软超自然语音)，提供极具人情味的语音回复（例如“晓晓”音色），告别机械音。
*   **现代技术栈**:
    *   **前端**: React, TypeScript, Vite, React Three Fiber (R3F), Ant Design.
    *   **AI 服务**: Python (FastAPI), OpenAI SDK (兼容 DashScope), Edge TTS.
    *   **后端 (可选)**: Go (Gin) 用于处理 WebSocket 连接（为未来扩展预留）。

## 🛠️ 架构概览

本项目由三个核心部分组成：

1.  **前端 (`/frontend`)**:
    *   基于 React 构建，负责渲染 3D 场景、展示聊天界面以及处理用户交互（录音、点击）。
    *   与 AI 服务通信，发送语音/文本并接收回复。
2.  **AI 服务 (`/ai_service`)**:
    *   基于 Python FastAPI 的核心服务。
    *   负责 **STT** (语音 -> 文本)。
    *   调用 **LLM** (文本 -> AI 回复)。
    *   负责 **TTS** (AI 回复 -> 语音)。
3.  **后端 (`/backend`)**:
    *   基于 Go 语言的服务（目前作为 WebSocket 扩展的占位符）。

## 🚀 快速开始

### 前置要求

*   **Node.js** (v18+)
*   **Python** (v3.10+)
*   **Go** (v1.20+) - *可选*
*   **API Key**: 您需要一个阿里云 DashScope (通义千问) 的 API Key。

### 1. 启动 AI 服务 (Python)

```bash
cd ai_service

# 创建虚拟环境 (推荐)
python3 -m venv venv
source venv/bin/activate  # Windows 请使用 venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt
# 注意: 您的系统还需要安装 ffmpeg 用于音频处理
# macOS: brew install ffmpeg

# 配置环境变量
# 在 ai_service/ 目录下创建一个 .env 文件:
echo "DASHSCOPE_API_KEY=您的真实API_KEY" > .env
echo "AI_MODEL=qwen-plus" >> .env

# 运行服务
python3 main.py
```
*服务运行地址: `http://localhost:8000`*

### 2. 启动前端 (React)

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```
*前端运行地址: `http://localhost:5174`*

### 3. 启动后端 (Go) - *可选*

```bash
cd backend
go run cmd/server/main.go
```
*后端运行地址: `http://localhost:8080`*

## 🎮 使用指南

1.  打开浏览器访问 `http://localhost:5174`。
2.  您将看到 3D AI 面试官的特写画面。
3.  按住右下角的 **"按住说话"** 按钮，开始提问或进行自我介绍。
4.  松开按钮发送。
5.  AI 会思考片刻，然后通过语音和文字进行回复，同时数字人的嘴巴会随语音同步动作！

## ⚙️ 个性化定制

### 更换数字人形象
您可以更改 `frontend/src/components/Avatar3D.tsx` 文件中的 `AVATAR_URL` 常量来替换模型。
您可以在 [Ready Player Me](https://readyplayer.me/) 免费创建并获取您自己的数字人链接（.glb 格式）。

### 更换语音音色
要更改 TTS 音色，请修改 `ai_service/main.py` 中 `process_tts` 函数内的 `voice` 变量。
*   示例: `zh-CN-YunxiNeural` (男声), `zh-CN-XiaoxiaoNeural` (女声)。

## 📄 许可证

本项目开源并遵循 MIT 许可证。
