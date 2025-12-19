
from youtube_transcript_api import YouTubeTranscriptApi
import json

video_id = '0ldH-RL9ZCU'

try:
    print(f"Fetching {video_id}...")
    api = YouTubeTranscriptApi()
    transcript = api.fetch(video_id)
    print(f"Success! Found {len(transcript)} segments.")
    print("First segment:", transcript[0])
except Exception as e:
    print(f"Error: {e}")
