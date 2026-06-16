import React, { useState, useRef, useEffect } from 'react';
import './ChatInterface.css';

export default function ChatInterface({ paperText, paperTitle }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am your AI Research Companion. I have fully indexed **${paperTitle || 'the paper'}**. You can ask me to explain algorithms, clarify terminology, list datasets, or synthesize findings. How can I help you today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (userText) => {
    if (!userText.trim()) return;

    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const { chatWithPaper } = await import('../utils/api');
      const response = await chatWithPaper(paperText, newMessages, userText);
      setMessages([...newMessages, { role: 'assistant', content: response.reply }]);
    } catch (err) {
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: `Error: ${err.message || 'Could not communicate with the companion. Please verify your internet connection and API key.'}` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickPrompt = (promptText) => {
    sendMessage(promptText);
  };

  const quickPrompts = [
    "Explain the core methodology simply.",
    "What are the main datasets or algorithms used?",
    "What are the key limitations outlined in the paper?",
    "Summarize the practical applications of this research."
  ];

  return (
    <div className="chat-container glass-panel animate-fade-in">
      <div className="chat-header">
        <div className="chat-title-group">
          <span className="chat-header-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <div>
            <h3>Research Companion</h3>
            <span className="chat-status">Context indexed</span>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message-wrapper ${msg.role === 'user' ? 'msg-user' : 'msg-assistant'}`}>
            <div className="message-bubble">
              <div className="msg-sender-name">{msg.role === 'user' ? 'You' : 'Companion'}</div>
              <div className="msg-body">
                {/* Process simple markdown formatting like bolding and line breaks */}
                {msg.content.split('\n').map((line, lIdx) => {
                  // Bold processing
                  const parts = line.split(/(\*\*.*?\*\*)/g);
                  return (
                    <p key={lIdx}>
                      {parts.map((part, pIdx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
                        }
                        return part;
                      })}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="message-wrapper msg-assistant">
            <div className="message-bubble loading-bubble">
              <span className="msg-sender-name">Companion is analyzing</span>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {messages.length === 1 && !loading && (
        <div className="quick-prompts-container">
          <p className="quick-prompts-label">Suggested prompts:</p>
          <div className="quick-prompts-grid">
            {quickPrompts.map((p, idx) => (
              <button key={idx} onClick={() => handleQuickPrompt(p)} className="btn btn-secondary quick-prompt-btn">
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="chat-input-wrapper">
          <input
            type="text"
            placeholder="Ask a question about the paper..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="input-field chat-input-box"
          />
          <button 
            type="submit" 
            className="btn btn-primary send-btn"
            disabled={loading || !input.trim()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
