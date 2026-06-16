import json
import re
from typing import Dict, Any, List

# List of common English stopwords for fallback keyword extraction
STOPWORDS = set([
    "the", "and", "of", "to", "in", "is", "that", "for", "on", "with", "as", "by", "an", "at", 
    "be", "this", "are", "from", "it", "was", "were", "which", "or", "but", "not", "your", "my",
    "we", "they", "he", "she", "you", "our", "their", "them", "us", "i", "me", "him", "her",
    "can", "will", "would", "should", "could", "has", "have", "had", "been", "does", "do", "did",
    "about", "also", "their", "some", "more", "than", "other", "into", "only", "then", "its",
    "such", "these", "there", "use", "used", "using", "how", "who", "what", "where", "when", "why",
    "paper", "study", "research", "results", "analysis", "proposed", "method", "system", "model",
    "data", "figure", "table", "section", "using", "based", "results", "approach", "performance"
])

def extract_keywords_heuristics(text: str, top_n: int = 8) -> List[str]:
    """
    Extracts key terminology from text using simple frequency-based heuristic.
    """
    # Normalize text to lower case and find word characters
    words = re.findall(r'\b[a-z]{4,}\b', text.lower())
    
    # Filter stopwords
    filtered_words = [w for w in words if w not in STOPWORDS]
    
    # Count frequencies
    freq = {}
    for w in filtered_words:
        freq[w] = freq.get(w, 0) + 1
        
    # Sort by frequency
    sorted_keywords = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    return [item[0].capitalize() for item in sorted_keywords[:top_n]]

def calculate_nlp_metrics(text: str) -> Dict[str, Any]:
    """
    Computes heuristic readability, word count, reading time, and complexity metrics.
    """
    word_count = len(text.split())
    
    # Standard reading speed is ~200 WPM
    reading_time_mins = max(1, round(word_count / 200))
    
    # Find sentences
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    sentence_count = len(sentences) if len(sentences) > 0 else 1
    
    # Readability calculation: Coleman-Liau or simple heuristics
    # Coleman-Liau: CLI = 0.0588 * L - 0.296 * S - 15.8
    # L is average letters per 100 words. S is average sentences per 100 words.
    letters = sum(len(w) for w in text if w.isalnum())
    
    words_ratio = word_count / 100
    if words_ratio > 0:
        L = (letters / word_count) * 100
        S = (sentence_count / word_count) * 100
        cli = 0.0588 * L - 0.296 * S - 15.8
    else:
        cli = 12 # Default to high school
        
    # Map CLI grade level to readability terms
    if cli < 8:
        complexity = "General / Easy"
    elif cli < 12:
        complexity = "Intermediate / High School"
    elif cli < 16:
        complexity = "Advanced / Undergraduate"
    else:
        complexity = "Highly Academic / Post-Graduate"
        
    keywords = extract_keywords_heuristics(text)
    
    return {
        "word_count": word_count,
        "reading_time": reading_time_mins,
        "complexity": complexity,
        "readability_score": round(max(0, min(100, 100 - cli * 4))), # Scale it to 0-100 index
        "keywords": keywords
    }

def generate_local_nlp_summary(text: str) -> Dict[str, Any]:
    """
    Local heuristic NLP fallback to parse and summarize the document
    if the Gemini API key hits rate limits or is invalid.
    """
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    title = "Analyzed Document"
    if len(lines) > 0:
        title = lines[0][:100]
        if len(title) < 10 and len(lines) > 1:
            title = lines[0] + " " + lines[1][:50]
            
    authors = ["Local NLP Analyzer"]
    if len(lines) > 1:
        authors_guess = lines[1][:100]
        if len(authors_guess) > 15 and ',' in authors_guess:
            authors = [a.strip() for a in authors_guess.split(',')[:3]]
            
    # Heuristic Abstract / Summary
    abstract = ""
    abstract_match = re.search(r'\b(abstract|executive summary|summary|abstract:)\b', text, re.IGNORECASE)
    if abstract_match:
        idx = abstract_match.end()
        abstract = text[idx:idx+1200].strip()
        abstract = re.sub(r'^[:\s\-\.\n]+', '', abstract)
    else:
        # Fallback to first few paragraphs
        paras = [p.strip() for p in text.split('\n\n') if p.strip()]
        abstract = "\n\n".join(paras[:2])[:1200]
        
    # Heuristic Methodology
    methodology = ""
    method_match = re.search(r'\b(methodology|methods|proposed approach|system model|framework|algorithm|experimental design|design)\b', text, re.IGNORECASE)
    if method_match:
        idx = method_match.end()
        methodology = text[idx:idx+1000].strip()
        methodology = re.sub(r'^[:\s\-\.\n]+', '', methodology)
    else:
        # Fallback search middle of text
        text_len = len(text)
        mid = text_len // 2
        methodology = text[mid:mid+1000].strip()
        
    # Heuristic Findings
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    
    findings = []
    finding_keywords = ['results', 'achieve', 'outperform', 'accurate', 'improved', 'significant', 'accuracy', 'increase', 'contribution']
    for s in sentences:
        if any(w in s.lower() for w in finding_keywords):
            cleaned = s.replace('\n', ' ')
            findings.append(cleaned)
            if len(findings) >= 3:
                break
    if len(findings) < 2:
        findings = [s.replace('\n', ' ') for s in sentences[5:8]]
        
    # Heuristic Limitations
    limitations = []
    limitation_keywords = ['limitation', 'future work', 'future research', 'restrict', 'shortcoming', 'conclude']
    for s in sentences:
        if any(w in s.lower() for w in limitation_keywords):
            cleaned = s.replace('\n', ' ')
            limitations.append(cleaned)
            if len(limitations) >= 2:
                break
    if len(limitations) < 2:
        limitations = [
            "Further empirical analysis is required to validate these findings under diverse operational settings.", 
            "Future investigations will explore scaling this architecture to more complex domain scenarios."
        ]
        
    # Heuristic Definitions
    keywords = extract_keywords_heuristics(text, top_n=4)
    definitions = []
    for kw in keywords:
        definitions.append({
            "term": kw,
            "definition": f"Core term frequently referenced within the document text. Represents a primary focal area identified by local frequency analysis."
        })
        
    return {
        "title": title,
        "authors": authors,
        "executive_summary": abstract,
        "methodology": methodology,
        "key_findings": findings,
        "limitations_future_work": limitations,
        "definitions": definitions,
        "api_fallback": True
    }

async def generate_gemini_summary(text: str, api_key: str) -> Dict[str, Any]:
    """
    Uses Google Gemini API to analyze the research paper text and extract
    a structured summary in JSON format.
    Falls back to a local heuristic summary if rate limited (429) or invalid key.
    """
    if not api_key:
        # If no key, fallback immediately
        return generate_local_nlp_summary(text)
        
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    truncated_text = text[:150000]
    
    prompt = f"""
You are an expert academic research assistant. Analyze the provided research paper text and return a comprehensive, structured summary in JSON format.

Your response MUST be valid JSON only. Do not wrap the JSON in Markdown block formatting like ```json ... ```. Do not add any explanatory text outside the JSON.

JSON Structure:
{{
  "title": "Extracted title of the paper (or best guess if not clear)",
  "authors": ["Author 1", "Author 2"],
  "executive_summary": "A high-level 2-3 paragraph summary of the paper's core motivation, approach, and conclusions.",
  "methodology": "A detailed explanation of the methodology, algorithms, dataset, design choices, or experimental setup used by the authors.",
  "key_findings": [
    "Key finding or contribution 1 (with metrics/context if available)",
    "Key finding or contribution 2",
    "Key finding or contribution 3"
  ],
  "limitations_future_work": [
    "Limitation or future work area 1",
    "Limitation or future work area 2"
  ],
  "definitions": [
    {{
      "term": "Term or concept name",
      "definition": "Explanation of this term as it applies to this research paper"
    }}
  ]
}}

Ensure all fields are fully populated and reflect the true contents of the paper.

Research Paper Text:
{truncated_text}
"""
    
    try:
        response = await client.aio.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type='application/json'
            )
        )
        
        result_text = response.text.strip()
        if result_text.startswith("```"):
            result_text = re.sub(r'^```(?:json)?\n', '', result_text)
            result_text = re.sub(r'\n```$', '', result_text)
            result_text = result_text.strip()
            
        data = json.loads(result_text)
        data["api_fallback"] = False
        return data
    except Exception as e:
        print("GEMINI ERROR - Activating local NLP Fallback:", str(e))
        # Handle API rate limit / 429 quota exception gracefully
        fallback_data = generate_local_nlp_summary(text)
        fallback_data["api_fallback"] = True
        fallback_data["fallback_reason"] = str(e)
        return fallback_data
