# VyomAi - AI Technology Company Website

> Futuristic 2050-themed website for VyomAi — an AI technology company building next-generation solutions.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS 3, shadcn/ui, Framer Motion
- **Backend**: Express.js, Node.js
- **Database**: Firebase Firestore (with in-memory fallback for development)
- **AI**: Google Gemini API
- **Deployment**: Vercel

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

## Environment Variables

### Required (Server)
- `GEMINI_API_KEY` — Google Gemini API key for AI features
- `FIREBASE_SERVICE_ACCOUNT` — Firebase service account JSON (base64 encoded)
- `JWT_SECRET` — Secret key for JWT authentication
- `SESSION_SECRET` — Session encryption key

### Optional (Server)
- `SOCIAL_MEDIA_ENCRYPTION_KEY` — Key for encrypting social media tokens
- `ADMIN_EMAIL` — Admin contact email address

### Optional (Client - VITE_ prefix)
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID for login

## Project Structure

```
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Route pages
│   │   ├── lib/         # Utilities & hooks
│   │   └── test/        # Test files
│   └── public/      # Static assets
├── server/          # Express backend
│   ├── routes.ts    # API routes
│   ├── storage.ts   # Data layer (Firebase/Memory)
│   └── email-service.ts
├── shared/          # Shared types & schemas
│   └── schema.ts    # Zod schemas, TypeScript types
└── vercel.json      # Vercel deployment config
```

## Deployment

### Vercel (Production)
```bash
# Deploy to production
vercel --prod --yes
```

### Local Development
```bash
# Start dev server on port 5000
npm run dev
```

## Admin Access

- **URL**: `/admin`
- **Login**: QR code or email-based authentication
- **Default credentials**: See `.env.vercel` (never commit to git)

## Key Features

- **AI Solutions Finder** — Interactive quiz to match users with solutions
- **AI Consultant Chat** — Real-time AI chat assistant with streaming
- **Smart Search** — Cmd+K global search modal
- **Multi-language Support** — English, Nepali, Hindi
- **Dark/Light Theme** — Toggle with system preference detection
- **Responsive Design** — Optimized for mobile, tablet, and desktop

## Brand Palette

- **Primary**: `#8a50e8` (Violet)
- **Mid**: `#c060d0` (Magenta)
- **Accent**: `#e07040` (Orange)
- **Neon**: `#39FF14` (Green glow)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run test` | Run test suite |
| `npm run check` | TypeScript type checking |

## License

MIT
