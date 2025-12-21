/**
 * Client-side YouTube Transcript Fetcher
 *
 * This module fetches YouTube transcripts directly from the user's browser,
 * bypassing cloud server IP blocking by YouTube.
 *
 * How it works:
 * 1. Fetches the YouTube video page HTML
 * 2. Extracts caption track URLs from ytInitialPlayerResponse
 * 3. Fetches the actual transcript from the caption URL
 */

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

interface TranscriptResult {
  success: boolean;
  transcript?: string;
  segments?: TranscriptSegment[];
  title?: string;
  videoId?: string;
  error?: string;
}

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

  return null;
}

// Decode HTML entities
function decodeEntities(text: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value
    .replace(/\n/g, " ")
    .trim();
}

// Parse caption XML into segments
function parseCaptionsXml(xmlText: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");

  // Handle <text> elements (standard format)
  const textElements = doc.querySelectorAll("text");
  textElements.forEach((elem) => {
    const text = elem.textContent || "";
    const start = parseFloat(elem.getAttribute("start") || "0");
    const dur = parseFloat(elem.getAttribute("dur") || "0");

    if (text.trim()) {
      segments.push({
        text: decodeEntities(text),
        start,
        duration: dur,
      });
    }
  });

  return segments;
}

// Fetch transcript from caption URL (via CORS proxy if needed)
async function fetchCaptionFromUrl(captionUrl: string): Promise<TranscriptSegment[]> {
  // Try direct fetch first (may work for some caption URLs)
  // Then fallback to CORS proxy
  const urlsToTry = [
    captionUrl,
    `https://corsproxy.io/?${encodeURIComponent(captionUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(captionUrl)}`,
  ];

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        continue;
      }

      const xmlText = await response.text();
      const segments = parseCaptionsXml(xmlText);
      
      if (segments.length > 0) {
        return segments;
      }
    } catch (error) {
      console.log("[Client Transcript] Caption fetch attempt failed:", error);
      // Continue to next URL
    }
  }

  throw new Error("Failed to fetch captions from all sources");
}

// CORS Proxies for client-side YouTube page fetching
// These proxies bypass CORS but request still comes from user's browser/IP
const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

// Extract player response from YouTube page via CORS proxy
async function getPlayerResponse(videoId: string): Promise<any> {
  const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  let lastError: Error | null = null;
  
  // Try each CORS proxy until one works
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyUrl = CORS_PROXIES[i](videoPageUrl);
    
    try {
      console.log(`[Client Transcript] Trying proxy ${i + 1}...`);
      
      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Proxy ${i + 1} returned ${response.status}`);
      }

      const html = await response.text();
      
      // Extract ytInitialPlayerResponse
      const playerResponseMatch = html.match(
        /ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\});/
      );

      if (!playerResponseMatch) {
        throw new Error("Could not find player response in page");
      }

      try {
        const parsed = JSON.parse(playerResponseMatch[1]);
        console.log(`[Client Transcript] Successfully parsed player response via proxy ${i + 1}`);
        return parsed;
      } catch (e) {
        throw new Error("Failed to parse player response JSON");
      }
    } catch (error: any) {
      console.log(`[Client Transcript] Proxy ${i + 1} failed:`, error.message);
      lastError = error;
      // Continue to next proxy
    }
  }

  // All proxies failed
  throw lastError || new Error("All CORS proxies failed");
}

// Main function to fetch transcript client-side
export async function fetchTranscriptClientSide(
  url: string
): Promise<TranscriptResult> {
  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      return { success: false, error: "Invalid YouTube URL" };
    }

    console.log("[Client Transcript] Fetching for video:", videoId);

    // Get player response from video page
    const playerResponse = await getPlayerResponse(videoId);

    // Extract video title
    const title =
      playerResponse?.videoDetails?.title || "Unknown Title";

    // Get caption tracks
    const captionTracks =
      playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captionTracks || captionTracks.length === 0) {
      return {
        success: false,
        error: "No captions available for this video",
        videoId,
        title,
      };
    }

    console.log(
      "[Client Transcript] Found caption tracks:",
      captionTracks.length
    );

    // Find best caption track (prefer English, then any)
    let selectedTrack = captionTracks.find(
      (t: any) =>
        t.languageCode === "en" && !t.kind // Manual English first
    );

    if (!selectedTrack) {
      selectedTrack = captionTracks.find(
        (t: any) => t.languageCode?.startsWith("en") // Any English
      );
    }

    if (!selectedTrack) {
      selectedTrack = captionTracks.find(
        (t: any) => !t.kind // Any manual caption
      );
    }

    if (!selectedTrack) {
      selectedTrack = captionTracks[0]; // Fallback to first
    }

    if (!selectedTrack?.baseUrl) {
      return {
        success: false,
        error: "No valid caption track found",
        videoId,
        title,
      };
    }

    console.log(
      "[Client Transcript] Selected track:",
      selectedTrack.languageCode,
      selectedTrack.name?.simpleText
    );

    // Fetch the actual captions
    const segments = await fetchCaptionFromUrl(selectedTrack.baseUrl);

    if (segments.length === 0) {
      return {
        success: false,
        error: "No transcript segments found",
        videoId,
        title,
      };
    }

    // Combine segments into transcript text
    const transcript = segments
      .map((s) => s.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    console.log(
      "[Client Transcript] Success! Got",
      segments.length,
      "segments"
    );

    return {
      success: true,
      transcript,
      segments,
      title,
      videoId,
    };
  } catch (error: any) {
    console.error("[Client Transcript] Error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch transcript",
    };
  }
}

// Check if client-side fetch is likely to work
// Some browsers block cross-origin requests to YouTube
export function canFetchClientSide(): boolean {
  // In browser context, this should work
  // Server-side rendering will return false
  return typeof window !== "undefined" && typeof document !== "undefined";
}
