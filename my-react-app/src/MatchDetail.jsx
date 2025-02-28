import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './MatchDetail.css';

function MatchDetail() {
  const { matchId } = useParams();
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tennis/match/${matchId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched match data:', data);
        setMatchData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching match details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (matchId) {
      fetchMatchDetails();
    }
  }, [matchId]);

  // Helper functions for formatting
  const formatTimeStatus = (status) => {
    if (status === '1') return 'LIVE';
    if (status === '0') return 'SCHEDULED';
    if (status === '3') return 'ENDED';
    return 'UPCOMING';
  };

  const formatPlayerName = (name) => {
    if (!name) return 'Unknown Player';
    return name.replace(/\s+/g, ' ').replace(/\([^)]*\)/g, '').trim();
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = new Date(parseInt(timestamp) * 1000);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid time';
    }
  };

  if (loading) {
    return (
      <div className="match-detail-container">
        <div className="loading-detail">
          <div className="loading-spinner"></div>
          <p>Loading match details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="match-detail-container">
        <div className="detail-header">
          <Link to="/" className="back-button">← Back to Matches</Link>
          <h1>Match Details</h1>
        </div>
        <div className="error-message">
          <h3>Error Loading Match</h3>
          <p>{error}</p>
          <p>The match data could not be loaded. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="match-detail-container">
        <div className="detail-header">
          <Link to="/" className="back-button">← Back to Matches</Link>
          <h1>Match Details</h1>
        </div>
        <div className="not-found">
          <h3>Match Not Found</h3>
          <p>The match with ID {matchId} could not be found.</p>
        </div>
      </div>
    );
  }

  // Extract data from matchData
  const betsapiData = matchData.betsapi_data || {};
  const rapidData = matchData.rapid_data || {};
  
  const inplayEvent = betsapiData.inplayEvent || betsapiData.inplay_event || {};
  const homeTeam = inplayEvent.home || {};
  const awayTeam = inplayEvent.away || {};
  const league = inplayEvent.league || {};
  
  const timeStatus = inplayEvent.time_status || '0';
  const score = inplayEvent.ss || '';
  const points = inplayEvent.points || '0-0';
  const playingIndicator = inplayEvent.playing_indicator || '';
  const detailedScores = inplayEvent.scores || {};
  const startTime = formatTimestamp(inplayEvent.time);
  
  // Format player names
  const player1Name = formatPlayerName(homeTeam.name);
  const player2Name = formatPlayerName(awayTeam.name);

  // Extract odds data
  const markets = {};
  const rawOddsData = rapidData.raw_odds_data || {};
  const rawEventData = rapidData.raw_event_data || {};

  if (rawOddsData && rawOddsData.markets) {
    Object.entries(rawOddsData.markets).forEach(([key, value]) => {
      markets[key] = value;
    });
  }

  return (
    <div className="match-detail-container">
      <div className="detail-header">
        <Link to="/" className="back-button">← Back to Matches</Link>
        <h1>Match Details</h1>
      </div>
      
      <div className="match-detail-card">
        <div className="match-tournament">
          <h2>{league.name || 'Tennis Match'}</h2>
          <div className={`match-status-badge ${timeStatus === '1' ? 'live' : ''}`}>
            {formatTimeStatus(timeStatus)}
          </div>
        </div>
        
        <div className="match-info-panel">
          <div className="match-time-info">
            <div className="info-item">
              <span className="info-label">Match ID:</span>
              <span className="info-value">{matchData.match_id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Start Time:</span>
              <span className="info-value">{startTime}</span>
            </div>
            {league.cc && (
              <div className="info-item">
                <span className="info-label">Country:</span>
                <span className="info-value">{league.cc}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="match-teams-detail">
          <div className="team-detail">
            <div className="team-name-large">{player1Name}</div>
            {homeTeam.cc && <div className="team-country-badge">{homeTeam.cc}</div>}
            {playingIndicator && playingIndicator.includes('0') && (
              <div className="serving-badge">Serving</div>
            )}
          </div>
          
          <div className="score-display">
            <div className="current-score">{score}</div>
            {points && points !== '0-0' && (
              <div className="points">Current Points: {points}</div>
            )}
          </div>
          
          <div className="team-detail">
            <div className="team-name-large">{player2Name}</div>
            {awayTeam.cc && <div className="team-country-badge">{awayTeam.cc}</div>}
            {playingIndicator && playingIndicator.includes('1') && (
              <div className="serving-badge">Serving</div>
            )}
          </div>
        </div>
        
        {Object.keys(detailedScores).length > 0 && (
          <div className="sets-detail">
            <h3>Set Scores</h3>
            <div className="sets-table-large">
              <div className="set-header-row">
                <div className="set-label"></div>
                {Object.keys(detailedScores).map(set => (
                  <div key={set} className="set-number-cell">Set {set}</div>
                ))}
              </div>
              <div className="player-score-row">
                <div className="player-name-cell">{player1Name.split('/')[0]}</div>
                {Object.keys(detailedScores).map(set => (
                  <div key={set} className="set-score-cell">{detailedScores[set]?.home || '0'}</div>
                ))}
              </div>
              <div className="player-score-row">
                <div className="player-name-cell">{player2Name.split('/')[0]}</div>
                {Object.keys(detailedScores).map(set => (
                  <div key={set} className="set-score-cell">{detailedScores[set]?.away || '0'}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {Object.keys(markets).length > 0 && (
        <div className="odds-detail-card">
          <h3>Betting Markets</h3>
          <div className="markets-grid">
            {Object.entries(markets).map(([marketName, marketData], index) => (
              <div key={index} className="market-box">
                <div className="market-title">{marketName}</div>
                <div className="market-content">
                  {typeof marketData === 'object' ? (
                    <div className="market-table">
                      {Object.entries(marketData).map(([key, value], i) => (
                        <div key={i} className="market-row">
                          <div className="market-key">{key}</div>
                          <div className="market-value">
                            {typeof value === 'object' ? JSON.stringify(value) : value}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="market-simple">{marketData}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rawEventData && Object.keys(rawEventData).length > 0 && (
        <div className="event-data-card">
          <h3>Additional Match Data</h3>
          <div className="event-data-grid">
            {Object.entries(rawEventData)
              .filter(([key, _]) => !['FI', 'ID'].includes(key))
              .map(([key, value], index) => (
                <div key={index} className="event-data-item">
                  <div className="event-data-key">{key}</div>
                  <div className="event-data-value">
                    {typeof value === 'object' 
                      ? JSON.stringify(value, null, 2).substring(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '')
                      : String(value)
                    }
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
      
      <div className="detail-footer">
        <Link to="/" className="back-link">Return to All Matches</Link>
      </div>
    </div>
  );
}

export default MatchDetail;
