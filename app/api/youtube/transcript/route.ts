import { NextRequest, NextResponse } from "next/server";
import { Innertube, ClientType } from "youtubei.js";

// Force Node.js runtime (not Edge)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// ============================================================================
// YouTube Transcript API using youtubei.js with Android client
// Android client may bypass some IP restrictions
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

// Get video info using oembed (always works)
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
    console.error("[YouTube API] Error fetching video info:", error);
  }
  return { title: "Unknown Title", duration: 0 };
}

// Try different client configurations
const clientConfigs = [
  {
    name: "ANDROID",
    config: {
      lang: "en",
      location: "US",
      client_type: ClientType.ANDROID,
      device_category: "MOBILE",
      retrieve_player: false,
      generate_session_locally: true,
    },
  },
  {
    name: "IOS",
    config: {
      lang: "en",
      location: "US",
      client_type: ClientType.IOS,
      device_category: "MOBILE",
      retrieve_player: false,
      generate_session_locally: true,
    },
  },
  {
    name: "WEB",
    config: {
      lang: "en",
      location: "US",
      client_type: ClientType.WEB,
      retrieve_player: false,
      generate_session_locally: true,
    },
  },
];

async function getTranscript(videoId: string): Promise<{
  success: boolean;
  segments?: TranscriptSegment[];
  error?: string;
  method?: string;
  debug?: any;
}> {
  const debug: any = {
    videoId,
    attempts: [],
    timestamp: new Date().toISOString(),
  };

  // Try different client types
  for (const clientConfig of clientConfigs) {
    debug.attempts.push({
      client: clientConfig.name,
      status: "trying",
    });

    try {
      console.log(`📱 [YouTube API] Trying ${clientConfig.name} client...`);

      const innertube = await Innertube.create(clientConfig.config as any);
      const info = await innertube.getInfo(videoId);

      // Check playability
      if (info.playability_status?.status !== "OK") {
        debug.attempts[debug.attempts.length - 1].status = "not_playable";
        debug.attempts[debug.attempts.length - 1].reason =
          info.playability_status?.reason;
        console.log(
          `❌ [YouTube API] ${clientConfig.name}: Not playable - ${info.playability_status?.reason}`
        );
        continue;
      }

      // Try getTranscript method
      try {
        console.log(`📝 [YouTube API] ${clientConfig.name}: Getting transcript...`);
        const transcriptInfo = await info.getTranscript();

        if (transcriptInfo) {
          const transcriptContent = transcriptInfo?.transcript?.content;
          const bodySegments = transcriptContent?.body?.initial_segments;

          if (bodySegments && bodySegments.length > 0) {
            console.log(
              `✅ [YouTube API] ${clientConfig.name}: Got ${bodySegments.length} segments!`
            );

            debug.attempts[debug.attempts.length - 1].status = "success";
            debug.attempts[debug.attempts.length - 1].segmentCount =
              bodySegments.length;

            const segments: TranscriptSegment[] = bodySegments
              .filter((segment: any) => segment?.snippet?.text)
              .map((segment: any) => ({
                text: segment.snippet.text || "",
                start: parseFloat(segment.start_ms || "0") / 1000,
                duration:
                  parseFloat(segment.end_ms || "0") / 1000 -
                  parseFloat(segment.start_ms || "0") / 1000,
              }));

            return {
              success: true,
              segments,
              method: `youtubei.js-${clientConfig.name}`,
              debug,
            };
          }
        }
      } catch (transcriptError: any) {
        console.log(
          `⚠️ [YouTube API] ${clientConfig.name}: getTranscript failed - ${transcriptError.message}`
        );
        debug.attempts[debug.attempts.length - 1].transcriptError =
          transcriptError.message;
      }

      // Fallback: Try caption tracks
      const captions = info.captions;
      if (captions) {
        const captionTracks = (captions as any).caption_tracks || [];

        if (captionTracks.length > 0) {
          console.log(
            `📝 [YouTube API] ${clientConfig.name}: Found ${captionTracks.length} caption tracks`
          );

          // Select best track
          let selectedTrack =
            captionTracks.find(
              (t: any) =>
                t.language_code?.startsWith("en") && t.kind !== "asr"
            ) ||
            captionTracks.find((t: any) => t.kind !== "asr") ||
            captionTracks.find((t: any) =>
              t.language_code?.startsWith("en")
            ) ||
            captionTracks[0];

          if (selectedTrack?.base_url) {
            try {
              const captionResponse = await fetch(selectedTrack.base_url);
              const xmlText = await captionResponse.text();

              if (xmlText && xmlText.trim().length > 0) {
                // Parse XML
                const segments: TranscriptSegment[] = [];
                const textRegex =
                  /<text\s+start="([^"]+)"\s+dur="([^"]+)"[^>]*>([^<]*)<\/text>/g;

                let match;
                while ((match = textRegex.exec(xmlText)) !== null) {
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

                if (segments.length > 0) {
                  console.log(
                    `✅ [YouTube API] ${clientConfig.name}: Parsed ${segments.length} segments from captions`
                  );

                  debug.attempts[debug.attempts.length - 1].status = "success";
                  debug.attempts[debug.attempts.length - 1].segmentCount =
                    segments.length;
                  debug.attempts[debug.attempts.length - 1].method = "captions";

                  return {
                    success: true,
                    segments,
                    method: `youtubei.js-${clientConfig.name}-captions`,
                    debug,
                  };
                }
              }
            } catch (captionError: any) {
              console.log(
                `⚠️ [YouTube API] ${clientConfig.name}: Caption fetch failed - ${captionError.message}`
              );
              debug.attempts[debug.attempts.length - 1].captionError =
                captionError.message;
            }
          }
        }
      }

      debug.attempts[debug.attempts.length - 1].status = "no_transcript";
    } catch (error: any) {
      console.log(
        `❌ [YouTube API] ${clientConfig.name} error: ${error.message}`
      );
      debug.attempts[debug.attempts.length - 1].status = "error";
      debug.attempts[debug.attempts.length - 1].error = error.message;
    }
  }

  return {
    success: false,
    error: "No transcripts available. Tried ANDROID, IOS, and WEB clients.",
    debug,
  };
}

export async function POST(request: NextRequest) {
  console.log("🎬 [YouTube API] Request received");

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

    console.log(`🎯 [YouTube API] Video ID: ${videoId}`);

    // Get video info
    const { title, duration } = await getVideoInfo(videoId);
    console.log(`📺 [YouTube API] Title: "${title}"`);

    // Get transcript
    const result = await getTranscript(videoId);

    if (!result.success || !result.segments) {
      console.log(`❌ [YouTube API] Failed: ${result.error}`);
      return NextResponse.json(
        {
          error: result.error || "No transcripts available",
          debug: result.debug,
        },
        { status: 404 }
      );
    }

    // Format transcript
    const formattedTranscript = result.segments
      .map((s) => s.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    console.log(
      `✅ [YouTube API] Success! ${result.segments.length} segments via ${result.method}`
    );

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        title,
        duration,
        transcript: formattedTranscript,
        rawTranscript: result.segments,
        languageCode: "auto",
        method: result.method,
      },
    });
  } catch (error: any) {
    console.error("❌ [YouTube API] Fatal error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch transcript" },
      { status: 500 }
    );
  }
}
