// APIs
const BOSE_API = '/.netlify/functions/bose';
const SPOTIFY_API = '/.netlify/functions/spotify';
const QUEUE_API = '/.netlify/functions/queue';

// State
let isPlaying = false;
let currentVolume = 50;
let speakerName = 'Bose';
let spotifyToken = localStorage.getItem('spotify_token');
let spotifyRefreshToken = localStorage.getItem('spotify_refresh_token');
let tokenExpiry = localStorage.getItem('spotify_token_expiry');
let currentUser = null;
let searchTimeout;
let queueEntriesCache = [];

// Elements
const albumArt = document.getElementById('albumArt');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const trackSource = document.getElementById('trackSource');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const deviceIndicator = document.getElementById('deviceIndicator');
const deviceName = document.getElementById('deviceName');
const powerBtn = document.getElementById('powerBtn');
const toast = document.getElementById('toast');
const spotifyLogin = document.getElementById('spotifyLogin');
const spotifyLoginBtn = document.getElementById('spotifyLoginBtn');
const spotifyInterface = document.getElementById('spotifyInterface');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const queueList = document.getElementById('queueList');
const queueCount = document.getElementById('queueCount');
const emptyQueue = document.getElementById('emptyQueue');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');

// ===== BOSE CONTROLS =====
async function sendBoseCommand(command) {
    try {
        const url = `${BOSE_API}?action=command&speaker=${encodeURIComponent(speakerName)}&cmd=${encodeURIComponent(command)}`;
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        showToast('Error de conexión');
        return null;
    }
}

async function getBoseState() {
    try {
        const response = await fetch(`${BOSE_API}?action=state`);
        const data = await response.json();
        deviceIndicator.classList.remove('offline');
        return data;
    } catch (error) {
        deviceIndicator.classList.add('offline');
        return null;
    }
}

async function updateNowPlaying() {
    const homeState = await getBoseState();
    
    if (homeState?.currentState?.speakers) {
        const speakers = homeState.currentState.speakers;
        const speakerKey = Object.keys(speakers)[0];
        
        if (speakerKey) {
            const speaker = speakers[speakerKey];
            speakerName = speaker.name || 'Bose';
            deviceName.textContent = speakerName;

            if (speaker.currentVolume) {
                currentVolume = parseInt(speaker.currentVolume);
                volumeSlider.value = currentVolume;
                volumeValue.textContent = `${currentVolume}%`;
            }

            if (speaker.nowPlaying) {
                const np = speaker.nowPlaying;
                const source = np.source || np.$?.source || 'UNKNOWN';

                isPlaying = np.playStatus === 'PLAY_STATE';
                updatePlayPauseButton();

                if (source === 'STANDBY' || source === 'INVALID_SOURCE') {
                    trackTitle.textContent = 'Bose SoundTouch';
                    trackArtist.textContent = 'Sin reproducir';
                    trackSource.textContent = '—';
                    albumArt.classList.remove('playing');
                    resetAlbumArt();
                } else {
                    trackTitle.textContent = np.track || np.stationName || 'Reproduciendo';
                    trackArtist.textContent = np.artist || np.description || formatSource(source);
                    trackSource.textContent = formatSource(source);
                    
                    albumArt.classList.toggle('playing', isPlaying);

                    const artUrl = np.art?.$t || np.art?.link || np.art?._ || np.art;
                    if (artUrl && typeof artUrl === 'string' && artUrl.startsWith('http')) {
                        albumArt.innerHTML = `<img src="${artUrl}" alt="Album Art" onerror="resetAlbumArt()">`;
                    } else {
                        resetAlbumArt();
                    }
                }
            }
        }
    }
}

function resetAlbumArt() {
    albumArt.innerHTML = `<svg class="speaker-icon" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6zm-2 16c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>`;
}

function updatePlayPauseButton() {
    playIcon.style.display = isPlaying ? 'none' : 'block';
    pauseIcon.style.display = isPlaying ? 'block' : 'none';
}

function formatSource(source) {
    const sources = { 
        'SPOTIFY': 'Spotify', 
        'BLUETOOTH': 'Bluetooth', 
        'AUX': 'AUX', 
        'TUNEIN': 'TuneIn',
        'AIRPLAY': 'AirPlay',
        'DEEZER': 'Deezer',
        'AMAZON': 'Amazon Music'
    };
    return sources[source] || source;
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// Player event listeners
playPauseBtn.addEventListener('click', async () => {
    await sendBoseCommand(isPlaying ? '/key/pause' : '/key/play');
    showToast(isPlaying ? 'Pausado' : 'Reproduciendo');
    isPlaying = !isPlaying;
    updatePlayPauseButton();
});

prevBtn.addEventListener('click', async () => {
    await sendBoseCommand('/key/prev_track');
    showToast('Anterior');
    setTimeout(updateNowPlaying, 1000);
});

nextBtn.addEventListener('click', async () => {
    await sendBoseCommand('/key/next_track');
    showToast('Siguiente');
    setTimeout(updateNowPlaying, 1000);
});

let volumeTimeout;
volumeSlider.addEventListener('input', (e) => {
    volumeValue.textContent = `${e.target.value}%`;
    clearTimeout(volumeTimeout);
    volumeTimeout = setTimeout(() => sendBoseCommand(`/volume/${e.target.value}`), 300);
});

powerBtn.addEventListener('click', async () => {
    await sendBoseCommand('/key/power');
    showToast('Apagando...');
    setTimeout(updateNowPlaying, 1500);
});

// ===== SPOTIFY FUNCTIONS =====
async function checkSpotifyToken() {
    if (!spotifyToken) return false;
    
    if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
        if (spotifyRefreshToken) {
            await refreshSpotifyToken();
        } else {
            return false;
        }
    }
    return !!spotifyToken;
}

async function refreshSpotifyToken() {
    try {
        const response = await fetch(`${SPOTIFY_API}?action=refresh&refresh_token=${spotifyRefreshToken}`);
        const data = await response.json();
        
        if (data.access_token) {
            spotifyToken = data.access_token;
            localStorage.setItem('spotify_token', spotifyToken);
            localStorage.setItem('spotify_token_expiry', Date.now() + (data.expires_in * 1000));
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
    }
}

async function getSpotifyUser() {
    try {
        const response = await fetch(`${SPOTIFY_API}?action=me`, {
            headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        return null;
    }
}

spotifyLoginBtn.addEventListener('click', async () => {
    const response = await fetch(`${SPOTIFY_API}?action=auth-url`);
    const data = await response.json();
    window.location.href = data.url;
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    spotifyToken = null;
    spotifyRefreshToken = null;
    currentUser = null;
    spotifyLogin.style.display = 'flex';
    spotifyInterface.style.display = 'none';
    showToast('Sesión cerrada');
});

async function handleSpotifyCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        const response = await fetch(`${SPOTIFY_API}?action=token&code=${code}`);
        const data = await response.json();
        
        if (data.access_token) {
            spotifyToken = data.access_token;
            spotifyRefreshToken = data.refresh_token;
            localStorage.setItem('spotify_token', spotifyToken);
            localStorage.setItem('spotify_refresh_token', spotifyRefreshToken);
            localStorage.setItem('spotify_token_expiry', Date.now() + (data.expires_in * 1000));
            
            window.history.replaceState({}, document.title, window.location.pathname);
            await showSpotifyInterface();
            showToast('Conectado a Spotify');
        }
    }
}

async function showSpotifyInterface() {
    spotifyLogin.style.display = 'none';
    spotifyInterface.style.display = 'flex';

    // Get user info
    currentUser = await getSpotifyUser();
    if (currentUser) {
        userName.textContent = currentUser.display_name || 'Usuario';
        if (currentUser.images?.[0]?.url) {
            userAvatar.src = currentUser.images[0].url;
            userAvatar.style.display = 'block';
        } else {
            userAvatar.style.display = 'none';
        }
    }

    // Load queue entries from database
    await loadQueueEntries();
    loadQueue();
}

// ===== DATABASE FUNCTIONS =====
async function loadQueueEntries() {
    try {
        const response = await fetch(`${QUEUE_API}?action=get-recent`);
        const data = await response.json();
        queueEntriesCache = data || [];
    } catch (error) {
        console.error('Error loading queue entries:', error);
        queueEntriesCache = [];
    }
}

async function saveQueueEntry(trackUri, trackName, trackArtist, trackImage, addedBy) {
    try {
        const response = await fetch(`${QUEUE_API}?action=add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                trackUri,
                trackName,
                trackArtist,
                trackImage,
                addedBy
            })
        });
        const data = await response.json();
        
        if (data.success) {
            // Update local cache
            queueEntriesCache.push({
                track_uri: trackUri,
                added_by: addedBy,
                added_at: new Date().toISOString()
            });
        }
        
        return data.success;
    } catch (error) {
        console.error('Error saving queue entry:', error);
        return false;
    }
}

function findAddedBy(uri) {
    const entry = queueEntriesCache.find(e => e.track_uri === uri);
    return entry?.added_by || null;
}

// ===== SEARCH =====
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        searchResults.innerHTML = '';
        return;
    }

    searchTimeout = setTimeout(() => searchSpotify(query), 300);
});

async function searchSpotify(query) {
    if (!await checkSpotifyToken()) {
        showToast('Sesión expirada');
        spotifyLogin.style.display = 'flex';
        spotifyInterface.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`${SPOTIFY_API}?action=search&q=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });
        const data = await response.json();

        if (data.tracks?.items) {
            renderSearchResults(data.tracks.items);
        }
    } catch (error) {
        showToast('Error en búsqueda');
    }
}

function renderSearchResults(tracks) {
    searchResults.innerHTML = tracks.slice(0, 8).map(track => `
        <div class="track-item" data-uri="${track.uri}">
            <img src="${track.album.images[2]?.url || track.album.images[0]?.url}" alt="">
            <div class="track-item-info">
                <div class="track-item-title">${escapeHtml(track.name)}</div>
                <div class="track-item-artist">${escapeHtml(track.artists.map(a => a.name).join(', '))}</div>
            </div>
            <button class="add-queue-btn" onclick="addToQueue('${track.uri}', '${escapeHtml(track.name)}', '${escapeHtml(track.artists[0].name)}', '${track.album.images[2]?.url || track.album.images[0]?.url}', this)">
                <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            </button>
        </div>
    `).join('');
}

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}

// ===== QUEUE =====
async function addToQueue(uri, name, artist, image, btn) {
    if (!await checkSpotifyToken()) {
        showToast('Sesión expirada');
        return;
    }

    try {
        // Add to Spotify queue
        const response = await fetch(`${SPOTIFY_API}?action=queue&uri=${encodeURIComponent(uri)}`, {
            headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });
        const data = await response.json();

        if (data.success) {
            btn.classList.add('added');
            btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
            
            // Save to database
            const addedBy = currentUser?.display_name || 'Anónimo';
            await saveQueueEntry(uri, name, artist, image, addedBy);
            
            showToast(`"${name}" añadido`);
            loadQueue();
        } else {
            showToast('Error: ¿Está Spotify activo?');
        }
    } catch (error) {
        showToast('Error al añadir');
    }
}

async function loadQueue() {
    if (!await checkSpotifyToken()) return;

    try {
        const response = await fetch(`${SPOTIFY_API}?action=get-queue`, {
            headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });
        const data = await response.json();

        let totalTracks = 0;
        let html = '';

        if (data.currently_playing) {
            const track = data.currently_playing;
            const addedByInfo = findAddedBy(track.uri);
            html += `
                <div class="queue-item now-playing">
                    <img src="${track.album?.images[2]?.url || track.album?.images[0]?.url || ''}" alt="">
                    <div class="queue-item-info">
                        <div class="now-playing-badge">▶ Reproduciendo</div>
                        <div class="queue-item-title">${escapeHtml(track.name)}</div>
                        <div class="queue-item-artist">${escapeHtml(track.artists?.map(a => a.name).join(', '))}</div>
                        ${addedByInfo ? `<div class="queue-item-added-by">Añadido por ${escapeHtml(addedByInfo)}</div>` : ''}
                    </div>
                </div>
            `;
            totalTracks++;
        }

        if (data.queue?.length) {
            data.queue.forEach(track => {
                const addedByInfo = findAddedBy(track.uri);
                html += `
                    <div class="queue-item">
                        <img src="${track.album?.images[2]?.url || track.album?.images[0]?.url || ''}" alt="">
                        <div class="queue-item-info">
                            <div class="queue-item-title">${escapeHtml(track.name)}</div>
                            <div class="queue-item-artist">${escapeHtml(track.artists?.map(a => a.name).join(', '))}</div>
                            ${addedByInfo ? `<div class="queue-item-added-by">Añadido por ${escapeHtml(addedByInfo)}</div>` : ''}
                        </div>
                    </div>
                `;
                totalTracks++;
            });
        }

        if (totalTracks > 0) {
            emptyQueue.style.display = 'none';
            queueList.innerHTML = html;
            queueCount.textContent = `${totalTracks} ${totalTracks === 1 ? 'canción' : 'canciones'}`;
        } else {
            emptyQueue.style.display = 'flex';
            queueList.innerHTML = '';
            queueList.appendChild(emptyQueue);
            queueCount.textContent = '0 canciones';
        }
    } catch (error) {
        console.error('Error loading queue:', error);
    }
}

// ===== INITIALIZE =====
async function init() {
    await updateNowPlaying();
    setInterval(updateNowPlaying, 5000);

    // Check for Spotify callback
    await handleSpotifyCallback();

    // Check if already logged in
    if (await checkSpotifyToken()) {
        await showSpotifyInterface();
    }

    // Refresh queue and entries every 10 seconds
    setInterval(async () => {
        if (spotifyToken) {
            await loadQueueEntries();
            loadQueue();
        }
    }, 10000);
}

// Start app
init();
