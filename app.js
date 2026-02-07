// Task Manager Application with Local Storage
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentView = 'dashboard';
        this.filters = {
            search: '',
            priority: 'all',
            status: 'all',
            project: 'all'
        };
        this.editingTaskId = null;
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.render();
    }

    // Local Storage Methods
    loadFromLocalStorage() {
        const stored = localStorage.getItem('taskManagerData');
        if (stored) {
            this.tasks = JSON.parse(stored);
        } else {
            // Initialize with sample data
            this.tasks = this.getSampleTasks();
            this.saveToLocalStorage();
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('taskManagerData', JSON.stringify(this.tasks));
    }

    getSampleTasks() {
        return [
            {
                id: Date.now() + 1,
                name: 'Design Homepage Mockup',
                description: 'Create wireframes and visual design for the new homepage',
                status: 'In Progress',
                priority: 'High',
                project: 'Website Redesign',
                assignee: 'Sarah Chen',
                startDate: '2024-01-15',
                endDate: '2024-01-20',
                progress: 60
            },
            {
                id: Date.now() + 2,
                name: 'Backend API Development',
                description: 'Build REST API endpoints for user authentication',
                status: 'Not Started',
                priority: 'High',
                project: 'Mobile App',
                assignee: 'John Smith',
                startDate: '2024-01-18',
                endDate: '2024-02-01',
                progress: 0
            },
            {
                id: Date.now() + 3,
                name: 'Database Migration',
                description: 'Migrate from PostgreSQL 12 to PostgreSQL 15',
                status: 'Completed',
                priority: 'Medium',
                project: 'Infrastructure',
                assignee: 'Mike Johnson',
                startDate: '2024-01-10',
                endDate: '2024-01-14',
                progress: 100
            },
            {
                id: Date.now() + 4,
                name: 'User Testing Session',
                description: 'Conduct usability testing with 10 participants',
                status: 'On Hold',
                priority: 'Low',
                project: 'Website Redesign',
                assignee: 'Emily Davis',
                startDate: '2024-01-25',
                endDate: '2024-01-27',
                progress: 25
            }
        ];
    }

    // CRUD Operations
    addTask(taskData) {
        const newTask = {
            id: Date.now(),
            name: taskData.name,
            description: taskData.description || '',
            status: taskData.status || 'Not Started',
            priority: taskData.priority || 'Medium',
            project: taskData.project || '',
            assignee: taskData.assignee || '',
            startDate: taskData.startDate || '',
            endDate: taskData.endDate || '',
            progress: taskData.progress || 0
        };
        this.tasks.push(newTask);
        this.saveToLocalStorage();
        this.render();
        return newTask;
    }

    updateTask(id, updates) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], ...updates };
            this.saveToLocalStorage();
            this.render();
            return this.tasks[index];
        }
        return null;
    }

    deleteTask(id) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return false;
        }
        const index = this.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            this.tasks.splice(index, 1);
            this.saveToLocalStorage();
            this.render();
            return true;
        }
        return false;
    }

    getTask(id) {
        return this.tasks.find(t => t.id === id);
    }

    // Event Listeners
    setupEventListeners() {
        // View switching
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Add task button
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.openTaskModal();
        });

        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettingsModal();
        });

        // Search and filters
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.render();
        });

        document.getElementById('priorityFilter').addEventListener('change', (e) => {
            this.filters.priority = e.target.value;
            this.render();
        });

        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.render();
        });

        document.getElementById('projectFilter').addEventListener('change', (e) => {
            this.filters.project = e.target.value;
            this.render();
        });

        // Task modal
        document.getElementById('closeTaskModal').addEventListener('click', () => {
            this.closeTaskModal();
        });

        document.getElementById('cancelTaskBtn').addEventListener('click', () => {
            this.closeTaskModal();
        });

        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTaskSubmit();
        });

        // Settings modal
        document.getElementById('closeSettingsModal').addEventListener('click', () => {
            this.closeSettingsModal();
        });

        document.getElementById('cancelSettingsBtn').addEventListener('click', () => {
            this.closeSettingsModal();
        });

        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importDataBtn').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });

        document.getElementById('importFileInput').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        document.getElementById('clearDataBtn').addEventListener('click', () => {
            this.clearAllData();
        });

        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    // View Management
    switchView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Show/hide views
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
        });
        document.getElementById(`${view}View`).classList.add('active');

        this.render();
    }

    // Filtering
    getFilteredTasks() {
        return this.tasks.filter(task => {
            const matchesSearch = !this.filters.search || 
                task.name.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                task.description.toLowerCase().includes(this.filters.search.toLowerCase());
            
            const matchesPriority = this.filters.priority === 'all' || 
                task.priority === this.filters.priority;
            
            const matchesStatus = this.filters.status === 'all' || 
                task.status === this.filters.status;
            
            const matchesProject = this.filters.project === 'all' || 
                task.project === this.filters.project;

            return matchesSearch && matchesPriority && matchesStatus && matchesProject;
        });
    }

    // Rendering
    render() {
        this.updateStats();
        this.updateProjectFilter();

        if (this.currentView === 'dashboard') {
            this.renderDashboard();
        } else if (this.currentView === 'kanban') {
            this.renderKanban();
        } else if (this.currentView === 'gantt') {
            this.renderGantt();
        }
    }

    updateStats() {
        const filteredTasks = this.getFilteredTasks();
        const total = filteredTasks.length;
        const completed = filteredTasks.filter(t => t.status === 'Completed').length;
        const inProgress = filteredTasks.filter(t => t.status === 'In Progress').length;
        const notStarted = filteredTasks.filter(t => t.status === 'Not Started').length;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('inProgressTasks').textContent = inProgress;
        document.getElementById('notStartedTasks').textContent = notStarted;
    }

    updateProjectFilter() {
        const projects = [...new Set(this.tasks.map(t => t.project).filter(p => p))];
        const projectFilter = document.getElementById('projectFilter');
        const currentValue = projectFilter.value;
        
        projectFilter.innerHTML = '<option value="all">All Projects</option>';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project;
            option.textContent = project;
            projectFilter.appendChild(option);
        });
        
        projectFilter.value = currentValue;
    }

    renderDashboard() {
        const tbody = document.getElementById('dashboardTableBody');
        const filteredTasks = this.getFilteredTasks();

        tbody.innerHTML = filteredTasks.map(task => `
            <tr>
                <td>${task.name}</td>
                <td><span class="status-badge status-${task.status.toLowerCase().replace(/ /g, '-')}">${task.status}</span></td>
                <td><span class="priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</span></td>
                <td>${task.project || 'N/A'}</td>
                <td>${task.assignee || 'Unassigned'}</td>
                <td>${task.endDate || 'N/A'}</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${task.progress}%"></div>
                    </div>
                    <span class="progress-text">${task.progress}%</span>
                </td>
                <td>
                    <button class="action-btn" onclick="taskManager.openTaskModal(${task.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" onclick="taskManager.deleteTask(${task.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderKanban() {
        const statuses = ['Not Started', 'In Progress', 'Completed', 'On Hold'];
        const filteredTasks = this.getFilteredTasks();

        statuses.forEach(status => {
            const columnId = status.toLowerCase().replace(/ /g, '-');
            const column = document.getElementById(`${columnId}-column`);
            const tasksForStatus = filteredTasks.filter(t => t.status === status);

            column.innerHTML = tasksForStatus.map(task => `
                <div class="kanban-card" draggable="true" data-task-id="${task.id}" ondragstart="taskManager.handleDragStart(event)" ondragend="taskManager.handleDragEnd(event)">
                    <div class="kanban-card-header">
                        <h4>${task.name}</h4>
                        <span class="priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
                    </div>
                    <p class="kanban-card-description">${task.description || 'No description'}</p>
                    <div class="kanban-card-meta">
                        <span><i class="fas fa-user"></i> ${task.assignee || 'Unassigned'}</span>
                        <span><i class="fas fa-calendar"></i> ${task.endDate || 'No deadline'}</span>
                    </div>
                    <div class="kanban-card-actions">
                        <button class="action-btn" onclick="taskManager.openTaskModal(${task.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn" onclick="taskManager.deleteTask(${task.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        });

        // Setup drop zones
        document.querySelectorAll('.kanban-column').forEach(column => {
            column.addEventListener('dragover', this.handleDragOver);
            column.addEventListener('drop', (e) => this.handleDrop(e));
        });
    }

    handleDragStart(event) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/html', event.target.innerHTML);
        event.dataTransfer.setData('taskId', event.target.dataset.taskId);
        event.target.style.opacity = '0.4';
    }

    handleDragEnd(event) {
        event.target.style.opacity = '1';
    }

    handleDragOver(event) {
        if (event.preventDefault) {
            event.preventDefault();
        }
        event.dataTransfer.dropEffect = 'move';
        return false;
    }

    handleDrop(event) {
        if (event.stopPropagation) {
            event.stopPropagation();
        }

        const taskId = parseInt(event.dataTransfer.getData('taskId'));
        const newStatus = event.currentTarget.dataset.status;
        
        if (taskId && newStatus) {
            const statusMap = {
                'not-started': 'Not Started',
                'in-progress': 'In Progress',
                'completed': 'Completed',
                'on-hold': 'On Hold'
            };
            
            const progress = statusMap[newStatus] === 'Completed' ? 100 : 
                           statusMap[newStatus] === 'In Progress' ? 50 :
                           statusMap[newStatus] === 'On Hold' ? 25 : 0;

            this.updateTask(taskId, { 
                status: statusMap[newStatus],
                progress: progress
            });
        }

        return false;
    }

    renderGantt() {
        const ganttTasks = document.getElementById('ganttTasks');
        const ganttBars = document.getElementById('ganttBars');
        const filteredTasks = this.getFilteredTasks().filter(t => t.startDate && t.endDate);

        if (filteredTasks.length === 0) {
            ganttTasks.innerHTML = '<div style="padding: 20px; text-align: center;">No tasks with dates to display</div>';
            ganttBars.innerHTML = '';
            return;
        }

        // Calculate date range
        const dates = filteredTasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate)]);
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;

        // Render task names
        ganttTasks.innerHTML = filteredTasks.map(task => `
            <div class="gantt-task-name">
                <strong>${task.name}</strong>
                <small>${task.project || 'No project'}</small>
            </div>
        `).join('');

        // Render gantt bars
        ganttBars.innerHTML = filteredTasks.map(task => {
            const start = new Date(task.startDate);
            const end = new Date(task.endDate);
            const daysFromStart = Math.ceil((start - minDate) / (1000 * 60 * 60 * 24));
            const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            
            const left = (daysFromStart / totalDays) * 100;
            const width = (duration / totalDays) * 100;

            return `
                <div class="gantt-row">
                    <div class="gantt-bar status-${task.status.toLowerCase().replace(/ /g, '-')}" 
                         style="left: ${left}%; width: ${width}%"
                         title="${task.name}: ${task.startDate} to ${task.endDate}">
                        <span class="gantt-bar-label">${task.progress}%</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Task Modal Management
    openTaskModal(taskId = null) {
        this.editingTaskId = taskId;
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const title = document.getElementById('taskModalTitle');

        if (taskId) {
            const task = this.getTask(taskId);
            title.textContent = 'Edit Task';
            document.getElementById('taskName').value = task.name;
            document.getElementById('taskDescription').value = task.description;
            document.getElementById('taskStatus').value = task.status;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskProject').value = task.project;
            document.getElementById('taskAssignee').value = task.assignee;
            document.getElementById('taskStartDate').value = task.startDate;
            document.getElementById('taskEndDate').value = task.endDate;
            document.getElementById('taskProgress').value = task.progress;
        } else {
            title.textContent = 'Add New Task';
            form.reset();
        }

        modal.style.display = 'block';
    }

    closeTaskModal() {
        document.getElementById('taskModal').style.display = 'none';
        this.editingTaskId = null;
    }

    handleTaskSubmit() {
        const formData = {
            name: document.getElementById('taskName').value,
            description: document.getElementById('taskDescription').value,
            status: document.getElementById('taskStatus').value,
            priority: document.getElementById('taskPriority').value,
            project: document.getElementById('taskProject').value,
            assignee: document.getElementById('taskAssignee').value,
            startDate: document.getElementById('taskStartDate').value,
            endDate: document.getElementById('taskEndDate').value,
            progress: parseInt(document.getElementById('taskProgress').value)
        };

        if (this.editingTaskId) {
            this.updateTask(this.editingTaskId, formData);
        } else {
            this.addTask(formData);
        }

        this.closeTaskModal();
    }

    // Settings Modal
    openSettingsModal() {
        document.getElementById('settingsModal').style.display = 'block';
    }

    closeSettingsModal() {
        document.getElementById('settingsModal').style.display = 'none';
    }

    exportData() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `task-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (Array.isArray(imported)) {
                    this.tasks = imported;
                    this.saveToLocalStorage();
                    this.render();
                    alert('Data imported successfully!');
                    this.closeSettingsModal();
                } else {
                    alert('Invalid file format');
                }
            } catch (error) {
                alert('Error importing file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all tasks? This cannot be undone.')) {
            this.tasks = [];
            this.saveToLocalStorage();
            this.render();
            this.closeSettingsModal();
        }
    }
}

// Initialize the app
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
});