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
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true, // 追加
        },
        frame: false,
        transparent: true,
        resizable: false,
    });

    mainWindow.loadFile('index.html');

    // 開発ツールを開く (任意)
    // mainWindow.webContents.openDevTools({ mode: 'detach' });

    // SMTCMonitor Workerを起動
    const smtcWorker = fork(path.join(__dirname, 'smtc-worker.js'));

    smtcWorker.on('message', (message) => {
        console.log("Received message from SMTCMonitor Worker:", message); // 追加
        if (message.type === 'media-update') {
            // Workerから受け取ったメディア情報をレンダラープロセスに送信
            mainWindow.webContents.send('media-update', message.payload);
        }
    });

    smtcWorker.on('error', (error) => {
        console.error("SMTCMonitor Worker error:", error);
    });

    smtcWorker.on('exit', (code) => {
        if (code !== 0) {
            console.error(`SMTCMonitor Worker stopped with exit code ${code}`);
        }
    });

    // ウィンドウが閉じられたときにWorkerを終了
    mainWindow.on('closed', () => {
        smtcWorker.kill();
    });

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
