
from youtube_transcript_api import YouTubeTranscriptApi
import json

video_id = '0ldH-RL9ZCU'

try:
    print(f"Fetching {video_id}...")
    transcript = YouTubeTranscriptApi.get_transcript(video_id)
    print(f"Success! Found {len(transcript)} lines.")
except Exception as e:
    print(f"Error: {e}")
