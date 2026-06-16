import React, { useState, useEffect } from 'react';
import './Navbar.css';

export default function Navbar() {
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter an API Key first.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/test-gemini', {
        method: 'GET',
        headers: {
          'X-Gemini-Key': apiKey.trim(),
        },
      });
      const data = await response.json();
      if (data.success) {
        setTestResult({ success: true, message: 'Connection Successful! Model responded.' });
      } else {
        setTestResult({ success: false, message: `Failed: ${data.error || 'Unknown error'}` });
      }
    } catch (err) {
      setTestResult({ success: false, message: `Failed: ${err.message}` });
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    setApiKey(savedKey);
  }, []);

  const handleSaveKey = () => {
    localStorage.setItem('gemini_api_key', apiKey.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setShowKeyInput(false);
    }, 1200);
  };

  const handleClearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setIsSaved(false);
  };

  return (
    <header className="navbar-container glass-panel">
      <div className="navbar-brand">
        <div className="brand-text">
          <h1 className="brand-title">AI & NLP Research Platform</h1>
          <span className="brand-tagline">By Apexium</span>
        </div>
      </div>

      <div className="navbar-actions">
        <button 
          className={`btn-key-toggle ${apiKey ? 'key-active' : ''}`}
          onClick={() => setShowKeyInput(!showKeyInput)}
          title="Configure Gemini API Key"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
          {apiKey ? 'API Key Configured' : 'Set API Key'}
        </button>

        {showKeyInput && (
          <div className="api-key-dropdown glass-panel animate-fade-in">
            <h3>Gemini API Key</h3>
            <p className="dropdown-desc">
              Unlimited usage. Paste a new API key here at any time to switch or update your account.
            </p>
            <div className="input-group">
              <input
                type="password"
                placeholder={apiKey ? "••••••••••••••••" : "Enter Gemini API Key"}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                }}
                className="input-field key-input"
              />
              {apiKey && (
                <div className="key-status-hint">
                  Active Key: <code>{apiKey.slice(0, 6)}...{apiKey.slice(-4)}</code>
                </div>
              )}
              <div className="button-group">
                <button 
                  onClick={handleTestKey} 
                  className="btn btn-secondary btn-sm" 
                  disabled={isTesting || !apiKey.trim()}
                  style={{ marginRight: 'auto' }}
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
                <button onClick={handleSaveKey} className="btn btn-primary btn-sm">
                  {isSaved ? 'Saved!' : 'Save Key'}
                </button>
                {apiKey && (
                  <button onClick={handleClearKey} className="btn btn-secondary btn-sm clear-btn">
                    Remove
                  </button>
                )}
              </div>
              {testResult && (
                <div 
                  className="test-result-message" 
                  style={{ 
                    marginTop: '0.75rem', 
                    fontSize: '0.8rem', 
                    textAlign: 'left',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    background: testResult.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    color: testResult.success ? '#10b981' : '#ef4444',
                    border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.16)'}`,
                    lineHeight: '1.4'
                  }}
                >
                  {testResult.message}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
