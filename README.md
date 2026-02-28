# INOVEST Science Day Event Website

A premium, fast, and smooth website built with Next.js and Supabase for managing event submissions.

## Features
- **Participant Submission**: Easy form for team details, PPT, and additional files.
- **Admin Dashboard**: FCFS ordered submissions, verification (acceptance) logic, and bulk download.
- **Auto-Open PPT**: Accepts a submission and automatically opens the PPT in a new tab.
- **Bulk Download**: Generates a ZIP file with the structure `SerialNumber_TeamName_teamLeaderName`.
- **Premium Design**: Dark mode, glassmorphism, and smooth animations.

## Tech Stack
- **Framework**: Next.js 14
- **Database/Storage**: Supabase
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **ZIP Generation**: JSZip & File-Saver

## Setup Instructions

### 1. Supabase Setup
1. Create a new project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** and run the contents of `supabase_schema.sql` (found in the root directory).
3. Go to **Storage**, create a new bucket named `submissions`, and set it to **Public**.

### 2. Environment Variables
Ensure your `.env` file has the following:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
```

### 3. Local Development
```bash
npm install
npm run dev
```
Visit `http://localhost:3000` for the participant form and `http://localhost:3000/admin` for the dashboard.

### 4. Hosting on Vercel
1. Push your code to a GitHub repository.
2. Connect the repository to [Vercel](https://vercel.com).
3. Add the environment variables in the Vercel dashboard.
4. Deploy!

## Folder Structure
- `src/app/page.js`: Participant submission form.
- `src/app/admin/page.js`: Admin management dashboard.
- `src/app/layout.js` & `globals.css`: Global layout and premium styling.
- `lib/supabase.js`: Supabase client configuration.
- `supabase_schema.sql`: Database schema and policies.
