# AI Interviewer

An intelligent, interactive AI interviewer application featuring a 3D digital human avatar with real-time lip-sync, natural voice synthesis (Edge TTS), and LLM-powered conversation capabilities.

![AI Interviewer Screenshot](https://via.placeholder.com/800x450?text=AI+Interviewer+Preview)

## ✨ Features

*   **3D Digital Avatar**:
    *   High-quality 3D avatar powered by [Ready Player Me](https://readyplayer.me/).
    *   **Real-time Lip-Sync**: Mouth movements synchronize automatically with the AI's speech.
    *   **Natural Animation**: Includes random eye blinking and head tracking for a lifelike presence.
    *   **Customizable**: Supports loading custom avatars via GLB URLs.
*   **Intelligent Conversation**:
    *   Powered by **Aliyun DashScope (Qwen/通义千问)** for smart, context-aware interview questions and responses.
*   **Natural Voice Interaction**:
    *   **Speech-to-Text (STT)**: Converts user speech to text using Google Speech Recognition.
    *   **Text-to-Speech (TTS)**: Uses **Edge TTS** (Microsoft Azure Neural Voices) for ultra-realistic, human-like speech output (e.g., "Xiaoxiao" voice).
*   **Modern Tech Stack**:
    *   **Frontend**: React, TypeScript, Vite, React Three Fiber (R3F), Ant Design.
    *   **AI Service**: Python (FastAPI), OpenAI SDK (compatible with DashScope), Edge TTS.
    *   **Backend (Optional)**: Go (Gin) for WebSocket handling (if needed for future extensions).

## 🛠️ Architecture

The project consists of three main components:

1.  **Frontend (`/frontend`)**:
    *   A React application that renders the 3D scene and handles user interaction (recording audio, displaying chat).
    *   Communicates with the AI Service to send audio/text and receive responses.
2.  **AI Service (`/ai_service`)**:
    *   A Python FastAPI server.
    *   Handles **STT** (Audio -> Text).
    *   Calls **LLM** (Text -> AI Response).
    *   Handles **TTS** (AI Response -> Audio).
3.  **Backend (`/backend`)**:
    *   A Go server (currently a placeholder for potential WebSocket expansions).

## 🚀 Getting Started

### Prerequisites

*   **Node.js** (v18+)
*   **Python** (v3.10+)
*   **Go** (v1.20+) - *Optional*
*   **API Key**: You need an API Key for Aliyun DashScope (Qwen).

### 1. Setup AI Service (Python)

```bash
cd ai_service

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
# Note: You also need ffmpeg installed on your system for audio processing
# macOS: brew install ffmpeg

# Configure Environment Variables
# Create a .env file in ai_service/ directory:
echo "DASHSCOPE_API_KEY=your_actual_api_key_here" > .env
echo "AI_MODEL=qwen-plus" >> .env

# Run the service
python3 main.py
```
*Service runs on: `http://localhost:8000`*

### 2. Setup Frontend (React)

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```
*Frontend runs on: `http://localhost:5174`*

### 3. Setup Backend (Go) - *Optional*

```bash
cd backend
go run cmd/server/main.go
```
*Backend runs on: `http://localhost:8080`*

## 🎮 Usage

1.  Open your browser and visit `http://localhost:5174`.
2.  You will see the 3D AI Interviewer.
3.  Click and hold the **"按住说话" (Hold to Speak)** button to ask a question or introduce yourself.
4.  Release the button to send.
5.  The AI will think for a moment and then reply with both text and voice, while the avatar's mouth moves in sync!

## ⚙️ Customization

### Changing the Avatar
You can change the 3D model by updating the `AVATAR_URL` constant in `frontend/src/components/Avatar3D.tsx`. You can create your own avatar at [Ready Player Me](https://readyplayer.me/).

### Changing the Voice
To change the TTS voice, modify the `voice` variable in the `process_tts` function in `ai_service/main.py`.
*   Example: `zh-CN-YunxiNeural` (Male), `zh-CN-XiaoxiaoNeural` (Female).

## 📄 License

This project is open-source and available under the MIT License.
