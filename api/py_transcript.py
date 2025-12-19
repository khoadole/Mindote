from http.server import BaseHTTPRequestHandler
import json
import re
from urllib.parse import parse_qs, urlparse
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
)
import urllib.request


def extract_video_id(url: str) -> str | None:
    """Extract video ID from various YouTube URL formats"""
    patterns = [
        r"(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)",
        r"youtube\.com\/embed\/([^&\n?#]+)",
        r"youtube\.com\/v\/([^&\n?#]+)",
        r"youtube\.com\/shorts\/([^&\n?#]+)",
        r"youtube\.com\/live\/([^&\n?#]+)",
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    # If no pattern matched, assume it's a raw video ID
    if len(url) == 11 and re.match(r"^[a-zA-Z0-9_-]+$", url):
        return url
    
    return None


def get_video_title(video_id: str) -> str:
    """Get video title using oEmbed API"""
    try:
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        req = urllib.request.Request(
            oembed_url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            return data.get("title", "Unknown Title")
    except Exception:
        return "Unknown Title"


def get_transcript(video_id: str) -> dict:
    """Fetch transcript using youtube-transcript-api"""
    try:
        # Try to get transcript in preferred languages
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Try to find manually created transcript first, then generated
        transcript = None
        language_code = "unknown"
        
        try:
            # Try English first
            transcript = transcript_list.find_transcript(["en"])
            language_code = "en"
        except:
            try:
                # Try auto-generated English
                transcript = transcript_list.find_generated_transcript(["en"])
                language_code = "en-auto"
            except:
                try:
                    # Get any available transcript
                    for t in transcript_list:
                        transcript = t
                        language_code = t.language_code
                        break
                except:
                    pass
        
        if transcript is None:
            return {
                "success": False,
                "error": "No transcript available for this video"
            }
        
        # Fetch the transcript data
        transcript_data = transcript.fetch()
        
        # Format transcript as segments
        segments = []
        full_text_parts = []
        
        for item in transcript_data:
            text = item.get("text", "").replace("\n", " ").strip()
            segments.append({
                "text": text,
                "start": item.get("start", 0),
                "duration": item.get("duration", 0)
            })
            full_text_parts.append(text)
        
        full_text = " ".join(full_text_parts)
        # Clean up multiple spaces
        full_text = re.sub(r"\s+", " ", full_text).strip()
        
        return {
            "success": True,
            "transcript": full_text,
            "segments": segments,
            "languageCode": language_code
        }
        
    except TranscriptsDisabled:
        return {
            "success": False,
            "error": "Transcripts are disabled for this video"
        }
    except NoTranscriptFound:
        return {
            "success": False,
            "error": "No transcript found for this video"
        }
    except VideoUnavailable:
        return {
            "success": False,
            "error": "Video is unavailable"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests with videoId query parameter"""
        try:
            # Parse query parameters
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            
            video_id = params.get("videoId", [None])[0]
            url = params.get("url", [None])[0]
            
            # If URL provided, extract video ID from it
            if url and not video_id:
                video_id = extract_video_id(url)
            
            if not video_id:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "error": "videoId or url parameter is required"
                }).encode())
                return
            
            # Get transcript
            result = get_transcript(video_id)
            
            if not result["success"]:
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "error": result["error"]
                }).encode())
                return
            
            # Get video title
            title = get_video_title(video_id)
            
            # Success response
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "data": {
                    "videoId": video_id,
                    "title": title,
                    "transcript": result["transcript"],
                    "rawTranscript": result["segments"],
                    "languageCode": result["languageCode"]
                }
            }).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": f"Internal server error: {str(e)}"
            }).encode())
    
    def do_POST(self):
        """Handle POST requests with JSON body"""
        try:
            # Read body
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            data = json.loads(body) if body else {}
            
            url = data.get("url", "")
            video_id = data.get("videoId", "")
            
            # Extract video ID from URL if provided
            if url and not video_id:
                video_id = extract_video_id(url)
            
            if not video_id:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "error": "url or videoId is required"
                }).encode())
                return
            
            # Get transcript
            result = get_transcript(video_id)
            
            if not result["success"]:
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "error": result["error"]
                }).encode())
                return
            
            # Get video title
            title = get_video_title(video_id)
            
            # Success response
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "data": {
                    "videoId": video_id,
                    "title": title,
                    "transcript": result["transcript"],
                    "rawTranscript": result["segments"],
                    "languageCode": result["languageCode"]
                }
            }).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": f"Internal server error: {str(e)}"
            }).encode())
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
