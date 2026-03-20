const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process'); // forkをインポート

// const { SMTCMonitor } = require('@coooookies/windows-smtc-monitor'); // SMTCMonitorはWorker内で使用するため、ここでは不要

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 320,
        height: 520,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
        },
        frame: false,
        transparent: true,
        resizable: false,
    });

    mainWindow.loadFile('index.html');

    // 開発ツールを開く (任意)
    // mainWindow.webContents.openDevTools({ mode: 'detach' });

    // プラットフォーム固有のWorkerを起動
    let mediaWorker;
    if (process.platform === 'win32') {
        mediaWorker = fork(path.join(__dirname, 'smtc-worker.js'));
    } else if (process.platform === 'darwin') {
        mediaWorker = fork(path.join(__dirname, 'macos-media-worker.js'));
    } else if (process.platform === 'linux') {
        mediaWorker = fork(path.join(__dirname, 'linux-media-worker.js'));
    }

    if (mediaWorker) {
        mediaWorker.on('message', (message) => {
            console.log("Received message from Media Worker:", message);
            if (message.type === 'media-update') {
                mainWindow.webContents.send('media-update', message.payload);
            }
        });

        mediaWorker.on('error', (error) => {
            console.error("Media Worker error:", error);
        });

        mediaWorker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`Media Worker stopped with exit code ${code}`);
            }
        });

        // 終了時にWorkerをクリーンアップ
        mainWindow.on('closed', () => {
            mediaWorker.kill();
        });

        // メディア操作のIPCイベント
        ipcMain.on('media-control', (event, action) => {
            if (mediaWorker) {
                mediaWorker.send({ type: 'control', action });
            }
        });
    }

    // レンダラープロセスからのIPCイベントを処理
    ipcMain.on('minimize-window', () => {
        mainWindow.minimize();
    });

    ipcMain.on('close-window', () => {
        mainWindow.close();
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
