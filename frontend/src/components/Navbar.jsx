import React from 'react';

/**
 * Navbar Component
 * Displays SatQuery AI branding, subtitle, navigation tabs, and ISRO Hackathon info.
 */
function Navbar({ activeTab = 'dashboard', onTabChange = () => {} }) {
  return (
    <header className="navbar">
      {/* Brand Section */}
      <div className="brand-section">
        <div className="brand-logo" title="SatQuery AI - Remote Sensing Intelligence">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 7 9 3 5 7l4 4" />
            <path d="m17 11 4 4-4 4-4-4" />
            <path d="m8 12 4 4 6-6-4-4Z" />
            <path d="m16 8 3-3" />
            <path d="M9 21a6 6 0 0 0-6-6" />
            <path d="M10 14a3 3 0 0 0-3-3" />
          </svg>
        </div>
        <div className="brand-text">
          <div className="brand-title-row">
            <h1>SatQuery AI</h1>
            <span className="brand-edition">SIH 2026</span>
          </div>
          <p className="brand-subtitle">Remote Sensing Intelligence</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="nav-links">
        <button
          type="button"
          className={`nav-link-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onTabChange('dashboard')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
          </svg>
          Dashboard
        </button>

        <button
          type="button"
          className={`nav-link-btn ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => onTabChange('analysis')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
          Analysis
        </button>

        <button
          type="button"
          className={`nav-link-btn ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => onTabChange('about')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          About
        </button>
      </nav>

      {/* Badges & System Status */}
      <div className="nav-badges">
        <span className="badge badge-isro" title="ISRO - Problem Statement SIH26167">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          ISRO • SIH26167
        </span>
        <span className="badge badge-status">
          <span className="status-dot"></span>
          Step 4 Map Active
        </span>
      </div>
    </header>
  );
}

export default Navbar;
