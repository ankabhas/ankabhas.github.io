import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { PlusCircle, Trash2, X, Save, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { supabase } from '../App';

const DIRECTIONS = [
  { value: 'decrease', label: '↓ Decrease', icon: <TrendingDown size={16} /> },
  { value: 'increase', label: '↑ Increase', icon: <TrendingUp size={16} /> },
  { value: 'maintain', label: '→ Maintain', icon: <Minus size={16} /> },
];

const MilestoneTracker = () => {
  const [milestones, setMilestones] = useState([]);
  const [entries, setEntries] = useState({});          // { milestoneId: [...entries] }
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logValue, setLogValue] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState({ name: '', unit: '', goal_value: '', goal_direction: 'decrease' });

  useEffect(() => {
    fetchMilestones();
  }, []);

  useEffect(() => {
    if (selected) fetchEntries(selected);
  }, [selected]);

  const fetchMilestones = async () => {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) { console.error(error); return; }
    setMilestones(data || []);
    if (data?.length > 0 && !selected) setSelected(data[0].id);
  };

  const fetchEntries = async (milestoneId) => {
    const { data, error } = await supabase
      .from('milestone_entries')
      .select('*')
      .eq('milestone_id', milestoneId)
      .order('entry_date', { ascending: true });
    if (error) { console.error(error); return; }
    setEntries(prev => ({ ...prev, [milestoneId]: data || [] }));
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('milestones').insert([{
      name: form.name,
      unit: form.unit,
      goal_value: form.goal_value ? parseFloat(form.goal_value) : null,
      goal_direction: form.goal_direction,
    }]);
    if (error) { console.error(error); return; }
    setForm({ name: '', unit: '', goal_value: '', goal_direction: 'decrease' });
    setShowForm(false);
    fetchMilestones();
  };

  const handleDeleteMilestone = async (id) => {
    if (!window.confirm('Delete this milestone and all its entries?')) return;
    await supabase.from('milestones').delete().eq('id', id);
    if (selected === id) setSelected(null);
    fetchMilestones();
  };

  const handleLogEntry = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('milestone_entries').insert([{
      milestone_id: selected,
      entry_date: logDate,
      value: parseFloat(logValue),
      notes: logNotes || null,
    }]);
    if (error) { console.error(error); return; }
    setLogValue('');
    setLogNotes('');
    setLogDate(new Date().toISOString().split('T')[0]);
    setShowLogForm(false);
    fetchEntries(selected);
  };

  const handleDeleteEntry = async (entryId) => {
    await supabase.from('milestone_entries').delete().eq('id', entryId);
    fetchEntries(selected);
  };

  const selectedMilestone = milestones.find(m => m.id === selected);
  const currentEntries = (selected && entries[selected]) || [];

  const chartData = currentEntries.map(e => ({
    date: new Date(e.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: parseFloat(e.value),
    notes: e.notes,
  }));

  const latest = currentEntries[currentEntries.length - 1];
  const first = currentEntries[0];
  const change = latest && first && first !== latest
    ? (parseFloat(latest.value) - parseFloat(first.value)).toFixed(1)
    : null;

  const goalValue = selectedMilestone?.goal_value;
  const goalDirection = selectedMilestone?.goal_direction;

  const progressTowardGoal = () => {
    if (!goalValue || !latest || !first) return null;
    const total = Math.abs(parseFloat(first.value) - goalValue);
    const done = Math.abs(parseFloat(latest.value) - parseFloat(first.value));
    if (total === 0) return 100;
    const pct = Math.min(100, Math.round((done / total) * 100));
    // Direction check: if goal is decrease, progress means value went down
    if (goalDirection === 'decrease') return parseFloat(latest.value) < parseFloat(first.value) ? pct : 0;
    if (goalDirection === 'increase') return parseFloat(latest.value) > parseFloat(first.value) ? pct : 0;
    return pct;
  };

  const progress = progressTowardGoal();

  return (
    <div className="milestone-tracker">
      <div className="milestone-header">
        <h2>Milestones</h2>
        <button className="create-habit-btn" onClick={() => setShowForm(true)}>
          <PlusCircle size={20} /> New Milestone
        </button>
      </div>

      {/* Create milestone modal */}
      {showForm && (
        <div className="habit-form-overlay">
          <div className="habit-form-container">
            <div className="form-header">
              <h3>New Milestone</h3>
              <button onClick={() => setShowForm(false)} className="close-btn"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateMilestone} className="habit-form">
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Body Weight" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Unit</label>
                  <input type="text" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                    placeholder="kg, lbs, %" required />
                </div>
                <div className="form-group">
                  <label>Goal Value <span className="label-hint">(optional)</span></label>
                  <input type="number" step="0.1" value={form.goal_value}
                    onChange={e => setForm({ ...form, goal_value: e.target.value })}
                    placeholder="e.g., 75" />
                </div>
              </div>
              <div className="form-group">
                <label>Direction</label>
                <div className="direction-grid">
                  {DIRECTIONS.map(d => (
                    <label key={d.value} className={`direction-option ${form.goal_direction === d.value ? 'selected' : ''}`}>
                      <input type="radio" name="direction" value={d.value} checked={form.goal_direction === d.value}
                        onChange={e => setForm({ ...form, goal_direction: e.target.value })} />
                      {d.icon} {d.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="submit-btn"><Save size={18} /> Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {milestones.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <h2>No milestones yet</h2>
          <p>Add a milestone like weight, body fat %, or any metric you track over time.</p>
        </div>
      ) : (
        <>
          {/* Milestone pills */}
          <div className="milestone-pills">
            {milestones.map(m => (
              <div key={m.id} className={`milestone-pill ${selected === m.id ? 'active' : ''}`}
                onClick={() => setSelected(m.id)}>
                <span>{m.name}</span>
                <button className="pill-delete" onClick={e => { e.stopPropagation(); handleDeleteMilestone(m.id); }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          {selectedMilestone && (
            <div className="milestone-detail">
              {/* Summary cards */}
              <div className="milestone-summary">
                <div className="ms-card">
                  <div className="ms-label">Latest</div>
                  <div className="ms-value">{latest ? `${parseFloat(latest.value)} ${selectedMilestone.unit}` : '—'}</div>
                </div>
                <div className="ms-card">
                  <div className="ms-label">Change</div>
                  <div className={`ms-value ${change !== null ? (parseFloat(change) < 0 ? 'trend-down' : 'trend-up') : ''}`}>
                    {change !== null ? `${parseFloat(change) > 0 ? '+' : ''}${change} ${selectedMilestone.unit}` : '—'}
                  </div>
                </div>
                {goalValue && (
                  <div className="ms-card">
                    <div className="ms-label">Goal</div>
                    <div className="ms-value">{goalValue} {selectedMilestone.unit}</div>
                  </div>
                )}
                {progress !== null && (
                  <div className="ms-card ms-progress-card">
                    <div className="ms-label">Progress</div>
                    <div className="ms-value">{progress}%</div>
                    <div className="ms-progress-bar">
                      <div className="ms-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Chart */}
              {chartData.length > 1 && (
                <div className="chart-container">
                  <h3>{selectedMilestone.name} over time</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            const p = payload[0].payload;
                            return (
                              <div className="custom-tooltip">
                                <p><strong>{p.value} {selectedMilestone.unit}</strong></p>
                                {p.notes && <p style={{ color: '#6b7280', fontSize: '0.8rem' }}>{p.notes}</p>}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {goalValue && (
                        <ReferenceLine y={goalValue} stroke="#10b981" strokeDasharray="5 5"
                          label={{ value: 'Goal', position: 'right', fontSize: 11, fill: '#10b981' }} />
                      )}
                      <Line type="monotone" dataKey="value" stroke="#667eea" strokeWidth={2.5}
                        dot={{ r: 4, fill: '#667eea' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Log entry */}
              <div className="milestone-log-section">
                <div className="milestone-log-header">
                  <h3>Log Entry</h3>
                  <button className="log-entry-btn" onClick={() => setShowLogForm(v => !v)}>
                    {showLogForm ? <X size={18} /> : <PlusCircle size={18} />}
                    {showLogForm ? 'Cancel' : 'Add Entry'}
                  </button>
                </div>

                {showLogForm && (
                  <form onSubmit={handleLogEntry} className="log-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Value ({selectedMilestone.unit})</label>
                        <input type="number" step="0.1" value={logValue}
                          onChange={e => setLogValue(e.target.value)} placeholder="e.g., 78.5" required />
                      </div>
                      <div className="form-group">
                        <label>Date</label>
                        <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Notes <span className="label-hint">(optional)</span></label>
                      <input type="text" value={logNotes} onChange={e => setLogNotes(e.target.value)}
                        placeholder="e.g., after morning workout" />
                    </div>
                    <button type="submit" className="submit-btn"><Save size={16} /> Save Entry</button>
                  </form>
                )}
              </div>

              {/* Entry history */}
              <div className="milestone-history">
                <h3>History</h3>
                {currentEntries.length === 0 ? (
                  <p className="no-entries">No entries yet. Log your first one above.</p>
                ) : (
                  <div className="history-list">
                    {[...currentEntries].reverse().map(e => (
                      <div key={e.id} className="history-item">
                        <div className="history-main">
                          <span className="history-value">{parseFloat(e.value)} {selectedMilestone.unit}</span>
                          <span className="history-date">{new Date(e.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        {e.notes && <p className="history-notes">{e.notes}</p>}
                        <button className="delete-btn" onClick={() => handleDeleteEntry(e.id)}><Trash2 size={15} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MilestoneTracker;
