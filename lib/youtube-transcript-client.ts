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

// Fetch transcript from caption URL
async function fetchCaptionFromUrl(captionUrl: string): Promise<TranscriptSegment[]> {
  try {
    const response = await fetch(captionUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch captions: ${response.status}`);
    }

    const xmlText = await response.text();
    return parseCaptionsXml(xmlText);
  } catch (error) {
    console.error("[Client Transcript] Error fetching caption URL:", error);
    throw error;
  }
}

// Extract player response from YouTube page
async function getPlayerResponse(videoId: string): Promise<any> {
  // Use YouTube's oembed for basic info
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

  // We need to fetch the actual video page to get caption tracks
  // This uses a CORS proxy or direct fetch (works in browser context)
  const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const response = await fetch(videoPageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch video page: ${response.status}`);
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
    return JSON.parse(playerResponseMatch[1]);
  } catch (e) {
    throw new Error("Failed to parse player response");
  }
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
