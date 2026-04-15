# Spotly

> Discover, save, and remember the places that make your city feel like home.

[Live Demo](https://spotly-murex.vercel.app) · [Figma Mockup](https://www.figma.com/design/2JfsRQw9MV8k8WSE5Mh3sw/Spotly-Mock-up?node-id=1-2)

---

## Overview

Spotly is a location-aware web app that helps you explore nearby places — coffee shops, restaurants, parks, galleries, and cocktail bars — and organize them into personal collections. Search by category, switch cities on the fly, and save any spot to a named collection you can revisit anytime. It's part city guide, part personal scrapbook.

---

## Features

- **Location-aware discovery** — uses your GPS or a manual city search to surface nearby spots via Google Local results
- **Category filtering** — browse by Coffee, Restaurants, Parks, Galleries, or Cocktails
- **Smart search** — live text search across all loaded places
- **Collections** — create named collections (e.g. "Weekend Cafes") and save spots into them
- **Auth system** — JWT-based sign up / login with profile editing and avatar support
- **API caching** — SerpAPI results are cached in PostgreSQL with a 30-day TTL and a 75 km radius proximity match, keeping response times fast and API costs low
- **Responsive UI** — clean, minimal design built with Tailwind CSS

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React, TypeScript, Tailwind CSS         |
| Routing    | React Router v6                         |
| Backend    | Node.js, Express, TypeScript            |
| Database   | PostgreSQL                              |
| Places API | SerpAPI (Google Local)                  |
| Geocoding  | Nominatim (OpenStreetMap)               |
| Auth       | JWT                                     |
| Deploy     | Vercel                                  |

---

## Screenshots

<!-- Add 1–2 screenshots or a GIF of the Discover page and Collections page here -->

---

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL database
- SerpAPI key

### Installation

```bash
git clone https://github.com/Smat-ctrl/Spotly.git
cd Spotly
npm install
```

### Environment Variables

Create a `.env` file in `/backend`:
DATABASE_URL=your_postgres_connection_string
SERP_API_KEY=your_serpapi_key
JWT_SECRET=your_jwt_secret

### Running Locally

```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd App && npm run dev
```

---

## Project Structure
Spotly/
├── App/          # React + TypeScript frontend
│   ├── features/ # Discover, Collections, Profile feature modules
│   ├── pages/    # Route-level page components
│   └── components/
├── backend/      # Express API, auth, DB, SerpAPI integration
└── package.json

---

## Author

Samuel Mathew · [GitHub](https://github.com/Smat-ctrl) · [LinkedIn](https://www.linkedin.com/in/smat-ctrl/)
