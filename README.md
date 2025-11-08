# Daily Work Log MVP

A personal daily work log web application built with Next.js and Supabase.

## Features

- 🔐 **Authentication**: Secure signup and login with email/password
- 📝 **Work Logs**: Create, edit, and delete daily work entries
- 🎯 **Multiple Entry Types**: Daily work, goals, learning, wins, help given, feedback, and leave
- ✅ **TODO Lists**: Add and track action items within each log
- 📊 **Dashboard**: Visual analytics with charts showing your work patterns
- 🔍 **Search & Filter**: Find logs by keyword, date range, and entry type
- 📥 **Export**: Download your logs as CSV or JSON
- 🔔 **Reminders**: Get notified about missed daily logs and upcoming deadlines
- 📈 **Streak Tracking**: Monitor your logging consistency

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Supabase (PostgreSQL, Authentication, Row Level Security)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: TanStack Query (React Query)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account ([sign up here](https://supabase.com))
- A Vercel account ([sign up here](https://vercel.com))

### 1. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Run the SQL script to create the database schema
5. Go to Settings → API to find your project credentials:
   - `Project URL` (your Supabase URL)
   - `anon public` key (your Supabase Anon Key)

### 2. Configure Authentication

1. In your Supabase dashboard, go to Authentication → Providers
2. Ensure **Email** provider is enabled
3. Configure email templates if desired (optional)
4. Set your site URL in Authentication → URL Configuration

### 3. Local Development

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### 4. Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click "Deploy"

#### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow the prompts and add environment variables when asked

### 5. Post-Deployment Configuration

1. Copy your Vercel deployment URL
2. Go to your Supabase dashboard → Authentication → URL Configuration
3. Add your Vercel URL to the list of allowed redirect URLs:
   - `https://your-app.vercel.app/**`
4. Test the authentication flow

## Project Structure

```
├── app/
│   ├── dashboard/          # Dashboard and logs pages
│   │   ├── logs/          # Logs listing and CRUD
│   │   │   ├── new/       # Create new log
│   │   │   └── [id]/edit/ # Edit existing log
│   │   ├── layout.tsx     # Dashboard layout with nav
│   │   └── page.tsx       # Dashboard with charts
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (redirects)
│   └── providers.tsx      # React Query provider
├── components/
│   └── DashboardNav.tsx   # Navigation component
├── lib/
│   └── supabase/          # Supabase client configuration
│       ├── client.ts      # Browser client
│       ├── server.ts      # Server client
│       └── middleware.ts  # Auth middleware
├── supabase/
│   └── migrations/        # Database migrations
├── middleware.ts          # Next.js middleware
└── README.md
```

## Database Schema

### `logs` table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| date | date | Date of the log entry |
| entry_type | text | Type of entry (daily_work, goal_progress, etc.) |
| title | text | Log title (max 200 chars) |
| todos | jsonb | Array of todo items |
| description | text | Markdown description |
| deadline | timestamptz | Optional deadline |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

## Key Features Explained

### Row Level Security (RLS)

All database queries are protected by Supabase RLS policies. Users can only access their own logs, enforced at the database level.

### Streak Calculation

The streak counter tracks consecutive days with at least one log entry, starting from today and going backwards.

### Reminders

- **Missing Log**: Dashboard shows a banner if no log exists for today
- **Upcoming Deadlines**: Lists logs with deadlines within 48 hours

### Export Functionality

- **CSV**: All fields exported as comma-separated values
- **JSON**: Array of log objects with full data
- Exports respect current filters and search terms

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| NEXT_PUBLIC_SUPABASE_URL | Your Supabase project URL | Yes |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Your Supabase anonymous key | Yes |

## Troubleshooting

### Authentication Issues

- Verify your Supabase URL and anon key are correct
- Check that email provider is enabled in Supabase
- Ensure your deployment URL is added to allowed redirect URLs

### Database Errors

- Confirm the SQL migration was run successfully
- Check that RLS policies are enabled
- Verify user is authenticated before making queries

### Deployment Issues

- Ensure environment variables are set in Vercel
- Check build logs for any errors
- Verify Node.js version compatibility

## Future Enhancements

- [ ] File attachments using Supabase Storage
- [ ] Email notifications for deadlines
- [ ] AI-powered weekly summaries
- [ ] Mobile app (React Native)
- [ ] Team collaboration features
- [ ] Advanced analytics and insights
- [ ] Import functionality for existing logs

## Support

For issues or questions:
1. Check the [Next.js documentation](https://nextjs.org/docs)
2. Review [Supabase documentation](https://supabase.com/docs)
3. Open an issue in this repository

## License

MIT License - feel free to use this project for personal or commercial purposes.
