# 📊 Jimaku Bunseki (字幕分析)

**Jimaku Bunseki** is a specialized PWA (Progressive Web App) designed to analyze Japanese subtitles (`.srt`). It helps learners determine the difficulty of an Anime or J-Drama by analyzing vocabulary frequency and JLPT levels.

## 🚀 Features

- **Multi-file Upload**: Analyze entire seasons (batch upload 6 files).
- **JLPT Breakdown**: See the distribution of N5-N1 vocabulary.
- **Frequency Analysis**: Based on BCCWJ corpus ranking.
- **PWA Support**: Installable on mobile and desktop.
- **Offline History**: Saves analysis results locally using IndexedDB.
- **Privacy Focused**: Parsing happens client-side; raw text is not stored on servers.

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (Read-only Dictionary), IndexedDB (Local History)
- **Charts**: Recharts
- **Icons**: Lucide React

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/jimaku-bunseki.git
   cd jimaku-bunseki
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run local server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## ☁️ Deployment (Vercel)

This project is configured for seamless deployment on Vercel.

1. Push this code to your GitHub repository.
2. Go to [Vercel Dashboard](https://vercel.com).
3. Click **"Add New..."** -> **"Project"**.
4. Import your `jimaku-bunseki` repository.
5. Vercel will automatically detect **Vite**.
6. Click **Deploy**.

## 📄 License

MIT License. Created by Philia Space Community.
