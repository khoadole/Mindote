#!/usr/bin/env python3
import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi

def get_transcript(video_id):
    try:
        # Based on local testing, this environment uses .fetch() or similar
        # We try standard get_transcript first, then fallback to what worked in test_py_final.py
        try:
             # Standard
             return YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'en-US', 'vi']), None
        except AttributeError:
             # Fallback for this specific environment's version
             api = YouTubeTranscriptApi()
             return api.fetch(video_id), None
             
    except Exception as e:
        return None, str(e)

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'Video ID is required'}))
        sys.exit(1)
    
    video_id = sys.argv[1]
    
    transcript, error = get_transcript(video_id)
    
    if error:
        print(json.dumps({
            'success': False,
            'video_id': video_id,
            'error': error
        }))
        sys.exit(1)
    
    # Format
    segments = []
    if isinstance(transcript, list):
         # Standard return
         segments = transcript
    else:
         # Maybe object?
         # The test_py_final.py had objects with .text attributes.
         # So we need to serialize them if they are objects
         for item in transcript:
             if hasattr(item, 'text'):
                 segments.append({
                     'text': item.text,
                     'start': item.start,
                     'duration': item.duration
                 })
             else:
                 segments.append(item)

    print(json.dumps({
        'success': True,
        'video_id': video_id,
        'segments': segments,
        'language': 'unknown'
    }))

if __name__ == '__main__':
    main()
