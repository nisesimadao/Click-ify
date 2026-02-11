const { SMTCMonitor } = require('@coooookies/windows-smtc-monitor');

const monitor = new SMTCMonitor();

monitor.on('update', (sessions) => {
    const currentSession = sessions[0];
    if (currentSession) {
        console.log("SMTCMonitor Worker: currentSession.media.thumbnail type:", typeof currentSession.media.thumbnail);
        if (currentSession.media.thumbnail instanceof Buffer) {
            console.log("SMTCMonitor Worker: currentSession.media.thumbnail is Buffer, length:", currentSession.media.thumbnail.length);
        } else {
            console.log("SMTCMonitor Worker: currentSession.media.thumbnail value:", currentSession.media.thumbnail);
        }
        process.send({
            type: 'media-update',
            payload: {
                title: currentSession.media.title,
                artist: currentSession.media.artist,
                album: currentSession.media.album,
                artwork: currentSession.media.thumbnail,
                playbackStatus: currentSession.playback.status,
                position: currentSession.playback.position,
                duration: currentSession.playback.duration,
            }
        });
    } else {
        process.send({ type: 'media-update', payload: null });
    }
});

// Workerスレッドをアクティブに保つため、定期的にgetMediaSessionsを呼び出す
// これにより、updateイベントがトリガーされる可能性も確認
setInterval(() => {
    // SMTCMonitor.getMediaSessions() は静的メソッドなので、クラス名で呼び出す
    // ただし、updateイベントが発火するかは不明。
    // もしイベントが発火しない場合、ここで直接メディア情報を取得してpostMessageする
    try {
        const sessions = SMTCMonitor.getMediaSessions();
        console.log("SMTCMonitor.getMediaSessions() returned:", sessions);
        const currentSession = sessions[0];
        if (currentSession) {
            console.log("SMTCMonitor Worker (setInterval): currentSession.media.thumbnail type:", typeof currentSession.media.thumbnail);
            if (currentSession.media.thumbnail instanceof Buffer) {
                console.log("SMTCMonitor Worker (setInterval): currentSession.media.thumbnail is Buffer, length:", currentSession.media.thumbnail.length);
            } else {
                console.log("SMTCMonitor Worker (setInterval): currentSession.media.thumbnail value:", currentSession.media.thumbnail);
            }
            process.send({
                type: 'media-update',
                payload: {
                    title: currentSession.media.title,
                    artist: currentSession.media.artist,
                    album: currentSession.media.album,
                    artwork: currentSession.media.thumbnail,
                    playbackStatus: currentSession.playback.status,
                    position: currentSession.playback.position,
                    duration: currentSession.playback.duration,
                }
            });
        } else {
            process.send({ type: 'media-update', payload: null });
        }
    } catch (error) {
        console.error("Error in SMTCMonitor.getMediaSessions:", error);
    }
}, 1000); // 1秒ごとにポーリング

// Workerが終了する際にモニターを停止 (もしstop()メソッドがあれば)
process.on('exit', () => {
    // monitor.stop(); // stop()メソッドの有無が不明なため、コメントアウトのまま
});

console.log("SMTCMonitor Worker started.");