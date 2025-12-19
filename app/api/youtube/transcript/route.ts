import { NextRequest, NextResponse } from "next/server";
// Fetch transcript using youtube-transcript library
import { YoutubeTranscript } from 'youtube-transcript';

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

interface TranscriptResult {
  success: boolean;
  video_id: string;
  language?: string;
  language_code?: string;
  available_languages?: string[];
  segments?: TranscriptSegment[];
  error?: string;
}

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

async function getTranscript(videoId: string): Promise<TranscriptResult> {
  // Check if running on Vercel
  const isVercel = process.env.VERCEL === '1';

  if (isVercel) {
    // Vercel: Call Python Serverless Function
    try {
        // Construct absolute URL for internal fetch if needed, 
        // or relative if on same domain. 
        // Usually internal APIs needs absolute URL on server side.
        // We can use process.env.VERCEL_URL
        const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
        
        // Forward headers from the original request to bypass Vercel Authentication (Preview Mode)
        const headers = new Headers();
        request.headers.forEach((value, key) => {
            // Forward relevant headers, especially Cookie and Authorization
            if (['cookie', 'authorization', 'x-vercel-protection-bypass'].includes(key.toLowerCase())) {
                headers.set(key, value);
            }
        });
        
        const response = await fetch(`${baseUrl}/api/py_transcript?videoId=${videoId}`, {
            headers: headers
        });
        
        if (!response.ok) {
            throw new Error(`Python function failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
        
    } catch (error: any) {
        console.error(`❌ [YouTube API] Vercel Python error:`, error.message);
        return {
            success: false,
            video_id: videoId,
            error: error.message || 'Failed to fetch from Python function'
        };
    }
  } else {
    // Local: Run Python script
    const scriptPath = path.join(process.cwd(), 'scripts', 'get_transcript.py');
    try {
        console.log(`📄 [YouTube API] Running Python script (Local): ${videoId}`);
        const { stdout } = await execAsync(`python3 "${scriptPath}" "${videoId}"`);
        const result = JSON.parse(stdout);
        return result;
    } catch (error: any) {
        console.error(`❌ [YouTube API] Local Python script error:`, error.message);
        return {
            success: false,
            video_id: videoId,
            error: error.message || 'Failed to execute local Python script'
        };
    }
  }
}

// Get video info (title, duration)
async function getVideoInfo(videoId: string): Promise<{ title: string; duration: number }> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title || 'Unknown Title',
        duration: 0, // oembed doesn't provide duration
      };
    }
  } catch (error) {
    console.error('Error fetching video info:', error);
  }
  
  return { title: 'Unknown Title', duration: 0 };
}

// Helper to extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
    /youtube\.com\/live\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Decode HTML/Unicode entities in transcript text
function decodeEntities(text: string): string {
  // youtube-transcript usually returns decoded text, but we keep this for safety
  // or simple cleanup if needed.
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\n/g, ' ')
    .trim();
}

export async function POST(request: NextRequest) {
  console.log("🎬 [YouTube API] Request received");

  try {
    const body = await request.json();
    console.log("📝 [YouTube API] Request body:", body);

    const { url } = body;

    if (!url) {
      console.log("❌ [YouTube API] No URL provided");
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    // Extract video ID
    const videoId = extractVideoId(url);
    console.log("🎯 [YouTube API] Extracted video ID:", videoId);

    if (!videoId) {
      console.log("❌ [YouTube API] Invalid URL");
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // Fetch transcript
    console.log("📄 [YouTube API] Fetching transcript...");
    const transcriptResult = await getTranscript(videoId);
    
    if (!transcriptResult.success || !transcriptResult.segments) {
      console.log("❌ [YouTube API] Transcript fetch failed:", transcriptResult.error);
      return NextResponse.json(
        {
          error: transcriptResult.error || "No captions available for this video. Please try a video with closed captions (CC).",
        },
        { status: 404 }
      );
    }
    
    console.log(`✅ [YouTube API] Transcript fetched: ${transcriptResult.segments.length} segments`);

    // Get video info
    const { title, duration } = await getVideoInfo(videoId);
    console.log(`📺 [YouTube API] Video: "${title}"`);

    // Format transcript - decode entities and join
    const formattedTranscript = transcriptResult.segments
      .map((item) => decodeEntities(item.text))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    console.log(`✅ [YouTube API] Success! Transcript length: ${formattedTranscript.length} chars`);

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        title,
        duration,
        language: transcriptResult.language,
        languageCode: transcriptResult.language_code,
        availableLanguages: transcriptResult.available_languages,
        transcript: formattedTranscript,
        rawTranscript: transcriptResult.segments.map(item => ({
          ...item,
          text: decodeEntities(item.text),
        })),
      },
    });
  } catch (error: any) {
    console.error("❌ [YouTube API] Fatal error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch transcript",
      },
      { status: 500 }
    );
  }
}
