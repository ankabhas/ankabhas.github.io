import React, { useState } from 'react';
import { Timer, Clock, Hash, Check, Play, Pause, Plus } from 'lucide-react';
import { supabase } from '../App';

const Dashboard = ({ habits, entries, refreshData, loading }) => {
  const [activeTimers, setActiveTimers] = useState({});
  const [inputValues, setInputValues] = useState({});

  const getHabitIcon = (type) => {
    switch (type) {
      case 'duration': return <Timer size={20} />;
      case 'time': return <Clock size={20} />;
      case 'counter': return <Hash size={20} />;
      case 'boolean': return <Check size={20} />;
      default: return <Check size={20} />;
    }
  };

  const getHabitColor = (category) => {
    const colors = {
      health: '#10b981',
      productivity: '#3b82f6',
      lifestyle: '#f59e0b',
      fitness: '#ef4444',
      learning: '#8b5cf6',
      default: '#6366f1'
    };
    return colors[category] || colors.default;
  };

  const getTodayEntry = (habitId) => {
    return entries.find(e => e.habit_id === habitId);
  };

  const saveEntry = async (habitId, value) => {
    const today = new Date().toISOString().split('T')[0];
    const existingEntry = getTodayEntry(habitId);

    const entryData = {
      habit_id: habitId,
      entry_date: today,
      value: value
    };

    if (existingEntry) {
      const { error } = await supabase
        .from('habit_entries')
        .update(entryData)
        .eq('id', existingEntry.id);
      
      if (error) console.error('Error updating entry:', error);
    } else {
      const { error } = await supabase
        .from('habit_entries')
        .insert([entryData]);
      
      if (error) console.error('Error creating entry:', error);
    }

    refreshData();
  };

  const handleBooleanToggle = async (habitId) => {
    const entry = getTodayEntry(habitId);
    const newValue = entry ? (entry.value === '1' ? '0' : '1') : '1';
    await saveEntry(habitId, newValue);
  };

  const handleCounterChange = async (habitId, increment) => {
    const entry = getTodayEntry(habitId);
    const currentValue = entry ? parseInt(entry.value) || 0 : 0;
    const newValue = Math.max(0, currentValue + increment).toString();
    await saveEntry(habitId, newValue);
  };

  const handleCounterInput = (habitId, value) => {
    setInputValues({ ...inputValues, [habitId]: value });
  };

  const handleCounterInputSave = async (habitId) => {
    const raw = inputValues[habitId];
    if (raw === undefined || raw === '') return;
    const parsed = parseInt(raw);
    if (!isNaN(parsed)) {
      await saveEntry(habitId, Math.max(0, parsed).toString());
      setInputValues({ ...inputValues, [habitId]: undefined });
    }
  };

  const handleTimeInput = async (habitId, time) => {
    await saveEntry(habitId, time);
    setInputValues({ ...inputValues, [habitId]: '' });
  };

  const handleDurationInput = async (habitId, minutes) => {
    if (minutes && !isNaN(minutes)) {
      await saveEntry(habitId, minutes.toString());
      setInputValues({ ...inputValues, [habitId]: '' });
    }
  };

  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your habits...</p>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🎯</div>
        <h2>No habits yet!</h2>
        <p>Start building better habits by adding your first one.</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Today's Habits</h2>
        <p className="dashboard-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="habits-grid">
        {habits.map(habit => {
          const entry = getTodayEntry(habit.id);

          const timeToMins = (t) => { const [h, m] = t.split(':'); return parseInt(h) * 60 + parseInt(m); };

          const isExcessive = entry && habit.max_value && (
            habit.type === 'duration' ? parseInt(entry.value) > parseInt(habit.max_value) :
            habit.type === 'time' ? timeToMins(entry.value) > timeToMins(habit.max_value) :
            false
          );

          const isCompleted = !isExcessive && entry && (
            habit.type === 'boolean' ? entry.value === '1' :
            habit.type === 'counter' ? parseInt(entry.value) >= parseInt(habit.target_value) :
            habit.type === 'duration' ? parseInt(entry.value) >= parseInt(habit.target_value) :
            entry.value
          );

          return (
            <div
              key={habit.id}
              className={`habit-card ${isCompleted ? 'completed' : ''} ${isExcessive ? 'excessive' : ''}`}
              style={{ '--habit-color': getHabitColor(habit.category) }}
            >
              <div className="habit-card-header">
                <div className="habit-icon" style={{ background: getHabitColor(habit.category) }}>
                  {getHabitIcon(habit.type)}
                </div>
                <div className="habit-info">
                  <h3>{habit.name}</h3>
                  <span className="habit-category">{habit.category}</span>
                  {isExcessive && <span className="excessive-label">⚠ Excessive</span>}
                </div>
                {isCompleted && <div className="completion-badge">✓</div>}
                {isExcessive && <div className="excessive-badge">!</div>}
              </div>

              <div className="habit-card-body">
                {habit.type === 'boolean' && (
                  <button 
                    className={`toggle-button ${entry?.value === '1' ? 'active' : ''}`}
                    onClick={() => handleBooleanToggle(habit.id)}
                  >
                    {entry?.value === '1' ? 'Done! ✓' : 'Mark Complete'}
                  </button>
                )}

                {habit.type === 'counter' && (
                  <div className="counter-control">
                    <input
                      type="number"
                      min="0"
                      className="counter-input"
                      value={inputValues[habit.id] !== undefined ? inputValues[habit.id] : (entry?.value || '')}
                      placeholder={entry?.value || '0'}
                      onChange={(e) => handleCounterInput(habit.id, e.target.value)}
                      onBlur={() => handleCounterInputSave(habit.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCounterInputSave(habit.id)}
                    />
                    <div className="counter-display">
                      <span className="counter-target">/ {habit.target_value}</span>
                      <span className="counter-unit">{habit.unit}</span>
                    </div>
                  </div>
                )}

                {habit.type === 'time' && (
                  <div className="time-input-group">
                    <input 
                      type="time"
                      value={inputValues[habit.id] || entry?.value || ''}
                      onChange={(e) => setInputValues({ ...inputValues, [habit.id]: e.target.value })}
                      onBlur={(e) => e.target.value && handleTimeInput(habit.id, e.target.value)}
                      className="time-input"
                    />
                    {entry?.value && (
                      <div className="recorded-time">
                        Recorded: {entry.value}
                      </div>
                    )}
                  </div>
                )}

                {habit.type === 'duration' && (
                  <div className="duration-input-group">
                    <div className="duration-display">
                      {entry?.value ? (
                        <>
                          <span className="duration-value">{formatDuration(parseInt(entry.value))}</span>
                          <span className="duration-target">/ {formatDuration(parseInt(habit.target_value))}</span>
                        </>
                      ) : (
                        <span className="duration-placeholder">Not tracked yet</span>
                      )}
                    </div>
                    <div className="duration-input-controls">
                      <input 
                        type="number"
                        placeholder="Minutes"
                        value={inputValues[habit.id] || ''}
                        onChange={(e) => setInputValues({ ...inputValues, [habit.id]: e.target.value })}
                        className="duration-input"
                        min="0"
                      />
                      <button 
                        onClick={() => handleDurationInput(habit.id, inputValues[habit.id])}
                        className="add-duration-btn"
                      >
                        <Plus size={16} /> Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
