import React, { useState, useEffect, useRef } from 'react';

/**
 * ChatBox Component
 * Natural language query interface for SatQuery AI.
 * Displays user prompts, local UI confirmations, and suggested query chips.
 * Supports loading state during /analyze backend execution.
 */
function ChatBox({ messages, onSendMessage, onClearChat, isLoading = false }) {
  const [queryInput, setQueryInput] = useState('');
  const chatEndRef = useRef(null);

  // Suggested remote sensing queries
  const exampleQueries = [
    'Show me the areas affected by flooding.',
    'Show flooded areas in Pune',
    'Find vegetation in this area',
    'Show water bodies',
  ];

  // Auto-scroll chat history when a new message is appended
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;
    const trimmed = queryInput.trim();
    if (!trimmed) return;

    onSendMessage(trimmed);
    setQueryInput('');
  };

  const handleSelectExample = (exampleText) => {
    if (isLoading) return;
    setQueryInput(exampleText);
  };

  return (
    <div className="card chat-card">
      <div className="card-header">
        <span className="card-title">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
          </svg>
          Natural Language Query
        </span>
        <div className="card-actions">
          {messages.length > 0 && (
            <button
              type="button"
              className="btn-clear-chat"
              onClick={onClearChat}
              disabled={isLoading}
              title="Reset conversation"
            >
              Clear
            </button>
          )}
          <span className="card-badge">Step 7 Real Backend</span>
        </div>
      </div>

      <div className="chat-container">
        {/* Chat History Thread */}
        <div className="chat-history">
          {messages.length === 0 ? (
            <div className="chat-empty-notice">
              <div className="empty-icon">🛰️</div>
              <p className="empty-title">Ready for Natural Language Query</p>
              <p className="empty-desc">
                Ask questions about satellite imagery, flooded zones, vegetation indices, or water bodies.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-bubble ${
                  msg.sender === 'user' ? 'bubble-user' : 'bubble-assistant'
                }`}
              >
                <div className="bubble-header">
                  <span className="bubble-sender">
                    {msg.sender === 'user' ? '👤 User Query' : '🛰️ SatQuery AI'}
                  </span>
                  <span className="bubble-timestamp">
                    {msg.timestamp || 'Just now'}
                  </span>
                </div>
                <div className="bubble-text">{msg.text}</div>
                {msg.note && (
                  <div className="bubble-note">
                    {msg.note}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            type="text"
            className="chat-input"
            placeholder={
              isLoading
                ? "Analyzing satellite image with backend pipeline..."
                : "Type query (e.g. Show me the areas affected by flooding)..."
            }
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="btn-send"
            disabled={isLoading || !queryInput.trim()}
            title={isLoading ? "Analysis in progress..." : "Send Query"}
          >
            <span>{isLoading ? "Analyzing..." : "Send"}</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>

        {/* Example Query Prompts */}
        <div className="example-queries">
          <div className="example-queries-header">
            <span className="example-label">Example Queries:</span>
            <span className="example-hint">Click to paste</span>
          </div>
          <div className="query-chips">
            {exampleQueries.map((example, idx) => (
              <button
                key={idx}
                type="button"
                className="chip-btn"
                onClick={() => handleSelectExample(example)}
                disabled={isLoading}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatBox;
