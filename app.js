// Task Manager App
let tasks = [];
let currentView = 'dashboard';
let sortColumn = null;
let sortDirection = 'asc';
let draggedCard = null;

// Configuration
const CONFIG_KEY = 'taskManagerConfig';
const DEFAULT_SHEET_ID = '1w6I2fGi4e2_ztQHNy7ia0kjmmbrewWzg7vWtAM1QlKc';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    const config = getConfig();
    if (!config.sheetId) {
        showConfigModal();
    } else {
        loadTasks();
    }
}

function getConfig() {
    const saved = localStorage.getItem(CONFIG_KEY);
    return saved ? JSON.parse(saved) : { sheetId: DEFAULT_SHEET_ID };
}

function saveConfig(sheetId) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ sheetId }));
}

function setupEventListeners() {
    // View switching
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Sync button
    document.getElementById('syncBtn').addEventListener('click', loadTasks);

    // Filters
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('priorityFilter').addEventListener('change', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('projectFilter').addEventListener('change', applyFilters);

    // Config modal
    document.getElementById('saveConfigBtn').addEventListener('click', saveConfiguration);
    document.getElementById('cancelConfigBtn').addEventListener('click', hideConfigModal);

    // Gantt zoom
    document.getElementById('ganttZoomIn')?.addEventListener('click', () => adjustGanttZoom('in'));
    document.getElementById('ganttZoomOut')?.addEventListener('click', () => adjustGanttZoom('out'));
}

function showConfigModal() {
    const modal = document.getElementById('configModal');
    const input = document.getElementById('sheetIdInput');
    const config = getConfig();
    input.value = config.sheetId || DEFAULT_SHEET_ID;
    modal.classList.add('active');
}

function hideConfigModal() {
    document.getElementById('configModal').classList.remove('active');
}

function saveConfiguration() {
    const sheetId = document.getElementById('sheetIdInput').value.trim();
    if (sheetId) {
        saveConfig(sheetId);
        hideConfigModal();
        loadTasks();
    }
}

async function loadTasks() {
    const config = getConfig();
    const sheetId = config.sheetId;
    
    if (!sheetId) {
        showConfigModal();
        return;
    }

    showLoading(true);
    hideError();

    try {
        // Fetch from Google Sheets using published CSV endpoint
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Active%20Tasks`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data from Google Sheets');
        
        const csvText = await response.text();
        tasks = parseCSV(csvText);
        
        renderDashboard();
        renderKanban();
        renderGantt();
        updateStats();
        populateProjectFilter();
        
        showLoading(false);
    } catch (error) {
        console.error('Error loading tasks:', error);
        showError('Failed to load tasks. Please check your Google Sheets ID and ensure the sheet is published. Error: ' + error.message);
        showLoading(false);
        
        // Load sample data for demo
        loadSampleData();
    }
}

function parseCSV(csv) {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const tasks = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < headers.length) continue;
        
        const task = {};
        headers.forEach((header, index) => {
            task[header.toLowerCase().replace(/\s+/g, '_')] = values[index]?.replace(/"/g, '').trim() || '';
        });
        
        if (task.task_name) {
            tasks.push(task);
        }
    }
    
    return tasks;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    
    return result;
}

function loadSampleData() {
    tasks = [
        {
            task_name: 'Complete Q1 Trading Strategy Review',
            status: 'In Progress',
            priority: 'High',
            deadline: '2026-02-28',
            project_category: 'Trading Strategy',
            notes: 'Focus on EM Asia FX pairs'
        },
        {
            task_name: 'Update Risk Models',
            status: 'Not Started',
            priority: 'High',
            deadline: '2026-03-15',
            project_category: 'Risk Management',
            notes: 'Include volatility adjustments'
        },
        {
            task_name: 'Review EUR/USD Position Limits',
            status: 'Not Started',
            priority: 'High',
            deadline: '2026-02-14',
            project_category: 'Risk Management',
            notes: 'Urgent - review before Valentine\'s Day'
        },
        {
            task_name: 'Analyze JPY correlation patterns',
            status: 'In Progress',
            priority: 'Medium',
            deadline: '2026-03-01',
            project_category: 'Market Analysis',
            notes: 'Cross-check with BOJ policy updates'
        },
        {
            task_name: 'Build automated alert system',
            status: 'Not Started',
            priority: 'Medium',
            deadline: '2026-03-31',
            project_category: 'Trading Automation',
            notes: 'Integration with existing monitoring'
        }
    ];
    
    renderDashboard();
    renderKanban();
    renderGantt();
    updateStats();
    populateProjectFilter();
}

function switchView(view) {
    currentView = view;
    
    // Update buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Update views
    document.querySelectorAll('.view').forEach(v => {
        v.classList.toggle('active', v.id === `${view}View`);
    });
}

function updateStats() {
    const total = tasks.length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const urgent = tasks.filter(t => t.priority === 'High').length;
    
    document.getElementById('totalTasks').textContent = total;
    document.getElementById('inProgressTasks').textContent = inProgress;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('urgentTasks').textContent = urgent;
}

function renderDashboard() {
    const tbody = document.getElementById('tasksTableBody');
    tbody.innerHTML = '';
    
    const filteredTasks = getFilteredTasks();
    
    filteredTasks.forEach(task => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${escapeHtml(task.task_name || task.task)}</strong><br>
                <small style="color: #6C757D;">${escapeHtml(task.notes || '')}</small>
            </td>
            <td><span class="status-badge status-${slugify(task.status)}">${escapeHtml(task.status)}</span></td>
            <td><span class="priority-badge priority-${task.priority?.toLowerCase()}">${escapeHtml(task.priority)}</span></td>
            <td>${formatDate(task.deadline)}</td>
            <td>${escapeHtml(task.project_category || task.project || '')}</td>
        `;
        tbody.appendChild(row);
    });
}

function renderKanban() {
    const statuses = ['Not Started', 'In Progress', 'Completed', 'On Hold'];
    
    statuses.forEach(status => {
        const container = document.getElementById(`kanban-${slugify(status)}`);
        if (!container) return;
        
        container.innerHTML = '';
        
        const statusTasks = tasks.filter(t => t.status === status);
        statusTasks.forEach(task => {
            const card = createKanbanCard(task);
            container.appendChild(card);
        });
    });
    
    setupDragAndDrop();
}

function createKanbanCard(task) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.task = task.task_name || task.task;
    
    const priorityColor = {
        'High': '#DC3545',
        'Medium': '#FFC107',
        'Low': '#28A745'
    }[task.priority] || '#4A90E2';
    
    card.style.borderLeftColor = priorityColor;
    
    card.innerHTML = `
        <h4>${escapeHtml(task.task_name || task.task)}</h4>
        <p style="font-size: 12px; color: #6C757D; margin-top: 5px;">${escapeHtml(task.notes || '')}</p>
        <div class="kanban-card-meta">
            <span class="priority-badge priority-${task.priority?.toLowerCase()}">${escapeHtml(task.priority)}</span>
            <span><i class="far fa-calendar"></i> ${formatDate(task.deadline)}</span>
        </div>
    `;
    
    return card;
}

function setupDragAndDrop() {
    const cards = document.querySelectorAll('.kanban-card');
    const columns = document.querySelectorAll('.kanban-cards');
    
    cards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });
    
    columns.forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    draggedCard = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedCard) {
        const newStatus = this.parentElement.dataset.status;
        const taskName = draggedCard.dataset.task;
        
        // Update task status
        const task = tasks.find(t => (t.task_name || t.task) === taskName);
        if (task) {
            task.status = newStatus;
            renderKanban();
            renderDashboard();
            updateStats();
        }
    }
    
    return false;
}

function renderGantt() {
    const chart = document.getElementById('ganttChart');
    if (!chart) return;
    
    chart.innerHTML = '';
    
    const tasksWithDeadlines = tasks.filter(t => t.deadline);
    if (tasksWithDeadlines.length === 0) {
        chart.innerHTML = '<p style="text-align: center; color: #6C757D; padding: 40px;">No tasks with deadlines</p>';
        return;
    }
    
    // Calculate date range
    const dates = tasksWithDeadlines.map(t => new Date(t.deadline));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const today = new Date();
    
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);
    
    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
    
    // Update date range display
    document.getElementById('ganttDateRange').textContent = 
        `${formatDate(minDate)} - ${formatDate(maxDate)}`;
    
    // Create header
    const header = document.createElement('div');
    header.className = 'gantt-header';
    header.innerHTML = `
        <div class="gantt-header-label">Task</div>
        <div class="gantt-dates">
            <span>${formatDate(minDate)}</span>
            <span>Today</span>
            <span>${formatDate(maxDate)}</span>
        </div>
    `;
    chart.appendChild(header);
    
    // Create rows
    tasksWithDeadlines.forEach(task => {
        const row = document.createElement('div');
        row.className = 'gantt-row';
        
        const deadline = new Date(task.deadline);
        const startDate = new Date(deadline);
        startDate.setDate(startDate.getDate() - 7); // Assume 7 day duration
        
        const startOffset = ((startDate - minDate) / (maxDate - minDate)) * 100;
        const duration = ((deadline - startDate) / (maxDate - minDate)) * 100;
        
        const barColor = {
            'High': '#DC3545',
            'Medium': '#FFC107',
            'Low': '#28A745'
        }[task.priority] || '#4A90E2';
        
        row.innerHTML = `
            <div class="gantt-label">${escapeHtml(task.task_name || task.task)}</div>
            <div class="gantt-timeline">
                <div class="gantt-bar" style="left: ${startOffset}%; width: ${duration}%; background: ${barColor};">
                    ${formatDate(task.deadline)}
                </div>
            </div>
        `;
        
        chart.appendChild(row);
    });
}

function applyFilters() {
    renderDashboard();
}

function getFilteredTasks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const priorityFilter = document.getElementById('priorityFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const projectFilter = document.getElementById('projectFilter').value;
    
    return tasks.filter(task => {
        const matchesSearch = !searchTerm || 
            (task.task_name || task.task || '').toLowerCase().includes(searchTerm) ||
            (task.notes || '').toLowerCase().includes(searchTerm);
        
        const matchesPriority = !priorityFilter || task.priority === priorityFilter;
        const matchesStatus = !statusFilter || task.status === statusFilter;
        const matchesProject = !projectFilter || 
            (task.project_category || task.project) === projectFilter;
        
        return matchesSearch && matchesPriority && matchesStatus && matchesProject;
    });
}

function populateProjectFilter() {
    const projects = [...new Set(tasks.map(t => t.project_category || t.project).filter(Boolean))];
    const select = document.getElementById('projectFilter');
    
    select.innerHTML = '<option value="">All Projects</option>';
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project;
        option.textContent = project;
        select.appendChild(option);
    });
}

function sortTable(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    
    tasks.sort((a, b) => {
        let aVal = a[column] || a[column + '_name'] || '';
        let bVal = b[column] || b[column + '_name'] || '';
        
        if (column === 'deadline') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        }
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    renderDashboard();
}

function adjustGanttZoom(direction) {
    // Placeholder for zoom functionality
    console.log('Zoom', direction);
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function slugify(text) {
    return (text || '').toLowerCase().replace(/\s+/g, '-');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading(show) {
    document.getElementById('loadingIndicator').classList.toggle('active', show);
}

function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    errorEl.textContent = message;
    errorEl.classList.add('active');
}

function hideError() {
    document.getElementById('errorMessage').classList.remove('active');
}