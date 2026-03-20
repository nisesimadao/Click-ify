const { exec } = require('child_process');
const path = require('path');

const SWIFT_MONITOR_PATH = path.join(__dirname, 'nowplaying_monitor.swift');

function runAppleScriptMonitor() {
    return new Promise((resolve) => {
        // AppleScript経由でメディア情報を取得
        exec(`osascript -e 'tell application "Music" to if player state is playing then artist & "\t" & name & "\t" & album & "\t" & duration & "\t" & player position & "\t" & "playing" else if player state is paused then artist & "\t" & name & "\t" & album & "\t" & duration & "\t" & player position & "\t" & "paused" else "" end if' 2>/dev/null`, (error, stdout, stderr) => {
            if (error) {
                // Musicアプリがない場合、他のアプリを試す
                exec(`osascript -e 'tell application "Spotify" to if player state is playing then artist & "\t" & name & "\t" & album & "\t" & duration & "\t" & player position & "\t" & "playing" else if player state is paused then artist & "\t" & name & "\t" & album & "\t" & duration & "\t" & player position & "\t" & "paused" else "" end if' 2>/dev/null`, (error, stdout, stderr) => {
                    if (error || -z "$stdout") {
                        console.log("No supported media player found");
                        resolve(null);
                        return;
                    }
                    parseAppleScriptOutput(stdout, resolve);
                });
                return;
            }
            parseAppleScriptOutput(stdout, resolve);
        });
    });
}

function parseAppleScriptOutput(stdout, resolve) {
    if (!stdout) {
        resolve(null);
        return;
    }

    const parts = stdout.trim().split('\t');
    if (parts.length < 2) {
        resolve(null);
        return;
    }

    const [artist, title, album, duration, position, playback_status] = parts;
    if (!artist || !title) {
        resolve(null);
        return;
    }

    const durationSeconds = duration ? parseTimeStr(duration) : 0;
    const positionSeconds = position ? parseTimeStr(position) : 0;
    const playbackStatus = playback_status === 'playing' ? 1 : 2;
    const timestamp = Date.now() / 1000;

    resolve({
        title: title || "Unknown Title",
        artist: artist || "",
        album: album || "",
        duration: durationSeconds,
        position: positionSeconds,
        playbackStatus: playbackStatus,
        artwork: null,
        artworkMIME: 'image/png',
        timestamp: timestamp
    });
}

async function controlMedia(action, value) {
    console.log(`AppleScript control attempt: action=${action}, value=${value}`);
    let script = "tell application \"Music\" to return name";

    switch (action) {
        case 'play-pause':
            script = "tell application \"Music\" to playpause";
            break;
        case 'next':
            script = "tell application \"Music\" to next track";
            break;
        case 'prev':
            script = "tell application \"Music\" to previous track";
            break;
        case 'seek':
            if (value) {
                script = `tell application \"Music\" to set player position to ${value}`;
            }
            break;
    }

    return new Promise((resolve) => {
        exec(`osascript -e '${script}'`, (error, stdout, stderr) => {
            if (error) console.error("AppleScript control error:", stderr || error);
            resolve();
        });
    });
}

process.on('message', async (message) => {
    if (message.type === 'control') {
        await controlMedia(message.action, message.value);
        const info = await runAppleScriptMonitor();
        if (info) process.send({ type: 'media-update', payload: info });
    }
});

setInterval(async () => {
    const info = await runAppleScriptMonitor();
    if (info) {
        process.send({ type: 'media-update', payload: info });
    }
}, 1000);

console.log("MacOS Media Worker (AppleScript) started.");
