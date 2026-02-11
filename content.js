let ipodPiPWindow = null;
let ipodContainer = null;
let globalRenderMenu = null;
let globalIsMenuOpen = false;

const IPOD_HTML_INNER = `
    <div class="ipod-chassis" id="ipod-chassis">
        <div class="ipod-screen-frame">
            <div class="ipod-screen">
                <div class="ipod-screen-glass"></div>
                
                <div class="ipod-header">
                    <span id="ipod-time-display">12:00 PM</span>
                    <div class="ipod-battery-icon">
                        <div class="ipod-battery-level"></div>
                    </div>
                </div>
                
                <div id="ipod-menu-view" class="ipod-menu-overlay">
                    <div class="ipod-menu-title">iPod</div>
                    <ul id="ipod-menu-list" class="ipod-menu-list"></ul>
                </div>

                <div id="ipod-lyrics-header-bar" class="ipod-lyrics-header-bar">
                    <div id="ipod-lyrics-header-title" class="ipod-lyrics-header-title">Title</div>
                    <div id="ipod-lyrics-header-artist" class="ipod-lyrics-header-artist">Artist</div>
                </div>

                <div class="ipod-content-split">
                    <div id="ipod-lyrics-view" class="ipod-lyrics-overlay">
                        <div id="ipod-lyrics-bg" class="ipod-lyrics-bg"></div>
                        <div id="ipod-lyrics-content" class="ipod-lyrics-content">
                            <div style="margin-top: 50%; color: rgba(255,255,255,0.5);">Waiting for Lyrics...</div>
                        </div>
                    </div>

                    <div class="ipod-cover-art-large" id="ipod-cover-container">
                        <div class="ipod-cover-placeholder">
                            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/></svg>
                        </div>
                        <img id="ipod-cover-img" src="" style="display:none;">
                    </div>
                    <div class="ipod-info-side">
                        <div class="ipod-track-info">
                            <div class="ipod-text-title" id="ipod-title">Not Playing</div>
                            <div class="ipod-text-artist" id="ipod-artist"></div>
                            <div class="ipod-text-album" id="ipod-album"></div>
                        </div>
                    </div>
                </div>
                
                <div class="ipod-progress-area">
                    <div class="ipod-scrubber-bar" id="ipod-scrubber">
                        <div class="ipod-scrubber-fill" id="ipod-scrubber-fill" style="width: 0%"></div>
                    </div>
                    <div class="ipod-time-labels">
                        <span id="ipod-time-current">0:00</span>
                        <span id="ipod-time-total">-:--</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="ipod-wheel-area">
            <div class="ipod-click-wheel" id="ipod-wheel">
                <div class="wheel-label label-menu" id="btn-menu">MENU</div>
                <div class="wheel-label label-next"><svg class="wheel-icon" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></div>
                <div class="wheel-label label-prev"><svg class="wheel-icon" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></div>
                <div class="wheel-label label-play">
                        <svg class="wheel-icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        <svg class="wheel-icon" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </div>
                <div class="ipod-center-btn" id="ipod-center-btn"></div>
            </div>
        </div>
    </div>
`;

function injectStartButton() {
    if (document.getElementById('start-ipod-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'start-ipod-btn';
    btn.innerText = 'iPod Mode';
    btn.style.position = 'fixed';
    btn.style.bottom = '90px';
    btn.style.right = '20px';
    btn.style.zIndex = '9999';
    btn.style.padding = '10px 20px';
    btn.style.borderRadius = '20px';
    btn.style.backgroundColor = '#666';
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.fontWeight = 'bold';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
    btn.onclick = startIpodMode;
    document.body.appendChild(btn);
}

async function startIpodMode() {
    if (!('documentPictureInPicture' in window)) {
        alert("Document Picture-in-Picture API is not supported.");
        return;
    }
    const container = document.createElement('div');
    container.id = 'ipod-pip-container';
    container.innerHTML = IPOD_HTML_INNER;

    const styleSheetUrl = chrome.runtime.getURL('ipod_pip_styles.css');
    const cssResponse = await fetch(styleSheetUrl);
    const cssText = await cssResponse.text();
    const styleTag = document.createElement('style');
    styleTag.textContent = cssText;

    try {
        ipodPiPWindow = await documentPictureInPicture.requestWindow({ width: 320, height: 520 });
        ipodPiPWindow.document.body.classList.add('ipod-pip-body');
        ipodPiPWindow.document.head.appendChild(styleTag);
        ipodPiPWindow.document.body.appendChild(container);

        initIpodControls(ipodPiPWindow.document);
        // Only trigger initial empty update to clear defaults
        ipcRenderer.send('media-control', 'request-update');

        ipodPiPWindow.addEventListener('pagehide', () => {
            ipodPiPWindow = null;
            globalRenderMenu = null;
            globalIsMenuOpen = false;
        });
    } catch (err) {
        console.error("Failed to open PIP window:", err);
    }
}

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

    globalRenderMenu = function () {
        menuList.innerHTML = '';
        const menuItems = [
            { label: 'Now Playing', action: 'close' },
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
        ipcRenderer.send('media-control', 'play-pause');
    };

    const nextTrack = (e) => {
        e.stopPropagation();
        ipcRenderer.send('media-control', 'next');
    };
    const prevTrack = (e) => {
        e.stopPropagation();
        ipcRenderer.send('media-control', 'prev');
    };

    if (playBtnLabel) playBtnLabel.onclick = togglePlay;
    if (nextBtn) nextBtn.onclick = nextTrack;
    if (prevBtn) prevBtn.onclick = prevTrack;

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
                ipcRenderer.send('media-control', delta > 0 ? 'volume-down' : 'volume-up');
            }
        });
    }
}

setInterval(injectStartButton, 2000);
