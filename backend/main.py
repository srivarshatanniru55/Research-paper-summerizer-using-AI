import os
import aiohttp
from typing import List, Dict, Optional

# Monkey-patch ClientConnectorDNSError for compatibility with older aiohttp versions
if not hasattr(aiohttp, "ClientConnectorDNSError"):
    class ClientConnectorDNSError(aiohttp.ClientConnectorError):
        pass
    aiohttp.ClientConnectorDNSError = ClientConnectorDNSError

from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import services
from services.parser import extract_text_from_pdf_bytes, fetch_and_extract_text_from_url
from services.summarizer import calculate_nlp_metrics, generate_gemini_summary
from services.chat import get_chat_response

app = FastAPI(title="Apexium AI Backend")

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev purposes. In production, restrict to frontend domain.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schemas for request validation
class URLAnalyzeRequest(BaseModel):
    url: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    paper_text: str
    messages: List[ChatMessage]
    user_query: str

def get_api_key(x_gemini_key: Optional[str] = Header(None)) -> str:
    """
    Retrieves the Gemini API Key.
    Prioritizes the 'X-Gemini-Key' HTTP header from the request,
    falling back to the 'GEMINI_API_KEY' or 'GOOGLE_API_KEY' environment variables.
    """
    if x_gemini_key:
        return x_gemini_key
    
    # Fallback to env variables
    env_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if env_key:
        return env_key
        
    return ""

@app.get("/")
def read_root():
    return {"status": "running", "message": "Apexium AI - Research Summary API is ready."}

@app.post("/api/analyze/file")
async def analyze_file(
    file: UploadFile = File(...),
    x_gemini_key: Optional[str] = Header(None)
):
    # Retrieve API Key (proceed even if empty to enable local fallback summary)
    api_key = get_api_key(x_gemini_key)

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        # 1. Read bytes & extract text
        pdf_bytes = await file.read()
        extracted_text = extract_text_from_pdf_bytes(pdf_bytes)
        
        if not extracted_text:
            raise HTTPException(status_code=422, detail="Unable to extract text from the PDF. The file might be scanned or protected.")
        
        # 2. Compute heuristic NLP metrics
        nlp_metrics = calculate_nlp_metrics(extracted_text)
        
        # 3. Request AI Summary from Gemini
        ai_summary = await generate_gemini_summary(extracted_text, api_key)
        
        return {
            "success": True,
            "filename": file.filename,
            "nlp_metrics": nlp_metrics,
            "summary": ai_summary,
            "paper_text": extracted_text
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing paper: {str(e)}")

@app.post("/api/analyze/url")
async def analyze_url(
    payload: URLAnalyzeRequest,
    x_gemini_key: Optional[str] = Header(None)
):
    # Retrieve API Key (proceed even if empty to enable local fallback summary)
    api_key = get_api_key(x_gemini_key)

    url = payload.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL cannot be empty.")

    try:
        # 1. Fetch and extract text from URL (PDF or HTML website)
        extracted_text = await fetch_and_extract_text_from_url(url)
        
        if not extracted_text:
            raise HTTPException(status_code=422, detail="Unable to extract text content from the URL.")
            
        # 2. Compute heuristic NLP metrics
        nlp_metrics = calculate_nlp_metrics(extracted_text)
        
        # 4. Request AI Summary from Gemini
        ai_summary = await generate_gemini_summary(extracted_text, api_key)
        
        return {
            "success": True,
            "source_url": url,
            "nlp_metrics": nlp_metrics,
            "summary": ai_summary,
            "paper_text": extracted_text
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching/processing paper from URL: {str(e)}")

@app.post("/api/chat")
async def chat_with_paper(
    payload: ChatRequest,
    x_gemini_key: Optional[str] = Header(None)
):
    api_key = get_api_key(x_gemini_key)
    if not api_key:
        return {
            "success": True, 
            "reply": "⚠️ Gemini API key is missing. Please configure a valid API Key in the settings panel (top right) to enable interactive Q&A chat."
        }
        
    try:
        # Format messages for the service
        formatted_messages = [{"role": msg.role, "content": msg.content} for msg in payload.messages]
        
        reply = await get_chat_response(
            paper_text=payload.paper_text,
            messages=formatted_messages,
            user_query=payload.user_query,
            api_key=api_key
        )
        
        return {"success": True, "reply": reply}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.get("/api/test-gemini")
async def test_gemini(x_gemini_key: Optional[str] = Header(None)):
    """
    Test endpoint to verify Gemini API connection.
    Sends a simple prompt and returns the result or the error details.
    """
    api_key = get_api_key(x_gemini_key)
    if not api_key:
        return {"success": False, "error": "No API key provided in X-Gemini-Key header or environment."}
    
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        response = await client.aio.models.generate_content(
            model='gemini-3.5-flash',
            contents="Hello! Please reply with exactly: 'Gemini connection test successful.'"
        )
        return {
            "success": True,
            "response": response.text.strip(),
            "model": "gemini-3.5-flash"
        }
    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
