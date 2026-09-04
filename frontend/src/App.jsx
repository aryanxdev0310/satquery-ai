import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';

/**
 * App Component
 * Root component managing navigation tabs and global application layout.
 */
function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleTabChange = (tab) => {
    setActiveTab(tab);

    if (tab === 'analysis') {
      const el = document.getElementById('analysis-panel');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="app-main-content">
        <Home activeTab={activeTab} />
      </main>
    </div>
  );
}

export default App;
