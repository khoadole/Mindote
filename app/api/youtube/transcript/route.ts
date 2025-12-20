import { NextRequest, NextResponse } from "next/server";
import { Innertube } from "youtubei.js";
import { getSubtitles, getVideoDetails } from "youtube-caption-extractor";

// Force Node.js runtime (not Edge)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30; // 30 seconds timeout (requires Hobby plan or higher)

// ============================================================================
// YouTube Transcript API using youtubei.js + youtube-caption-extractor
// ============================================================================

// Singleton Innertube client
let innertubeClient: Innertube | null = null;

async function getInnertubeClient(): Promise<Innertube> {
  if (!innertubeClient) {
    console.log("🔧 [YouTube API] Creating Innertube client...");
    innertubeClient = await Innertube.create({
      lang: "en",
      location: "US",
      retrieve_player: false, // Don't need player for basic info
    });
    console.log("✅ [YouTube API] Innertube client created");
  }
  return innertubeClient;
}

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

// Fetch video info using youtubei.js
async function getVideoInfo(
  videoId: string
): Promise<{ title: string; duration: number }> {
  try {
    const innertube = await getInnertubeClient();
    const info = await innertube.getInfo(videoId);
    return {
      title: info.basic_info.title || "Unknown Title",
      duration: info.basic_info.duration || 0,
    };
  } catch (error) {
    console.error("Error fetching video info:", error);
    // Fallback to oembed API
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
    } catch {}
    return { title: "Unknown Title", duration: 0 };
  }
}

// Fetch transcript using youtube-caption-extractor
async function getTranscript(videoId: string): Promise<{
  success: boolean;
  segments?: TranscriptSegment[];
  languageCode?: string;
  error?: string;
  debug?: any;
}> {
  const debug: any = {
    videoId,
    attempts: [],
    timestamp: new Date().toISOString(),
  };

  // Try different language codes
  const languagesToTry = ["en", "vi", undefined]; // undefined = auto-detect

  for (const lang of languagesToTry) {
    const langDesc = lang || "auto";
    debug.attempts.push({ lang: langDesc, status: "trying" });

    try {
      console.log(`📝 [YouTube API] Trying to get subtitles with lang: ${langDesc}`);

      const subtitles = await getSubtitles({
        videoID: videoId,
        lang: lang,
      });

      if (subtitles && subtitles.length > 0) {
        console.log(`✅ [YouTube API] Got ${subtitles.length} subtitle segments`);
        debug.attempts[debug.attempts.length - 1].status = "success";
        debug.attempts[debug.attempts.length - 1].segmentCount = subtitles.length;

        const segments: TranscriptSegment[] = subtitles.map((item: any) => ({
          text: item.text || "",
          start: parseFloat(item.start) || 0,
          duration: parseFloat(item.dur) || 0,
        }));

        return {
          success: true,
          segments,
          languageCode: lang || "auto",
          debug,
        };
      } else {
        debug.attempts[debug.attempts.length - 1].status = "empty";
        debug.attempts[debug.attempts.length - 1].error = "No subtitles returned";
      }
    } catch (error: any) {
      console.log(`❌ [YouTube API] Failed with lang ${langDesc}: ${error.message}`);
      debug.attempts[debug.attempts.length - 1].status = "failed";
      debug.attempts[debug.attempts.length - 1].error = error.message;

      // If error indicates video is unavailable, don't try other languages
      if (
        error.message?.includes("unavailable") ||
        error.message?.includes("private")
      ) {
        return {
          success: false,
          error: error.message,
          debug,
        };
      }
    }
  }

  return {
    success: false,
    error: "No transcripts available for this video",
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

    // Fetch video info using youtubei.js
    console.log("📺 [YouTube API] Fetching video info...");
    const { title, duration } = await getVideoInfo(videoId);
    console.log(`📺 [YouTube API] Video: "${title}" (${duration}s)`);

    // Fetch transcript using youtube-caption-extractor
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
        language: transcriptResult.languageCode || "unknown",
        languageCode: transcriptResult.languageCode || "unknown",
        transcript: formattedTranscript,
        rawTranscript: transcriptResult.segments.map((item) => ({
          ...item,
          text: decodeEntities(item.text),
        })),
        cached: false,
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
