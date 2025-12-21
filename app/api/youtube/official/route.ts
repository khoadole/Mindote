import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

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

  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
}

// Decode HTML entities
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

// Get video info using YouTube Data API
async function getVideoInfo(videoId: string): Promise<{
  title: string;
  description: string;
  channelTitle: string;
  duration: string;
  hasCaptions: boolean;
}> {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY is not configured");
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || "YouTube API error");
  }

  if (!data.items || data.items.length === 0) {
    throw new Error("Video not found");
  }

  const video = data.items[0];
  return {
    title: video.snippet?.title || "Unknown",
    description: video.snippet?.description || "",
    channelTitle: video.snippet?.channelTitle || "Unknown",
    duration: video.contentDetails?.duration || "PT0S",
    hasCaptions: video.contentDetails?.caption === "true",
  };
}

// Get available caption tracks using YouTube Data API
async function getCaptionTracks(videoId: string): Promise<any[]> {
  if (!YOUTUBE_API_KEY) {
    return [];
  }

  const url = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.log("[YouTube Official] Caption API error:", data.error.message);
      return [];
    }

    return data.items || [];
  } catch (error) {
    console.error("[YouTube Official] Error fetching captions:", error);
    return [];
  }
}

// Parse XML transcript
function parseTranscriptXml(xml: string): { text: string; start: number; duration: number }[] {
  const segments: { text: string; start: number; duration: number }[] = [];
  const textRegex = /<text\s+start="([^"]+)"\s+dur="([^"]+)"[^>]*>([^<]*)<\/text>/g;

  let match;
  while ((match = textRegex.exec(xml)) !== null) {
    const start = parseFloat(match[1]) || 0;
    const dur = parseFloat(match[2]) || 0;
    let text = match[3] || "";
    text = decodeEntities(text);

    if (text.trim()) {
      segments.push({
        text: text.trim(),
        start,
        duration: dur,
      });
    }
  }

  return segments;
}

// Try to fetch transcript using timedtext (fallback method)
async function fetchTranscriptFallback(videoId: string, languages: string[]): Promise<{
  segments: { text: string; start: number; duration: number }[];
  language: string;
} | null> {
  for (const lang of languages) {
    const urls = [
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=srv3`,
    ];

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        if (response.ok) {
          const text = await response.text();
          if (text && text.includes("<text")) {
            const segments = parseTranscriptXml(text);
            if (segments.length > 0) {
              return { segments, language: lang };
            }
          }
        }
      } catch {
        continue;
      }
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  console.log("🎬 [YouTube Official API] Request received");

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json(
      { error: "YOUTUBE_API_KEY is not configured on server" },
      { status: 500 }
    );
  }

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

    console.log(`🎯 [YouTube Official API] Video ID: ${videoId}`);

    // Step 1: Get video info using official API
    const videoInfo = await getVideoInfo(videoId);
    console.log(`📺 [YouTube Official API] Title: "${videoInfo.title}"`);
    console.log(`📺 [YouTube Official API] Has captions: ${videoInfo.hasCaptions}`);

    // Step 2: Get caption tracks (metadata only)
    const captionTracks = await getCaptionTracks(videoId);
    console.log(`📝 [YouTube Official API] Caption tracks found: ${captionTracks.length}`);

    // Build language priority from available tracks
    const availableLanguages = captionTracks.map((track: any) => track.snippet?.language).filter(Boolean);
    const languagePriority = [
      "en", "en-US", "en-GB",
      ...availableLanguages,
      "vi", "auto"
    ];

    // Step 3: Try to get transcript content (fallback method)
    const transcriptResult = await fetchTranscriptFallback(videoId, languagePriority);

    if (transcriptResult) {
      const fullTranscript = transcriptResult.segments.map((s) => s.text).join(" ");

      return NextResponse.json({
        success: true,
        data: {
          videoId,
          title: videoInfo.title,
          channelTitle: videoInfo.channelTitle,
          duration: videoInfo.duration,
          hasCaptions: videoInfo.hasCaptions,
          transcript: fullTranscript,
          segments: transcriptResult.segments,
          language: transcriptResult.language,
          availableCaptions: captionTracks.map((track: any) => ({
            language: track.snippet?.language,
            name: track.snippet?.name,
            trackKind: track.snippet?.trackKind,
          })),
          method: "youtube-data-api-v3",
        },
      });
    }

    // No transcript available
    return NextResponse.json(
      {
        error: "No transcript available for this video",
        data: {
          videoId,
          title: videoInfo.title,
          channelTitle: videoInfo.channelTitle,
          hasCaptions: videoInfo.hasCaptions,
          availableCaptions: captionTracks.map((track: any) => ({
            language: track.snippet?.language,
            name: track.snippet?.name,
            trackKind: track.snippet?.trackKind,
          })),
        },
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("❌ [YouTube Official API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch video info" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { 
        error: "YouTube URL is required",
        usage: "GET /api/youtube/official?url=YOUTUBE_URL",
        note: "Requires YOUTUBE_API_KEY environment variable"
      },
      { status: 400 }
    );
  }

  const fakeRequest = new NextRequest(request.url, {
    method: "POST",
    body: JSON.stringify({ url }),
  });

  return POST(fakeRequest);
}
