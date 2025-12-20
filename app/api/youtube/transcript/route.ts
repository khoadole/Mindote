import { NextRequest, NextResponse } from "next/server";
import { fetchTranscript, extractVideoId } from "@/lib/youtube-transcript";

// Force Node.js runtime (not Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// YouTube Transcript API using HTTP-based approach (works on Vercel!)
// ============================================================================

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
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

// Wrapper function for HTTP-based transcript fetching
async function getTranscript(videoId: string): Promise<{
  success: boolean;
  segments?: TranscriptSegment[];
  error?: string;
}> {
  console.log(`📄 [YouTube API] Fetching transcript for video: ${videoId}`);
  
  // Use our HTTP-based helper
  const result = await fetchTranscript(videoId);
  
  if (result.success && result.segments) {
    console.log(`✅ [YouTube API] Transcript fetched: ${result.segments.length} segments`);
  } else {
    console.log(`❌ [YouTube API] Transcript fetch failed: ${result.error}`);
  }
  
  return result;
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
        duration: 0,
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

    // Fetch transcript using Node.js library
    console.log("📄 [YouTube API] Fetching transcript...");
    const transcriptResult = await getTranscript(videoId);
    
    if (!transcriptResult.success || !transcriptResult.segments) {
        console.log("❌ [YouTube API] Transcript fetch failed:", transcriptResult.error);
        return NextResponse.json(
          {
            error: transcriptResult.error || "No transcripts are available for this video. This may be because the video does not have captions or the captions are not accessible.",
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
        language: 'unknown',
        languageCode: 'unknown',
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
