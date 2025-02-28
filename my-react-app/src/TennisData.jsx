import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './TennisData.css';

function TennisData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [expandedMatch, setExpandedMatch] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tennis'); // Use relative URL instead of absolute
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const jsonData = await response.json();
      console.log('Fetched data:', jsonData); // Debug logging
      setData(jsonData);
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch data immediately when component mounts
    fetchData();
    
    // Set up interval to fetch data every minute
    const intervalId = setInterval(fetchData, 60000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  const toggleExpandMatch = (event, matchId) => {
    event.stopPropagation();
    if (expandedMatch === matchId) {
      setExpandedMatch(null);
    } else {
      setExpandedMatch(matchId);
    }
  };
  
  const navigateToMatchDetail = (matchId) => {
    navigate(`/match/${matchId}`);
  };

  // Show loading message if still loading and no data yet
  if (loading && !data) {
    return (
      <div className="tennis-data-container">
        <div className="loading">
          <p>Loading tennis data...</p>
        </div>
      </div>
    );
  }

  // Show error message if there was an error
  if (error) {
    return (
      <div className="tennis-data-container">
        <div className="error-container">
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button onClick={handleRefresh}>Try Again</button>
        </div>
      </div>
    );
  }

  // Show "no matches" message if we have data but no matches
  if (!data || !data.matches || data.matches.length === 0) {
    return (
      <div className="tennis-data-container">
        <div className="header-row">
          <h2>Live Tennis Matches</h2>
          <div className="refresh-section">
            <button onClick={handleRefresh}>Refresh Data</button>
            {lastUpdated && <span className="timestamp">Last updated: {lastUpdated}</span>}
          </div>
        </div>
        <div className="no-matches">
          <p>No live tennis matches available at the moment.</p>
        </div>
      </div>
    );
  }

  // Helper function to format time status
  const formatTimeStatus = (status) => {
    if (status === '1') {
      return 'LIVE';
    } else if (status === '0') {
      return 'SCHEDULED';
    } else if (status === '3') {
      return 'ENDED';
    } else {
      return 'UPCOMING';
    }
  };

  // Helper function to format score
  const formatScore = (scoreString) => {
    if (!scoreString) return '0 - 0';
    
    // Clean up the score string
    return scoreString.replace(/;/g, ' | ').replace(/,/g, '-');
  };

  // Helper function to extract player names
  const formatPlayerName = (name) => {
    if (!name) return 'Unknown Player';
    
    // Fix common name formatting issues
    return name
      .replace(/\s+/g, ' ')  // Remove extra spaces
      .replace(/\([^)]*\)/g, '') // Remove text in parentheses
      .trim();
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = new Date(parseInt(timestamp) * 1000);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid time';
    }
  };

  // Render the matches if we have data
  return (
    <div className="tennis-data-container">
      <div className="header-row">
        <h2>Live Tennis Matches ({data.matches.length})</h2>
        <div className="refresh-section">
          <button onClick={handleRefresh}>Refresh Data</button>
          {lastUpdated && <span className="timestamp">Last updated: {lastUpdated}</span>}
        </div>
      </div>
      
      <div className="matches-list">
        {data.matches.map((match, index) => {
          // Extract data from match
          const betsapiData = match.betsapi_data || {};
          const rapidData = match.rapid_data || {};
          
          // Extract team info from betsapi
          const inplayEvent = betsapiData.inplayEvent || betsapiData.inplay_event || {};
          const homeTeam = inplayEvent.home || {};
          const awayTeam = inplayEvent.away || {};
          const league = inplayEvent.league || {};
          
          // Get match status
          const timeStatus = inplayEvent.time_status || '0';
          const statusText = formatTimeStatus(timeStatus);
          
          // Format score
          const scoreText = formatScore(inplayEvent.ss);
          
          // Format player names
          const player1Name = formatPlayerName(homeTeam.name);
          const player2Name = formatPlayerName(awayTeam.name);
          
          // Extract detailed scores
          const scores = inplayEvent.scores || {};
          
          // Get current serving and points
          const points = inplayEvent.points || '0-0';
          const playingIndicator = inplayEvent.playing_indicator || '';
          
          // Extract start time
          const startTime = formatTimestamp(inplayEvent.time);
          
          // Extract odds data
          const marketsData = [];
          if (rapidData.raw_odds_data) {
            try {
              const parsedOdds = rapidData.raw_odds_data;
              if (parsedOdds && parsedOdds.markets) {
                Object.entries(parsedOdds.markets).forEach(([key, value]) => {
                  if (typeof value === 'object') {
                    marketsData.push({ market: key, data: value });
                  }
                });
              }
            } catch (e) {
              console.error('Error parsing odds:', e);
            }
          }
          
          const isExpanded = expandedMatch === match.match_id;

          return (
            <div 
              key={match.match_id || index} 
              className={`match-card ${isExpanded ? 'expanded' : ''}`}
              onClick={() => navigateToMatchDetail(match.match_id)}
            >
              <div className="match-header">
                <span className="league-name">{league.name || 'Tennis Match'}</span>
                <span className={`match-status ${timeStatus !== '1' ? 'scheduled' : ''}`}>
                  {statusText}
                </span>
              </div>
              
              <div className="match-teams">
                <div className="team">
                  <div className="team-name">{player1Name}</div>
                  {homeTeam.cc && <div className="team-country">{homeTeam.cc}</div>}
                  {playingIndicator && playingIndicator.includes('0') && (
                    <div className="serving-indicator">Serving</div>
                  )}
                </div>
                <span className="versus">vs</span>
                <div className="team">
                  <div className="team-name">{player2Name}</div>
                  {awayTeam.cc && <div className="team-country">{awayTeam.cc}</div>}
                  {playingIndicator && playingIndicator.includes('1') && (
                    <div className="serving-indicator">Serving</div>
                  )}
                </div>
              </div>
              
              <div className="score-section">
                <h4>Current Score</h4>
                <div className="score">{scoreText}</div>
                {points && points !== '0-0' && (
                  <div className="points-display">
                    Current Points: <span className="current-points">{points}</span>
                  </div>
                )}
              </div>
              
              {Object.keys(scores).length > 0 && (
                <div className="detailed-scores">
                  <h4>Set Scores</h4>
                  <div className="sets-table">
                    <div className="set-header">
                      <div className="set-label"></div>
                      {Object.keys(scores).map(set => (
                        <div key={set} className="set-number">Set {set}</div>
                      ))}
                    </div>
                    <div className="player-row">
                      <div className="player-name-short">{player1Name.split('/')[0]}</div>
                      {Object.keys(scores).map(set => (
                        <div key={set} className="set-score">
                          {scores[set]?.home || '0'}
                        </div>
                      ))}
                    </div>
                    <div className="player-row">
                      <div className="player-name-short">{player2Name.split('/')[0]}</div>
                      {Object.keys(scores).map(set => (
                        <div key={set} className="set-score">
                          {scores[set]?.away || '0'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {isExpanded && (
                <div className="match-details" onClick={(e) => e.stopPropagation()}>
                  <div className="match-info-row">
                    <span className="info-label">Match ID:</span>
                    <span className="info-value">{match.match_id}</span>
                  </div>
                  <div className="match-info-row">
                    <span className="info-label">Start Time:</span>
                    <span className="info-value">{startTime}</span>
                  </div>
                  {marketsData.length > 0 && (
                    <div className="markets-section">
                      <h4>Available Markets</h4>
                      <div className="markets-list">
                        {marketsData.slice(0, 3).map((market, idx) => (
                          <div key={idx} className="market-item">
                            <div className="market-name">{market.market}</div>
                            <div className="market-values">
                              {Object.entries(market.data).slice(0, 3).map(([key, value], i) => (
                                <div key={i} className="market-value-item">
                                  <span className="market-key">{key}:</span>
                                  <span className="market-value">{typeof value === 'object' ? JSON.stringify(value).substring(0, 20) : value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="match-footer">
                {isExpanded ? (
                  <button 
                    className="expand-button" 
                    onClick={(e) => toggleExpandMatch(e, match.match_id)}
                  >
                    Collapse
                  </button>
                ) : (
                  <div className="footer-buttons">
                    <button 
                      className="expand-button" 
                      onClick={(e) => toggleExpandMatch(e, match.match_id)}
                    >
                      Quick View
                    </button>
                    <span className="separator">|</span>
                    <Link to={`/match/${match.match_id}`}>
                      <button className="view-details-button">
                        View Full Details
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TennisData;
