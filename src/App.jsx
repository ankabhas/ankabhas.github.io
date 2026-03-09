import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Home, PlusCircle, BarChart3, Settings, Timer, Clock, Hash, Check, TrendingUp, Flame, Target, Calendar } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import HabitManager from './components/HabitManager';
import PasswordGate from './components/PasswordGate';
import './App.css';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
export const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [habits, setHabits] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHabits();
    fetchTodayEntries();
  }, []);

  const fetchHabits = async () => {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching habits:', error);
    } else {
      setHabits(data || []);
    }
    setLoading(false);
  };

  const fetchTodayEntries = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('habit_entries')
      .select('*')
      .gte('entry_date', today)
      .lt('entry_date', new Date(new Date(today).getTime() + 86400000).toISOString().split('T')[0]);
    
    if (error) {
      console.error('Error fetching entries:', error);
    } else {
      setEntries(data || []);
    }
  };

  const refreshData = () => {
    fetchHabits();
    fetchTodayEntries();
  };

  return (
    <PasswordGate>
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <Flame className="logo-icon" />
            <h1>HabitFlow</h1>
          </div>
          <div className="header-stats">
            <div className="stat-badge">
              <Target size={16} />
              <span>{habits.length} habits</span>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        {currentView === 'dashboard' && (
          <Dashboard 
            habits={habits} 
            entries={entries} 
            refreshData={refreshData}
            loading={loading}
          />
        )}
        {currentView === 'habits' && (
          <HabitManager 
            habits={habits} 
            refreshData={refreshData}
          />
        )}
        {currentView === 'analytics' && (
          <Analytics habits={habits} />
        )}
      </main>

      <nav className="bottom-nav">
        <button 
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentView('dashboard')}
        >
          <Home size={24} />
          <span>Today</span>
        </button>
        <button 
          className={`nav-item ${currentView === 'habits' ? 'active' : ''}`}
          onClick={() => setCurrentView('habits')}
        >
          <PlusCircle size={24} />
          <span>Habits</span>
        </button>
        <button 
          className={`nav-item ${currentView === 'analytics' ? 'active' : ''}`}
          onClick={() => setCurrentView('analytics')}
        >
          <BarChart3 size={24} />
          <span>Progress</span>
        </button>
      </nav>
    </div>
    </PasswordGate>
  );
}

export default App;
