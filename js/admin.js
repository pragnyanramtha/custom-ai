class KnowledgeAdmin {
    constructor() {
        this.entries = [];
        this.filteredEntries = [];
        this.currentEditingId = null;
        this.currentDeleteId = null;
        
        // DOM elements
        this.entriesList = document.getElementById('entriesList');
        this.entriesCount = document.getElementById('entriesCount');
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearchBtn');
        this.searchResultsInfo = document.getElementById('searchResultsInfo');
        
        // Modal elements
        this.entryModal = document.getElementById('entryModal');
        this.deleteModal = document.getElementById('deleteModal');
        this.entryForm = document.getElementById('entryForm');
        this.modalTitle = document.getElementById('modalTitle');
        
        // Form elements
        this.entryKey = document.getElementById('entryKey');
        this.entryValue = document.getElementById('entryValue');
        this.entryTags = document.getElementById('entryTags');
        
        // Button elements
        this.addEntryBtn = document.getElementById('addEntryBtn');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        this.confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        
        // Toast container
        this.toastContainer = document.getElementById('toastContainer');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadEntries();
    }
    
    setupEventListeners() {
        // Search functionality
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
        
        // Modal controls
        this.addEntryBtn.addEventListener('click', () => this.openAddModal());
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.cancelDeleteBtn.addEventListener('click', () => this.closeDeleteModal());
        
        // Form submission
        this.entryForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.confirmDeleteBtn.addEventListener('click', () => this.handleDelete());
        
        // Close modals on overlay click
        this.entryModal.addEventListener('click', (e) => {
            if (e.target === this.entryModal) this.closeModal();
        });
        this.deleteModal.addEventListener('click', (e) => {
            if (e.target === this.deleteModal) this.closeDeleteModal();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeDeleteModal();
            }
        });
        
        // Auto-resize textarea
        this.entryValue.addEventListener('input', () => this.autoResizeTextarea());
    }
    
    async loadEntries() {
        const maxRetries = 3;
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.showLoadingState();
                
                const response = await fetch('/api/knowledge', {
                    signal: AbortSignal.timeout(15000) // 15 second timeout
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    
                    if (response.status >= 500) {
                        throw new Error('Server error occurred. Please try again.');
                    } else if (response.status === 429) {
                        throw new Error('Too many requests. Please wait a moment.');
                    } else {
                        throw new Error(errorData.message || `Failed to load entries (${response.status})`);
                    }
                }
                
                const data = await response.json();
                this.entries = data.entries || [];
                this.filteredEntries = [...this.entries];
                
                this.renderEntries();
                this.updateEntriesCount();
                return; // Success, exit retry loop
                
            } catch (error) {
                lastError = error;
                console.error(`Load attempt ${attempt} failed:`, error);
                
                // Don't retry on certain errors
                if (error.name === 'AbortError') {
                    this.showError('Request Timeout', 'The request took too long. Please check your connection and try again.');
                    this.showErrorState();
                    return;
                }
                
                if (!navigator.onLine) {
                    this.showError('No Internet Connection', 'Please check your internet connection and try again.');
                    this.showErrorState();
                    return;
                }
                
                // Retry on network/server errors
                if (attempt < maxRetries && (error.message.includes('Server error') || error.message.includes('Failed to fetch'))) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    continue;
                }
            }
        }
        
        // All retries failed
        this.showError('Failed to load knowledge entries', lastError?.message || 'Please refresh the page to try again.');
        this.showErrorState();
    }
    
    handleSearch(query) {
        const trimmedQuery = query.trim().toLowerCase();
        
        if (trimmedQuery === '') {
            this.clearSearch();
            return;
        }
        
        this.filteredEntries = this.entries.filter(entry => {
            const keyMatch = entry.key.toLowerCase().includes(trimmedQuery);
            const valueMatch = entry.value.toLowerCase().includes(trimmedQuery);
            const tagMatch = entry.tags && entry.tags.some(tag => 
                tag.toLowerCase().includes(trimmedQuery)
            );
            
            return keyMatch || valueMatch || tagMatch;
        });
        
        this.renderEntries();
        this.updateSearchResults(trimmedQuery);
        this.clearSearchBtn.style.display = 'block';
    }
    
    clearSearch() {
        this.searchInput.value = '';
        this.filteredEntries = [...this.entries];
        this.renderEntries();
        this.clearSearchBtn.style.display = 'none';
        this.searchResultsInfo.textContent = '';
    }
    
    updateSearchResults(query) {
        const count = this.filteredEntries.length;
        const total = this.entries.length;
        
        if (count === 0) {
            this.searchResultsInfo.textContent = `No entries found for "${query}"`;
        } else if (count === total) {
            this.searchResultsInfo.textContent = '';
        } else {
            this.searchResultsInfo.textContent = `Found ${count} of ${total} entries for "${query}"`;
        }
    }
    
    renderEntries() {
        if (this.filteredEntries.length === 0) {
            this.showEmptyState();
            return;
        }
        
        const entriesHTML = this.filteredEntries.map(entry => this.createEntryHTML(entry)).join('');
        this.entriesList.innerHTML = entriesHTML;
        
        // Add event listeners to action buttons
        this.setupEntryEventListeners();
    }
    
    createEntryHTML(entry) {
        const tagsHTML = entry.tags && entry.tags.length > 0 
            ? entry.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')
            : '<span class="tag">No tags</span>';
        
        const createdDate = new Date(entry.createdAt).toLocaleDateString();
        const updatedDate = new Date(entry.updatedAt).toLocaleDateString();
        const isUpdated = entry.createdAt !== entry.updatedAt;
        
        return `
            <div class="entry-card" data-id="${entry.id}">
                <div class="entry-header">
                    <h3 class="entry-title">${this.escapeHtml(entry.key)}</h3>
                    <div class="entry-actions">
                        <button class="action-button edit-button" data-id="${entry.id}" title="Edit entry">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="action-button delete-button" data-id="${entry.id}" title="Delete entry">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="entry-content" data-id="${entry.id}">
                    ${this.escapeHtml(entry.value)}
                </div>
                ${entry.value.length > 200 ? `<button class="expand-button" data-id="${entry.id}">Show more</button>` : ''}
                <div class="entry-footer">
                    <div class="entry-tags">
                        ${tagsHTML}
                    </div>
                    <div class="entry-meta">
                        Created: ${createdDate}
                        ${isUpdated ? `<br>Updated: ${updatedDate}` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    setupEntryEventListeners() {
        // Edit buttons
        document.querySelectorAll('.edit-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.openEditModal(id);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.openDeleteModal(id);
            });
        });
        
        // Expand buttons
        document.querySelectorAll('.expand-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.toggleEntryExpansion(id);
            });
        });
    }
    
    toggleEntryExpansion(id) {
        const content = document.querySelector(`.entry-content[data-id="${id}"]`);
        const button = document.querySelector(`.expand-button[data-id="${id}"]`);
        
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            button.textContent = 'Show more';
        } else {
            content.classList.add('expanded');
            button.textContent = 'Show less';
        }
    }
    
    openAddModal() {
        this.currentEditingId = null;
        this.modalTitle.textContent = 'Add New Entry';
        this.resetForm();
        this.showModal();
    }
    
    openEditModal(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;
        
        this.currentEditingId = id;
        this.modalTitle.textContent = 'Edit Entry';
        
        this.entryKey.value = entry.key;
        this.entryValue.value = entry.value;
        this.entryTags.value = entry.tags ? entry.tags.join(', ') : '';
        
        this.autoResizeTextarea();
        this.showModal();
    }
    
    openDeleteModal(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;
        
        this.currentDeleteId = id;
        
        const preview = document.getElementById('deleteEntryPreview');
        preview.innerHTML = `
            <h4>${this.escapeHtml(entry.key)}</h4>
            <p>${this.escapeHtml(entry.value.substring(0, 150))}${entry.value.length > 150 ? '...' : ''}</p>
        `;
        
        this.deleteModal.classList.add('show');
    }
    
    showModal() {
        this.entryModal.classList.add('show');
        setTimeout(() => this.entryKey.focus(), 100);
    }
    
    closeModal() {
        this.entryModal.classList.remove('show');
        this.resetForm();
        this.currentEditingId = null;
    }
    
    closeDeleteModal() {
        this.deleteModal.classList.remove('show');
        this.currentDeleteId = null;
    }
    
    resetForm() {
        this.entryForm.reset();
        this.autoResizeTextarea();
    }
    
    autoResizeTextarea() {
        this.entryValue.style.height = 'auto';
        this.entryValue.style.height = Math.min(this.entryValue.scrollHeight, 200) + 'px';
    }
    
    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.entryForm);
        const data = {
            key: formData.get('key').trim(),
            value: formData.get('value').trim(),
            tags: formData.get('tags').trim().split(',').map(tag => tag.trim()).filter(tag => tag)
        };
        
        if (!data.key || !data.value) {
            this.showError('Validation Error', 'Title and content are required.');
            return;
        }
        
        try {
            this.setButtonLoading(this.saveBtn, true);
            
            let response;
            if (this.currentEditingId) {
                // Update existing entry
                response = await fetch(`/api/knowledge/${this.currentEditingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } else {
                // Create new entry
                response = await fetch('/api/knowledge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save entry');
            }
            
            const result = await response.json();
            
            if (this.currentEditingId) {
                // Update existing entry in local array
                const index = this.entries.findIndex(e => e.id === this.currentEditingId);
                if (index !== -1) {
                    this.entries[index] = result.entry;
                }
                this.showSuccess('Entry Updated', 'The knowledge entry has been updated successfully.');
            } else {
                // Add new entry to local array
                this.entries.unshift(result.entry);
                this.showSuccess('Entry Created', 'The new knowledge entry has been created successfully.');
            }
            
            // Refresh the display
            this.filteredEntries = [...this.entries];
            this.renderEntries();
            this.updateEntriesCount();
            this.closeModal();
            
        } catch (error) {
            console.error('Error saving entry:', error);
            this.showError('Save Failed', error.message);
        } finally {
            this.setButtonLoading(this.saveBtn, false);
        }
    }
    
    async handleDelete() {
        if (!this.currentDeleteId) return;
        
        try {
            this.setButtonLoading(this.confirmDeleteBtn, true);
            
            const response = await fetch(`/api/knowledge/${this.currentDeleteId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete entry');
            }
            
            // Remove from local array
            this.entries = this.entries.filter(e => e.id !== this.currentDeleteId);
            this.filteredEntries = this.filteredEntries.filter(e => e.id !== this.currentDeleteId);
            
            this.renderEntries();
            this.updateEntriesCount();
            this.closeDeleteModal();
            
            this.showSuccess('Entry Deleted', 'The knowledge entry has been deleted successfully.');
            
        } catch (error) {
            console.error('Error deleting entry:', error);
            this.showError('Delete Failed', error.message);
        } finally {
            this.setButtonLoading(this.confirmDeleteBtn, false);
        }
    }
    
    setButtonLoading(button, loading) {
        const text = button.querySelector('.button-text');
        const loader = button.querySelector('.button-loading');
        
        if (loading) {
            text.style.opacity = '0';
            loader.style.display = 'block';
            button.disabled = true;
        } else {
            text.style.opacity = '1';
            loader.style.display = 'none';
            button.disabled = false;
        }
    }
    
    updateEntriesCount() {
        const total = this.entries.length;
        const filtered = this.filteredEntries.length;
        
        if (total === 0) {
            this.entriesCount.textContent = 'No entries';
        } else if (filtered === total) {
            this.entriesCount.textContent = `${total} ${total === 1 ? 'entry' : 'entries'}`;
        } else {
            this.entriesCount.textContent = `${filtered} of ${total} entries`;
        }
    }
    
    showLoadingState() {
        this.entriesList.innerHTML = `
            <div class="loading-entries">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <span>Loading entries...</span>
            </div>
        `;
        this.entriesCount.textContent = 'Loading...';
    }
    
    showEmptyState() {
        const isSearching = this.searchInput.value.trim() !== '';
        
        if (isSearching) {
            this.entriesList.innerHTML = `
                <div class="no-entries">
                    <h3>No matching entries found</h3>
                    <p>Try adjusting your search terms or <button class="expand-button" onclick="document.getElementById('clearSearchBtn').click()">clear the search</button> to see all entries.</p>
                </div>
            `;
        } else {
            this.entriesList.innerHTML = `
                <div class="no-entries">
                    <h3>No knowledge entries yet</h3>
                    <p>Get started by adding your first knowledge entry to help the AI assistant answer customer questions.</p>
                    <button class="primary-button" onclick="document.getElementById('addEntryBtn').click()" style="margin-top: 1rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Your First Entry
                    </button>
                </div>
            `;
        }
    }
    
    showErrorState() {
        this.entriesList.innerHTML = `
            <div class="no-entries">
                <h3>Failed to load entries</h3>
                <p>There was an error loading the knowledge base entries.</p>
                <button class="primary-button" onclick="location.reload()" style="margin-top: 1rem;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23,4 23,10 17,10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                    Retry
                </button>
            </div>
        `;
        this.entriesCount.textContent = 'Error';
    }
    
    showToast(type, title, message) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconSVG = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2"><polyline points="20,6 9,17 4,12"></polyline></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f39c12" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
        };
        
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">${iconSVG[type]}</div>
                <div class="toast-message">
                    <div class="toast-title">${this.escapeHtml(title)}</div>
                    <div class="toast-text">${this.escapeHtml(message)}</div>
                </div>
            </div>
            <button class="toast-close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        
        // Add close functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.removeToast(toast));
        
        this.toastContainer.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => this.removeToast(toast), 5000);
    }
    
    removeToast(toast) {
        if (toast && toast.parentNode) {
            toast.style.animation = 'toastSlideIn 0.3s ease-out reverse';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }
    
    showSuccess(title, message) {
        this.showToast('success', title, message);
    }
    
    showError(title, message) {
        this.showToast('error', title, message);
    }
    
    showWarning(title, message) {
        this.showToast('warning', title, message);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize admin interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KnowledgeAdmin();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Refresh entries when page becomes visible (in case of external changes)
        const admin = window.knowledgeAdmin;
        if (admin) {
            admin.loadEntries();
        }
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('Connection restored');
});

window.addEventListener('offline', () => {
    console.log('Connection lost');
});