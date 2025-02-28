# main_api.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.exceptions import HTTPException
from datetime import datetime
import uvicorn
import os
import json
import asyncio
import threading
import traceback
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Import directly from tennis bot module
from aggregator.sports.tennis.betsapi_prematch import BetsapiPrematch
from aggregator.sports.tennis.rapid_tennis_fetcher import RapidInplayOddsFetcher
from aggregator.sports.tennis.tennis_merger import TennisMerger

app = FastAPI()

# Store data globally for API access
tennis_matches = []

# Allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your front-end domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/tennis")
async def get_tennis_matches():
    """
    Return the latest tennis matches data along with a timestamp.
    """
    logger.info(f"API request received. Current data length: {len(tennis_matches)}")
    return {
        "timestamp": datetime.now().isoformat(),
        "matches": tennis_matches
    }

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

# Mount the static files directory (React build) if it exists
react_build_dir = os.path.join(os.path.dirname(__file__), "my-react-app", "build")
if os.path.exists(react_build_dir):
    app.mount("/static", StaticFiles(directory=os.path.join(react_build_dir, "static")), name="static")
    
    @app.get("/", include_in_schema=False)
    async def serve_react_app():
        return FileResponse(os.path.join(react_build_dir, "index.html"))
    
    # This is needed for React Router to work - handle all unmatched paths
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_react_routes(full_path: str):
        # Exclude API paths from this catch-all
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        # For all other paths, serve the React app's index.html
        return FileResponse(os.path.join(react_build_dir, "index.html"))

# Function to fetch tennis data directly
async def fetch_tennis_data():
    global tennis_matches
    
    while True:
        try:
            logger.info("Starting data fetch cycle")
            
            # Initialize fetchers
            betsapi_fetcher = BetsapiPrematch()
            rapid_fetcher = RapidInplayOddsFetcher()
            
            # Fetch data from both APIs
            logger.info("Fetching data from BetsAPI...")
            bets_data = await betsapi_fetcher.get_tennis_data()
            logger.info(f"Fetched {len(bets_data)} records from BetsAPI")
            
            logger.info("Fetching data from RapidAPI...")
            rapid_data = await rapid_fetcher.get_tennis_data()
            logger.info(f"Fetched {len(rapid_data)} records from RapidAPI")
            
            # Merge data
            logger.info("Merging data from both APIs...")
            merger = TennisMerger()
            merged_data = merger.merge(bets_data, rapid_data)
            logger.info(f"Merged data contains {len(merged_data)} matches")
            
            # Update global variable
            tennis_matches = merged_data
            
            # Wait before next cycle (60 seconds)
            logger.info("Fetch cycle complete. Waiting 60 seconds before next cycle.")
            await asyncio.sleep(60)
            
        except Exception as e:
            logger.error(f"Error in fetch cycle: {e}")
            traceback.print_exc()
            await asyncio.sleep(10)  # Short sleep on error

# Function to run the fetch loop in a separate thread
def run_fetch_loop():
    asyncio.run(fetch_tennis_data())

if __name__ == "__main__":
    # Start the fetch loop in a separate thread
    fetch_thread = threading.Thread(target=run_fetch_loop)
    fetch_thread.daemon = True
    fetch_thread.start()
    
    # Start the FastAPI server
    uvicorn.run(app, host="0.0.0.0", port=8000)
