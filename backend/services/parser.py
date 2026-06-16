import io
import re
import aiohttp
from pypdf import PdfReader

def clean_extracted_text(text: str) -> str:
    """
    Cleans up extracted text from PDF/HTML.
    Handles issues like hyphenation, line breaks, and simple encoding bugs.
    """
    if not text:
        return ""
    
    # Replace soft hyphens and combine words split by newlines
    text = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', text)
    
    # Replace normal newlines with spaces, but keep paragraphs (double newlines)
    text = re.sub(r'\n\s*\n', '##PARAGRAPH##', text)
    text = re.sub(r'\n', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'##PARAGRAPH##', '\n\n', text)
    
    return text.strip()

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """
    Extracts text from PDF binary data.
    """
    pdf_file = io.BytesIO(pdf_bytes)
    reader = PdfReader(pdf_file)
    extracted_text = []
    
    for page in reader.pages:
        text = page.extract_text()
        if text:
            extracted_text.append(text)
            
    raw_text = "\n".join(extracted_text)
    return clean_extracted_text(raw_text)

def clean_arxiv_url(url: str) -> str:
    """
    Converts an arXiv URL to its corresponding PDF download URL.
    """
    url = url.strip()
    match = re.search(r'(?:abs|pdf)/(\d{4}\.\d{4,5}|[a-z\-]+/\d{7})(?:\.pdf)?', url)
    if match:
        arxiv_id = match.group(1)
        return f"https://arxiv.org/pdf/{arxiv_id}.pdf"
    
    if url.endswith(".pdf"):
        return url
        
    return url

def extract_text_from_html(html_content: str) -> str:
    """
    Strips HTML tags and extracts visible text content from a web page.
    Uses regex for zero-dependency parsing.
    """
    # Remove script and style elements
    html_content = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>', '', html_content, flags=re.IGNORECASE)
    # Remove HTML comments
    html_content = re.sub(r'<!--.*?-->', '', html_content, flags=re.DOTALL)
    # Replace common block elements with double newlines
    html_content = re.sub(r'<br\s*/?>', '\n', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'</?(?:p|div|h[1-6]|li|tr|article|section)\b[^>]*>', '\n', html_content, flags=re.IGNORECASE)
    # Strip remaining HTML tags
    text = re.sub(r'<[^>]+>', '', html_content)
    
    # Clean up whitespace and newlines
    lines = [line.strip() for line in text.split('\n')]
    cleaned_lines = []
    for line in lines:
        if line:
            # Replace multiple spaces with a single space
            cleaned_line = re.sub(r'\s+', ' ', line)
            cleaned_lines.append(cleaned_line)
            
    # Combine back with paragraphs
    return "\n\n".join(cleaned_lines)

async def fetch_and_extract_text_from_url(url: str) -> str:
    """
    Asynchronously downloads a URL. If it's a PDF, extracts text.
    If it's an HTML page/text, extracts text content from HTML.
    """
    # If it is arXiv, convert to PDF link
    target_url = clean_arxiv_url(url)
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    async with aiohttp.ClientSession(headers=headers) as session:
        async with session.get(target_url) as response:
            if response.status != 200:
                raise Exception(f"Failed to fetch content from URL. HTTP Status: {response.status}")
            
            content_type = response.headers.get('Content-Type', '').lower()
            content_bytes = await response.read()
            
            # 1. Check if content is PDF
            # PDF magic bytes starting with %PDF-
            is_pdf = content_bytes.startswith(b'%PDF') or 'application/pdf' in content_type or target_url.endswith('.pdf')
            
            if is_pdf:
                return extract_text_from_pdf_bytes(content_bytes)
            
            # 2. Check if content is HTML/Text
            try:
                # Try decoding as UTF-8
                html_text = content_bytes.decode('utf-8', errors='replace')
                extracted_text = extract_text_from_html(html_text)
                if not extracted_text:
                    raise Exception("Extracted text is empty.")
                return clean_extracted_text(extracted_text)
            except Exception as e:
                raise Exception(f"Failed to extract text from webpage: {str(e)}")
