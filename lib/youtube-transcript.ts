/**
 * YouTube Transcript Fetcher - HTTP-based approach
 * Works reliably on Vercel serverless without external libraries
 */

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

interface TranscriptResult {
  success: boolean;
  segments?: TranscriptSegment[];
  error?: string;
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoId(url: string): string | null {
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

  // If it's already just an ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
}

/**
 * Parse YouTube's timed text XML format
 */
function parseTimedText(xml: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  
  // Match all <text> tags with attributes
  const textRegex = /<text start="([^"]+)" dur="([^"]+)"[^>]*>([^<]*)<\/text>/g;
  let match;

  while ((match = textRegex.exec(xml)) !== null) {
    const start = parseFloat(match[1]);
    const duration = parseFloat(match[2]);
    let text = match[3];

    // Decode HTML entities
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .trim();

    if (text) {
      segments.push({ text, start, duration });
    }
  }

  return segments;
}

/**
 * Get random user agent to avoid blocking
 */
function getUserAgent(): string {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ];
  return agents[Math.floor(Math.random() * agents.length)];
}

/**
 * Fetch transcript for a YouTube video using HTTP requests
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptResult> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[YouTube] Attempt ${attempt + 1}/${maxRetries} for video ${videoId}`);

      // Step 1: Fetch video page
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const pageResponse = await fetch(videoUrl, {
        headers: {
          'User-Agent': getUserAgent(),
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      if (!pageResponse.ok) {
        throw new Error(`Failed to fetch video page: ${pageResponse.status}`);
      }

      const html = await pageResponse.text();

      // Step 2: Extract ytInitialPlayerResponse
      const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
      if (!playerResponseMatch) {
        throw new Error('Could not find player response in page');
      }

      const playerResponse = JSON.parse(playerResponseMatch[1]);

      // Step 3: Get caption tracks
      const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer;
      if (!captions || !captions.captionTracks) {
        return {
          success: false,
          error: 'No transcripts are available for this video. The video may not have captions enabled.',
        };
      }

      const captionTracks = captions.captionTracks;
      
      // Try to find English caption track first
      let captionTrack = captionTracks.find((track: any) => 
        track.languageCode === 'en' || track.languageCode.startsWith('en')
      );

      // If no English, use first available
      if (!captionTrack && captionTracks.length > 0) {
        captionTrack = captionTracks[0];
      }

      if (!captionTrack || !captionTrack.baseUrl) {
        return {
          success: false,
          error: 'No caption URL found',
        };
      }

      // Step 4: Fetch caption data
      const captionUrl = captionTrack.baseUrl;
      const captionResponse = await fetch(captionUrl, {
        headers: {
          'User-Agent': getUserAgent(),
        },
      });

      if (!captionResponse.ok) {
        throw new Error(`Failed to fetch captions: ${captionResponse.status}`);
      }

      const captionXml = await captionResponse.text();

      // Step 5: Parse caption XML
      const segments = parseTimedText(captionXml);

      if (segments.length === 0) {
        return {
          success: false,
          error: 'No transcript segments found',
        };
      }

      console.log(`[YouTube] Successfully fetched ${segments.length} segments`);

      return {
        success: true,
        segments,
      };

    } catch (error: any) {
      lastError = error;
      console.error(`[YouTube] Attempt ${attempt + 1} failed:`, error.message);

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        const waitTime = (attempt + 1) * 1000; // 1s, 2s, 3s
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Failed to fetch transcript after retries',
  };
}
