import { NextRequest, NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";

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

  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
}

// Get YouTube transcript using Innertube API with Android client
async function getYoutubeTranscript(
  videoId: string,
  language: string = "en"
): Promise<{
  success: boolean;
  transcript?: { caption: string; startTime: number; endTime: number }[];
  availableTracks?: { language: string; name: string; kind: string }[];
  error?: string;
}> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Step 1: Fetch HTML and get INNERTUBE_API_KEY
  const htmlResponse = await fetch(videoUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  const html = await htmlResponse.text();

  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  if (!apiKeyMatch) {
    return { success: false, error: "INNERTUBE_API_KEY not found" };
  }
  const apiKey = apiKeyMatch[1];

  console.log(`🔑 [Innertube] Got API key: ${apiKey.substring(0, 10)}...`);

  // Step 2: Call player API with Android client
  const playerResponse = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "ANDROID",
            clientVersion: "20.10.38",
          },
        },
        videoId,
      }),
    }
  );

  const playerData = await playerResponse.json();

  // Step 3: Extract caption tracks
  const tracks =
    playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!tracks || tracks.length === 0) {
    return { success: false, error: "No captions found for this video" };
  }

  // Format available tracks
  const availableTracks = tracks.map((t: any) => ({
    language: t.languageCode,
    name: t.name?.simpleText || t.name || "Unknown",
    kind: t.kind || "standard",
  }));

  console.log(`📝 [Innertube] Found ${tracks.length} caption tracks`);

  // Find requested language track
  let track = tracks.find((t: any) => t.languageCode === language);

  // Fallback: try English variants
  if (!track && language === "en") {
    track = tracks.find(
      (t: any) =>
        t.languageCode === "en-US" || t.languageCode.startsWith("en")
    );
  }

  // Fallback: use first available track
  if (!track) {
    track = tracks[0];
    console.log(
      `⚠️ [Innertube] Language "${language}" not found, using: ${track.languageCode}`
    );
  }

  // Step 4: Fetch and parse captions XML
  let baseUrl = track.baseUrl;
  // Remove fmt parameter if present
  baseUrl = baseUrl.replace(/&fmt=\w+$/, "");

  const captionResponse = await fetch(baseUrl);
  const xml = await captionResponse.text();

  try {
    const parsed = await parseStringPromise(xml);

    if (!parsed.transcript?.text) {
      return {
        success: false,
        error: "Invalid transcript format",
        availableTracks,
      };
    }

    const transcript = parsed.transcript.text.map((entry: any) => ({
      caption: entry._ || "",
      startTime: parseFloat(entry.$.start),
      endTime: parseFloat(entry.$.start) + parseFloat(entry.$.dur),
    }));

    return {
      success: true,
      transcript,
      availableTracks,
    };
  } catch (parseError: any) {
    return {
      success: false,
      error: `Failed to parse captions: ${parseError.message}`,
      availableTracks,
    };
  }
}

export async function POST(request: NextRequest) {
  console.log("🎬 [Innertube Transcript] Request received");

  try {
    const body = await request.json();
    const { url, language = "en" } = body;

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

    console.log(`🎯 [Innertube Transcript] Video ID: ${videoId}`);

    const result = await getYoutubeTranscript(videoId, language);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          availableTracks: result.availableTracks,
        },
        { status: 404 }
      );
    }

    // Combine all captions into full transcript
    const fullTranscript = result
      .transcript!.map((t) => t.caption)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    console.log(
      `✅ [Innertube Transcript] Success! ${result.transcript!.length} segments`
    );

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        transcript: fullTranscript,
        segments: result.transcript,
        availableTracks: result.availableTracks,
        method: "innertube-android",
      },
    });
  } catch (error: any) {
    console.error("❌ [Innertube Transcript] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch transcript" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const language = request.nextUrl.searchParams.get("lang") || "en";

  if (!url) {
    return NextResponse.json(
      {
        error: "YouTube URL is required",
        usage: "GET /api/youtube/innertube?url=YOUTUBE_URL&lang=en",
      },
      { status: 400 }
    );
  }

  const fakeRequest = new NextRequest(request.url, {
    method: "POST",
    body: JSON.stringify({ url, language }),
  });

  return POST(fakeRequest);
}
