<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Atlas - AI-Powered Local Discovery Assistant

Atlas is an intelligent local guide that uses Google Gemini with Google Maps integration to find the best places near you. Features multilingual support (English, Hindi, Bengali), chat and voice modes, and interactive location cards.

## Prerequisites

- Node.js (v18+)
- A valid [Gemini API Key](https://aistudio.google.com/app/apikey)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API Key:**
   Create or edit `.env.local` and add:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Start the backend server:**
   ```bash
   npm run start:server
   ```

4. **Start the frontend (in a new terminal):**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   Navigate to `https://localhost:3000`

> **Note:** Allow location access when prompted - Atlas uses your GPS coordinates to find nearby places within a 5km radius.

## Features

- 🗺️ **Google Maps Integration** - Real-time place recommendations
- 📍 **Location-aware** - 5km radius search based on your current position
- 🗣️ **Voice Mode** - Speak your queries and hear responses
- 🌐 **Multilingual** - English, Hindi, Bengali support
- 📱 **Responsive** - Works on desktop and mobile

