const fs = require('fs');
const os = require('os');
const path = require('path');
const axios = require('axios');
const youtubeDl = require('youtube-dl-exec');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const ffmpeg = require('fluent-ffmpeg');
const { explainFrames } = require('./claudeClient');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

async function downloadVideo(url) {
  const tempPath = path.join(os.tmpdir(), `reel-${Date.now()}.mp4`);
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(tempPath, response.data);
  return tempPath;
}

async function downloadVideoYtDlp(url) {
  const tempPath = path.join(os.tmpdir(), `reel-${Date.now()}.mp4`);
  await youtubeDl(url, {
    output: tempPath,
    mergeOutputFormat: 'mp4',
    noPlaylist: true,
  });
  return tempPath;
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

async function processReel(videoUrl) {
  const videoPath = await downloadVideo(videoUrl);

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

async function processReelFromPublicUrl(url) {
  const videoPath = await downloadVideoYtDlp(url);

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

module.exports = { processReel, processReelFromPublicUrl };
