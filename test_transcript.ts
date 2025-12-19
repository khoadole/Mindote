
import { YoutubeTranscript } from 'youtube-transcript';
import { Innertube, UniversalCache } from 'youtubei.js';

const VIDEO_ID = '0ldH-RL9ZCU'; // The video from the screenshot

async function testYoutubeTranscript() {
  console.log('Testing youtube-transcript...');
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(VIDEO_ID);
    console.log(`[youtube-transcript] Success: Found ${transcript.length} items`);
  } catch (error) {
    console.error('[youtube-transcript] Failed:', error);
  }
}

async function testInnertube() {
  console.log('Testing youtubei.js...');
  try {
    const yt = await Innertube.create({ cache: new UniversalCache(false), generate_session_locally: true });
    const info = await yt.getInfo(VIDEO_ID);
    const transcriptData = await info.getTranscript();
    
    if (transcriptData && transcriptData.transcript) {
       // content is usually in transcriptData.transcript.content.body.initial_segments
       console.log(`[youtubei.js] Success: Transcript found`);
    } else {
       console.log('[youtubei.js] No transcript found');
    }
  } catch (error) {
    console.error('[youtubei.js] Failed:', error);
  }
}

async function main() {
  await testYoutubeTranscript();
  console.log('---');
  await testInnertube();
}

main();
