const { ipcRenderer } = require('electron');

let globalRenderMenu = null;
let globalIsMenuOpen = false;
let lastTrackTitle = "";

// メインプロセスからメディア情報を受信したときにUIを更新
ipcRenderer.on('media-update', (event, mediaInfo) => {
    console.log("Received media-update from main process:", mediaInfo); // 追加
    updateMetadata(document, mediaInfo);
});

document.addEventListener('DOMContentLoaded', () => {
    initIpodControls(document);

    // ウィンドウコントロールボタンのイベントリスナー
    const minimizeBtn = document.getElementById('minimize-btn');
    const closeBtn = document.getElementById('close-btn');

    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
            ipcRenderer.send('minimize-window');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            ipcRenderer.send('close-window');
        });
    }

    // 初回起動時にダミーデータでupdateMetadataを呼び出す代わりに、
    // メインプロセスからの情報受信を待つか、初期状態を設定する
    updateMetadata(document, null); // 初期状態としてnullを渡す
});

function initIpodControls(doc) {
    const centerBtn = doc.getElementById('ipod-center-btn');
    const menuBtn = doc.getElementById('btn-menu');
    const nextBtn = doc.querySelector('.label-next');
    const prevBtn = doc.querySelector('.label-prev');
    const playBtnLabel = doc.querySelector('.label-play');

    const lyricsView = doc.getElementById('ipod-lyrics-view');
    const coverContainer = doc.getElementById('ipod-cover-container');
    const lyricsHeader = doc.getElementById('ipod-lyrics-header-bar');
    const screen = doc.querySelector('.ipod-screen');
    const chassis = doc.getElementById('ipod-chassis');
    
    const menuView = doc.getElementById('ipod-menu-view');
    const menuList = doc.getElementById('ipod-menu-list');

    let menuIndex = 0;
    let currentTheme = 0;
    const themes = ['', 'theme-black', 'theme-u2'];
    const themeNames = ['Silver', 'Black', 'U2 (Black & Red)'];

    // --- 特定のWebサイトのDOMに依存する関数は一旦無効化またはプレースホルダー ---
    function findVolumeSlider() {
        console.warn("findVolumeSlider is not implemented for native app yet.");
        return null;
    }

    function findControlBtn(testId, labelKeywords) {
        console.warn("findControlBtn is not implemented for native app yet.");
        return null;
    }

    function getShuffleState() {
        return 'Unknown'; // プレースホルダー
    }

    function getRepeatState() {
        return 'Unknown'; // プレースホルダー
    }
    // --- ここまで ---

    globalRenderMenu = function() {
        menuList.innerHTML = '';
        const menuItems = [
            { label: 'Now Playing', action: 'close' },
            { label: `Shuffle: ${getShuffleState()}`, action: 'toggle_shuffle' },
            { label: `Repeat: ${getRepeatState()}`, action: 'toggle_repeat' },
            { label: `Theme: ${themeNames[currentTheme]}`, action: 'cycle_theme' }
        ];

        menuItems.forEach((item, index) => {
            const li = doc.createElement('li');
            li.className = 'ipod-menu-item';
            if (index === menuIndex) li.classList.add('selected');
            
            li.innerHTML = `<span>${item.label}</span><span class="ipod-menu-arrow">&gt;</span>`;
            li.onclick = () => {
                menuIndex = index;
                globalRenderMenu();
                executeMenu(menuItems[index].action);
            };
            menuList.appendChild(li);
        });
        return menuItems;
    };

    function executeMenu(action) {
        if (action === 'close') {
            toggleMenu();
        } else if (action === 'toggle_shuffle') {
            console.log("Toggle Shuffle (not implemented for native app yet)");
            // ネイティブAPI経由でシャッフルを切り替えるロジックを後で追加
        } else if (action === 'toggle_repeat') {
            console.log("Toggle Repeat (not implemented for native app yet)");
            // ネイティブAPI経由でリピートを切り替えるロジックを後で追加
        } else if (action === 'cycle_theme') {
            currentTheme = (currentTheme + 1) % themes.length;
            chassis.className = 'ipod-chassis ' + themes[currentTheme];
            globalRenderMenu();
        }
    }

    function toggleMenu() {
        if (globalIsMenuOpen) {
            menuView.style.display = 'none';
            globalIsMenuOpen = false;
        } else {
            menuView.style.display = 'flex';
            globalIsMenuOpen = true;
            globalRenderMenu();
        }
    }

    menuBtn.onclick = (e) => { e.stopPropagation(); toggleMenu(); };

    centerBtn.onclick = (e) => {
        e.stopPropagation();
        if (globalIsMenuOpen) {
            const items = globalRenderMenu();
            executeMenu(items[menuIndex].action);
        } else {
            if (getComputedStyle(lyricsView).display === 'none') {
                lyricsView.style.display = 'flex';
                coverContainer.style.visibility = 'hidden';
                if (lyricsHeader) lyricsHeader.style.display = 'flex';
                if (screen) screen.classList.add('lyrics-active');
            } else {
                lyricsView.style.display = 'none';
                coverContainer.style.visibility = 'visible';
                if (lyricsHeader) lyricsHeader.style.display = 'none';
                if (screen) screen.classList.remove('lyrics-active');
            }
        }
    };

    const togglePlay = (e) => {
        e.stopPropagation();
        console.log("Toggle Play/Pause (not implemented for native app yet)");
        // ネイティブAPI経由で再生/一時停止を切り替えるロジックを後で追加
    };

    const nextTrack = (e) => {
        e.stopPropagation();
        console.log("Next Track (not implemented for native app yet)");
        // ネイティブAPI経由で次のトラックを再生するロジックを後で追加
    };
    const prevTrack = (e) => {
        e.stopPropagation();
        console.log("Previous Track (not implemented for native app yet)");
        // ネイティブAPI経由で前のトラックを再生するロジックを後で追加
    };

    if (playBtnLabel) playBtnLabel.onclick = togglePlay;
    if (nextBtn) nextBtn.onclick = nextTrack;
    if (prevBtn) prevTrack.onclick = prevTrack;

    const wheel = doc.getElementById('ipod-wheel');
    if (wheel) {
        wheel.addEventListener('wheel', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const delta = Math.sign(e.deltaY); 
            
            if (globalIsMenuOpen) {
                const currentItems = globalRenderMenu();
                if (delta > 0) { 
                    if (menuIndex < currentItems.length - 1) menuIndex++;
                } else { 
                    if (menuIndex > 0) menuIndex--;
                }
                globalRenderMenu();
            } else {
                console.log("Volume control via wheel (not implemented for native app yet)");
                // ネイティブAPI経由で音量を調整するロジックを後で追加
            }
        });
    }
}

function parseTimeStr(str) {
    if (!str) return 0;
    const parts = str.split(':');
    if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    if (parts.length === 3) return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    return 0;
}

function updateMetadata(doc, mediaInfo) { // mediaInfo引数を追加
    if (globalIsMenuOpen && globalRenderMenu) {
        globalRenderMenu();
    }

    const titleEl = doc.getElementById('ipod-title');
    const artistEl = doc.getElementById('ipod-artist');
    const albumEl = doc.getElementById('ipod-album');
    const coverImg = doc.getElementById('ipod-cover-img');
    const coverPlaceholder = doc.querySelector('.ipod-cover-placeholder');
    const lyricsHeaderTitle = doc.getElementById('ipod-lyrics-header-title');
    const lyricsHeaderArtist = doc.getElementById('ipod-lyrics-header-artist');
    const lyricsBg = doc.getElementById('ipod-lyrics-bg');

    let currentTitle = "Not Playing";
    let currentArtist = "";
    let currentAlbum = "";
    let artworkSrc = "";
    let currentPosition = 0;
    let totalDuration = 0;

    if (mediaInfo) {
        currentTitle = mediaInfo.title || "Unknown Title";
        currentArtist = mediaInfo.artist || "Unknown Artist";
        currentAlbum = mediaInfo.album || "";
        
        // mediaInfo.artwork が { type: 'Buffer', data: [Array] } の形式で渡されるため、Bufferを再構築
        if (mediaInfo.artwork && mediaInfo.artwork.type === 'Buffer' && Array.isArray(mediaInfo.artwork.data)) {
            const artworkBuffer = Buffer.from(mediaInfo.artwork.data);
            artworkSrc = `data:image/png;base64,${artworkBuffer.toString('base64')}`;
        } else {
            artworkSrc = "";
        }
        currentPosition = mediaInfo.position || 0;
        totalDuration = mediaInfo.duration || 0;
    }

    if (lastTrackTitle !== currentTitle) {
        lastTrackTitle = currentTitle;
        const lyricsContent = doc.getElementById('ipod-lyrics-content');
        if (lyricsContent) lyricsContent.innerHTML = '<div style="margin-top: 50%; color: rgba(255,255,255,0.5);">Loading...</div>';
        const lyricsView = doc.getElementById('ipod-lyrics-view');
        if (lyricsView) lyricsView.setAttribute('data-signature', '');
    }

    if (titleEl) titleEl.textContent = currentTitle;
    if (artistEl) artistEl.textContent = currentArtist;
    if (albumEl) albumEl.textContent = currentAlbum;
    if (lyricsHeaderTitle) lyricsHeaderTitle.textContent = currentTitle;
    if (lyricsHeaderArtist) lyricsHeaderArtist.textContent = currentArtist;

    if (artworkSrc) {
        console.log("Renderer: artworkSrc generated:", artworkSrc.substring(0, 100) + "..."); // 長いので一部のみ
        if (coverImg.src !== artworkSrc) {
            coverImg.src = artworkSrc;
            coverImg.style.display = 'block';
            if (coverPlaceholder) coverPlaceholder.style.display = 'none';
            if (lyricsBg) lyricsBg.style.backgroundImage = `url('${artworkSrc}')`;
            console.log("Renderer: coverImg.src updated to:", coverImg.src.substring(0, 100) + "...");
        } else {
            console.log("Renderer: coverImg.src is already up-to-date.");
        }
    } else {
        console.log("Renderer: artworkSrc is empty.");
        coverImg.style.display = 'none';
        if (coverPlaceholder) coverPlaceholder.style.display = 'flex';
        if (lyricsBg) lyricsBg.style.backgroundImage = 'none';
    }

    const lyricsView = doc.getElementById('ipod-lyrics-view');
    const lyricsContent = doc.getElementById('ipod-lyrics-content');
    if (lyricsView && getComputedStyle(lyricsView).display !== 'none' && lyricsContent) {
        // 歌詞表示ロジックは、後でネイティブAPIから歌詞を取得するように修正
        // 現時点ではダミー
        const validLines = []; 
        if (validLines.length > 0) {
            // ... 既存の歌詞表示ロジック ...
        }
    }

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    let currentStr = formatTime(currentPosition);
    let totalStr = formatTime(totalDuration);
    let progressPercent = (totalDuration > 0) ? (currentPosition / totalDuration) * 100 : 0;

    const timeCurrentEl = doc.getElementById('ipod-time-current');
    const timeTotalEl = doc.getElementById('ipod-time-total');
    const scrubberFill = doc.getElementById('ipod-scrubber-fill');
    if (timeCurrentEl) timeCurrentEl.textContent = currentStr;
    if (timeTotalEl) timeTotalEl.textContent = totalStr;
    if (scrubberFill) scrubberFill.style.width = `${progressPercent}%`;

    const timeDisplay = doc.getElementById('ipod-time-display');
    if (timeDisplay) {
        const now = new Date();
        timeDisplay.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // requestAnimationFrameは不要。メディア情報が更新されたときにのみUIを更新する
    // requestAnimationFrame(() => updateMetadata(doc));
}