from fastapi import FastAPI
from pydantic import BaseModel
import base64
import os
import io
import speech_recognition as sr
# from gtts import gTTS # Removed in favor of edge-tts
import edge_tts
import asyncio
from pydub import AudioSegment
import uuid
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="AI Interviewer Service")

# Create temp directory for audio processing
os.makedirs("temp", exist_ok=True)

class ChatRequest(BaseModel):
    message: str = None
    audio_data: str = None # Base64 encoded audio
    session_id: str = "default"

class ChatResponse(BaseModel):
    text: str
    audio_data: str = None # Base64 encoded audio
    emotion: str = "neutral"

def process_stt(base64_audio: str) -> str:
    try:
        # Decode base64
        audio_bytes = base64.b64decode(base64_audio)
        
        # Save as temp webm file
        temp_webm = f"temp/{uuid.uuid4()}.webm"
        temp_wav = f"temp/{uuid.uuid4()}.wav"
        
        with open(temp_webm, "wb") as f:
            f.write(audio_bytes)
            
        # Convert WebM to WAV (SpeechRecognition needs WAV)
        audio = AudioSegment.from_file(temp_webm)
        audio.export(temp_wav, format="wav")
        
        # Recognize speech
        recognizer = sr.Recognizer()
        with sr.AudioFile(temp_wav) as source:
            audio_data = recognizer.record(source)
            # Use Google Web Speech API (Free, no key required)
            text = recognizer.recognize_google(audio_data, language="zh-CN")
            
        # Cleanup
        os.remove(temp_webm)
        os.remove(temp_wav)
        
        return text
    except Exception as e:
        print(f"STT Error: {e}")
        return ""

async def process_tts(text: str) -> str:
    try:
        # Generate speech using edge-tts
        # Voice options: zh-CN-XiaoxiaoNeural, zh-CN-YunxiNeural, etc.
        voice = "zh-CN-XiaoxiaoNeural"
        communicate = edge_tts.Communicate(text, voice)
        
        temp_mp3 = f"temp/{uuid.uuid4()}.mp3"
        await communicate.save(temp_mp3)
        
        # Read back as base64
        with open(temp_mp3, "rb") as f:
            audio_data = f.read()
            base64_audio = base64.b64encode(audio_data).decode('utf-8')
            
        # Cleanup
        os.remove(temp_mp3)
        
        return base64_audio
    except Exception as e:
        print(f"TTS Error: {e}")
        return ""

# Initialize OpenAI Client
# Allow use of DASHSCOPE_API_KEY or standard OPENAI_API_KEY
api_key = os.getenv("DASHSCOPE_API_KEY") or os.getenv("OPENAI_API_KEY")
base_url = os.getenv("OPENAI_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")

client = OpenAI(
    api_key=api_key,
    base_url=base_url
)

def get_ai_response(user_text: str) -> str:
    try:
        current_key = os.getenv("DASHSCOPE_API_KEY") or os.getenv("OPENAI_API_KEY")
        if not current_key or current_key == "sk-placeholder":
            return f"（Mock）收到：{user_text}。请在 .env 文件中配置真实的 API Key (DASHSCOPE_API_KEY) 以启用智能对话。"

        model_name = os.getenv("AI_MODEL", "qwen-plus")
        
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "你是一位专业的AI面试官。请以专业、友善的态度进行面试，针对候选人的回答提出后续问题。请保持回答简练。"},
                {"role": "user", "content": user_text}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI Error: {e}")
        return f"抱歉，我暂时无法连接到大脑（API 调用失败: {e}）。"

@app.get("/")
async def root():
    return {"message": "AI Service is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    user_text = request.message
    
    # Real STT Logic
    if request.audio_data:
        transcribed_text = process_stt(request.audio_data)
        if transcribed_text:
            user_text = transcribed_text
        else:
            user_text = "（无法识别语音，请重试）"
    
    # AI Logic (LLM)
    if not user_text:
        ai_text = "我没有听清，请再说一遍好吗？"
    else:
        ai_text = get_ai_response(user_text)
    
    # Real TTS Logic
    audio_response = await process_tts(ai_text)
    
    return ChatResponse(
        text=ai_text,
        audio_data=audio_response, 
        emotion="interested"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
