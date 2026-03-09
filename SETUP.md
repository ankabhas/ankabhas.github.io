# Quick Setup Guide

## Step 1: Install Dependencies
\`\`\`bash
npm install
\`\`\`

## Step 2: Set Up Supabase

1. **Create a Supabase account** at https://supabase.com
2. **Create a new project**
3. **Run the schema**: 
   - Go to SQL Editor in Supabase Dashboard
   - Copy and paste contents of `supabase-schema.sql`
   - Click "Run"

## Step 3: Configure Environment

1. **Copy the example env file**:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. **Get your Supabase credentials**:
   - Go to Project Settings → API in Supabase
   - Copy "Project URL"
   - Copy "anon/public key"

3. **Update .env file**:
   \`\`\`
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   \`\`\`

## Step 4: Run Locally

\`\`\`bash
npm run dev
\`\`\`

Visit: http://localhost:5173

## Step 5: Deploy to GitHub Pages

1. **Create a GitHub repository** and push your code

2. **Update vite.config.js** (if needed):
   \`\`\`javascript
   base: '/your-repo-name/'
   \`\`\`

3. **Deploy**:
   \`\`\`bash
   npm run deploy
   \`\`\`

4. **Enable GitHub Pages**:
   - Go to repo Settings → Pages
   - Select `gh-pages` branch
   - Save

Done! 🎉

## Troubleshooting

**Can't connect to Supabase?**
- Check .env file has correct credentials
- Verify Supabase project is active
- Check browser console for errors

**GitHub Pages shows blank page?**
- Verify `base` in vite.config.js
- Check repository name matches
- Wait 2-3 minutes for deployment

**Need help?** Check the full README.md
