# Tennis Bot Implementation Guide: Bridging FastAPI Backend with React Frontend

This document outlines the complete implementation of the Tennis Bot application, including how the FastAPI backend and React frontend are integrated, and how data flows through the system.

## 1. System Architecture Overview

The Tennis Bot is built using:
- **Backend**: FastAPI (Python)
- **Frontend**: React
- **Data Sources**: External tennis data APIs (BetsAPI and RapidAPI)

## 2. Backend Implementation (FastAPI)

### Core Setup

```python
# Core imports for the API
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.exceptions import HTTPException

# Initialize FastAPI app
app = FastAPI()

# Configure CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, limit this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### API Endpoints

```python
# Main endpoint to fetch all tennis matches
@app.get("/api/tennis")
async def get_tennis_data():
    try:
        # Return stored or freshly fetched tennis data
        return {"matches": tennis_matches}
    except Exception as e:
        logger.error(f"Error retrieving tennis data: {str(e)}")
        return {"error": str(e)}

# Endpoint to fetch a specific match by ID
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

### Serving the React Frontend

```python
# Mount React build directory to serve frontend
react_build_dir = os.path.join(os.path.dirname(__file__), "my-react-app", "build")
if os.path.exists(react_build_dir):
    # Serve static assets (JS, CSS)
    app.mount("/static", StaticFiles(directory=os.path.join(react_build_dir, "static")), name="static")
    
    # Serve the main index.html
    @app.get("/", include_in_schema=False)
    async def serve_react_app():
        return FileResponse(os.path.join(react_build_dir, "index.html"))
    
    # Support React Router by handling all frontend routes
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_react_routes(full_path: str):
        # Exclude API paths from this catch-all
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        # For all other paths, serve the React app's index.html
        return FileResponse(os.path.join(react_build_dir, "index.html"))
```

### Data Fetching

```python
# Function to fetch tennis data from external APIs
async def fetch_tennis_data():
    try:
        betsapi_fetcher = BetsapiPrematch()
        rapidapi_fetcher = RapidInplayOddsFetcher()
        
        # Get data from both sources
        betsapi_data = await betsapi_fetcher.get_data()
        rapidapi_data = await rapidapi_fetcher.get_data()
        
        # Process and combine the data
        # Save to file for persistence
        with open("tennis_data.json", "w") as file:
            json.dump({"matches": tennis_matches}, file)
            
    except Exception as e:
        logger.error(f"Error fetching tennis data: {str(e)}")
```

## 3. Frontend Implementation (React)

### Project Setup

The React frontend was created using Create React App:

```bash
npx create-react-app my-react-app
cd my-react-app
npm install react-router-dom  # For navigation
```

### Key Components

#### 1. App.js - Main Component with Routing

```jsx
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
```

#### 2. TennisData.jsx - Main Matches List

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TennisData.css';

function TennisData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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
      setLoading(false);
    }
  };

  // Navigation function
  const navigateToMatchDetail = (matchId) => {
    navigate(`/match/${matchId}`);
  };

  useEffect(() => {
    fetchData();
    // Set interval for polling updates
    const intervalId = setInterval(fetchData, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Render matches list
  return (
    <div className="tennis-data-container">
      {/* ... loading/error handling ... */}
      
      <div className="matches-list">
        {data.matches.map((match) => (
          <div 
            className="match-card"
            onClick={() => navigateToMatchDetail(match.match_id)}
          >
            {/* Match card content */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 3. MatchDetail.jsx - Individual Match Detail Page

```jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './MatchDetail.css';

function MatchDetail() {
  const { matchId } = useParams();
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        const response = await fetch(`/api/tennis/match/${matchId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setMatchData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching match details:', err);
        setLoading(false);
      }
    };

    if (matchId) {
      fetchMatchDetails();
    }
  }, [matchId]);

  // Render match details
  return (
    <div className="match-detail-container">
      {/* Back navigation */}
      <div className="detail-header">
        <Link to="/" className="back-button">← Back to Matches</Link>
        <h1>Match Details</h1>
      </div>
      
      {/* Match data display */}
      {!loading && matchData && (
        <div className="match-detail-card">
          {/* Match details rendering */}
        </div>
      )}
    </div>
  );
}
```

## 4. Data Flow

1. **External API → Backend**:
   - FastAPI backend periodically fetches data from external tennis APIs
   - Data is processed, combined, and stored locally

2. **Backend → Frontend**:
   - Frontend makes HTTP requests to the `/api/tennis` endpoint for match list
   - Frontend makes HTTP requests to `/api/tennis/match/{match_id}` for individual match details

3. **User Interaction**:
   - Users can view the match list, expand for quick preview, or navigate to dedicated match detail pages
   - Frontend state management handles loading, errors, and data display

## 5. Deployment Process

1. **Build React App**:
   ```bash
   cd my-react-app
   npm run build
   ```

2. **Serve from FastAPI**:
   - FastAPI serves the built React app from the `/my-react-app/build` directory
   - API endpoints and static files are handled by different routes

3. **Start the Application**:
   ```bash
   python main_api.py
   ```

## 6. Key Integration Points

1. **URL Structure**:
   - API endpoints use `/api/*` prefix
   - All other routes are handled by React Router

2. **Data Fetching**:
   - Frontend uses the Fetch API to request data from backend endpoints
   - Relative URLs are used to maintain consistency regardless of deployment

3. **React Router Support**:
   - FastAPI has a catch-all route that forwards non-API requests to React's index.html
   - This allows for client-side routing to work with the backend

4. **Static File Serving**:
   - FastAPI serves React's static files (JS, CSS) via a dedicated route

## 7. Conclusion

This implementation provides a seamless integration between a FastAPI backend and React frontend. The backend handles data acquisition and processing, while the frontend focuses on presentation and user interaction. The application is designed to be easily maintainable, with clean separation of concerns and a modern, responsive UI.
