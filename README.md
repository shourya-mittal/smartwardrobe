<div align="center">

<img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
<img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" />
<img src="https://img.shields.io/badge/PostgreSQL-Neon-00E5A0?style=for-the-badge&logo=postgresql&logoColor=white" />
<img src="https://img.shields.io/badge/Groq-AI-F55036?style=for-the-badge" />

<br />
<br />

# 👔 SmartWardrobe

## 🌐 Live Demo
[SmartWardrobe](https://smartwardrobe.vercel.app/)

**An AI-powered wardrobe management and outfit recommendation web application.**

SmartWardrobe lets you digitally catalog your clothing, automatically analyze items using AI vision, and receive intelligent outfit suggestions tailored to your local weather, occasion, and personal style — all from a clean, modern interface.

</div>

---

## ⚡ Key Highlights

- AI-powered clothing recognition using LLM vision
- Real-time weather-based outfit generation
- Smart daily outfit planner with per-day AI caching
- Full-stack app with authentication & secure storage
- Production-ready architecture with scalable backend

---

## 💡 Why This Project?

Managing clothes and choosing outfits is a daily problem.  
This project solves it using AI by:

- Automatically analyzing clothing items
- Reducing decision fatigue
- Providing context-aware outfit suggestions

It combines full-stack engineering with real-world usability.

---

[Features](#-features) · [Tech Stack](#-tech-stack) · [Screenshots](#-screenshots) · [Getting Started](#-getting-started) · [Project Structure](#-project-structure) · [Future Improvements](#-future-improvements)

---

## ✨ Features

### 🧠 AI Clothing Recognition
Upload a photo of any clothing item and the AI automatically detects its type, dominant color, material, fit, pattern, suitable seasons, and appropriate occasions — no manual tagging required.

### 🌤️ Weather-Aware Outfit Suggestions
SmartWardrobe fetches real-time weather data for your location and factors in temperature, conditions, and season when generating outfit recommendations.

### 👗 Smart Outfit Recommendations
Select an occasion and let the AI suggest 3 complete outfit combinations from your wardrobe. The system prioritizes items you haven't worn recently, ensures color coordination, avoids clashing patterns, and matches materials to the weather. When your wardrobe is small, it suggests complementary items to complete the look.

### 📅 Smart Daily Outfit Planner
Every day, the app automatically picks the single best outfit for you based on today's weather, your recent wear history, and your wardrobe tags. The suggestion is generated once and cached for the day — no repeated AI calls. You can refresh it anytime or log it to your history with one tap.

### 🏷️ Rich Clothing Tags
Every item is tagged with type, color, seasons, occasions, material (cotton, wool, denim...), fit (slim, regular, oversized), and pattern (solid, striped, plaid...). These tags power more precise and context-aware AI suggestions. Tags are auto-filled by AI on upload and can be edited anytime.

### 🗂️ Wardrobe Management
Browse your full wardrobe with filtering by clothing type. Add, view, edit tags, and delete items with a clean card-based interface.

### 📅 Outfit History
Every outfit you choose to wear is saved to your history with the date, occasion, and weather conditions at the time.

### 🔐 Secure Authentication
Full email/password authentication with hashed passwords, JWT sessions, and per-user data isolation. Every piece of data and every image is scoped strictly to the logged-in user.

### 🎨 Gender-Aware Suggestions
Outfit recommendations and accessory suggestions respect the user's gender preference, ensuring contextually appropriate styling advice.

### ⚙️ Profile Management
Users can update their display name and change their password directly from the settings page.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Frontend** | React 19, TypeScript, Tailwind CSS v4 |
| **UI Components** | shadcn/ui (New York style) |
| **Database** | PostgreSQL via Neon (serverless) |
| **Authentication** | NextAuth.js (Credentials provider, JWT sessions) |
| **File Storage** | Vercel Blob (private access) |
| **AI — Vision** | `groq-sdk` with `meta-llama/llama-4-scout-17b-16e-instruct` |
| **AI — Outfits** | `@ai-sdk/groq` with `meta-llama/llama-4-scout-17b-16e-instruct` |
| **Weather** | OpenWeatherMap API |
| **Data Fetching** | SWR |
| **Notifications** | Sonner |

---

## 📸 Screenshots

| Dashboard | Wardrobe | Outfit Suggestions |
|---|---|---|
| ![Dashboard](./screenshots/dashboard.png) | ![Wardrobe](./screenshots/wardrobe.png) | ![Suggestions](./screenshots/suggestions.png) |

| Add Clothing (AI Analysis) | Outfit History | Mobile View |
|---|---|---|
| ![Add Clothing](./screenshots/clothing.png) | ![History](./screenshots/history.png) | ![Mobile](./screenshots/mobile.png) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A [Neon](https://neon.tech) database
- A [Vercel](https://vercel.com) account (for Blob storage)
- A [Groq](https://console.groq.com) API key
- An [OpenWeatherMap](https://openweathermap.org/api) API key

### 1. Clone the repository

```bash
git clone https://github.com/your-username/smartwardrobe.git
cd smartwardrobe
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root of the project:

```bash
# Database (Neon)
DATABASE_URL=your_neon_connection_string

# NextAuth
NEXTAUTH_SECRET=your_random_secret_string   # generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Vercel Blob
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# AI
GROQ_API_KEY=your_groq_api_key

# Weather
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key
```

### 4. Set up the database

Run the schema migration in your Neon SQL editor:

```bash
# Copy the contents of scripts/001-create-tables.sql
# and run it in your Neon dashboard → SQL Editor
```

Or connect directly:

```bash
psql $DATABASE_URL -f scripts/001-create-tables.sql
```

> **If upgrading an existing database**, also run these migrations:
> ```sql
> -- Add new clothing tag columns
> ALTER TABLE clothes
>   ADD COLUMN material TEXT NOT NULL DEFAULT 'other',
>   ADD COLUMN fit      TEXT NOT NULL DEFAULT 'regular',
>   ADD COLUMN pattern  TEXT NOT NULL DEFAULT 'solid';
>
> -- Smart daily planner tables
> CREATE TABLE daily_suggestions (
>   id               SERIAL PRIMARY KEY,
>   user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
>   date             DATE NOT NULL,
>   outfit_title     TEXT NOT NULL,
>   reasoning        TEXT NOT NULL,
>   confidence       INT NOT NULL,
>   additional_items JSONB DEFAULT '[]',
>   weather_snapshot JSONB,
>   created_at       TIMESTAMPTZ DEFAULT NOW(),
>   UNIQUE(user_id, date)
> );
>
> CREATE TABLE daily_suggestion_items (
>   id            SERIAL PRIMARY KEY,
>   suggestion_id INT NOT NULL REFERENCES daily_suggestions(id) ON DELETE CASCADE,
>   clothing_id   INT NOT NULL
> );
> ```

### 5. Set up Vercel Blob

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Open your project → **Storage** tab
3. Create a new **Blob** store
4. Copy the `BLOB_READ_WRITE_TOKEN` into your `.env.local`

### 6. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
smartwardrobe/
├── app/
│   ├── api/
│   │   ├── analyze-clothing/   # AI vision endpoint
│   │   ├── auth/               # NextAuth + registration
│   │   ├── clothes/            # Wardrobe CRUD
│   │   │   └── [id]/           # Edit clothing item tags (PATCH)
│   │   ├── daily-suggestion/   # Smart daily outfit planner
│   │   ├── file/               # Private image serving
│   │   ├── outfits/            # Outfit history
│   │   ├── suggest/            # AI outfit recommendations
│   │   ├── upload/             # Image upload to Blob
│   │   ├── user/profile/       # Profile update endpoint
│   │   └── weather/            # OpenWeatherMap proxy
│   ├── dashboard/
│   │   ├── history/            # Outfit history page
│   │   ├── settings/           # User settings & profile editing
│   │   ├── suggest/            # Outfit suggestion page
│   │   └── wardrobe/           # Wardrobe management page
│   ├── login/                  # Login page
│   └── register/               # Registration page
├── components/
│   ├── dashboard/              # Dashboard-specific components
│   │   ├── add-clothing-dialog.tsx
│   │   ├── edit-clothing-dialog.tsx
│   │   ├── clothing-card.tsx
│   │   ├── daily-outfit-widget.tsx
│   │   ├── weather-widget.tsx
│   │   └── sidebar.tsx
│   └── ui/                     # shadcn/ui component library
├── lib/
│   ├── auth.ts                 # NextAuth configuration
│   ├── db.ts                   # Neon database client
│   ├── types.ts                # Shared TypeScript types
│   └── utils.ts                # Utility functions
├── scripts/
│   └── 001-create-tables.sql  # Database schema
└── hooks/                      # Custom React hooks
```

---

## 🗄️ Database Schema

```sql
users                  — id, name, email, password, gender, location, created_at
clothes                — id, user_id, name, type, color, seasons, occasions,
                         material, fit, pattern, image_pathname, last_worn_at
outfits                — id, user_id, occasion, weather (JSONB), ai_generated, worn_at
outfit_items           — id, outfit_id, clothing_id
daily_suggestions      — id, user_id, date, outfit_title, reasoning, confidence,
                         additional_items (JSONB), weather_snapshot (JSONB)
daily_suggestion_items — id, suggestion_id, clothing_id
```

---

## 🔮 Future Improvements

- [ ] **Multiple images per item** — front, back, and detail views
- [ ] **Outfit sharing** — share outfit combinations publicly or with friends
- [ ] **Style preferences** — let users define their aesthetic (minimalist, streetwear, formal-first, etc.)
- [ ] **Seasonal packing lists** — AI-generated suggestions for what to pack for trips
- [ ] **Wear frequency analytics** — charts showing which items you wear most and least
- [ ] **Shopping suggestions** — identify wardrobe gaps and suggest items to buy
- [ ] **Mobile app** — React Native version with camera integration
- [ ] **Collaborative wardrobes** — shared wardrobe spaces for couples or housemates

---

## 🙏 Acknowledgements

- [Groq](https://groq.com) for fast LLM inference
- [Neon](https://neon.tech) for serverless Postgres
- [shadcn/ui](https://ui.shadcn.com) for the component library
- [OpenWeatherMap](https://openweathermap.org) for weather data
- [Vercel](https://vercel.com) for hosting and Blob storage

---

<div align="center">

## 👨‍💻 Author

**Shourya Mittal**  
📧 shouryamittal2004@gmail.com  

</div>
