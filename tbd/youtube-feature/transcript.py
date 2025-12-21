"""
YouTube Transcript API - Python Serverless Function for Vercel

This endpoint uses youtube-transcript-api library which may have better
cloud compatibility compared to Node.js alternatives.
"""

from http.server import BaseHTTPRequestHandler
import json
import re
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
    NoTranscriptAvailable,
)


def extract_video_id(url: str) -> str | None:
    """Extract video ID from YouTube URL."""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)',
        r'youtube\.com\/embed\/([^&\n?#]+)',
        r'youtube\.com\/v\/([^&\n?#]+)',
        r'youtube\.com\/shorts\/([^&\n?#]+)',
        r'youtube\.com\/live\/([^&\n?#]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None


def get_video_info(video_id: str) -> dict:
    """Get video info from YouTube oembed API."""
    import urllib.request
    
    try:
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        with urllib.request.urlopen(oembed_url, timeout=10) as response:
            data = json.loads(response.read().decode())
            return {
                "title": data.get("title", "Unknown Title"),
                "author": data.get("author_name", "Unknown")
            }
    except Exception as e:
        print(f"Error fetching video info: {e}")
        return {"title": "Unknown Title", "author": "Unknown"}


def get_transcript(video_id: str) -> dict:
    """Fetch transcript using youtube-transcript-api."""
    debug = {
        "videoId": video_id,
        "attempts": [],
    }
    
    # Try different language codes
    languages_to_try = [
        ['en'],           # English first
        ['en-US'],        # US English
        ['en-GB'],        # UK English  
        ['vi'],           # Vietnamese
        ['auto'],         # Auto-generated
    ]
    
    for langs in languages_to_try:
        lang_str = ','.join(langs)
        debug["attempts"].append({"lang": lang_str, "status": "trying"})
        
        try:
            print(f"[Python API] Trying languages: {lang_str}")
            
            # Try to get transcript
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            
            # Try to find manual transcript first
            transcript = None
            try:
                transcript = transcript_list.find_manually_created_transcript(langs)
                print(f"[Python API] Found manual transcript")
            except NoTranscriptFound:
                # Fall back to auto-generated
                try:
                    transcript = transcript_list.find_generated_transcript(langs)
                    print(f"[Python API] Found auto-generated transcript")
                except NoTranscriptFound:
                    pass
            
            if transcript:
                # Fetch the actual transcript data
                transcript_data = transcript.fetch()
                
                if transcript_data:
                    debug["attempts"][-1]["status"] = "success"
                    debug["attempts"][-1]["count"] = len(transcript_data)
                    
                    # Format segments
                    segments = [
                        {
                            "text": item.get("text", ""),
                            "start": item.get("start", 0),
                            "duration": item.get("duration", 0),
                        }
                        for item in transcript_data
                    ]
                    
                    # Combine into full transcript
                    full_transcript = " ".join([
                        item.get("text", "").replace("\n", " ")
                        for item in transcript_data
                    ])
                    
                    return {
                        "success": True,
                        "transcript": full_transcript,
                        "segments": segments,
                        "languageCode": transcript.language_code,
                        "debug": debug,
                    }
            
            debug["attempts"][-1]["status"] = "not_found"
            
        except TranscriptsDisabled:
            debug["attempts"][-1]["status"] = "disabled"
            debug["attempts"][-1]["error"] = "Transcripts are disabled for this video"
            return {
                "success": False,
                "error": "Transcripts are disabled for this video",
                "debug": debug,
            }
            
        except VideoUnavailable:
            debug["attempts"][-1]["status"] = "unavailable"
            debug["attempts"][-1]["error"] = "Video is unavailable"
            return {
                "success": False,
                "error": "Video is unavailable",
                "debug": debug,
            }
            
        except NoTranscriptAvailable:
            debug["attempts"][-1]["status"] = "no_transcript"
            continue
            
        except Exception as e:
            debug["attempts"][-1]["status"] = "error"
            debug["attempts"][-1]["error"] = str(e)
            print(f"[Python API] Error: {e}")
            continue
    
    # Try getting any available transcript
    try:
        print(f"[Python API] Trying to get any available transcript...")
        debug["attempts"].append({"lang": "any", "status": "trying"})
        
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Get first available transcript
        for transcript in transcript_list:
            print(f"[Python API] Found transcript: {transcript.language_code}")
            transcript_data = transcript.fetch()
            
            if transcript_data:
                debug["attempts"][-1]["status"] = "success"
                debug["attempts"][-1]["count"] = len(transcript_data)
                debug["attempts"][-1]["foundLang"] = transcript.language_code
                
                segments = [
                    {
                        "text": item.get("text", ""),
                        "start": item.get("start", 0),
                        "duration": item.get("duration", 0),
                    }
                    for item in transcript_data
                ]
                
                full_transcript = " ".join([
                    item.get("text", "").replace("\n", " ")
                    for item in transcript_data
                ])
                
                return {
                    "success": True,
                    "transcript": full_transcript,
                    "segments": segments,
                    "languageCode": transcript.language_code,
                    "debug": debug,
                }
                
    except Exception as e:
        debug["attempts"][-1]["status"] = "error"
        debug["attempts"][-1]["error"] = str(e)
        print(f"[Python API] Final error: {e}")
    
    return {
        "success": False,
        "error": "No transcripts available for this video",
        "debug": debug,
    }


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Handle POST request."""
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            url = data.get('url', '')
            
            if not url:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "error": "YouTube URL is required"
                }).encode())
                return
            
            # Extract video ID
            video_id = extract_video_id(url)
            
            if not video_id:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "error": "Invalid YouTube URL"
                }).encode())
                return
            
            print(f"[Python API] Processing video: {video_id}")
            
            # Get video info
            video_info = get_video_info(video_id)
            
            # Get transcript
            result = get_transcript(video_id)
            
            if result["success"]:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "data": {
                        "videoId": video_id,
                        "title": video_info["title"],
                        "transcript": result["transcript"],
                        "rawTranscript": result["segments"],
                        "languageCode": result.get("languageCode", "unknown"),
                        "method": "python-youtube-transcript-api",
                    }
                }).encode())
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "error": result.get("error", "Failed to fetch transcript"),
                    "debug": result.get("debug"),
                }).encode())
                
        except Exception as e:
            print(f"[Python API] Fatal error: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": str(e)
            }).encode())
    
    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
