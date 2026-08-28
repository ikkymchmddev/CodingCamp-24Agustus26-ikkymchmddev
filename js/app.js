/**
 * ==========================================================================
 * TO-DO LIST LIFE DASHBOARD - APP.JS
 * Vanilla JavaScript (ES6+) Implementation
 * Features: Clock & Dynamic Greeting, Custom Name, Pomodoro Timer with Audio,
 * Interactive To-Do List (Duplicate Prevention & Sorting), Quick Links, Dark Mode.
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ==========================================================================
     1. GLOBAL STATE MANAGEMENT
     ========================================================================== */
  const state = {
    // User Profile
    username: localStorage.getItem('lifedash_username') || 'Pengguna',
    theme: localStorage.getItem('lifedash_theme') || 'dark',

    // Pomodoro Timer State
    pomodoro: {
      totalSeconds: 25 * 60,
      remainingSeconds: 25 * 60,
      isRunning: false,
      timerId: null,
      completedSessions: parseInt(localStorage.getItem('lifedash_pomodoro_sessions') || '0', 10)
    },

    // To-Do List State
    todos: JSON.parse(localStorage.getItem('lifedash_todos') || '[]'),
    filter: 'all',      // 'all' | 'active' | 'completed'
    sort: 'newest',     // 'newest' | 'oldest' | 'alpha-asc' | 'alpha-desc'
    searchQuery: '',

    // Quick Links State
    links: JSON.parse(localStorage.getItem('lifedash_links') || 'null') || [
      { id: '1', title: 'Google', url: 'https://google.com' },
      { id: '2', title: 'GitHub', url: 'https://github.com' },
      { id: '3', title: 'YouTube', url: 'https://youtube.com' },
      { id: '4', title: 'RevoU', url: 'https://revou.co' }
    ]
  };

  /* ==========================================================================
     2. DOM ELEMENTS SELECTION
     ========================================================================== */
  const elements = {
    // Header & Clock
    digitalClock: document.getElementById('digitalClock'),
    currentDate: document.getElementById('currentDate'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),

    // Hero Section
    timeGreeting: document.getElementById('timeGreeting'),
    userNameDisplay: document.getElementById('userNameDisplay'),
    editNameBtn: document.getElementById('editNameBtn'),
    heroPendingCount: document.getElementById('heroPendingCount'),
    heroPomodoroSessions: document.getElementById('heroPomodoroSessions'),

    // Pomodoro Timer
    pomodoroTimerDisplay: document.getElementById('pomodoroTimerDisplay'),
    pomodoroProgressCircle: document.getElementById('pomodoroProgressCircle'),
    pomodoroStatusBadge: document.getElementById('pomodoroStatusBadge'),
    startPauseTimerBtn: document.getElementById('startPauseTimerBtn'),
    stopTimerBtn: document.getElementById('stopTimerBtn'),
    resetTimerBtn: document.getElementById('resetTimerBtn'),
    presetBtns: document.querySelectorAll('.preset-btn:not(.custom-preset-btn)'),
    customTimerBtn: document.getElementById('customTimerBtn'),
    customTimerRow: document.getElementById('customTimerRow'),
    customMinutesInput: document.getElementById('customMinutesInput'),
    applyCustomTimerBtn: document.getElementById('applyCustomTimerBtn'),
    pomodoroCard: document.querySelector('.pomodoro-card'),

    // Quick Links
    quickLinksGrid: document.getElementById('quickLinksGrid'),
    openAddLinkModalBtn: document.getElementById('openAddLinkModalBtn'),

    // To-Do List
    addTaskForm: document.getElementById('addTaskForm'),
    taskTitleInput: document.getElementById('taskTitleInput'),
    taskInputError: document.getElementById('taskInputError'),
    todoSearchInput: document.getElementById('todoSearchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    filterTabs: document.querySelectorAll('.filter-tab'),
    todoSortSelect: document.getElementById('todoSortSelect'),
    todoList: document.getElementById('todoList'),
    emptyState: document.getElementById('emptyState'),
    emptyStateTitle: document.getElementById('emptyStateTitle'),
    emptyStateDesc: document.getElementById('emptyStateDesc'),
    taskCounterText: document.getElementById('taskCounterText'),
    todoProgressBar: document.getElementById('todoProgressBar'),
    activeCountText: document.getElementById('activeCountText'),
    clearCompletedBtn: document.getElementById('clearCompletedBtn'),

    // Modals
    nameModal: document.getElementById('nameModal'),
    nameForm: document.getElementById('nameForm'),
    nameInput: document.getElementById('nameInput'),
    closeNameModalBtn: document.getElementById('closeNameModalBtn'),
    cancelNameBtn: document.getElementById('cancelNameBtn'),

    addLinkModal: document.getElementById('addLinkModal'),
    addLinkForm: document.getElementById('addLinkForm'),
    linkTitleInput: document.getElementById('linkTitleInput'),
    linkUrlInput: document.getElementById('linkUrlInput'),
    closeLinkModalBtn: document.getElementById('closeLinkModalBtn'),
    cancelLinkBtn: document.getElementById('cancelLinkBtn'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
  };

  /* ==========================================================================
     3. UTILITY FUNCTIONS
     ========================================================================== */
  
  /** Escape HTML string to prevent XSS attacks when rendering user input */
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  /** Show toast notifications */
  function showToast(message, type = 'warning') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '⚠️';
    if (type === 'success') icon = '✅';
    if (type === 'danger') icon = '❌';

    toast.innerHTML = `<span>${icon}</span> <span>${escapeHTML(message)}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /** Synthesize pleasant audio chime for Pomodoro timer completion using Web Audio API */
  function playChimeSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      // Friendly two-tone chime (E5 -> A5)
      playTone(659.25, now, 0.4);
      playTone(880.00, now + 0.3, 0.6);
    } catch (e) {
      console.log('Audio playback not permitted or supported:', e);
    }
  }

  /* ==========================================================================
     4. HEADER & DYNAMIC GREETING LOGIC
     ========================================================================== */
  
  /** Apply Theme (Dark / Light) */
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lifedash_theme', theme);
  }

  /** Update Digital Clock and Greeting every second */
  function updateClockAndGreeting() {
    const now = new Date();
    
    // Format Clock: HH:MM:SS
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    elements.digitalClock.textContent = `${hours}:${minutes}:${seconds}`;

    // Format Date in Indonesian Locale: e.g. "Senin, 28 Agustus 2026"
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elements.currentDate.textContent = now.toLocaleDateString('id-ID', options);

    // Dynamic Greeting based on time of day
    const currentHour = now.getHours();
    let greeting = 'Selamat Datang';

    if (currentHour >= 0 && currentHour < 11) {
      greeting = 'Selamat Pagi 🌅';
    } else if (currentHour >= 11 && currentHour < 15) {
      greeting = 'Selamat Siang ☀️';
    } else if (currentHour >= 15 && currentHour < 18) {
      greeting = 'Selamat Sore 🌇';
    } else {
      greeting = 'Selamat Malam 🌙';
    }

    elements.timeGreeting.textContent = greeting;
  }

  /** User Name Management */
  function updateUserNameDisplay() {
    elements.userNameDisplay.textContent = state.username;
    localStorage.setItem('lifedash_username', state.username);
  }

  function openNameModal() {
    elements.nameInput.value = state.username;
    elements.nameModal.classList.remove('hidden');
    elements.nameInput.focus();
  }

  function closeNameModal() {
    elements.nameModal.classList.add('hidden');
  }

  /* ==========================================================================
     5. FOCUS TIMER / POMODORO LOGIC
     ========================================================================== */
  const CIRCLE_RADIUS = 95;
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS; // ~596.9

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function updatePomodoroUI() {
    // Update Timer text
    elements.pomodoroTimerDisplay.textContent = formatTime(state.pomodoro.remainingSeconds);

    // Update Circular SVG Progress
    const progress = state.pomodoro.remainingSeconds / state.pomodoro.totalSeconds;
    const offset = CIRCLE_CIRCUMFERENCE * (1 - progress);
    elements.pomodoroProgressCircle.style.strokeDashoffset = offset;

    // Update Button State & Status Badge
    if (state.pomodoro.isRunning) {
      elements.startPauseTimerBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1"/>
          <rect x="14" y="4" width="4" height="16" rx="1"/>
        </svg>
        <span>Jeda</span>
      `;
      elements.pomodoroStatusBadge.textContent = 'Fokus Berlangsung';
      elements.pomodoroStatusBadge.className = 'badge badge-active';
      elements.stopTimerBtn.disabled = false;
    } else {
      elements.startPauseTimerBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        <span>Mulai Fokus</span>
      `;
      elements.stopTimerBtn.disabled = state.pomodoro.remainingSeconds === state.pomodoro.totalSeconds;

      if (state.pomodoro.remainingSeconds === 0) {
        elements.pomodoroStatusBadge.textContent = 'Sesi Selesai!';
        elements.pomodoroStatusBadge.className = 'badge badge-completed';
      } else {
        elements.pomodoroStatusBadge.textContent = 'Siap Fokus';
        elements.pomodoroStatusBadge.className = 'badge badge-ready';
      }
    }

    // Hero stat update
    elements.heroPomodoroSessions.textContent = state.pomodoro.completedSessions;
  }

  function startTimer() {
    if (state.pomodoro.isRunning) return;
    
    state.pomodoro.isRunning = true;
    elements.pomodoroCard.classList.remove('finished');

    state.pomodoro.timerId = setInterval(() => {
      if (state.pomodoro.remainingSeconds > 0) {
        state.pomodoro.remainingSeconds--;
        updatePomodoroUI();
      } else {
        // Timer Finished!
        onTimerComplete();
      }
    }, 1000);

    updatePomodoroUI();
  }

  function pauseTimer() {
    state.pomodoro.isRunning = false;
    clearInterval(state.pomodoro.timerId);
    state.pomodoro.timerId = null;
    updatePomodoroUI();
  }

  function stopTimer() {
    pauseTimer();
    state.pomodoro.remainingSeconds = state.pomodoro.totalSeconds;
    elements.pomodoroCard.classList.remove('finished');
    updatePomodoroUI();
  }

  function resetTimer() {
    stopTimer();
  }

  function setPomodoroDuration(minutes) {
    stopTimer();
    state.pomodoro.totalSeconds = minutes * 60;
    state.pomodoro.remainingSeconds = minutes * 60;
    updatePomodoroUI();
  }

  function onTimerComplete() {
    pauseTimer();
    elements.pomodoroCard.classList.add('finished');
    
    // Play chime sound & increment stats
    playChimeSound();
    state.pomodoro.completedSessions++;
    localStorage.setItem('lifedash_pomodoro_sessions', state.pomodoro.completedSessions);
    
    showToast('🎉 Waktu Fokus Selesai! Istirahat sejenak untuk menyegarkan pikiran.', 'success');
    updatePomodoroUI();
  }

  /* ==========================================================================
     6. INTERACTIVE TO-DO LIST LOGIC
     ========================================================================== */
  
  function saveTodos() {
    localStorage.setItem('lifedash_todos', JSON.stringify(state.todos));
    renderTodos();
  }

  /** Prevent Duplicate Task Name Check (Case-Insensitive) */
  function isDuplicateTask(title, currentId = null) {
    const cleanTitle = title.trim().toLowerCase();
    return state.todos.some(todo => todo.id !== currentId && todo.text.trim().toLowerCase() === cleanTitle);
  }

  /** Add New Task */
  function handleAddTask(e) {
    e.preventDefault();
    const inputVal = elements.taskTitleInput.value.trim();
    
    // Clear previous error
    elements.taskInputError.textContent = '';
    elements.taskInputError.classList.add('hidden');

    // Validation 1: Empty input check
    if (!inputVal) {
      elements.taskInputError.textContent = '⚠️ Nama tugas tidak boleh kosong!';
      elements.taskInputError.classList.remove('hidden');
      return;
    }

    // Validation 2: Duplicate task check
    if (isDuplicateTask(inputVal)) {
      elements.taskInputError.textContent = '⚠️ Tugas ini sudah ada di dalam daftar Anda!';
      elements.taskInputError.classList.remove('hidden');
      showToast('Gagal menambahkan: Duplikasi nama tugas ditemukan!', 'warning');
      return;
    }

    // Create Task Object
    const newTask = {
      id: Date.now().toString(),
      text: inputVal,
      completed: false,
      createdAt: Date.now()
    };

    state.todos.unshift(newTask); // Add to top
    saveTodos();

    elements.taskTitleInput.value = '';
    showToast('Tugas baru berhasil ditambahkan! 🚀', 'success');
  }

  /** Toggle Task Completion */
  function toggleTaskCompletion(id) {
    state.todos = state.todos.map(todo => {
      if (todo.id === id) {
        return { ...todo, completed: !todo.completed };
      }
      return todo;
    });
    saveTodos();
  }

  /** Delete Task */
  function deleteTask(id) {
    state.todos = state.todos.filter(todo => todo.id !== id);
    saveTodos();
    showToast('Tugas berhasil dihapus.', 'danger');
  }

  /** Inline Edit Task Title */
  function enableInlineEdit(todo, textElement, containerElement) {
    const currentText = todo.text;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-edit-input';
    input.value = currentText;

    textElement.replaceWith(input);
    input.focus();

    const saveEdit = () => {
      const newText = input.value.trim();
      
      if (!newText) {
        showToast('Nama tugas tidak boleh kosong!', 'warning');
        renderTodos();
        return;
      }

      if (isDuplicateTask(newText, todo.id)) {
        showToast('Nama tugas sudah digunakan oleh tugas lain!', 'warning');
        renderTodos();
        return;
      }

      todo.text = newText;
      saveTodos();
      showToast('Tugas berhasil diperbarui!', 'success');
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveEdit();
      } else if (e.key === 'Escape') {
        renderTodos();
      }
    });

    input.addEventListener('blur', () => {
      saveEdit();
    });
  }

  /** Filter & Sort Tasks */
  function getFilteredAndSortedTodos() {
    let filtered = [...state.todos];

    // Filter by Status Tab
    if (state.filter === 'active') {
      filtered = filtered.filter(t => !t.completed);
    } else if (state.filter === 'completed') {
      filtered = filtered.filter(t => t.completed);
    }

    // Filter by Search Query
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.text.toLowerCase().includes(q));
    }

    // Sorting Options
    switch (state.sort) {
      case 'newest':
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'alpha-asc':
        filtered.sort((a, b) => a.text.localeCompare(b.text));
        break;
      case 'alpha-desc':
        filtered.sort((a, b) => b.text.localeCompare(a.text));
        break;
    }

    return filtered;
  }

  /** Render To-Do List UI */
  function renderTodos() {
    const filteredTodos = getFilteredAndSortedTodos();
    elements.todoList.innerHTML = '';

    // Calculate Task Statistics
    const totalCount = state.todos.length;
    const completedCount = state.todos.filter(t => t.completed).length;
    const activeCount = totalCount - completedCount;
    const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    // Update Progress Bar & Counter Labels
    elements.todoProgressBar.style.width = `${percent}%`;
    elements.taskCounterText.textContent = `${completedCount} dari ${totalCount} selesai (${percent}%)`;
    elements.activeCountText.textContent = `${activeCount} tugas tersisa`;
    elements.heroPendingCount.textContent = activeCount;
    elements.clearCompletedBtn.disabled = completedCount === 0;

    // Render Empty State if no tasks match
    if (filteredTodos.length === 0) {
      elements.emptyState.classList.remove('hidden');
      if (state.searchQuery) {
        elements.emptyStateTitle.textContent = 'Pencarian tidak ditemukan';
        elements.emptyStateDesc.textContent = `Tidak ada tugas yang cocok dengan "${state.searchQuery}".`;
      } else if (state.filter === 'completed') {
        elements.emptyStateTitle.textContent = 'Belum ada tugas selesai';
        elements.emptyStateDesc.textContent = 'Selesaikan beberapa tugas untuk melihatnya di sini!';
      } else if (state.filter === 'active') {
        elements.emptyStateTitle.textContent = 'Tidak ada tugas aktif';
        elements.emptyStateDesc.textContent = 'Semua tugasmu telah selesai. Kerja bagus!';
      } else {
        elements.emptyStateTitle.textContent = 'Belum ada tugas';
        elements.emptyStateDesc.textContent = 'Tambahkan tugas baru untuk mulai mengorganisir harimu!';
      }
    } else {
      elements.emptyState.classList.add('hidden');
    }

    // Render Task Items
    filteredTodos.forEach(todo => {
      const li = document.createElement('li');
      li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
      
      const createdDateStr = new Date(todo.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });

      li.innerHTML = `
        <div class="todo-item-left">
          <input 
            type="checkbox" 
            class="custom-checkbox" 
            ${todo.completed ? 'checked' : ''} 
            aria-label="Tandai tugas selesai"
          >
          <div class="todo-text-wrapper">
            <span class="todo-text">${escapeHTML(todo.text)}</span>
            <span class="todo-meta">Dibuat: ${createdDateStr}</span>
          </div>
        </div>
        <div class="todo-item-actions">
          <button class="btn-icon edit-btn" title="Edit Tugas" aria-label="Edit Tugas">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              <path d="m15 5 4 4"/>
            </svg>
          </button>
          <button class="btn-icon delete-btn btn-danger-text" title="Hapus Tugas" aria-label="Hapus Tugas">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      `;

      // Checkbox Event
      const checkbox = li.querySelector('.custom-checkbox');
      checkbox.addEventListener('change', () => toggleTaskCompletion(todo.id));

      // Edit Event
      const editBtn = li.querySelector('.edit-btn');
      const textSpan = li.querySelector('.todo-text');
      const textWrapper = li.querySelector('.todo-text-wrapper');

      editBtn.addEventListener('click', () => enableInlineEdit(todo, textSpan, textWrapper));
      textSpan.addEventListener('dblclick', () => enableInlineEdit(todo, textSpan, textWrapper));

      // Delete Event
      const deleteBtn = li.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => deleteTask(todo.id));

      elements.todoList.appendChild(li);
    });
  }

  /* ==========================================================================
     7. QUICK LINKS / BOOKMARKS LOGIC
     ========================================================================== */
  
  function saveQuickLinks() {
    localStorage.setItem('lifedash_links', JSON.stringify(state.links));
    renderQuickLinks();
  }

  function renderQuickLinks() {
    elements.quickLinksGrid.innerHTML = '';

    state.links.forEach(link => {
      const card = document.createElement('a');
      card.href = link.url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.className = 'link-card';
      
      const firstLetter = (link.title[0] || 'W').toUpperCase();

      card.innerHTML = `
        <button class="delete-link-btn" title="Hapus Pintasan" aria-label="Hapus Pintasan">&times;</button>
        <div class="link-avatar">${firstLetter}</div>
        <span class="link-title" title="${escapeHTML(link.title)}">${escapeHTML(link.title)}</span>
      `;

      // Delete link card event
      const deleteBtn = card.querySelector('.delete-link-btn');
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        state.links = state.links.filter(l => l.id !== link.id);
        saveQuickLinks();
        showToast('Pintasan link dihapus.', 'danger');
      });

      elements.quickLinksGrid.appendChild(card);
    });
  }

  function handleAddQuickLink(e) {
    e.preventDefault();
    const title = elements.linkTitleInput.value.trim();
    let url = elements.linkUrlInput.value.trim();

    if (!title || !url) {
      showToast('Nama dan URL Website wajib diisi!', 'warning');
      return;
    }

    // Auto prepend http/https if missing
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    const newLink = {
      id: Date.now().toString(),
      title,
      url
    };

    state.links.push(newLink);
    saveQuickLinks();

    elements.linkTitleInput.value = '';
    elements.linkUrlInput.value = '';
    closeLinkModal();
    showToast('Pintasan link baru berhasil ditambahkan!', 'success');
  }

  function openLinkModal() {
    elements.addLinkModal.classList.remove('hidden');
    elements.linkTitleInput.focus();
  }

  function closeLinkModal() {
    elements.addLinkModal.classList.add('hidden');
  }

  /* ==========================================================================
     8. EVENT LISTENERS SETUP
     ========================================================================== */
  function setupEventListeners() {
    // Theme Toggle
    elements.themeToggleBtn.addEventListener('click', () => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
    });

    // User Name Edit Modal
    elements.editNameBtn.addEventListener('click', openNameModal);
    elements.userNameDisplay.addEventListener('click', openNameModal);
    elements.closeNameModalBtn.addEventListener('click', closeNameModal);
    elements.cancelNameBtn.addEventListener('click', closeNameModal);
    elements.nameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = elements.nameInput.value.trim();
      if (val) {
        state.username = val;
        updateUserNameDisplay();
        closeNameModal();
        showToast('Nama panggilan berhasil disimpan!', 'success');
      }
    });

    // Pomodoro Timer Controls
    elements.startPauseTimerBtn.addEventListener('click', () => {
      if (state.pomodoro.isRunning) {
        pauseTimer();
      } else {
        startTimer();
      }
    });

    elements.stopTimerBtn.addEventListener('click', stopTimer);
    elements.resetTimerBtn.addEventListener('click', resetTimer);

    // Preset Buttons
    elements.presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.presetBtns.forEach(b => b.classList.remove('active'));
        elements.customTimerBtn.classList.remove('active');
        elements.customTimerRow.classList.add('hidden');

        btn.classList.add('active');
        const mins = parseInt(btn.getAttribute('data-minutes'), 10);
        setPomodoroDuration(mins);
      });
    });

    // Custom Timer Button & Input
    elements.customTimerBtn.addEventListener('click', () => {
      elements.presetBtns.forEach(b => b.classList.remove('active'));
      elements.customTimerBtn.classList.add('active');
      elements.customTimerRow.classList.remove('hidden');
      elements.customMinutesInput.focus();
    });

    elements.applyCustomTimerBtn.addEventListener('click', () => {
      const val = parseInt(elements.customMinutesInput.value, 10);
      if (isNaN(val) || val < 1 || val > 180) {
        showToast('Masukkan durasi antara 1 hingga 180 menit!', 'warning');
        return;
      }
      setPomodoroDuration(val);
      showToast(`Timer diatur ke ${val} menit.`, 'success');
    });

    // To-Do List Add Task Form
    elements.addTaskForm.addEventListener('submit', handleAddTask);

    // To-Do Search Input
    elements.todoSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (state.searchQuery) {
        elements.clearSearchBtn.classList.remove('hidden');
      } else {
        elements.clearSearchBtn.classList.add('hidden');
      }
      renderTodos();
    });

    elements.clearSearchBtn.addEventListener('click', () => {
      elements.todoSearchInput.value = '';
      state.searchQuery = '';
      elements.clearSearchBtn.classList.add('hidden');
      renderTodos();
    });

    // To-Do Filter Tabs
    elements.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        elements.filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.filter = tab.getAttribute('data-filter');
        renderTodos();
      });
    });

    // To-Do Sort Dropdown
    elements.todoSortSelect.addEventListener('change', (e) => {
      state.sort = e.target.value;
      renderTodos();
    });

    // Clear Completed Tasks
    elements.clearCompletedBtn.addEventListener('click', () => {
      state.todos = state.todos.filter(t => !t.completed);
      saveTodos();
      showToast('Semua tugas selesai telah dibersihkan.', 'success');
    });

    // Quick Links Modal & Form
    elements.openAddLinkModalBtn.addEventListener('click', openLinkModal);
    elements.closeLinkModalBtn.addEventListener('click', closeLinkModal);
    elements.cancelLinkBtn.addEventListener('click', closeLinkModal);
    elements.addLinkForm.addEventListener('submit', handleAddQuickLink);

    // Close modals when clicking overlay
    window.addEventListener('click', (e) => {
      if (e.target === elements.nameModal) closeNameModal();
      if (e.target === elements.addLinkModal) closeLinkModal();
    });
  }

  /* ==========================================================================
     9. INITIALIZATION
     ========================================================================== */
  function init() {
    applyTheme(state.theme);
    updateUserNameDisplay();
    updateClockAndGreeting();
    setInterval(updateClockAndGreeting, 1000);

    updatePomodoroUI();
    renderTodos();
    renderQuickLinks();

    setupEventListeners();
  }

  // Launch App
  init();
});
