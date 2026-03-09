# HabitFlow - Personal Habit Tracker

A beautiful, Duolingo-inspired habit tracking application built with React and Supabase. Track your daily habits, monitor your progress, and build better routines!

## ✨ Features

- **Multiple Habit Types**
  - ✅ Boolean habits (Yes/No tracking)
  - ⏱️ Duration tracking (screen time, study hours)
  - 🕐 Time stamps (wake up, sleep time)
  - 📊 Counters (steps, water intake)

- **Analytics & Insights**
  - 📈 Visual progress charts (last 14 days)
  - 🔥 Streak tracking (current & longest)
  - 📊 Consistency percentage
  - 💡 Smart insights and recommendations

- **Gamification**
  - 🎯 Daily goals and targets
  - ⭐ Completion badges
  - 🏆 Achievement tracking
  - 🔥 Streak celebrations

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- A Supabase account ([sign up here](https://supabase.com))
- Git installed

### 1. Clone the Repository

\`\`\`bash
git clone <your-repo-url>
cd habit-tracker
npm install
\`\`\`

### 2. Set Up Supabase

#### Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in your project details
4. Wait for the project to be created

#### Create Database Tables

Go to the SQL Editor in your Supabase dashboard and run the following SQL:

\`\`\`sql
-- Create habits table
CREATE TABLE habits (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('boolean', 'counter', 'duration', 'time')),
    category TEXT NOT NULL CHECK (category IN ('health', 'fitness', 'productivity', 'learning', 'lifestyle')),
    target_value TEXT,
    unit TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create habit_entries table
CREATE TABLE habit_entries (
    id BIGSERIAL PRIMARY KEY,
    habit_id BIGINT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(habit_id, entry_date)
);

-- Create indexes for better performance
CREATE INDEX idx_habits_created_at ON habits(created_at);
CREATE INDEX idx_habit_entries_habit_id ON habit_entries(habit_id);
CREATE INDEX idx_habit_entries_date ON habit_entries(entry_date);
CREATE INDEX idx_habit_entries_habit_date ON habit_entries(habit_id, entry_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_habits_updated_at 
    BEFORE UPDATE ON habits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_entries ENABLE ROW LEVEL SECURITY;

-- Create policies (allows all operations for now - customize based on your auth needs)
CREATE POLICY "Enable all access for habits" ON habits
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for habit_entries" ON habit_entries
    FOR ALL USING (true) WITH CHECK (true);
\`\`\`

#### Get Your Supabase Credentials

1. Go to Project Settings → API
2. Copy your **Project URL**
3. Copy your **anon/public key**

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and add your Supabase credentials:

\`\`\`
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
\`\`\`

### 4. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:5173` to see your app!

## 📦 Deployment to GitHub Pages

### 1. Update vite.config.js

If your repository name is not `habit-tracker`, update the `base` in `vite.config.js`:

\`\`\`javascript
export default defineConfig({
  plugins: [react()],
  base: '/your-repo-name/', // Replace with your repo name
})
\`\`\`

### 2. Deploy

\`\`\`bash
# Build and deploy
npm run deploy
\`\`\`

### 3. Enable GitHub Pages

1. Go to your GitHub repository
2. Settings → Pages
3. Source: Deploy from a branch
4. Branch: `gh-pages` / `root`
5. Save

Your app will be live at: `https://yourusername.github.io/your-repo-name/`

## 📊 Database Schema

### habits Table

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| name | TEXT | Habit name (e.g., "Morning Run") |
| type | TEXT | `boolean`, `counter`, `duration`, or `time` |
| category | TEXT | `health`, `fitness`, `productivity`, `learning`, or `lifestyle` |
| target_value | TEXT | Target value for counter/duration habits |
| unit | TEXT | Unit for counter habits (e.g., "steps", "glasses") |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### habit_entries Table

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| habit_id | BIGINT | Foreign key to habits table |
| entry_date | DATE | Date of the entry |
| value | TEXT | Entry value (depends on habit type) |
| created_at | TIMESTAMP | Creation timestamp |

**Unique Constraint:** `(habit_id, entry_date)` - One entry per habit per day

## 🎨 Customization

### Adding New Categories

Edit `src/components/HabitManager.jsx`:

\`\`\`javascript
const categories = [
  { value: 'health', label: '💚 Health', color: '#10b981' },
  { value: 'fitness', label: '💪 Fitness', color: '#ef4444' },
  { value: 'custom', label: '✨ Custom', color: '#ff00ff' }, // Add your category
];
\`\`\`

Update the Supabase CHECK constraint:

\`\`\`sql
ALTER TABLE habits DROP CONSTRAINT habits_category_check;
ALTER TABLE habits ADD CONSTRAINT habits_category_check 
    CHECK (category IN ('health', 'fitness', 'productivity', 'learning', 'lifestyle', 'custom'));
\`\`\`

### Changing Colors

Edit `src/App.css` and modify the color variables in habit cards and components.

## 🔒 Security Notes

The current setup uses public access policies for simplicity. For production:

1. **Enable Supabase Authentication**
2. **Update RLS Policies** to restrict access per user:

\`\`\`sql
-- Drop existing policies
DROP POLICY "Enable all access for habits" ON habits;
DROP POLICY "Enable all access for habit_entries" ON habit_entries;

-- Create user-specific policies (requires auth.users)
CREATE POLICY "Users can manage their own habits" ON habits
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own entries" ON habit_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM habits 
            WHERE habits.id = habit_entries.habit_id 
            AND habits.user_id = auth.uid()
        )
    );
\`\`\`

3. **Add user_id column** to habits table:

\`\`\`sql
ALTER TABLE habits ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
\`\`\`

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite
- **Database:** Supabase (PostgreSQL)
- **UI:** Custom CSS (Duolingo-inspired)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Deployment:** GitHub Pages

## 📝 Usage Tips

1. **Start Simple:** Begin with 2-3 habits you want to build
2. **Be Consistent:** Try to log your habits at the same time each day
3. **Review Weekly:** Check your analytics page to see trends
4. **Adjust Targets:** Don't be afraid to modify targets based on progress
5. **Celebrate Wins:** Enjoy those streak milestones! 🎉

## 🐛 Troubleshooting

### "Cannot connect to Supabase"
- Check your `.env` file has the correct credentials
- Verify your Supabase project is running
- Check browser console for detailed errors

### "Charts not showing data"
- Ensure you have entries logged for the selected habit
- Check that entry dates are within the last 14 days for the chart

### GitHub Pages shows blank page
- Verify `base` in `vite.config.js` matches your repo name
- Check browser console for path errors
- Ensure `gh-pages` branch is selected in repository settings

## 📄 License

MIT License - feel free to use this project however you'd like!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 💡 Future Enhancements

- [ ] User authentication and multi-user support
- [ ] Mobile app (React Native)
- [ ] Habit templates and recommendations
- [ ] Social features (share achievements)
- [ ] Export data to CSV/PDF
- [ ] Dark mode
- [ ] Habit reminders/notifications
- [ ] Weekly/Monthly reports

---

Built with ❤️ for better habits
