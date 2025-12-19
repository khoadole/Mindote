
from youtube_transcript_api import YouTubeTranscriptApi
import sys

video_id = '0ldH-RL9ZCU'

try:
    print(f"Fetching {video_id}...")
    # Try the most standard static method
    transcript = YouTubeTranscriptApi.get_transcript(video_id)
    print(f"Success (get_transcript)! Found {len(transcript)} lines.")
except Exception as e:
    print(f"Error (get_transcript): {e}")

    # Try the instance method approach seen in previous code (if that was actually working?)
    try:
        api = YouTubeTranscriptApi()
        # This might be why previous code was: "ytt_api = YouTubeTranscriptApi()"
        # But wait, YouTubeTranscriptApi is usually a class with static methods only.
        # Let's see if inspect helps.
        print("Retrying with list_transcripts...")
        t_list = YouTubeTranscriptApi.list_transcripts(video_id)
        t = t_list.find_transcript(['en'])
        data = t.fetch()
        print(f"Success (list_transcripts)! Found {len(data)} lines.")
    except Exception as e2:
         print(f"Error (list_transcripts): {e2}")

