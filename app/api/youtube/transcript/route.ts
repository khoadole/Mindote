import { NextRequest, NextResponse } from "next/server";

// Dynamic import for youtubei.js
async function getTranscript(videoId: string) {
  try {
    const { Innertube } = await import("youtubei.js");
    const youtube = await Innertube.create();
    
    const info = await youtube.getInfo(videoId);
    const transcriptData = await info.getTranscript();
    
    if (!transcriptData || !transcriptData.transcript) {
      throw new Error("No transcript available");
    }

    return transcriptData.transcript.content?.body?.initial_segments?.map(
      (segment: any) => ({
        text: segment.snippet.text,
        start: segment.start_ms / 1000,
        duration: segment.end_ms / 1000 - segment.start_ms / 1000,
      })
    ) || [];
  } catch (error) {
    throw error;
  }
}

// Helper to extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Helper to get video info from YouTube using youtubei.js
async function getVideoInfo(videoId: string) {
  try {
    const { Innertube } = await import("youtubei.js");
    const youtube = await Innertube.create();
    const info = await youtube.getInfo(videoId);
    
    const title = info.basic_info.title || "Unknown Title";
    const duration = info.basic_info.duration || 0;

    return { title, duration };
  } catch (error) {
    console.error("Error fetching video info:", error);
    return { title: "Unknown Title", duration: 0 };
  }
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

    // Get video info (title + duration)
    console.log("📡 [YouTube API] Fetching video info...");
    const { title, duration } = await getVideoInfo(videoId);
    console.log(`📺 [YouTube API] Video: "${title}" (${duration}s)`);

    // Check duration limit (60 minutes = 3600 seconds)
    const MAX_DURATION = 3600;
    if (duration > MAX_DURATION) {
      const minutes = Math.floor(duration / 60);
      console.log(`❌ [YouTube API] Video too long: ${minutes} minutes`);
      return NextResponse.json(
        {
          error: `Video is too long (${minutes} minutes). Maximum allowed is 60 minutes.`,
        },
        { status: 400 }
      );
    }

    // Fetch transcript
    try {
      console.log("📄 [YouTube API] Fetching transcript...");
      const transcript = await getTranscript(videoId);
      console.log(
        `✅ [YouTube API] Transcript fetched: ${transcript.length} items`
      );

      if (!transcript || transcript.length === 0) {
        console.log("❌ [YouTube API] No transcript available");
        return NextResponse.json(
          {
            error:
              "No captions available for this video. Please try a video with closed captions (CC).",
          },
          { status: 404 }
        );
      }

      // Format transcript
      const formattedTranscript = transcript
        .map((item: any) => item.text)
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
          transcript: formattedTranscript,
          rawTranscript: transcript, // Include raw data with timestamps
        },
      });
    } catch (transcriptError: any) {
      // Handle transcript-specific errors
      console.error(
        "❌ [YouTube API] Transcript error:",
        transcriptError.message
      );

      if (
        transcriptError.message?.includes("Transcript is disabled") ||
        transcriptError.message?.includes("Could not find captions")
      ) {
        return NextResponse.json(
          {
            error:
              "No captions available for this video. Please try a video with closed captions (CC).",
          },
          { status: 404 }
        );
      }

      throw transcriptError;
    }
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
