// background.js

const capturedUrls = new Set();

// 1. LISTENER: Sniffs for MASTER playlist requests only
// We filter out .ts segments or media playlists to reduce noise.
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url;
    
    // Strict Filter: Only look for the MASTER playlist.
    // This file contains the different quality levels (1080p, 720p, etc.)
    // and is the root URL needed for VLC or ffmpeg.
    if (url.includes('master.m3u8')) {
      
      capturedUrls.add(url);
      
      // Keep memory footprint low
      if (capturedUrls.size > 20) {
        const first = capturedUrls.values().next().value;
        capturedUrls.delete(first);
      }
    }
  },
  {
    urls: [
      "*://*.kick.com/*", 
      "*://*.live-video.net/*"
    ]
  }
);

// 2. COMMUNICATOR
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_URLS") {
    const vods = [];
    const live = [];
    
    capturedUrls.forEach(url => {
      // This is the specific distinction the user wants:
      // stream.kick.com = Permanent / VOD Backend
      // live-video.net = Temporary / Live Edge
      if (url.includes('stream.kick.com')) {
        vods.push(url);
      } else if (url.includes('live-video.net')) {
        live.push(url);
      } else {
        // Fallback for unexpected domains
        live.push(url);
      }
    });

    sendResponse({ 
      vods: Array.from(vods).reverse(),
      live: Array.from(live).reverse() 
    });
  }
  
  if (request.action === "CLEAR_URLS") {
    capturedUrls.clear();
    sendResponse({ success: true });
  }
});