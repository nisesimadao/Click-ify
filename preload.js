const { contextBridge, ipcRenderer } = require('electron');

// セキュリティ対策: 必要最小限のAPIのみを公開
contextBridge.exposeInMainWorld('electronAPI', {
    // メディア情報取得
    getMediaInfo: () => ipcRenderer.invoke('get-media-info'),

    // メディア制御
    playPause: () => ipcRenderer.invoke('media-control', 'play-pause'),
    nextTrack: () => ipcRenderer.invoke('media-control', 'next'),
    prevTrack: () => ipcRenderer.invoke('media-control', 'prev'),
    seek: (position) => ipcRenderer.invoke('media-control', 'seek', position),

    // UI制御
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    closeWindow: () => ipcRenderer.invoke('close-window'),

    // 設定取得
    getSettings: () => ipcRenderer.invoke('get-settings'),

    // イベントリスナー
    onMediaUpdate: (callback) => ipcRenderer.on('media-update', callback),
    removeMediaUpdateListener: (callback) => ipcRenderer.removeListener('media-update', callback),

    // エラー処理
    getLastError: () => ipcRenderer.invoke('get-last-error'),
});

// セキュリティ: 危険なAPIを無効化
Object.freeze(contextBridge.exposeInMainWorld('electron', undefined));
Object.freeze(contextBridge.exposeInMainWorld('require', undefined));
Object.freeze(contextBridge.exposeInMainWorld('process', undefined));