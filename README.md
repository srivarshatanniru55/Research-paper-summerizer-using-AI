Research Paper Summarizer using AI
Overview
Research Paper Summarizer is an AI-powered web application that helps users quickly understand research papers by generating concise summaries and key insights from PDF documents.

The application extracts text from uploaded research papers, analyzes the content, calculates NLP metrics, and generates intelligent summaries using Google's Gemini AI model.

Features
Upload and analyze PDF research papers

AI-generated summaries using Gemini API

Automatic text extraction from PDFs

NLP-based document statistics

Word Count

Estimated Reading Time

Complexity Level

Keyword Extraction

Chat with your research paper

Modern React-based user interface

FastAPI backend for efficient processing

Tech Stack
Frontend
React
Vite
JavaScript
CSS
Backend
Python
FastAPI
Uvicorn
AI & NLP
Google Gemini API
PDF Text Extraction
Custom NLP Analysis
Project Structure
Research-Paper-Summarizer/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── main.py
│   ├── services/
│   │   ├── parser.py
│   │   ├── summarizer.py
│   │   └── chat.py
│   └── requirements.txt
│
└── README.md
Installation
1. Clone Repository
git clone https://github.com/your-username/research-paper-summarizer.git
cd research-paper-summarizer
2. Backend Setup
cd backend
pip install -r requirements.txt
3. Start Backend
uvicorn main:app --reload
Backend runs on:

http://localhost:8000
4. Start Frontend
Open a new terminal:

cd frontend
npm install
npm run dev
Frontend runs on:

http://localhost:5173
How It Works
Open the application.
Navigate to the API Configuration or Settings section.
Enter your Gemini API key.
Save the configuration.
User uploads a research paper PDF.
Backend extracts text from the document.
NLP metrics are calculated.
Gemini AI generates a summary.
Results are displayed on the frontend.
Users can ask questions about the paper using the chat feature.
Output Includes
Research Paper Summary
Key Insights
Keywords
Word Count
Reading Time
Complexity Analysis
Interactive Paper Chat
Future Improvements
Multi-paper comparison
Citation extraction
Research trend analysis
Export summaries to PDF
Support for DOCX and TXT files
Advanced semantic search
Author
Developed as an AI-powered academic assistance project for simplifying research paper understanding and analysis.

License
This project is intended for educational and learning purposes.
