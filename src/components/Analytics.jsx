import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Flame, Calendar, Award } from 'lucide-react';
import { supabase } from '../App';

const Analytics = ({ habits }) => {
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalEntries: 0,
    consistency: 0
  });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (habits.length > 0 && !selectedHabit) {
      setSelectedHabit(habits[0].id);
    }
  }, [habits]);

  useEffect(() => {
    if (selectedHabit) {
      fetchHabitData(selectedHabit);
    }
  }, [selectedHabit]);

  const fetchHabitData = async (habitId) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('habit_entries')
      .select('*')
      .eq('habit_id', habitId)
      .gte('entry_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('entry_date', { ascending: true });

    if (error) {
      console.error('Error fetching entries:', error);
      return;
    }

    setEntries(data || []);
    calculateStats(data || [], habitId);
    prepareChartData(data || [], habitId);
  };

  const calculateStats = (entriesData, habitId) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    // Calculate streaks
    const sortedEntries = [...entriesData].sort((a, b) => 
      new Date(b.entry_date) - new Date(a.entry_date)
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i].entry_date);
      entryDate.setHours(0, 0, 0, 0);

      const isComplete = checkIfComplete(sortedEntries[i], habit);

      if (isComplete) {
        if (i === 0) {
          const daysDiff = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 1) {
            currentStreak = 1;
          }
        }

        tempStreak++;

        if (i > 0) {
          const prevDate = new Date(sortedEntries[i - 1].entry_date);
          prevDate.setHours(0, 0, 0, 0);
          const daysDiff = Math.floor((prevDate - entryDate) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 1) {
            if (currentStreak > 0) currentStreak++;
          } else {
            tempStreak = 1;
          }
        }

        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Calculate consistency (% of days with entries in last 30 days)
    const consistency = Math.round((entriesData.length / 30) * 100);

    setStats({
      currentStreak,
      longestStreak,
      totalEntries: entriesData.length,
      consistency
    });
  };

  const checkIfComplete = (entry, habit) => {
    if (habit.type === 'boolean') {
      return entry.value === '1';
    } else if (habit.type === 'counter' || habit.type === 'duration') {
      return parseInt(entry.value) >= parseInt(habit.target_value);
    } else {
      return !!entry.value;
    }
  };

  const prepareChartData = (entriesData, habitId) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    // Get last 14 days
    const last14Days = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last14Days.push(date.toISOString().split('T')[0]);
    }

    const data = last14Days.map(date => {
      const entry = entriesData.find(e => e.entry_date === date);
      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
      
      if (habit.type === 'boolean') {
        return {
          date: dayName,
          value: entry?.value === '1' ? 1 : 0,
          label: entry?.value === '1' ? 'Done' : 'Not Done'
        };
      } else if (habit.type === 'counter' || habit.type === 'duration') {
        return {
          date: dayName,
          value: entry ? parseInt(entry.value) : 0,
          target: parseInt(habit.target_value) || 0
        };
      } else if (habit.type === 'time') {
        return {
          date: dayName,
          value: entry?.value ? convertTimeToMinutes(entry.value) : null,
          label: entry?.value || 'No data'
        };
      }
    });

    setChartData(data);
  };

  const convertTimeToMinutes = (time) => {
    const [hours, minutes] = time.split(':');
    return parseInt(hours) * 60 + parseInt(minutes);
  };

  const formatTimeFromMinutes = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  if (habits.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <h2>No data yet!</h2>
        <p>Start tracking habits to see your progress here.</p>
      </div>
    );
  }

  const selectedHabitData = habits.find(h => h.id === selectedHabit);

  return (
    <div className="analytics">
      <div className="analytics-header">
        <h2>Your Progress</h2>
      </div>

      <div className="habit-selector">
        <label>Select Habit:</label>
        <select 
          value={selectedHabit || ''} 
          onChange={(e) => setSelectedHabit(parseInt(e.target.value))}
        >
          {habits.map(habit => (
            <option key={habit.id} value={habit.id}>
              {habit.name}
            </option>
          ))}
        </select>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ef4444' }}>
            <Flame size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.currentStreak}</div>
            <div className="stat-label">Current Streak</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b' }}>
            <Award size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.longestStreak}</div>
            <div className="stat-label">Longest Streak</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#10b981' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.consistency}%</div>
            <div className="stat-label">Consistency (30d)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#3b82f6' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalEntries}</div>
            <div className="stat-label">Total Entries</div>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <h3>Last 14 Days</h3>
        {selectedHabitData && (
          <ResponsiveContainer width="100%" height={300}>
            {selectedHabitData.type === 'boolean' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 1]} ticks={[0, 1]} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <p>{payload[0].payload.label}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            ) : selectedHabitData.type === 'time' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  tickFormatter={formatTimeFromMinutes}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <p>{payload[0].payload.label}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} name="Actual" />
                {selectedHabitData.target_value && (
                  <Line type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="Target" />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      <div className="insights-section">
        <h3>Insights</h3>
        <div className="insight-cards">
          {stats.currentStreak >= 7 && (
            <div className="insight-card success">
              <Flame size={20} />
              <p>🔥 Amazing! You're on a {stats.currentStreak} day streak!</p>
            </div>
          )}
          {stats.consistency >= 80 && (
            <div className="insight-card success">
              <TrendingUp size={20} />
              <p>⭐ Excellent consistency! You've tracked {stats.consistency}% of days.</p>
            </div>
          )}
          {stats.consistency < 50 && stats.totalEntries > 0 && (
            <div className="insight-card warning">
              <TrendingDown size={20} />
              <p>💪 Let's improve! Try tracking more consistently.</p>
            </div>
          )}
          {stats.currentStreak === 0 && stats.totalEntries > 0 && (
            <div className="insight-card info">
              <Calendar size={20} />
              <p>🎯 Start a new streak today!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
