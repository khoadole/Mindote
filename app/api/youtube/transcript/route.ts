import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

// ============================================================================
// YouTube Transcript API using Python youtube-transcript-api library
// ============================================================================

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

interface PythonTranscriptResult {
  success: boolean;
  video_id: string;
  language?: string;
  language_code?: string;
  available_languages?: string[];
  segments?: TranscriptSegment[];
  error?: string;
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

// Fetch transcript using Python script
async function getTranscriptViaPython(videoId: string): Promise<PythonTranscriptResult> {
  const scriptPath = path.join(process.cwd(), 'scripts', 'get_transcript.py');
  
  try {
    console.log(`📄 [YouTube API] Running Python script for video: ${videoId}`);
    
    const { stdout, stderr } = await execAsync(
      `python3 "${scriptPath}" "${videoId}" "en,en-US,vi"`,
      { timeout: 30000 } // 30 second timeout
    );
    
    if (stderr) {
      console.warn(`📄 [YouTube API] Python stderr:`, stderr);
    }
    
    const result: PythonTranscriptResult = JSON.parse(stdout);
    return result;
    
  } catch (error: any) {
    console.error(`❌ [YouTube API] Python script error:`, error.message);
    
    // Try to parse error output if available
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch {
        // Ignore parse error
      }
    }
    
    return {
      success: false,
      video_id: videoId,
      error: error.message || 'Failed to execute Python script'
    };
  }
}

// Get video info (title, duration) using Python
async function getVideoInfoViaPython(videoId: string): Promise<{ title: string; duration: number }> {
  // For now, we'll just return placeholders - the Python script doesn't fetch video metadata
  // In a production app, you might want to use the YouTube Data API or oembed
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

    // Fetch transcript using Python
    console.log("📄 [YouTube API] Fetching transcript via Python...");
    const transcriptResult = await getTranscriptViaPython(videoId);
    
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
    console.log(`� [YouTube API] Language: ${transcriptResult.language} (${transcriptResult.language_code})`);

    // Get video info
    const { title, duration } = await getVideoInfoViaPython(videoId);
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
