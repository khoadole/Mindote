import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Extract video ID from YouTube URL
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

  // If it's just a video ID (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
}

export async function POST(request: NextRequest) {
  console.log("🎬 [YouTube Transcript Simple] Request received");

  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    console.log(`🎯 [YouTube Transcript Simple] Video ID: ${videoId}`);

    // Fetch transcript using youtube-transcript library
    const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcriptData || transcriptData.length === 0) {
      return NextResponse.json(
        { error: "No transcript available for this video" },
        { status: 404 }
      );
    }

    // Format transcript
    const fullTranscript = transcriptData
      .map((item) => item.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    console.log(
      `✅ [YouTube Transcript Simple] Success! ${transcriptData.length} segments`
    );

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        transcript: fullTranscript,
        segments: transcriptData,
        method: "youtube-transcript",
      },
    });
  } catch (error: any) {
    console.error("❌ [YouTube Transcript Simple] Error:", error);

    // Check for specific error types
    if (error.message?.includes("disabled")) {
      return NextResponse.json(
        { error: "Transcript is disabled for this video" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to fetch transcript" },
      { status: 500 }
    );
  }
}

// Also support GET for easy browser testing
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "YouTube URL is required. Usage: ?url=YOUR_YOUTUBE_URL" },
      { status: 400 }
    );
  }

  // Reuse POST logic
  const fakeRequest = new NextRequest(request.url, {
    method: "POST",
    body: JSON.stringify({ url }),
  });

  return POST(fakeRequest);
}
