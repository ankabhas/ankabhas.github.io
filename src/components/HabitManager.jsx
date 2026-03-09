import React, { useState } from 'react';
import { PlusCircle, Trash2, Edit2, Save, X } from 'lucide-react';
import { supabase } from '../App';

const HabitManager = ({ habits, refreshData }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'boolean',
    category: 'health',
    target_value: '',
    unit: ''
  });

  const habitTypes = [
    { value: 'boolean', label: 'Yes/No', description: 'Did you do it?', example: 'Meditate, Workout' },
    { value: 'counter', label: 'Counter', description: 'Track a number', example: 'Steps, Water glasses' },
    { value: 'duration', label: 'Duration', description: 'Track time spent', example: 'Screen time, Study' },
    { value: 'time', label: 'Timestamp', description: 'Record a time', example: 'Wake up, Sleep' }
  ];

  const categories = [
    { value: 'health', label: '💚 Health', color: '#10b981' },
    { value: 'fitness', label: '💪 Fitness', color: '#ef4444' },
    { value: 'productivity', label: '📊 Productivity', color: '#3b82f6' },
    { value: 'learning', label: '📚 Learning', color: '#8b5cf6' },
    { value: 'lifestyle', label: '🌟 Lifestyle', color: '#f59e0b' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const habitData = {
      name: formData.name,
      type: formData.type,
      category: formData.category,
      target_value: formData.target_value || null,
      unit: formData.unit || null
    };

    if (editingId) {
      const { error } = await supabase
        .from('habits')
        .update(habitData)
        .eq('id', editingId);
      
      if (error) {
        console.error('Error updating habit:', error);
        alert('Error updating habit');
      } else {
        setEditingId(null);
      }
    } else {
      const { error } = await supabase
        .from('habits')
        .insert([habitData]);
      
      if (error) {
        console.error('Error creating habit:', error);
        alert('Error creating habit');
      }
    }

    setFormData({
      name: '',
      type: 'boolean',
      category: 'health',
      target_value: '',
      unit: ''
    });
    setShowForm(false);
    refreshData();
  };

  const handleEdit = (habit) => {
    setFormData({
      name: habit.name,
      type: habit.type,
      category: habit.category,
      target_value: habit.target_value || '',
      unit: habit.unit || ''
    });
    setEditingId(habit.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting habit:', error);
        alert('Error deleting habit');
      } else {
        refreshData();
      }
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      type: 'boolean',
      category: 'health',
      target_value: '',
      unit: ''
    });
  };

  return (
    <div className="habit-manager">
      <div className="manager-header">
        <h2>Manage Habits</h2>
        <button 
          className="create-habit-btn"
          onClick={() => setShowForm(true)}
        >
          <PlusCircle size={20} />
          New Habit
        </button>
      </div>

      {showForm && (
        <div className="habit-form-overlay">
          <div className="habit-form-container">
            <div className="form-header">
              <h3>{editingId ? 'Edit Habit' : 'Create New Habit'}</h3>
              <button onClick={cancelForm} className="close-btn">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="habit-form">
              <div className="form-group">
                <label>Habit Name</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Morning Meditation"
                  required
                />
              </div>

              <div className="form-group">
                <label>Habit Type</label>
                <div className="habit-type-grid">
                  {habitTypes.map(type => (
                    <label key={type.value} className={`type-option ${formData.type === type.value ? 'selected' : ''}`}>
                      <input 
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      />
                      <div className="type-content">
                        <strong>{type.label}</strong>
                        <span className="type-description">{type.description}</span>
                        <span className="type-example">{type.example}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Category</label>
                <div className="category-grid">
                  {categories.map(cat => (
                    <label key={cat.value} className={`category-option ${formData.category === cat.value ? 'selected' : ''}`}>
                      <input 
                        type="radio"
                        name="category"
                        value={cat.value}
                        checked={formData.category === cat.value}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      />
                      <span style={{ color: cat.color }}>{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {(formData.type === 'counter' || formData.type === 'duration') && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Target {formData.type === 'duration' ? 'Minutes' : 'Value'}</label>
                    <input 
                      type="number"
                      value={formData.target_value}
                      onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                      placeholder={formData.type === 'duration' ? '30' : '10000'}
                      min="1"
                    />
                  </div>

                  {formData.type === 'counter' && (
                    <div className="form-group">
                      <label>Unit</label>
                      <input 
                        type="text"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        placeholder="e.g., steps, glasses"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={cancelForm} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  <Save size={18} />
                  {editingId ? 'Update Habit' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="habits-list">
        {habits.length === 0 ? (
          <div className="empty-state-small">
            <p>No habits created yet. Click "New Habit" to get started!</p>
          </div>
        ) : (
          habits.map(habit => (
            <div key={habit.id} className="habit-list-item">
              <div className="habit-list-info">
                <h4>{habit.name}</h4>
                <div className="habit-meta">
                  <span className="badge">{habit.type}</span>
                  <span className="badge category-badge">{habit.category}</span>
                  {habit.target_value && (
                    <span className="badge">
                      Target: {habit.target_value} {habit.unit}
                    </span>
                  )}
                </div>
              </div>
              <div className="habit-list-actions">
                <button onClick={() => handleEdit(habit)} className="edit-btn">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(habit.id)} className="delete-btn">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HabitManager;
