from typing import List, Dict

async def get_chat_response(
    paper_text: str,
    messages: List[Dict[str, str]],
    user_query: str,
    api_key: str
) -> str:
    """
    Answers questions about the research paper content.
    """
    if not api_key:
        raise ValueError("Gemini API key is required to query the paper.")
        
    from google import genai
    client = genai.Client(api_key=api_key)
    
    # Extract only the most recent messages to prevent overflowing context limits
    # We will build a conversation history string
    history_str = ""
    for msg in messages[-10:]: # Keep last 10 messages
        role = "User" if msg["role"] == "user" else "Assistant"
        history_str += f"{role}: {msg['content']}\n"
        
    # Truncate paper text to keep prompt within safety limits (e.g., 100k characters)
    truncated_paper = paper_text[:120000]
    
    prompt = f"""
You are a brilliant AI Research Companion. You are discussing the following research paper with a user.
Your job is to answer the user's questions with high accuracy, detail, and formatting based on the paper.

Strict Rules:
1. Rely primarily on the provided research paper content.
2. If the answer cannot be found in the paper, state "According to the paper, this is not explicitly discussed. However, based on general scientific knowledge..." and provide a helpful response.
3. Be clear, technical but accessible, and use Markdown bullet points and bold formatting where appropriate to make your answer highly readable.
4. Do not make up facts or metrics.

Research Paper Content:
---
{truncated_paper}
---

Conversation History:
{history_str}

User: {user_query}
Assistant:
"""

    try:
        response = await client.aio.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        return f"Error communicating with AI companion: {str(e)}. Please check your API key and network connection."
