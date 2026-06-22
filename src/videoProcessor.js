const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const { explainFrames } = require('./claudeClient');

ffmpeg.setFfmpegPath(ffmpegPath);

const YT_DLP_PATH = path.join(__dirname, '..', 'yt-dlp');

async function downloadVideo(url) {
  const tempPath = path.join(os.tmpdir(), `reel-${Date.now()}.mp4`);
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(tempPath, response.data);
  return tempPath;
}

function downloadVideoYtDlp(url) {
  return new Promise((resolve, reject) => {
    const tempPath = path.join(os.tmpdir(), `reel-${Date.now()}.mp4`);
    const proc = spawn(YT_DLP_PATH, [
      '-o', tempPath,
      '--merge-output-format', 'mp4',
      '--no-playlist',
      url,
    ]);
    proc.on('close', (code) => {
      if (code === 0) resolve(tempPath);
      else reject(new Error(`yt-dlp exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

function extractFrames(videoPath, count = 6) {
  return new Promise((resolve, reject) => {
    const outDir = path.join(os.tmpdir(), `frames-${Date.now()}`);
    fs.mkdirSync(outDir, { recursive: true });

    ffmpeg(videoPath)
      .on('end', () => {
        const files = fs
          .readdirSync(outDir)
          .map((f) => path.join(outDir, f))
          .sort();
        resolve({ files, outDir });
      })
      .on('error', reject)
      .screenshots({
        count,
        folder: outDir,
        filename: 'frame-%i.png',
      });
  });
}

function frameToBase64(framePath) {
  return fs.readFileSync(framePath).toString('base64');
}

async function processReelWithDownloader(downloadFn, url) {
  const videoPath = await downloadFn(url);

  let result;
  try {
    const { files, outDir } = await extractFrames(videoPath, 6);
    const base64Frames = files.map(frameToBase64);

    result = await explainFrames(base64Frames);

    files.forEach((f) => fs.unlinkSync(f));
    fs.rmdirSync(outDir);
  } finally {
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
  }

  return result;
}

// Used by the webhook route — Meta provides a direct CDN video URL
async function processReel(videoUrl) {
  return processReelWithDownloader(downloadVideo, videoUrl);
}

// Used by the /explain route — accepts a public Instagram reel URL
async function processReelFromPublicUrl(url) {
  return processReelWithDownloader(downloadVideoYtDlp, url);
}

module.exports = { processReel, processReelFromPublicUrl };
