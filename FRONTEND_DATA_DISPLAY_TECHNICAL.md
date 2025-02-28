# Technical Implementation: Tennis Bot Frontend Data Display

This document outlines the exact technical steps and code implementations required to display tennis match data on the frontend, including the match detail view functionality.

## 1. Frontend-Backend Data Flow Implementation

### 1.1. Backend API Endpoints

```python
# main_api.py - FastAPI endpoint for all matches data
@app.get("/api/tennis")
async def get_tennis_data():
    try:
        # Return the list of all tennis matches
        return {"matches": tennis_matches}
    except Exception as e:
        logger.error(f"Error retrieving tennis data: {str(e)}")
        return {"error": str(e)}

# main_api.py - FastAPI endpoint for individual match data
@app.get("/api/tennis/match/{match_id}")
async def get_match_details(match_id: str):
    try:
        # Find the match with the given ID
        for match in tennis_matches:
            if match.get("match_id") == match_id:
                return match
        
        # If match not found
        return {"error": "Match not found"}, 404
    except Exception as e:
        logger.error(f"Error retrieving match details for {match_id}: {str(e)}")
        return {"error": str(e)}
```

### 1.2. API Data Structure

The API returns match data in this structure:
```json
{
  "matches": [
    {
      "match_id": "string",
      "league": {
        "name": "string",
        "country": "string"
      },
      "home": {
        "name": "string",
        "country": "string",
        "serving": boolean
      },
      "away": {
        "name": "string",
        "country": "string",
        "serving": boolean
      },
      "score": {
        "home": "string",
        "away": "string"
      },
      "sets": [
        {
          "home": "string",
          "away": "string"
        }
      ],
      "time_status": "string",
      "time": "string",
      "markets": [...]
    }
  ]
}
```

## 2. React Component Implementation

### 2.1. Main Matches List (TennisData.jsx)

The key function implemented to fetch and display match data:

```jsx
// TennisData.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TennisData.css';

function TennisData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedMatch, setExpandedMatch] = useState(null);
  const navigate = useNavigate();

  // Fetch data from backend
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tennis');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const jsonData = await response.json();
      setData(jsonData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Toggle match expansion for quick view
  const toggleMatchExpansion = (e, matchId) => {
    e.stopPropagation(); // Prevent triggering card click
    setExpandedMatch(expandedMatch === matchId ? null : matchId);
  };

  // Navigate to match detail page
  const navigateToMatchDetail = (matchId) => {
    navigate(`/match/${matchId}`);
  };

  // Initial data fetch and polling
  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(intervalId);
  }, []);

  // Match card rendering
  const renderMatchCard = (match) => {
    const isExpanded = expandedMatch === match.match_id;
    
    return (
      <div 
        key={match.match_id} 
        className="match-card"
        onClick={() => navigateToMatchDetail(match.match_id)}
      >
        {/* Match card header and content */}
        <div className="match-header">
          {/* League info and time status */}
        </div>
        
        <div className="match-teams">
          {/* Team names, countries, and scores */}
        </div>
        
        {/* Expanded view with additional details */}
        {isExpanded && (
          <div className="match-expanded">
            {/* Additional match data like sets, markets */}
          </div>
        )}
        
        {/* Footer with buttons */}
        <div className="match-footer">
          <div className="footer-buttons">
            <button 
              className="expand-button" 
              onClick={(e) => toggleMatchExpansion(e, match.match_id)}
            >
              {isExpanded ? 'Hide Details' : 'Quick View'}
            </button>
            <span className="separator">|</span>
            <button 
              className="view-details-button"
              onClick={(e) => {
                e.stopPropagation();
                navigateToMatchDetail(match.match_id);
              }}
            >
              View Full Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Main render method
  return (
    <div className="tennis-data-container">
      {loading && <div className="loading">Loading match data...</div>}
      {error && <div className="error">Error: {error}</div>}
      {data && (
        <div className="matches-list">
          {data.matches.length > 0 ? (
            data.matches.map(renderMatchCard)
          ) : (
            <div className="no-matches">No live matches available</div>
          )}
        </div>
      )}
    </div>
  );
}

export default TennisData;
```

### 2.2. Match Detail Component (MatchDetail.jsx)

The component for displaying individual match details:

```jsx
// MatchDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './MatchDetail.css';

function MatchDetail() {
  const { matchId } = useParams();
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch individual match data
  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tennis/match/${matchId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setMatchData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching match details:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (matchId) {
      fetchMatchDetails();
    }
  }, [matchId]);

  // Helper functions for formatting data
  const formatTimeStatus = (status) => {
    const statusMap = {
      '1': 'Not Started',
      '2': 'In Progress',
      '3': 'Finished',
      '4': 'Postponed',
      '5': 'Cancelled',
      '6': 'Walkover',
      '7': 'Interrupted',
      '8': 'Abandoned',
      '9': 'Retired',
      '99': 'Removed'
    };
    return statusMap[status] || status;
  };

  // Render match detail view
  return (
    <div className="match-detail-container">
      {/* Back navigation */}
      <div className="detail-header">
        <Link to="/" className="back-button">← Back to Matches</Link>
        <h1>Match Details</h1>
      </div>
      
      {/* Loading and error states */}
      {loading && <div className="detail-loading">Loading match details...</div>}
      {error && <div className="detail-error">Error: {error}</div>}
      
      {/* Match data display */}
      {!loading && matchData && (
        <div className="match-detail-card">
          {/* Match ID and time information */}
          <div className="detail-section match-info">
            <h2>Match Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Match ID:</span>
                <span className="info-value">{matchData.match_id}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Start Time:</span>
                <span className="info-value">{new Date(matchData.time * 1000).toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className="info-value">{formatTimeStatus(matchData.time_status)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">League:</span>
                <span className="info-value">{matchData.league?.name} ({matchData.league?.country})</span>
              </div>
            </div>
          </div>
          
          {/* Teams section */}
          <div className="detail-section teams-section">
            <h2>Teams</h2>
            <div className="teams-container">
              {/* Home team */}
              <div className="team home-team">
                <div className="team-name">
                  {matchData.home.serving && <span className="serving-indicator">🎾</span>}
                  {matchData.home.name}
                </div>
                <div className="team-country">{matchData.home.country}</div>
              </div>
              
              {/* Score display */}
              <div className="detail-score">
                <div className="score-value">
                  <span>{matchData.score?.home || '0'}</span>
                  <span className="score-separator">:</span>
                  <span>{matchData.score?.away || '0'}</span>
                </div>
              </div>
              
              {/* Away team */}
              <div className="team away-team">
                <div className="team-name">
                  {matchData.away.serving && <span className="serving-indicator">🎾</span>}
                  {matchData.away.name}
                </div>
                <div className="team-country">{matchData.away.country}</div>
              </div>
            </div>
          </div>
          
          {/* Sets section */}
          <div className="detail-section sets-section">
            <h2>Sets</h2>
            <div className="sets-container">
              <table className="sets-table">
                <thead>
                  <tr>
                    <th>Set</th>
                    <th>{matchData.home.name}</th>
                    <th>{matchData.away.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {matchData.sets?.map((set, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{set.home}</td>
                      <td>{set.away}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Betting markets section (if available) */}
          {matchData.markets && matchData.markets.length > 0 && (
            <div className="detail-section markets-section">
              <h2>Betting Markets</h2>
              <div className="markets-container">
                {matchData.markets.map((market, index) => (
                  <div key={index} className="market-card">
                    <h3>{market.name}</h3>
                    <table className="odds-table">
                      <thead>
                        <tr>
                          <th>Outcome</th>
                          <th>Odds</th>
                        </tr>
                      </thead>
                      <tbody>
                        {market.outcomes.map((outcome, idx) => (
                          <tr key={idx}>
                            <td>{outcome.name}</td>
                            <td className="odds-value">{outcome.odds}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Display all remaining data */}
          <div className="detail-section raw-data">
            <h2>Additional Match Data</h2>
            <pre className="json-data">
              {JSON.stringify(matchData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchDetail;
```

### 2.3. App Component with Routing (App.js)

```jsx
// App.js
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
```

## 3. Technical Steps to Enable Data Display

1. **Frontend Fetch Implementation**
   - Used the `fetch` API in React hooks to make HTTP requests to the backend
   - Implemented proper error handling and loading states
   - Set up polling with `setInterval` to refresh data periodically

2. **React Router Navigation Setup**
   - Used `useNavigate` hook from react-router-dom to enable programmatic navigation
   - Implemented URL parameters with the `useParams` hook to extract the match ID
   - Added both "Quick View" and "Full Details" modes for displaying match data

3. **FastAPI Route Configuration for SPA**
   - Added special catch-all route to support React Router's client-side routing:
   ```python
   @app.get("/{full_path:path}", include_in_schema=False)
   async def serve_react_routes(full_path: str):
       # Exclude API paths from this catch-all
       if full_path.startswith("api/"):
           raise HTTPException(status_code=404, detail="API endpoint not found")
       
       # For all other paths, serve the React app's index.html
       return FileResponse(os.path.join(react_build_dir, "index.html"))
   ```

4. **CORS Configuration**
   - Enabled Cross-Origin Resource Sharing to allow the frontend to make API requests:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

5. **CSS Implementation for Data Display**
   - Styled match cards with expandable sections for "Quick View"
   - Implemented responsive design for both list view and detail view
   - Used CSS Grid and Flexbox for layout of complex data structures

## 4. Data Display Debugging & Fixes

Initially, the data was not displaying properly. Here are the key issues and fixes implemented:

1. **API Response Structure Mismatch**
   - Initial issue: Frontend expecting different data structure than API provided
   - Fix: Unified the data model between backend and frontend

2. **Missing ID Parameter in Route**
   - Initial issue: URL parameter not correctly passed from list view to detail view  
   - Fix: Implemented proper route parameter with the `useParams` hook

3. **Invalid JSON Parsing**
   - Initial issue: Error handling during JSON parsing was inadequate
   - Fix: Added proper try/catch blocks around fetch operations

4. **CORS Blocking API Requests**
   - Initial issue: Browser security preventing API access
   - Fix: Added CORS middleware in FastAPI

5. **Client-side Routing Not Working**
   - Initial issue: Server returning 404 for React Router routes
   - Fix: Added catch-all route in FastAPI to serve index.html for all non-API routes

6. **Data Polling Causing Performance Issues**
   - Initial issue: Constant re-fetching affecting application performance
   - Fix: Implemented cleaner interval handling with proper cleanup

## 5. Special Notes

- When debugging API connections, the most common issue was incorrect URL paths between frontend and backend
- The match detail functionality required two distinct data flows:
  1. Main list view fetches all matches via `/api/tennis`
  2. Detail view fetches specific match data via `/api/tennis/match/{match_id}`
- Special attention was needed for date/time formatting and handling null/undefined data from the API
