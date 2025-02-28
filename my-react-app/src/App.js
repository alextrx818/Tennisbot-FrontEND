import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TennisData from './TennisData';
import MatchDetail from './MatchDetail';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="logo">
            <span className="tennis-icon">🎾</span>
            <h1>Tennis Bot</h1>
          </div>
          <nav className="app-nav">
            <ul>
              <li className="active">Live Matches</li>
              <li>Upcoming</li>
              <li>Results</li>
              <li>Tournaments</li>
            </ul>
          </nav>
        </header>
        
        <main className="app-content">
          <Routes>
            <Route path="/" element={<TennisData />} />
            <Route path="/match/:matchId" element={<MatchDetail />} />
          </Routes>
        </main>
        
        <footer className="app-footer">
          <p>&copy; {new Date().getFullYear()} Tennis Bot - Live Tennis Match Information</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
