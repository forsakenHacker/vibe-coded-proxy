document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('url-input');
    const goBtn = document.getElementById('go-btn');
    const browserFrame = document.getElementById('browser-frame');
    const loadingBar = document.getElementById('loading-bar');
    const welcomeOverlay = document.getElementById('welcome-overlay');
    const refreshBtn = document.getElementById('refresh-btn');
    const homeBtn = document.getElementById('home-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const quickLinks = document.querySelectorAll('.quick-link');
    const tabsContainer = document.querySelector('.tabs-container');
    const addTabBtn = document.querySelector('.add-tab');
    const gamesPortal = document.getElementById('games-portal');
    const gamesGrid = document.querySelector('.games-grid');

    const PROXY_URL = '/proxy?url=';

    const games = [
        { name: 'Pac-Man', type: 'classic', icon: 'fas fa-ghost', url: 'https://macek.github.io/google_pacman/', desc: 'The original arcade legend.' },
        { name: 'Snake', type: 'classic', icon: 'fas fa-worm', url: 'https://www.google.com/logos/2010/pacman10-i.html', desc: 'Classic Nokia-style snake.' },
        { name: 'Tetris', type: 'classic', icon: 'fas fa-shapes', url: 'https://tetris.com/play-tetris', desc: 'Stack the blocks.' },
        { name: '2048', type: 'modern', icon: 'fas fa-th', url: 'https://play2048.co/', desc: 'Join the numbers to get to 2048!' },
        { name: 'Hextris', type: 'modern', icon: 'fas fa-hexagon', url: 'https://hextris.io/', desc: 'Fast-paced puzzle game.' },
        { name: 'Doodle Jump', type: 'modern', icon: 'fas fa-arrow-up', url: 'https://doodlejump.io/', desc: 'Jump as high as you can.' }
    ];

    // --- Persistence Logic ---
    function saveState() {
        const tabs = [];
        document.querySelectorAll('.tab:not(.add-tab)').forEach(tab => {
            tabs.push({
                title: tab.querySelector('span').textContent,
                url: tab.dataset.url || '',
                active: tab.classList.contains('active')
            });
        });
        localStorage.setItem('nexus_tabs', JSON.stringify(tabs));
    }

    function loadState() {
        const savedTabs = JSON.parse(localStorage.getItem('nexus_tabs'));
        if (savedTabs && savedTabs.length > 0) {
            // Clear existing tab (except add button)
            document.querySelectorAll('.tab').forEach(t => t.remove());
            
            savedTabs.forEach(tabData => {
                const tab = createTabElement(tabData.title, tabData.url);
                if (tabData.active) {
                    setActiveTab(tab);
                    if (tabData.url) navigateTo(tabData.url, false);
                }
            });
        }
    }

    // --- Core Navigation ---
    function navigateTo(url, updateHistory = true) {
        if (!url) return;
        
        let targetUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            targetUrl = 'https://' + url;
        }

        welcomeOverlay.classList.add('hidden');
        gamesPortal.classList.add('hidden');
        browserFrame.classList.remove('hidden');
        loadingBar.style.width = '30%';
        
        urlInput.value = targetUrl;
        
        // Detect environment for proxy availability
        const isStaticGitHub = window.location.hostname.includes('github.io');
        const isLocalFile = window.location.protocol === 'file:';
        
        if (isStaticGitHub || isLocalFile) {
            browserFrame.src = targetUrl;
        } else {
            const proxiedUrl = PROXY_URL + encodeURIComponent(targetUrl);
            browserFrame.src = proxiedUrl;
        }

        // Update active tab data
        const activeTab = document.querySelector('.tab.active');
        if (activeTab) {
            activeTab.dataset.url = targetUrl;
            try {
                const domain = new URL(targetUrl).hostname;
                activeTab.querySelector('span').textContent = domain;
            } catch(e) {
                activeTab.querySelector('span').textContent = targetUrl;
            }
        }

        if (updateHistory) saveState();
    }

    // --- Tab Management ---
    function createTabElement(title = 'New Tab', url = '') {
        const newTab = document.createElement('div');
        newTab.className = 'tab';
        newTab.dataset.url = url;
        newTab.innerHTML = `
            <i class="fas fa-globe"></i>
            <span>${title}</span>
            <i class="fas fa-times close-tab"></i>
        `;
        tabsContainer.insertBefore(newTab, addTabBtn);
        return newTab;
    }

    function setActiveTab(tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        if (tab.dataset.url) {
            urlInput.value = tab.dataset.url;
            welcomeOverlay.classList.add('hidden');
            
            const isStaticGitHub = window.location.hostname.includes('github.io');
            const isLocalFile = window.location.protocol === 'file:';
            
            const finalUrl = (isStaticGitHub || isLocalFile) ? tab.dataset.url : PROXY_URL + encodeURIComponent(tab.dataset.url);
            
            if (browserFrame.src !== finalUrl) {
                browserFrame.src = finalUrl;
            }
        } else {
            urlInput.value = '';
            welcomeOverlay.classList.remove('hidden');
            browserFrame.src = 'about:blank';
        }
        saveState();
    }

    // --- UI Handlers ---
    homeBtn.addEventListener('click', () => {
        welcomeOverlay.classList.remove('hidden');
        gamesPortal.classList.add('hidden');
        browserFrame.src = 'about:blank';
        urlInput.value = '';
        const activeTab = document.querySelector('.tab.active');
        if (activeTab) {
            activeTab.dataset.url = '';
            activeTab.querySelector('span').textContent = 'New Tab';
        }
        saveState();
    });

    fullscreenBtn.addEventListener('click', () => {
        const viewport = document.querySelector('.viewport-container');
        if (!document.fullscreenElement) {
            viewport.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    addTabBtn.addEventListener('click', () => {
        const tab = createTabElement();
        setActiveTab(tab);
    });

    tabsContainer.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab');
        if (!tab) return;

        if (e.target.classList.contains('close-tab')) {
            const wasActive = tab.classList.contains('active');
            tab.remove();
            if (wasActive) {
                const remainingTabs = document.querySelectorAll('.tab');
                if (remainingTabs.length > 0) {
                    setActiveTab(remainingTabs[remainingTabs.length - 1]);
                }
            }
            saveState();
        } else {
            setActiveTab(tab);
        }
    });

    // --- Initialization ---
    function initGames() {
        gamesGrid.innerHTML = '';
        games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = `
                <div class="game-tag tag-${game.type}">${game.type}</div>
                <div class="game-icon"><i class="${game.icon}"></i></div>
                <h3>${game.name}</h3>
                <p>${game.desc}</p>
            `;
            card.addEventListener('click', () => {
                navigateTo(game.url);
                showView('browser');
            });
            gamesGrid.appendChild(card);
        });
    }

    function showView(view) {
        if (view === 'games') {
            gamesPortal.classList.remove('hidden');
            browserFrame.classList.add('hidden');
            welcomeOverlay.classList.add('hidden');
            initGames();
        } else {
            gamesPortal.classList.add('hidden');
            browserFrame.classList.remove('hidden');
        }
    }

    // Sidebar View Switching
    const sidebarNavItems = document.querySelectorAll('.sidebar nav li');
    sidebarNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-view');
            if (view) {
                sidebarNavItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                showView(view);
            }
        });
    });

    // Address Bar & Controls
    goBtn.addEventListener('click', () => navigateTo(urlInput.value));
    urlInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') navigateTo(urlInput.value); });
    refreshBtn.addEventListener('click', () => {
        const currentSrc = browserFrame.src;
        browserFrame.src = '';
        setTimeout(() => browserFrame.src = currentSrc, 50);
    });

    quickLinks.forEach(link => {
        link.addEventListener('click', () => navigateTo(link.getAttribute('data-url')));
    });

    browserFrame.addEventListener('load', () => {
        loadingBar.style.width = '100%';
        setTimeout(() => loadingBar.style.width = '0%', 300);
    });

    // Start
    loadState();
});
