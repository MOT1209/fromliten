// ==================== Global Variables ====================
let currentSurah = null;
let currentVerseIndex = 0;
let allSurahs = [];
let currentAudio = null;
let bookmarks = JSON.parse(localStorage.getItem('quranBookmarks')) || [];
let isPlaying = false;
let isRepeatEnabled = false;

// Toast Notification System
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('active'), 100);
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// ==================== DOM Elements ====================

const elements = {
    surahList: document.getElementById('surah-list'),
    versesContainer: document.getElementById('verses-container'),
    surahName: document.getElementById('surah-name'),
    surahDetails: document.getElementById('surah-details'),
    audioPlayer: document.getElementById('audio-player'),
    audioElement: document.getElementById('audio-element'),
    playPauseBtn: document.getElementById('play-pause'),
    prevVerseBtn: document.getElementById('prev-verse'),
    nextVerseBtn: document.getElementById('next-verse'),
    skipForwardBtn: document.getElementById('skip-forward'),
    skipBackBtn: document.getElementById('skip-back'),
    repeatBtn: document.getElementById('repeat-verse'),
    playbackSpeedSelect: document.getElementById('playback-speed'),
    closePlayerBtn: document.getElementById('close-player'),
    playerSurah: document.getElementById('player-surah'),
    playerVerse: document.getElementById('player-verse'),
    progressBar: document.getElementById('progress-bar'),
    currentTime: document.getElementById('current-time'),
    duration: document.getElementById('duration'),
    themeToggle: document.getElementById('theme-toggle'),
    menuToggle: document.getElementById('menu-toggle'),
    sidebar: document.getElementById('sidebar'),
    searchBtn: document.getElementById('search-btn'),
    bookmarkBtn: document.getElementById('bookmark-btn'),
    searchModal: document.getElementById('search-modal'),
    bookmarkModal: document.getElementById('bookmark-modal'),
    searchInput: document.getElementById('search-input'),
    searchResults: document.getElementById('search-results'),
    bookmarksList: document.getElementById('bookmarks-list'),
    reciterSelect: document.getElementById('reciter-select'),
    increaseFontBtn: document.getElementById('increase-font'),
    decreaseFontBtn: document.getElementById('decrease-font'),
    saveSurahBtn: document.getElementById('save-surah-main'),
    lastReadBtn: document.getElementById('last-read-btn'),
    tafsirBtn: document.getElementById('tafsir-btn'),
    tafsirModal: document.getElementById('tafsir-modal'),
    tafsirSelect: document.getElementById('tafsir-select'),
    tafsirContent: document.getElementById('tafsir-content'),
    surahSearch: document.getElementById('surah-search')
};

let currentFontSize = parseFloat(localStorage.getItem('quranFontSize')) || 2.3;

// ==================== Initialize App ====================
document.addEventListener('DOMContentLoaded', () => {
    loadSurahs();
    setupEventListeners();
    loadTheme();
});

// ==================== Load Surahs ====================
async function loadSurahs() {
    try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await response.json();
        allSurahs = data.data;
        displaySurahs(allSurahs);
    } catch (error) {
        console.error('Error loading surahs:', error);
        elements.surahList.innerHTML = '<p class="error">حدث خطأ في تحميل السور</p>';
    }
}

// ==================== Display Surahs ====================
function displaySurahs(surahs) {
    elements.surahList.innerHTML = surahs.map(surah => `
        <div class="surah-item" data-number="${surah.number}" onclick="loadSurah(${surah.number})">
            <div class="surah-number">${surah.number}</div>
            <div class="surah-info-card">
                <div class="surah-name-ar">${surah.name}</div>
                <div class="surah-meta">
                    <span class="meta-item"><i class="fas fa-globe"></i> ${surah.englishName}</span>
                    <span class="meta-item"><i class="fas fa-lines-leaning"></i> ${surah.numberOfAyahs} آية</span>
                    <span class="meta-item"><i class="fas fa-kaaba"></i> ${surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
                </div>
            </div>
            <i class="fas fa-chevron-left arrow-icon"></i>
        </div>
    `).join('');
}


// ==================== Load Surah ====================
async function loadSurah(surahNumber) {
    try {
        // Show loading
        elements.versesContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>جاري التحميل...</p></div>';

        // Fetch surah data
        const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`);
        const data = await response.json();
        currentSurah = data.data;

        // Update UI
        updateSurahHeader();
        displayVerses();
        highlightActiveSurah(surahNumber);

        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            elements.sidebar.classList.remove('active');
        }
    } catch (error) {
        console.error('Error loading surah:', error);
        elements.versesContainer.innerHTML = '<p class="error">حدث خطأ في تحميل السورة</p>';
    }
}

// ==================== Update Surah Header ====================
function updateSurahHeader() {
    elements.surahName.textContent = currentSurah.name;
    elements.surahDetails.textContent = `${currentSurah.englishName} • ${currentSurah.numberOfAyahs} آية • ${currentSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}`;

    // Update Save Button State
    const isSurahBookmarked = bookmarks.some(b => b.surah === currentSurah.number && b.type === 'surah');
    if (elements.saveSurahBtn) {
        elements.saveSurahBtn.classList.toggle('saved', isSurahBookmarked);
        elements.saveSurahBtn.innerHTML = isSurahBookmarked ? '<i class="fas fa-star" style="color: #fbbf24;"></i> تم الحفظ' : '<i class="far fa-star"></i> حفظ السورة';
        elements.saveSurahBtn.onclick = () => toggleSurahBookmark(currentSurah.number, currentSurah.name);
    }
}

// ==================== Display Verses ====================
function displayVerses() {
    // Create continuous text like a real Quran
    const versesHTML = currentSurah.ayahs.map((ayah, index) => {
        const isBookmarked = bookmarks.some(b => b.surah === currentSurah.number && b.verse === ayah.numberInSurah);

        return `<span class="verse-item ${isBookmarked ? 'bookmarked' : ''}" id="verse-${index}" data-verse-index="${index}" onclick="handleVerseClick(${index})" title="انقر للاستماع والتفسير">
            ${ayah.text}
            <span class="verse-number" onclick="event.stopPropagation(); toggleBookmark(${currentSurah.number}, ${ayah.numberInSurah}, '${ayah.text.replace(/'/g, "\\'")}', '${currentSurah.name}')" title="${isBookmarked ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}">${ayah.numberInSurah}</span>
        </span> `;
    }).join('');

    // Mushaf Page Header
    const juz = currentSurah.ayahs[0].juz;
    const pageHeader = `
        <div class="surah-header-mushaf">
            <div class="side-text">سُورَةُ ${currentSurah.name}</div>
            <div class="side-text">الجزء ${juz}</div>
        </div>
    `;

    elements.versesContainer.innerHTML = `
        <div class="verses-wrapper" style="font-size: ${currentFontSize}rem;">
            ${pageHeader}
            ${currentSurah.number !== 1 && currentSurah.number !== 9 ? '<p style="text-align: center; font-size: 2.5rem; margin-top: 1rem; margin-bottom: 2rem; color: #2c7a7b;">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>' : ''}
            <div class="mushaf-text-content">
                ${versesHTML}
            </div>
        </div>
    `;

    // Save as last read
    saveLastRead(currentSurah.number);
}

function saveLastRead(surahNumber) {
    localStorage.setItem('lastReadSurah', surahNumber);
}

// ==================== Highlight Active Surah ====================
function highlightActiveSurah(surahNumber) {
    document.querySelectorAll('.surah-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeItem = document.querySelector(`.surah-item[data-number="${surahNumber}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// ==================== Play Verse with Highlighting ====================
async function playVerse(verseIndex) {
    if (!currentSurah) return;

    currentVerseIndex = verseIndex;
    const reciter = elements.reciterSelect.value;
    const ayah = currentSurah.ayahs[verseIndex];

    try {
        // Fetch audio URL
        const response = await fetch(`https://api.alquran.cloud/v1/ayah/${ayah.number}/${reciter}`);
        const data = await response.json();

        // Set audio source
        elements.audioElement.src = data.data.audio;
        elements.audioElement.load();

        // Apply playback speed
        elements.audioElement.playbackRate = parseFloat(elements.playbackSpeedSelect.value);

        // Play audio
        await elements.audioElement.play();
        isPlaying = true;

        // Update UI
        updatePlayerUI();
        elements.audioPlayer.classList.add('active');
        elements.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';

        // ==================== HIGHLIGHT CURRENT VERSE ====================
        highlightCurrentVerse(verseIndex);

        // Scroll to verse
        const verseElement = document.getElementById(`verse-${verseIndex}`);
        if (verseElement) {
            verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

    } catch (error) {
        console.error('Error playing verse:', error);
    }
}

// ==================== Highlight Current Verse ====================
function highlightCurrentVerse(verseIndex) {
    // Remove previous highlights
    document.querySelectorAll('.verse-item').forEach(item => {
        item.classList.remove('playing');
    });

    // Add highlight to current verse
    const currentVerseElement = document.getElementById(`verse-${verseIndex}`);
    if (currentVerseElement) {
        currentVerseElement.classList.add('playing');
    }
}

// ==================== Update Player UI ====================
function updatePlayerUI() {
    const ayah = currentSurah.ayahs[currentVerseIndex];
    elements.playerSurah.textContent = currentSurah.name;
    elements.playerVerse.textContent = `الآية ${ayah.numberInSurah}`;
}

// ==================== Audio Controls ====================
elements.playPauseBtn.addEventListener('click', () => {
    if (isPlaying) {
        elements.audioElement.pause();
        elements.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        isPlaying = false;
    } else {
        elements.audioElement.play();
        elements.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        isPlaying = true;
    }
});

// Skip Forward 10s
elements.skipForwardBtn.addEventListener('click', () => {
    elements.audioElement.currentTime += 10;
});

// Skip Backward 10s
elements.skipBackBtn.addEventListener('click', () => {
    elements.audioElement.currentTime -= 10;
});

// Repeat Toggle
elements.repeatBtn.addEventListener('click', () => {
    isRepeatEnabled = !isRepeatEnabled;
    elements.repeatBtn.classList.toggle('active', isRepeatEnabled);
});

// Speed Change
elements.playbackSpeedSelect.addEventListener('change', (e) => {
    elements.audioElement.playbackRate = parseFloat(e.target.value);
});

elements.prevVerseBtn.addEventListener('click', async () => {
    if (currentVerseIndex > 0) {
        playVerse(currentVerseIndex - 1);
    } else if (currentSurah && currentSurah.number > 1) {
        await loadSurah(currentSurah.number - 1);
        playVerse(currentSurah.ayahs.length - 1);
    }
});

elements.nextVerseBtn.addEventListener('click', async () => {
    if (currentVerseIndex < currentSurah.ayahs.length - 1) {
        playVerse(currentVerseIndex + 1);
    } else if (currentSurah && currentSurah.number < 114) {
        await loadSurah(currentSurah.number + 1);
        playVerse(0);
    }
});

elements.closePlayerBtn.addEventListener('click', () => {
    elements.audioElement.pause();
    elements.audioPlayer.classList.remove('active');
    isPlaying = false;
    // Remove highlight when player is closed
    document.querySelectorAll('.verse-item').forEach(item => {
        item.classList.remove('playing');
    });
});

// Auto play next verse when current ends
elements.audioElement.addEventListener('ended', async () => {
    if (isRepeatEnabled) {
        elements.audioElement.currentTime = 0;
        elements.audioElement.play();
    } else if (currentSurah && currentVerseIndex < currentSurah.ayahs.length - 1) {
        playVerse(currentVerseIndex + 1);
    } else if (currentSurah && currentSurah.number < 114) {
        // MOVE TO NEXT SURAH
        const nextSurahNum = currentSurah.number + 1;
        await loadSurah(nextSurahNum);
        playVerse(0);
    } else {
        elements.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        isPlaying = false;
        // Remove highlight when playback ends
        document.querySelectorAll('.verse-item').forEach(item => {
            item.classList.remove('playing');
        });
    }
});

// Update progress bar
elements.audioElement.addEventListener('timeupdate', () => {
    const progress = (elements.audioElement.currentTime / elements.audioElement.duration) * 100;
    elements.progressBar.value = progress || 0;
    elements.currentTime.textContent = formatTime(elements.audioElement.currentTime);
    elements.duration.textContent = formatTime(elements.audioElement.duration);
});

// Seek functionality
elements.progressBar.addEventListener('input', (e) => {
    const time = (e.target.value / 100) * elements.audioElement.duration;
    elements.audioElement.currentTime = time;
});

// ==================== Format Time ====================
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ==================== Bookmarks Logic ====================
function toggleBookmark(surahNumber, verseNumber, verseText, surahName) {
    const existingIndex = bookmarks.findIndex(b => b.surah === surahNumber && b.verse === verseNumber && b.type === 'verse');

    if (existingIndex > -1) {
        bookmarks.splice(existingIndex, 1);
    } else {
        bookmarks.push({
            type: 'verse',
            surah: surahNumber,
            verse: verseNumber,
            text: verseText,
            surahName: surahName,
            date: new Date().getTime()
        });
    }
    saveAndRefresh();
}

function toggleSurahBookmark(surahNumber, surahName) {
    const existingIndex = bookmarks.findIndex(b => b.surah === surahNumber && b.type === 'surah');

    if (existingIndex > -1) {
        bookmarks.splice(existingIndex, 1);
    } else {
        bookmarks.push({
            type: 'surah',
            surah: surahNumber,
            surahName: surahName,
            date: new Date().getTime()
        });
    }
    saveAndRefresh();
}

function saveAndRefresh() {
    localStorage.setItem('quranBookmarks', JSON.stringify(bookmarks));
    if (currentSurah) {
        displayVerses();
        updateSurahHeader(); // Refresh header button too
    }
    displayBookmarks();
}

function displayBookmarks() {
    if (bookmarks.length === 0) {
        elements.bookmarksList.innerHTML = '<div class="empty-state"><i class="fas fa-bookmark" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.2;"></i><p>لا توجد سور أو آيات محفوظة بعد</p></div>';
        return;
    }

    // Sort: Surahs first, then verses by date
    const sorted = [...bookmarks].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'surah' ? -1 : 1;
        return b.date - a.date;
    });

    elements.bookmarksList.innerHTML = sorted.map((item, index) => {
        if (item.type === 'surah') {
            return `
                <div class="bookmark-item surah-bookmark" onclick="loadSurahFromBookmark(${item.surah})">
                    <div class="result-surah">
                        <i class="fas fa-star" style="color: var(--accent-gold);"></i>
                        سورة ${item.surahName} (كاملة)
                    </div>
                    <div class="bookmark-actions">
                        <button class="delete-bookmark" onclick="event.stopPropagation(); deleteBookmarkByIndex(${index})">
                            <i class="fas fa-trash"></i> حـذف
                        </button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="bookmark-item" onclick="loadSurahAndScroll(${item.surah}, ${item.verse})">
                    <div class="result-surah">
                        <i class="fas fa-book-open"></i>
                        سورة ${item.surahName} - الآية ${item.verse}
                    </div>
                    <div class="result-text">${item.text}</div>
                    <div class="bookmark-actions">
                        <button class="delete-bookmark" onclick="event.stopPropagation(); deleteBookmarkByIndex(${index})">
                            <i class="fas fa-trash"></i> حـذف
                        </button>
                    </div>
                </div>
            `;
        }
    }).join('');
}

async function loadSurahAndScroll(surahNumber, verseNumber) {
    await loadSurah(surahNumber);
    elements.bookmarkModal.classList.remove('active');

    // Find absolute index of verse in surah
    const verseIndex = currentSurah.ayahs.findIndex(a => a.numberInSurah === verseNumber);
    if (verseIndex > -1) {
        setTimeout(() => {
            const element = document.getElementById(`verse-${verseIndex}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('playing');
                setTimeout(() => element.classList.remove('playing'), 3000);
            }
        }, 500);
    }
}

async function loadSurahFromBookmark(surahNumber) {
    elements.bookmarkModal.classList.remove('active');
    await loadSurah(surahNumber);
}

function deleteBookmarkByIndex(index) {
    const sorted = [...bookmarks].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'surah' ? -1 : 1;
        return b.date - a.date;
    });
    const itemToDelete = sorted[index];

    // Find original index in bookmarks array
    const originalIndex = bookmarks.findIndex(b =>
        b.surah === itemToDelete.surah &&
        b.verse === itemToDelete.verse &&
        b.type === itemToDelete.type
    );

    if (originalIndex > -1) {
        bookmarks.splice(originalIndex, 1);
        saveAndRefresh();
    }
}

// ==================== Search ====================
let searchTimeout;
elements.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    if (query.length < 3) {
        elements.searchResults.innerHTML = '<p class="search-hint">ابدأ بكتابة كلمة للبحث عنها في القرآن الكريم</p>';
        return;
    }

    searchTimeout = setTimeout(() => searchQuran(query), 500);
});

async function searchQuran(query) {
    try {
        elements.searchResults.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i></div>';

        const response = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/ar`);
        const data = await response.json();

        if (data.data.matches.length === 0) {
            elements.searchResults.innerHTML = '<p class="search-hint">لم يتم العثور على نتائج</p>';
            return;
        }

        const results = data.data.matches.slice(0, 20); // Limit to 20 results
        elements.searchResults.innerHTML = results.map(match => `
            <div class="search-result-item" onclick="loadSurah(${match.surah.number})">
                <div class="result-surah">${match.surah.name} - الآية ${match.numberInSurah}</div>
                <div class="result-text">${match.text}</div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Search error:', error);
        elements.searchResults.innerHTML = '<p class="search-hint">حدث خطأ في البحث</p>';
    }
}

// ==================== Theme Toggle ====================
function loadTheme() {
    const theme = localStorage.getItem('quranTheme') || 'dark';
    if (theme === 'light') {
        document.body.classList.remove('dark-mode');
        elements.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

elements.themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    elements.themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('quranTheme', isDark ? 'dark' : 'light');
});

// ==================== Modal Controls ====================
elements.searchBtn.addEventListener('click', () => {
    elements.searchModal.classList.add('active');
});

elements.bookmarkBtn.addEventListener('click', () => {
    displayBookmarks();
    elements.bookmarkModal.classList.add('active');
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modalId = e.target.closest('button').dataset.modal;
        document.getElementById(modalId).classList.remove('active');
    });
});

// Close modal on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// ==================== Mobile/Drawer Menu ====================
elements.menuToggle.addEventListener('click', () => {
    elements.sidebar.classList.toggle('active');
});

// Close drawer when clicking outside (on the main content)
document.querySelector('.content').addEventListener('click', () => {
    if (elements.sidebar.classList.contains('active')) {
        elements.sidebar.classList.remove('active');
    }
});

// ==================== Filter Tabs ====================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const filter = e.target.dataset.filter;
        if (filter === 'all') {
            displaySurahs(allSurahs);
        } else {
            const filtered = allSurahs.filter(s =>
                s.revelationType.toLowerCase() === (filter === 'makkah' ? 'meccan' : 'medinan')
            );
            displaySurahs(filtered);
        }
    });
});

// ==================== Event Listeners Setup ====================
function setupEventListeners() {
    // Font controls
    elements.increaseFontBtn.addEventListener('click', () => {
        if (currentFontSize < 4) {
            currentFontSize += 0.2;
            applyFontSize();
        }
    });

    elements.decreaseFontBtn.addEventListener('click', () => {
        if (currentFontSize > 1.5) {
            currentFontSize -= 0.1; // Decrease by smaller increments
            applyFontSize();
        }
    });

    // Last read continue
    elements.lastReadBtn.addEventListener('click', () => {
        const lastRead = localStorage.getItem('lastReadSurah');
        if (lastRead) {
            loadSurah(lastRead);
        } else {
            alert('لا توجد قراءة سابقة محفوظة');
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ' && elements.audioPlayer.classList.contains('active')) {
            e.preventDefault();
            elements.playPauseBtn.click();
        }
        if (e.key === 'ArrowLeft' && elements.audioPlayer.classList.contains('active')) {
            elements.nextVerseBtn.click();
        }
        if (e.key === 'ArrowRight' && elements.audioPlayer.classList.contains('active')) {
            elements.prevVerseBtn.click();
        }
        if (e.key === 'm' || e.key === 'M') {
            elements.menuToggle.click();
        }
    });

    // Surah Search
    elements.surahSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allSurahs.filter(s =>
            s.name.includes(query) ||
            s.englishName.toLowerCase().includes(query) ||
            s.number.toString() === query
        );
        displaySurahs(filtered);
    });
}

function applyFontSize() {
    const wrapper = document.querySelector('.verses-wrapper');
    if (wrapper) {
        wrapper.style.fontSize = `${currentFontSize}rem`;
    }
    localStorage.setItem('quranFontSize', currentFontSize);
}

// ==================== Tafsir Logic ====================
function handleVerseClick(index) {
    playVerse(index);
    if (elements.tafsirModal.classList.contains('active')) {
        loadTafsir(index);
    }
}

async function loadTafsir(verseIndex) {
    if (!currentSurah) return;

    const ayah = currentSurah.ayahs[verseIndex];
    const edition = elements.tafsirSelect.value;

    elements.tafsirContent.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>جاري تحميل التفسير...</p></div>';

    try {
        const response = await fetch(`https://api.alquran.cloud/v1/ayah/${ayah.number}/${edition}`);
        const data = await response.json();

        elements.tafsirContent.innerHTML = `
            <div class="tafsir-header">
                <div class="tafsir-verse-text">${ayah.text}</div>
            </div>
            <div class="tafsir-text">
                ${data.data.text}
            </div>
            <div style="margin-top: 2rem; text-align: center; color: var(--text-secondary); font-size: 0.9rem;">
                المصدر: ${data.data.edition.name}
            </div>
        `;
    } catch (error) {
        console.error('Error loading tafsir:', error);
        elements.tafsirContent.innerHTML = '<p class="error">حدث خطأ في تحميل التفسير. يرجى المحاولة مرة أخرى.</p>';
    }
}

elements.tafsirBtn.addEventListener('click', () => {
    elements.tafsirModal.classList.add('active');
    loadTafsir(currentVerseIndex);
});

elements.tafsirSelect.addEventListener('change', () => {
    loadTafsir(currentVerseIndex);
});
