import { NextRequest, NextResponse } from "next/server";

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

// Fetch page HTML and extract caption track URL
async function fetchCaptionUrl(videoId: string): Promise<string | null> {
  try {
    // Fetch video page
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const html = await response.text();

    // Extract caption track from ytInitialPlayerResponse
    const captionMatch = html.match(/"captionTracks":\[([^\]]+)\]/);
    if (captionMatch) {
      const captionData = captionMatch[1];
      // Find base URL
      const urlMatch = captionData.match(/"baseUrl":"([^"]+)"/);
      if (urlMatch) {
        // Decode escaped URL
        return urlMatch[1].replace(/\\u0026/g, "&");
      }
    }

    return null;
  } catch (error) {
    console.error("[YouTube V2] Error fetching page:", error);
    return null;
  }
}

// Alternative: Try timedtext API directly
async function fetchTimedText(videoId: string, lang: string = "en"): Promise<string | null> {
  const urls = [
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=srv3`,
    `https://video.google.com/timedtext?v=${videoId}&lang=${lang}`,
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
          return text;
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  console.log("🎬 [YouTube V2] Request received");

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

    console.log(`🎯 [YouTube V2] Video ID: ${videoId}`);

    const debug: any = { videoId, attempts: [] };

    // Method 1: Try to extract caption URL from page
    console.log("[YouTube V2] Method 1: Extracting from page...");
    debug.attempts.push({ method: "page_extract", status: "trying" });

    const captionUrl = await fetchCaptionUrl(videoId);
    
    if (captionUrl) {
      try {
        const captionResponse = await fetch(captionUrl);
        const captionXml = await captionResponse.text();
        const segments = parseTranscriptXml(captionXml);

        if (segments.length > 0) {
          debug.attempts[0].status = "success";
          debug.attempts[0].count = segments.length;

          const transcript = segments.map((s) => s.text).join(" ");

          return NextResponse.json({
            success: true,
            data: {
              videoId,
              transcript,
              segments,
              method: "page_extract",
            },
          });
        }
      } catch (err: any) {
        debug.attempts[0].error = err.message;
      }
    }
    debug.attempts[0].status = "failed";

    // Method 2: Try timedtext API directly
    console.log("[YouTube V2] Method 2: Timedtext API...");
    debug.attempts.push({ method: "timedtext_api", status: "trying" });

    const languages = ["en", "en-US", "vi", "auto"];
    
    for (const lang of languages) {
      const xml = await fetchTimedText(videoId, lang);
      if (xml) {
        const segments = parseTranscriptXml(xml);
        if (segments.length > 0) {
          debug.attempts[1].status = "success";
          debug.attempts[1].lang = lang;
          debug.attempts[1].count = segments.length;

          const transcript = segments.map((s) => s.text).join(" ");

          return NextResponse.json({
            success: true,
            data: {
              videoId,
              transcript,
              segments,
              method: `timedtext_${lang}`,
            },
          });
        }
      }
    }
    debug.attempts[1].status = "failed";

    return NextResponse.json(
      {
        error: "No transcript available for this video",
        debug,
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("❌ [YouTube V2] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch transcript" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "YouTube URL is required. Usage: ?url=YOUR_YOUTUBE_URL" },
      { status: 400 }
    );
  }

  const fakeRequest = new NextRequest(request.url, {
    method: "POST",
    body: JSON.stringify({ url }),
  });

  return POST(fakeRequest);
}
