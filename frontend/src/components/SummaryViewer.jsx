import React, { useState } from 'react';
import './SummaryViewer.css';

export default function SummaryViewer({ analysisData, onBack }) {
  const [activeTab, setActiveTab] = useState('overview');

  const { nlp_metrics, summary, filename, source_url } = analysisData;
  const paperTitle = summary.title || filename || "Analyzed Document";
  const paperAuthors = summary.authors ? summary.authors.join(', ') : '';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="tab-pane animate-fade-in">
            <h3 className="section-title">Executive Summary</h3>
            <div className="markdown-content">
              {summary.executive_summary ? (
                summary.executive_summary.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))
              ) : (
                <p>No summary text provided.</p>
              )}
            </div>
          </div>
        );
      case 'methodology':
        return (
          <div className="tab-pane animate-fade-in">
            <h3 className="section-title">Methodology & Framework</h3>
            <div className="markdown-content">
              {summary.methodology ? (
                summary.methodology.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))
              ) : (
                <p>Methodology details not available.</p>
              )}
            </div>
          </div>
        );
      case 'takeaways':
        return (
          <div className="tab-pane animate-fade-in">
            <h3 className="section-title">Key Contributions & Findings</h3>
            {summary.key_findings && summary.key_findings.length > 0 ? (
              <ul className="bullet-list">
                {summary.key_findings.map((finding, index) => (
                  <li key={index}>{finding}</li>
                ))}
              </ul>
            ) : (
              <p>Key findings not available.</p>
            )}

            <h3 className="section-title" style={{ marginTop: '2.5rem' }}>Limitations & Future Scope</h3>
            {summary.limitations_future_work && summary.limitations_future_work.length > 0 ? (
              <ul className="bullet-list">
                {summary.limitations_future_work.map((limitation, index) => (
                  <li key={index} className="limitation-item">{limitation}</li>
                ))}
              </ul>
            ) : (
              <p>Limitations details not available.</p>
            )}
          </div>
        );
      case 'definitions':
        return (
          <div className="tab-pane animate-fade-in">
            <h3 className="section-title">Concept Definitions</h3>
            {summary.definitions && summary.definitions.length > 0 ? (
              <div className="definitions-grid">
                {summary.definitions.map((def, idx) => (
                  <div key={idx} className="definition-card glass-card">
                    <h4>{def.term}</h4>
                    <p>{def.definition}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-definitions">
                <p>No key terms defined in the summary. You can ask for terms inside the chat companion!</p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="summary-container animate-fade-in">
      <div className="summary-header-row">
        <button onClick={onBack} className="btn btn-secondary btn-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Analyze Another Source
        </button>
        {source_url && (
          <a href={source_url} target="_blank" rel="noopener noreferrer" className="paper-source-link">
            View Original Source
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>

      {summary.api_fallback && (
        <div className="api-fallback-warning">
          <span className="warning-icon">⚠️</span>
          <div className="warning-text">
            <strong>Gemini API Fallback Mode:</strong> Showing local heuristic NLP analysis.
            {summary.fallback_reason ? (
              <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', opacity: 0.95 }}>
                Error Details: <code style={{ background: 'rgba(0,0,0,0.15)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{summary.fallback_reason}</code>
              </div>
            ) : (
              <span> Please check your Gemini API plan or try again later.</span>
            )}
          </div>
        </div>
      )}

      <div className="paper-meta-card glass-panel">
        <span className="meta-paper-label">Document Source</span>
        <h2 className="paper-title">{paperTitle}</h2>
        {paperAuthors && <p className="paper-authors">By {paperAuthors}</p>}
      </div>

      {/* NLP Metrics Dashboard */}
      <div className="metrics-grid">
        <div className="metric-box glass-panel">
          <span className="metric-title">Word Count</span>
          <span className="metric-value">{nlp_metrics.word_count.toLocaleString()}</span>
          <span className="metric-desc">Total analyzed words</span>
        </div>
        <div className="metric-box glass-panel">
          <span className="metric-title">Est. Reading Time</span>
          <span className="metric-value">{nlp_metrics.reading_time} min</span>
          <span className="metric-desc">Based on ~200 words/min</span>
        </div>
        <div className="metric-box glass-panel">
          <span className="metric-title">Readability Profile</span>
          <span className="metric-value complexity-val">{nlp_metrics.complexity}</span>
          <span className="metric-desc">Coleman-Liau linguistic index</span>
        </div>
        <div className="metric-box glass-panel">
          <span className="metric-title">Document Clarity</span>
          <div className="clarity-row">
            <span className="metric-value">{nlp_metrics.readability_score}%</span>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${nlp_metrics.readability_score}%` }}
              ></div>
            </div>
          </div>
          <span className="metric-desc">Structure & complexity score</span>
        </div>
      </div>

      {/* Keywords panel */}
      {nlp_metrics.keywords && nlp_metrics.keywords.length > 0 && (
        <div className="keywords-panel glass-panel">
          <h4 className="keywords-title">Core Terminology & NLP Keyphrases</h4>
          <div className="keywords-list">
            {nlp_metrics.keywords.map((word, i) => (
              <span key={i} className="nlp-badge keyword-badge">{word}</span>
            ))}
          </div>
        </div>
      )}

      {/* Summary Tabs Panel */}
      <div className="summary-details glass-panel">
        <div className="tabs-header">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'methodology' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('methodology')}
          >
            Methodology
          </button>
          <button 
            className={`tab-btn ${activeTab === 'takeaways' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('takeaways')}
          >
            Key Findings
          </button>
          <button 
            className={`tab-btn ${activeTab === 'definitions' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('definitions')}
          >
            Terminology definitions
          </button>
        </div>
        <div className="tabs-body">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
