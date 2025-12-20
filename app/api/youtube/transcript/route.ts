import { NextRequest, NextResponse } from "next/server";
import {
  fetchTranscript,
  YoutubeTranscriptVideoUnavailableError,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptInvalidVideoIdError,
  InMemoryCache,
} from "youtube-transcript-plus";

// Force Node.js runtime (not Edge)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30; // 30 seconds timeout (requires Hobby plan or higher)

// ============================================================================
// YouTube Transcript API using youtube-transcript-plus library
// ============================================================================

// Initialize in-memory cache with 30 minutes TTL
const transcriptCache = new InMemoryCache(1800000);

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
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
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\n/g, " ")
    .trim();
}

// Fetch transcript using youtube-transcript-plus
async function getTranscript(videoId: string): Promise<{
  success: boolean;
  segments?: TranscriptSegment[];
  error?: string;
  debug?: any;
}> {
  const debug: any = {
    videoId,
    attempts: [],
    timestamp: new Date().toISOString(),
  };

  try {
    console.log(`📄 [YouTube API] Fetching transcript for video: ${videoId}`);

    // Try fetching with different language options
    // Strategy: Try auto-detect first (works for most videos), then fallback to specific languages
    const languageOptions = [
      undefined, // Auto-detect first (best chance of success)
      "en", // English as fallback
      "vi", // Vietnamese as second fallback
    ];

    let lastError: any = null;

    for (const lang of languageOptions) {
      try {
        const langDesc = lang || "auto";
        console.log(`🔍 [YouTube API] Trying language: ${langDesc}`);
        debug.attempts.push({ lang: langDesc, status: "trying" });

        // Use the library's built-in features with cache
        const transcript = await fetchTranscript(videoId, {
          lang,
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          cache: transcriptCache, // Use in-memory cache
        });

        console.log(
          `✅ [YouTube API] Got ${
            transcript?.length || 0
          } segments with language: ${langDesc}`
        );
        debug.attempts[debug.attempts.length - 1].status = "success";
        debug.attempts[debug.attempts.length - 1].segmentCount =
          transcript?.length || 0;

        if (transcript && transcript.length > 0) {
          const segments: TranscriptSegment[] = transcript.map((item: any) => ({
            text: item.text || "",
            start: item.offset || 0,
            duration: item.duration || 0,
          }));

          return {
            success: true,
            segments: segments,
            debug,
          };
        }
      } catch (langError: any) {
        const langDesc = lang || "auto";
        console.log(
          `❌ [YouTube API] Failed with language ${langDesc}: ${langError.message}`
        );
        debug.attempts[debug.attempts.length - 1].status = "failed";
        debug.attempts[debug.attempts.length - 1].error = langError.message;
        lastError = langError;

        // Handle specific error types that should NOT retry with other languages
        if (langError instanceof YoutubeTranscriptVideoUnavailableError) {
          // Video is completely unavailable - no point trying other languages
          return {
            success: false,
            error: "Video is unavailable or has been removed",
            debug,
          };
        }
        if (langError instanceof YoutubeTranscriptDisabledError) {
          // Transcripts are disabled for this video - no point trying other languages
          return {
            success: false,
            error: "Transcripts are disabled for this video",
            debug,
          };
        }
        if (langError instanceof YoutubeTranscriptInvalidVideoIdError) {
          // Invalid video ID - no point trying other languages
          return {
            success: false,
            error: "Invalid video ID or URL",
            debug,
          };
        }

        // For NotAvailableError or NotAvailableLanguageError:
        // Continue to try next language option (might be available in different language)
        // This is common when a video has captions but not in the requested language
      }
    }

    // If all attempts failed
    return {
      success: false,
      error:
        lastError?.message ||
        "No transcript found after trying all language options",
      debug,
    };
  } catch (error: any) {
    console.error(`❌ [YouTube API] Transcript error:`, error.message);
    console.error(`❌ [YouTube API] Full error:`, error);
    debug.fatalError = error.message;
    return {
      success: false,
      error: error.message || "Failed to fetch transcript",
      debug,
    };
  }
}

// Get video info (title, duration)
async function getVideoInfo(
  videoId: string
): Promise<{ title: string; duration: number }> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title || "Unknown Title",
        duration: 0,
      };
    }
  } catch (error) {
    console.error("Error fetching video info:", error);
  }

  return { title: "Unknown Title", duration: 0 };
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

    // Fetch transcript using youtube-transcript-plus library with cache
    console.log("📄 [YouTube API] Fetching transcript...");
    const transcriptResult = await getTranscript(videoId);

    if (!transcriptResult.success || !transcriptResult.segments) {
      console.log(
        "❌ [YouTube API] Transcript fetch failed:",
        transcriptResult.error
      );
      console.log(
        "📊 [YouTube API] Debug info:",
        JSON.stringify(transcriptResult.debug, null, 2)
      );
      return NextResponse.json(
        {
          error:
            transcriptResult.error ||
            "No transcripts are available for this video. This may be because the video does not have captions or the captions are not accessible.",
          debug: transcriptResult.debug,
        },
        { status: 404 }
      );
    }

    console.log(
      `✅ [YouTube API] Transcript fetched: ${transcriptResult.segments.length} segments`
    );

    // Get video info
    const { title, duration } = await getVideoInfo(videoId);
    console.log(`📺 [YouTube API] Video: "${title}"`);

    // Format transcript - decode entities and join
    const formattedTranscript = transcriptResult.segments
      .map((item) => decodeEntities(item.text))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    console.log(
      `✅ [YouTube API] Success! Transcript length: ${formattedTranscript.length} chars`
    );
    console.log(
      `💾 [YouTube API] Cache enabled - subsequent requests will be faster`
    );

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        title,
        duration,
        language: "unknown",
        languageCode: "unknown",
        transcript: formattedTranscript,
        rawTranscript: transcriptResult.segments.map((item) => ({
          ...item,
          text: decodeEntities(item.text),
        })),
        cached: false, // First fetch is not cached
      },
    });
  } catch (error: any) {
    console.error("❌ [YouTube API] Fatal error:", error);
    console.error("❌ [YouTube API] Error stack:", error.stack);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch transcript",
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
