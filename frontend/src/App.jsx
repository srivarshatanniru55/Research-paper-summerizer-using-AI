import React, { useState } from 'react';
import Navbar from './components/Navbar';
import FileUpload from './components/FileUpload';
import SummaryViewer from './components/SummaryViewer';
import ChatInterface from './components/ChatInterface';
import './App.css';

export default function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalysisComplete = (data) => {
    setAnalysisData(data);
    setError(null);
  };

  const handleBack = () => {
    setAnalysisData(null);
    setError(null);
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        {error && (
          <div className="error-banner">
            <div className="error-banner-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="error-close-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {!analysisData ? (
          <FileUpload 
            onAnalysisComplete={handleAnalysisComplete} 
            onError={setError} 
          />
        ) : (
          <div className="dashboard-layout">
            <div className="dashboard-left">
              <SummaryViewer 
                analysisData={analysisData} 
                onBack={handleBack} 
              />
            </div>
            <div className="dashboard-right">
              <ChatInterface 
                paperText={analysisData.paper_text} 
                paperTitle={analysisData.summary.title} 
              />
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Powered by Apexium</p>
      </footer>
    </div>
  );
}
