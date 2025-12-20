import { NextRequest, NextResponse } from "next/server";
import { getSubtitles, getVideoDetails } from "youtube-caption-extractor";
import {
  fetchTranscript,
  YoutubeTranscriptVideoUnavailableError,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptInvalidVideoIdError,
} from "youtube-transcript-plus";

// Force Node.js runtime (not Edge)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30; // 30 seconds timeout (requires Hobby plan or higher)

// ============================================================================
// YouTube Transcript API with multi-library fallback
// Strategy: Try youtube-caption-extractor first, fallback to youtube-transcript-plus
// ============================================================================

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

// Get video info using YouTube oembed API (always works)
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
        duration: 0, // oembed doesn't provide duration
      };
    }
  } catch (error) {
    console.error("Error fetching video info:", error);
  }
  return { title: "Unknown Title", duration: 0 };
}

// Strategy 1: Try youtube-caption-extractor
async function tryYoutubeCaptionExtractor(
  videoId: string,
  debug: any
): Promise<TranscriptSegment[] | null> {
  const languagesToTry = ["en", "vi", undefined];

  for (const lang of languagesToTry) {
    const langDesc = lang || "auto";
    debug.attempts.push({
      method: "youtube-caption-extractor",
      lang: langDesc,
      status: "trying",
    });

    try {
      console.log(
        `📝 [YouTube API] [caption-extractor] Trying lang: ${langDesc}`
      );

      const subtitles = await getSubtitles({
        videoID: videoId,
        lang: lang,
      });

      if (subtitles && subtitles.length > 0) {
        console.log(
          `✅ [YouTube API] [caption-extractor] Got ${subtitles.length} segments`
        );
        debug.attempts[debug.attempts.length - 1].status = "success";
        debug.attempts[debug.attempts.length - 1].segmentCount =
          subtitles.length;

        return subtitles.map((item: any) => ({
          text: item.text || "",
          start: parseFloat(item.start) || 0,
          duration: parseFloat(item.dur) || 0,
        }));
      } else {
        debug.attempts[debug.attempts.length - 1].status = "empty";
      }
    } catch (error: any) {
      console.log(
        `❌ [YouTube API] [caption-extractor] Failed: ${error.message}`
      );
      debug.attempts[debug.attempts.length - 1].status = "failed";
      debug.attempts[debug.attempts.length - 1].error = error.message;
    }
  }

  return null;
}

// Strategy 2: Try youtube-transcript-plus (better for cloud environments)
async function tryYoutubeTranscriptPlus(
  videoId: string,
  debug: any
): Promise<TranscriptSegment[] | null> {
  const languagesToTry = [undefined, "en", "vi"]; // undefined = auto-detect first

  for (const lang of languagesToTry) {
    const langDesc = lang || "auto";
    debug.attempts.push({
      method: "youtube-transcript-plus",
      lang: langDesc,
      status: "trying",
    });

    try {
      console.log(
        `📝 [YouTube API] [transcript-plus] Trying lang: ${langDesc}`
      );

      const transcript = await fetchTranscript(videoId, {
        lang,
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      });

      if (transcript && transcript.length > 0) {
        console.log(
          `✅ [YouTube API] [transcript-plus] Got ${transcript.length} segments`
        );
        debug.attempts[debug.attempts.length - 1].status = "success";
        debug.attempts[debug.attempts.length - 1].segmentCount =
          transcript.length;

        return transcript.map((item: any) => ({
          text: item.text || "",
          start: item.offset || 0,
          duration: item.duration || 0,
        }));
      } else {
        debug.attempts[debug.attempts.length - 1].status = "empty";
      }
    } catch (error: any) {
      console.log(
        `❌ [YouTube API] [transcript-plus] Failed: ${error.message}`
      );
      debug.attempts[debug.attempts.length - 1].status = "failed";
      debug.attempts[debug.attempts.length - 1].error = error.message;

      // Handle specific errors that mean we should stop trying
      if (
        error instanceof YoutubeTranscriptVideoUnavailableError ||
        error instanceof YoutubeTranscriptDisabledError ||
        error instanceof YoutubeTranscriptInvalidVideoIdError
      ) {
        debug.fatalError = error.message;
        return null;
      }
    }
  }

  return null;
}

// Main transcript fetching function with multi-library fallback
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

  console.log(`📄 [YouTube API] Fetching transcript for video: ${videoId}`);

  // Strategy 1: Try youtube-caption-extractor first (works better locally)
  console.log(`🔄 [YouTube API] Trying youtube-caption-extractor...`);
  let segments = await tryYoutubeCaptionExtractor(videoId, debug);

  if (segments && segments.length > 0) {
    debug.successMethod = "youtube-caption-extractor";
    return { success: true, segments, debug };
  }

  // Strategy 2: Try youtube-transcript-plus (better cloud compatibility)
  console.log(`🔄 [YouTube API] Trying youtube-transcript-plus...`);
  segments = await tryYoutubeTranscriptPlus(videoId, debug);

  if (segments && segments.length > 0) {
    debug.successMethod = "youtube-transcript-plus";
    return { success: true, segments, debug };
  }

  // All strategies failed
  return {
    success: false,
    error:
      debug.fatalError ||
      "No transcripts available for this video. Tried multiple methods.",
    debug,
  };
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

    // Fetch video info
    console.log("📺 [YouTube API] Fetching video info...");
    const { title, duration } = await getVideoInfo(videoId);
    console.log(`📺 [YouTube API] Video: "${title}" (${duration}s)`);

    // Fetch transcript with multi-library fallback
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
            "No transcripts are available for this video.",
          debug: transcriptResult.debug,
        },
        { status: 404 }
      );
    }

    console.log(
      `✅ [YouTube API] Transcript fetched: ${transcriptResult.segments.length} segments (via ${transcriptResult.debug?.successMethod})`
    );

    // Format transcript - decode entities and join
    const formattedTranscript = transcriptResult.segments
      .map((item) => decodeEntities(item.text))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    console.log(
      `✅ [YouTube API] Success! Transcript length: ${formattedTranscript.length} chars`
    );

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        title,
        duration,
        language: "auto",
        languageCode: "auto",
        transcript: formattedTranscript,
        rawTranscript: transcriptResult.segments.map((item) => ({
          ...item,
          text: decodeEntities(item.text),
        })),
        cached: false,
        method: transcriptResult.debug?.successMethod,
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
