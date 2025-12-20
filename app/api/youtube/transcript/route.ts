import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime (not Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// YouTube Transcript API using youtube-transcript-plus library
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

// Decode HTML/Unicode entities in transcript text
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\n/g, ' ')
    .trim();
}

// Fetch transcript using youtube-transcript-plus
async function getTranscript(videoId: string): Promise<{
  success: boolean;
  segments?: TranscriptSegment[];
  error?: string;
  debug?: any;
}> {
  const debug: any = {
    videoId,
    attempts: [],
    timestamp: new Date().toISOString(),
  };
  
  try {
    console.log(`📄 [YouTube API] Fetching transcript for video: ${videoId}`);
    
    // Dynamic import to ensure proper module loading
    const { fetchTranscript } = await import('youtube-transcript-plus');
    console.log(`📦 [YouTube API] Module loaded successfully`);
    
    // Try multiple language options
    const languageOptions = [
      undefined,  // Default - auto-detect
      { lang: 'en' },
      { lang: 'en-US' },
      { lang: 'vi' },
    ];
    
    let lastError: any = null;
    
    for (const langOption of languageOptions) {
      try {
        const optionDesc = langOption ? JSON.stringify(langOption) : 'auto';
        console.log(`🔍 [YouTube API] Trying with options: ${optionDesc}`);
        debug.attempts.push({ option: optionDesc, status: 'trying' });
        
        const transcript = await fetchTranscript(videoId, {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          ...langOption,
        });
        
        console.log(`✅ [YouTube API] Got ${transcript?.length || 0} segments with options: ${optionDesc}`);
        debug.attempts[debug.attempts.length - 1].status = 'success';
        debug.attempts[debug.attempts.length - 1].segmentCount = transcript?.length || 0;
        
        if (transcript && transcript.length > 0) {
          const segments: TranscriptSegment[] = transcript.map((item: any) => ({
            text: item.text || '',
            start: item.offset || item.start || 0,
            duration: item.duration || 0
          }));

          return {
            success: true,
            segments: segments,
            debug
          };
        }
      } catch (langError: any) {
        const optionDesc = langOption ? JSON.stringify(langOption) : 'auto';
        console.log(`❌ [YouTube API] Failed with options ${optionDesc}: ${langError.message}`);
        debug.attempts[debug.attempts.length - 1].status = 'failed';
        debug.attempts[debug.attempts.length - 1].error = langError.message;
        lastError = langError;
      }
    }
    
    // If all attempts failed
    return {
      success: false,
      error: lastError?.message || 'No transcript found after trying all language options',
      debug
    };
    
  } catch (error: any) {
    console.error(`❌ [YouTube API] Transcript error:`, error.message);
    console.error(`❌ [YouTube API] Full error:`, error);
    debug.fatalError = error.message;
    return {
      success: false,
      error: error.message || 'Failed to fetch transcript',
      debug
    };
  }
}

// Get video info (title, duration)
async function getVideoInfo(videoId: string): Promise<{ title: string; duration: number }> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title || 'Unknown Title',
        duration: 0,
      };
    }
  } catch (error) {
    console.error('Error fetching video info:', error);
  }
  
  return { title: 'Unknown Title', duration: 0 };
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

    // Fetch transcript
    console.log("📄 [YouTube API] Fetching transcript...");
    const transcriptResult = await getTranscript(videoId);
    
    // Fallback to Python API if Node.js fails
    if (!transcriptResult.success || !transcriptResult.segments) {
        console.log("⚠️ [YouTube API] Node.js fetch failed, trying Python fallback...");
        
        try {
            // Construct absolute URL for internal API call
            const protocol = request.nextUrl.protocol;
            const host = request.headers.get('host') || 'localhost:3000';
            const pythonApiUrl = `${protocol}//${host}/api/py_transcript?videoId=${videoId}`;
            
            console.log(`🐍 [YouTube API] Calling Python endpoint: ${pythonApiUrl}`);
            
            const pythonResponse = await fetch(pythonApiUrl);
            
            if (pythonResponse.ok) {
                const pythonData = await pythonResponse.json();
                
                if (pythonData.success && pythonData.data) {
                    console.log(`✅ [YouTube API] Python fallback successful!`);
                    return NextResponse.json(pythonData);
                }
            } else {
                console.log(`❌ [YouTube API] Python fallback failed with status: ${pythonResponse.status}`);
            }
        } catch (fallbackError) {
             console.error(`❌ [YouTube API] Python fallback error:`, fallbackError);
        }

        console.log("❌ [YouTube API] Transcript fetch failed:", transcriptResult.error);
        return NextResponse.json(
          {
            error: transcriptResult.error || "No captions available for this video. Please try a video with closed captions (CC).",
          },
          { status: 404 }
        );
    }
    
    console.log(`✅ [YouTube API] Transcript fetched: ${transcriptResult.segments.length} segments`);

    // Get video info
    const { title, duration } = await getVideoInfo(videoId);
    console.log(`📺 [YouTube API] Video: "${title}"`);

    // Format transcript - decode entities and join
    const formattedTranscript = transcriptResult.segments
      .map((item) => decodeEntities(item.text))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    console.log(`✅ [YouTube API] Success! Transcript length: ${formattedTranscript.length} chars`);

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        title,
        duration,
        language: 'unknown',
        languageCode: 'unknown',
        transcript: formattedTranscript,
        rawTranscript: transcriptResult.segments.map(item => ({
          ...item,
          text: decodeEntities(item.text),
        })),
      },
    });
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
