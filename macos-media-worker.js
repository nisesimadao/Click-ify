const { exec } = require('child_process');
const path = require('path');

const SWIFT_MONITOR_PATH = path.join(__dirname, 'nowplaying_monitor.swift');

function runSwiftMonitor() {
    return new Promise((resolve) => {
        // Use swift command but suppress warnings to stderr
        exec(`swift "${SWIFT_MONITOR_PATH}"`, (error, stdout, stderr) => {
            if (error) {
                console.error("Swift monitor execution error:", stderr || error);
                resolve(null);
                return;
            }

            const fullOutput = stdout.trim();
            const startIdx = fullOutput.indexOf('JSON_START');
            const endIdx = fullOutput.indexOf('JSON_END');

            if (startIdx === -1 || endIdx === -1) {
                resolve(null);
                return;
            }

            const output = fullOutput.substring(startIdx + 10, endIdx).trim();
            try {
                const data = JSON.parse(output);
                if (!data.title && !data.artist) {
                    resolve(null);
                    return;
                }
                resolve({
                    title: data.title || "Unknown Title",
                    artist: data.artist || "",
                    album: data.album || "",
                    duration: data.duration || 0,
                    position: data.elapsedTime || 0,
                    playbackStatus: data.playbackState === 1 ? 1 : 2, // 1: Playing, 2: Paused
                    artwork: data.artworkBase64 ? Buffer.from(data.artworkBase64, 'base64') : null,
                    artworkMIME: data.artworkMIME || 'image/png',
                    timestamp: data.timestamp || Date.now() / 1000
                });
            } catch (e) {
                console.error("Parse error in Worker:", e.message, "Output was:", output.substring(0, 100) + "...");
                resolve(null);
            }
        });
    });
}

async function controlMedia(action, value) {
    console.log(`Native control attempt: action=${action}, value=${value}`);
    let arg = action;
    if (action === 'seek') arg = `seek ${value}`;

    return new Promise((resolve) => {
        exec(`swift "${SWIFT_MONITOR_PATH}" ${arg}`, (error, stdout, stderr) => {
            if (error) console.error("Native control error:", stderr || error);
            resolve();
        });
    });
}

process.on('message', async (message) => {
    if (message.type === 'control') {
        await controlMedia(message.action, message.value);
        const info = await runSwiftMonitor();
        if (info) process.send({ type: 'media-update', payload: info });
    }
});

setInterval(async () => {
    const info = await runSwiftMonitor();
    if (info) {
        process.send({ type: 'media-update', payload: info });
    }
}, 1000);

console.log("MacOS Media Worker (Pure Native Script) started.");
