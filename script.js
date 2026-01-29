// State Management
const state = {
    entries: [],
    currentSession: null, // { startTime, date }
    userName: '',
    timerInterval: null
};

// DOM Elements
const elements = {
    currentTime: document.getElementById('current-time'),
    currentDate: document.getElementById('current-date'),
    userNameInput: document.getElementById('user-name'),
    btnClockIn: document.getElementById('btn-clock-in'),
    btnClockOut: document.getElementById('btn-clock-out'),
    statusBadge: document.getElementById('status-badge'),
    statusIndicator: document.getElementById('status-indicator'),
    elapsedTime: document.getElementById('elapsed-time'),
    todayList: document.getElementById('today-list'),
    todayTotal: document.getElementById('today-total'),
    historyTableBody: document.getElementById('history-table-body'),
    historyEmptyState: document.getElementById('history-empty-state'),
    btnExport: document.getElementById('btn-export'),
    btnClear: document.getElementById('btn-clear'),
    btnToggleManual: document.getElementById('btn-toggle-manual'),
    btnCancelManual: document.getElementById('btn-cancel-manual'),
    manualEntryForm: document.getElementById('manual-entry-form'),
    formManual: document.getElementById('form-manual'),
    manualDate: document.getElementById('manual-date'),
    manualStart: document.getElementById('manual-start'),
    manualEnd: document.getElementById('manual-end')
};

// Initialization
function init() {
    loadState();
    updateClock();
    setInterval(updateClock, 1000);
    renderApp();
    setupEventListeners();
    
    // Set default date for manual entry to today
    elements.manualDate.valueAsDate = new Date();
}

// Data Persistence
function saveState() {
    localStorage.setItem('timeTracker_entries', JSON.stringify(state.entries));
    localStorage.setItem('timeTracker_currentSession', JSON.stringify(state.currentSession));
    localStorage.setItem('timeTracker_userName', state.userName);
}

function loadState() {
    const storedEntries = localStorage.getItem('timeTracker_entries');
    const storedSession = localStorage.getItem('timeTracker_currentSession');
    const storedName = localStorage.getItem('timeTracker_userName');

    if (storedEntries) state.entries = JSON.parse(storedEntries);
    if (storedSession) state.currentSession = JSON.parse(storedSession);
    if (storedName) state.userName = storedName;

    // Restore UI state
    elements.userNameInput.value = state.userName;

    // Resume timer if session exists
    if (state.currentSession) {
        startTimer();
    }
}

// Core Logic
function clockIn() {
    if (!state.userName.trim()) {
        alert('Please enter your name first.');
        elements.userNameInput.focus();
        return;
    }

    const now = new Date();
    state.currentSession = {
        startTime: now.toISOString(),
        date: now.toISOString().split('T')[0]
    };
    
    saveState();
    startTimer();
    renderApp();
}

function clockOut() {
    if (!state.currentSession) return;

    const now = new Date();
    const entry = {
        id: Date.now().toString(),
        name: state.userName,
        date: state.currentSession.date,
        startTime: state.currentSession.startTime,
        endTime: now.toISOString(),
        duration: (now - new Date(state.currentSession.startTime)) / (1000 * 60 * 60) // hours
    };

    state.entries.unshift(entry); // Add to top
    state.currentSession = null;
    
    stopTimer();
    saveState();
    renderApp();
}

function addManualEntry(e) {
    e.preventDefault();
    
    if (!state.userName.trim()) {
        alert('Please enter your name first.');
        elements.userNameInput.focus();
        return;
    }

    const dateVal = elements.manualDate.value;
    const startVal = elements.manualStart.value;
    const endVal = elements.manualEnd.value;

    if (!dateVal || !startVal || !endVal) {
        alert('Please fill in all fields.');
        return;
    }

    const startDateTime = new Date(`${dateVal}T${startVal}`);
    const endDateTime = new Date(`${dateVal}T${endVal}`);

    if (endDateTime <= startDateTime) {
        alert('End time must be after start time.');
        return;
    }

    const entry = {
        id: Date.now().toString(),
        name: state.userName,
        date: dateVal,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        duration: (endDateTime - startDateTime) / (1000 * 60 * 60)
    };

    state.entries.unshift(entry);
    state.entries.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)); // Keep sorted
    
    saveState();
    renderApp();
    toggleManualForm(false);
    elements.formManual.reset();
    elements.manualDate.valueAsDate = new Date();
}

function deleteEntry(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
        state.entries = state.entries.filter(e => e.id !== id);
        saveState();
        renderApp();
    }
}

function clearHistory() {
    if (confirm('Are you sure you want to clear ALL history? This cannot be undone.')) {
        state.entries = [];
        saveState();
        renderApp();
    }
}

// Timer Logic
function startTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    
    const update = () => {
        if (!state.currentSession) return;
        const start = new Date(state.currentSession.startTime);
        const now = new Date();
        const diff = now - start;
        
        // Format duration HH:MM:SS
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        elements.elapsedTime.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    update();
    state.timerInterval = setInterval(update, 1000);
}

function stopTimer() {
    clearInterval(state.timerInterval);
    elements.elapsedTime.textContent = '00:00:00';
}

function updateClock() {
    const now = new Date();
    elements.currentTime.textContent = now.toLocaleTimeString();
    elements.currentDate.textContent = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// Rendering
function renderApp() {
    renderControls();
    renderToday();
    renderHistory();
}

function renderControls() {
    if (state.currentSession) {
        elements.btnClockIn.classList.add('hidden');
        elements.btnClockOut.classList.remove('hidden');
        elements.statusBadge.textContent = 'Clocked In';
        elements.statusBadge.classList.replace('bg-gray-100', 'bg-green-100');
        elements.statusBadge.classList.replace('text-gray-800', 'text-green-800');
        elements.statusIndicator.classList.replace('bg-gray-200', 'bg-green-500');
        elements.statusIndicator.classList.add('animate-pulse');
    } else {
        elements.btnClockIn.classList.remove('hidden');
        elements.btnClockOut.classList.add('hidden');
        elements.statusBadge.textContent = 'Not Working';
        elements.statusBadge.classList.replace('bg-green-100', 'bg-gray-100');
        elements.statusBadge.classList.replace('text-green-800', 'text-gray-800');
        elements.statusIndicator.classList.replace('bg-green-500', 'bg-gray-200');
        elements.statusIndicator.classList.remove('animate-pulse');
    }
}

function renderToday() {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysEntries = state.entries.filter(e => e.date === todayStr);
    
    const totalHours = todaysEntries.reduce((acc, curr) => acc + curr.duration, 0);
    elements.todayTotal.textContent = `${totalHours.toFixed(2)}h`;

    elements.todayList.innerHTML = '';
    
    if (todaysEntries.length === 0) {
        elements.todayList.innerHTML = '<div class="text-center text-gray-400 py-8 text-sm">No activity recorded today</div>';
        return;
    }

    todaysEntries.forEach(entry => {
        const start = new Date(entry.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const end = new Date(entry.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const el = document.createElement('div');
        el.className = 'flex justify-between items-center py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded transition-colors';
        el.innerHTML = `
            <div class="flex items-center">
                <div class="w-2 h-2 rounded-full bg-blue-400 mr-3"></div>
                <div>
                    <div class="text-sm font-medium text-gray-900">${start} - ${end}</div>
                    <div class="text-xs text-gray-500">${entry.duration.toFixed(2)} hrs</div>
                </div>
            </div>
            <button onclick="deleteEntry('${entry.id}')" class="text-gray-300 hover:text-red-500 transition-colors">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;
        elements.todayList.appendChild(el);
    });
}

function renderHistory() {
    elements.historyTableBody.innerHTML = '';
    
    if (state.entries.length === 0) {
        elements.historyEmptyState.classList.remove('hidden');
        return;
    } else {
        elements.historyEmptyState.classList.add('hidden');
    }

    state.entries.forEach(entry => {
        const date = new Date(entry.date).toLocaleDateString();
        const start = new Date(entry.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const end = new Date(entry.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${date}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${entry.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">${start}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">${end}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">${entry.duration.toFixed(2)}h</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="deleteEntry('${entry.id}')" class="text-red-600 hover:text-red-900 transition-colors">Delete</button>
            </td>
        `;
        elements.historyTableBody.appendChild(row);
    });
}

// Helpers
function toggleManualForm(show) {
    if (show) {
        elements.manualEntryForm.classList.remove('hidden');
        elements.manualDate.focus();
    } else {
        elements.manualEntryForm.classList.add('hidden');
    }
}

function exportToCSV() {
    if (state.entries.length === 0) return alert('No data to export');

    const headers = ['ID', 'Name', 'Date', 'Start Time', 'End Time', 'Duration (Hours)'];
    const csvContent = [
        headers.join(','),
        ...state.entries.map(e => [
            e.id,
            `"${e.name}"`, // Quote name to handle commas
            e.date,
            new Date(e.startTime).toLocaleTimeString(),
            new Date(e.endTime).toLocaleTimeString(),
            e.duration.toFixed(4)
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `time_entries_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Event Listeners
function setupEventListeners() {
    elements.userNameInput.addEventListener('input', (e) => {
        state.userName = e.target.value;
        saveState();
    });

    elements.btnClockIn.addEventListener('click', clockIn);
    elements.btnClockOut.addEventListener('click', clockOut);
    
    elements.btnToggleManual.addEventListener('click', () => toggleManualForm(true));
    elements.btnCancelManual.addEventListener('click', () => toggleManualForm(false));
    elements.formManual.addEventListener('submit', addManualEntry);
    
    elements.btnExport.addEventListener('click', exportToCSV);
    elements.btnClear.addEventListener('click', clearHistory);
}

// Boot
init();