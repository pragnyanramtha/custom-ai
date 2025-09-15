import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface KnowledgeEntry {
  id: string;
  key: string;
  value: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export function AdminPanel() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ key: '', value: '', tags: '' });

  // Load entries on component mount
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/knowledge');
      const data = await response.json();
      
      if (response.ok) {
        setEntries(data.entries || []);
      } else {
        console.error('Failed to load entries:', data.message);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchEntries = async (query: string) => {
    if (!query.trim()) {
      loadEntries();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/knowledge/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (response.ok) {
        setEntries(data.results || []);
      } else {
        console.error('Search failed:', data.message);
      }
    } catch (error) {
      console.error('Error searching entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createEntry = async () => {
    if (!newEntry.key.trim() || !newEntry.value.trim()) {
      alert('Key and value are required');
      return;
    }

    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: newEntry.key.trim(),
          value: newEntry.value.trim(),
          tags: newEntry.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEntries(prev => [data.entry, ...prev]);
        setNewEntry({ key: '', value: '', tags: '' });
        setShowCreateForm(false);
      } else {
        alert('Failed to create entry: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating entry:', error);
      alert('Error creating entry');
    }
  };

  const updateEntry = async (id: string, updates: Partial<KnowledgeEntry>) => {
    try {
      const response = await fetch(`/api/knowledge/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (response.ok) {
        setEntries(prev => prev.map(entry => 
          entry.id === id ? data.entry : entry
        ));
        setEditingEntry(null);
      } else {
        alert('Failed to update entry: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Error updating entry');
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEntries(prev => prev.filter(entry => entry.id !== id));
      } else {
        const data = await response.json();
        alert('Failed to delete entry: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error deleting entry');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchEntries(searchQuery);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base Admin</h1>
          <p className="text-gray-600 mt-1">Manage your AI chatbot's knowledge entries</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Create */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search knowledge entries..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </form>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Create New Entry</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                <input
                  type="text"
                  value={newEntry.key}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, key: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter key..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <textarea
                  value={newEntry.value}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, value: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter value..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newEntry.tags}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tag1, tag2, tag3..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createEntry}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewEntry({ key: '', value: '', tags: '' });
                  }}
                  className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Entries List */}
        <div className="bg-white rounded-lg shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No knowledge entries found.</p>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    loadEntries();
                  }}
                  className="text-blue-600 hover:text-blue-700 mt-2"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {entries.map((entry) => (
                <EntryItem
                  key={entry.id}
                  entry={entry}
                  isEditing={editingEntry?.id === entry.id}
                  onEdit={() => setEditingEntry(entry)}
                  onSave={(updates) => updateEntry(entry.id, updates)}
                  onCancel={() => setEditingEntry(null)}
                  onDelete={() => deleteEntry(entry.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface EntryItemProps {
  entry: KnowledgeEntry;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<KnowledgeEntry>) => void;
  onCancel: () => void;
  onDelete: () => void;
}

function EntryItem({ entry, isEditing, onEdit, onSave, onCancel, onDelete }: EntryItemProps) {
  const [editData, setEditData] = useState({
    key: entry.key,
    value: entry.value,
    tags: entry.tags?.join(', ') || ''
  });

  const handleSave = () => {
    onSave({
      key: editData.key.trim(),
      value: editData.value.trim(),
      tags: editData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    });
  };

  if (isEditing) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
            <input
              type="text"
              value={editData.key}
              onChange={(e) => setEditData(prev => ({ ...prev, key: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
            <textarea
              value={editData.value}
              onChange={(e) => setEditData(prev => ({ ...prev, value: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              type="text"
              value={editData.tags}
              onChange={(e) => setEditData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">{entry.key}</h3>
          <p className="text-gray-700 mb-3 whitespace-pre-wrap">{entry.value}</p>
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {entry.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="text-xs text-gray-500">
            Created: {new Date(entry.createdAt).toLocaleString()}
            {entry.updatedAt !== entry.createdAt && (
              <span className="ml-4">
                Updated: {new Date(entry.updatedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}