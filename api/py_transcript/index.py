from http.server import BaseHTTPRequestHandler
import json
import re
import time
from urllib.parse import parse_qs, urlparse
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
)
import urllib.request
import http.cookiejar


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
    """Get video title using oEmbed API with retry"""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
            req = urllib.request.Request(
                oembed_url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "application/json",
                    "Accept-Language": "en-US,en;q=0.9",
                },
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                data = json.loads(response.read().decode())
                return data.get("title", "Unknown Title")
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(1)
                continue
            print(f"Failed to get video title: {str(e)}")
            return "Unknown Title"


def get_transcript(video_id: str) -> dict:
    """Fetch transcript using youtube-transcript-api with retry and enhanced error handling"""
    max_retries = 3
    last_error = None
    
    for attempt in range(max_retries):
        try:
            print(f"Attempt {attempt + 1}/{max_retries} to fetch transcript for {video_id}")
            
            # Setup cookie jar for better YouTube compatibility
            cookie_jar = http.cookiejar.CookieJar()
            
            # Try to get transcript in preferred languages
            transcript_list = YouTubeTranscriptApi.list_transcripts(
                video_id,
                cookies=cookie_jar
            )
            
            # Try to find manually created transcript first, then generated
            transcript = None
            language_code = "unknown"
            
            # Try multiple language options in order of preference
            language_attempts = [
                (["en", "en-US", "en-GB"], "en"),  # English manual
                (["vi"], "vi"),  # Vietnamese manual
            ]
            
            # Try manual transcripts first
            for langs, code in language_attempts:
                try:
                    transcript = transcript_list.find_transcript(langs)
                    language_code = code
                    print(f"Found manual transcript in {code}")
                    break
                except:
                    continue
            
            # If no manual transcript, try auto-generated
            if transcript is None:
                try:
                    transcript = transcript_list.find_generated_transcript(["en"])
                    language_code = "en-auto"
                    print("Found auto-generated English transcript")
                except:
                    # Get any available transcript as last resort
                    try:
                        for t in transcript_list:
                            transcript = t
                            language_code = t.language_code
                            print(f"Using available transcript in {language_code}")
                            break
                    except Exception as e:
                        print(f"No transcript available: {str(e)}")
            
            if transcript is None:
                return {
                    "success": False,
                    "error": "No transcripts are available for this video. The video may not have captions enabled."
                }
            
            # Fetch the transcript data
            transcript_data = transcript.fetch()
            
            if not transcript_data or len(transcript_data) == 0:
                return {
                    "success": False,
                    "error": "Transcript data is empty"
                }
            
            # Format transcript as segments
            segments = []
            full_text_parts = []
            
            for item in transcript_data:
                text = item.get("text", "").replace("\n", " ").strip()
                if text:  # Only add non-empty segments
                    segments.append({
                        "text": text,
                        "start": item.get("start", 0),
                        "duration": item.get("duration", 0)
                    })
                    full_text_parts.append(text)
            
            full_text = " ".join(full_text_parts)
            # Clean up multiple spaces
            full_text = re.sub(r"\s+", " ", full_text).strip()
            
            print(f"Successfully fetched {len(segments)} transcript segments")
            
            return {
                "success": True,
                "transcript": full_text,
                "segments": segments,
                "languageCode": language_code
            }
            
        except TranscriptsDisabled as e:
            last_error = e
            return {
                "success": False,
                "error": "Transcripts are disabled for this video. The creator may have turned off captions."
            }
        except NoTranscriptFound as e:
            last_error = e
            return {
                "success": False,
                "error": "No transcript found for this video. Please ensure the video has captions enabled."
            }
        except VideoUnavailable as e:
            last_error = e
            return {
                "success": False,
                "error": "This video is unavailable or private."
            }
        except Exception as e:
            last_error = e
            print(f"Attempt {attempt + 1} failed: {str(e)}")
            
            # If this is not the last attempt, wait before retrying
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 2  # Exponential backoff: 2s, 4s, 6s
                print(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                # Last attempt failed
                error_msg = str(last_error)
                if "not accessible" in error_msg.lower() or "unavailable" in error_msg.lower():
                    return {
                        "success": False,
                        "error": "No transcripts are available for the video with ID '{}'. This may be because the video does not have captions or the captions are not accessible.".format(video_id)
                    }
                return {
                    "success": False,
                    "error": f"Failed to fetch transcript after {max_retries} attempts: {error_msg}"
                }
    
    # Should never reach here, but just in case
    return {
        "success": False,
        "error": "Unknown error occurred while fetching transcript"
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
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
    
    def do_HEAD(self):
        """Handle HEAD requests (for health checks, etc.)"""
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
