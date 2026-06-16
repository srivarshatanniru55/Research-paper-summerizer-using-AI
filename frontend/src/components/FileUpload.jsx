import React, { useState, useRef } from 'react';
import './FileUpload.css';

export default function FileUpload({ onAnalysisComplete, onError }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [arxivUrl, setArxivUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  
  const fileInputRef = useRef(null);

  const checkApiKey = () => {
    const key = localStorage.getItem('gemini_api_key');
    if (!key) {
      onError('Gemini API Key is missing! Please set it using the API Key button in the navbar first.');
      return false;
    }
    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (!checkApiKey()) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        await processFile(file);
      } else {
        onError('Only PDF files are supported.');
      }
    }
  };

  const handleFileChange = async (e) => {
    if (!checkApiKey()) return;
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    setLoading(true);
    onError(null);
    setLoadingStage('Extracting text content from PDF...');
    
    try {
      const { analyzeFile } = await import('../utils/api');
      
      // Artificial delay step to show parser transitions smoothly
      setTimeout(() => setLoadingStage('Analyzing document layout & computing NLP metrics...'), 1500);
      setTimeout(() => setLoadingStage('Consulting Gemini AI to build structured summary...'), 3500);
      
      const result = await analyzeFile(file);
      onAnalysisComplete(result);
    } catch (err) {
      onError(err.message || 'Failed to process file. Check connection and API key.');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!checkApiKey()) return;
    if (!arxivUrl.trim()) return;

    setLoading(true);
    onError(null);
    setLoadingStage('Fetching content from URL...');

    try {
      const { analyzeUrl } = await import('../utils/api');
      
      setTimeout(() => setLoadingStage('Parsing content and extracting NLP metadata...'), 2000);
      setTimeout(() => setLoadingStage('Generating summary using Gemini API...'), 4000);

      const result = await analyzeUrl(arxivUrl.trim());
      onAnalysisComplete(result);
    } catch (err) {
      onError(err.message || 'Failed to fetch content from URL. Make sure it is a valid, accessible link.');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="upload-container glass-panel animate-fade-in">
      <div className="brand-starting-card">
        <h1 className="brand-starting-title">AI & NLP Research Platform</h1>
        <p className="brand-starting-subtitle">By Apexium</p>
      </div>

      <p className="upload-subtitle">Upload a PDF locally or paste any URL (article, web page, or PDF) to extract insights instantly.</p>
      
      {loading ? (
        <div className="loader-container">
          <div className="spinner">
            <div className="double-bounce1"></div>
            <div className="double-bounce2"></div>
          </div>
          <p className="loader-stage animate-pulse-slow">{loadingStage}</p>
          <span className="loader-hint">This might take 10-15 seconds depending on document length...</span>
        </div>
      ) : (
        <>
          <div 
            className={`drag-area ${isDragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }}
              accept=".pdf"
            />
            <div className="upload-icon-container">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="upload-icon">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="drag-text">Drag & drop your PDF here, or <span>browse files</span></p>
            <span className="drag-limit">Supports PDFs of any size</span>
          </div>

          <div className="divider-container">
            <span className="divider-line"></span>
            <span className="divider-text">OR</span>
            <span className="divider-line"></span>
          </div>

          <form onSubmit={handleUrlSubmit} className="url-form">
            <div className="url-input-group">
              <input
                type="text"
                placeholder="Paste any article link, web page URL, or PDF link"
                value={arxivUrl}
                onChange={(e) => setArxivUrl(e.target.value)}
                className="input-field url-input"
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!arxivUrl.trim()}
              >
                Fetch & Analyze
              </button>
            </div>
            <span className="input-hint">Example: https://example.com/article or arXiv link</span>
          </form>
        </>
      )}
    </div>
  );
}
