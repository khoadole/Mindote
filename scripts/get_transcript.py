#!/usr/bin/env python3
"""
YouTube Transcript Fetcher
This script fetches YouTube transcripts using the youtube-transcript-api library.
It's called from the Next.js API route via subprocess.
"""

import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi

def get_transcript(video_id: str, languages: list = None):
    """Fetch transcript for a YouTube video."""
    if languages is None:
        languages = ['en', 'en-US', 'vi']
    
    try:
        ytt_api = YouTubeTranscriptApi()
        
        # Try to list available transcripts first
        try:
            transcript_list = ytt_api.list(video_id)
            available_langs = [t.language_code for t in transcript_list]
        except:
            available_langs = []
        
        # Fetch transcript
        try:
            transcript = ytt_api.fetch(video_id, languages=languages)
        except:
            # If preferred languages fail, try without language filter
            transcript = ytt_api.fetch(video_id)
        
        # Convert to list of dicts
        segments = []
        for snippet in transcript:
            segments.append({
                'text': snippet.text,
                'start': snippet.start,
                'duration': snippet.duration
            })
        
        return {
            'success': True,
            'video_id': video_id,
            'language': transcript.language if hasattr(transcript, 'language') else 'unknown',
            'language_code': transcript.language_code if hasattr(transcript, 'language_code') else 'unknown',
            'available_languages': available_langs,
            'segments': segments
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'video_id': video_id
        }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'Video ID is required'}))
        sys.exit(1)
    
    video_id = sys.argv[1]
    languages = sys.argv[2].split(',') if len(sys.argv) > 2 else None
    
    result = get_transcript(video_id, languages)
    print(json.dumps(result))
    
    sys.exit(0 if result['success'] else 1)

if __name__ == '__main__':
    main()
