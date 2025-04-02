# AgriBuddy: Restructured Project

This directory contains the restructured version of the AgriBuddy project, with a proper separation of frontend and backend code.

## Project Structure

```
restructured/
├── backend/
│   ├── src/
│   │   ├── ai-assistant.ts     # Multilingual AI voice assistant (Telugu support)
│   │   ├── auth.ts             # Authentication with user registration
│   │   ├── db.ts               # Database connection using Drizzle ORM
│   │   ├── index.ts            # Main Express application entry point
│   │   ├── routes.ts           # API and WebSocket routes
│   │   ├── storage.ts          # Data storage implementation
│   │   ├── types.ts            # TypeScript interfaces and types
│   │   └── vite.ts             # Vite integration for development
│   └── drizzle.config.ts       # Drizzle ORM configuration
├── frontend/
│   ├── src/
│   │   ├── components/         # React UI components
│   │   │   ├── feature-sections/
│   │   │   │   ├── crop-management.tsx
│   │   │   │   ├── equipment-section.tsx
│   │   │   │   ├── market-insights.tsx
│   │   │   │   └── weather-updates.tsx
│   │   │   ├── ui/             # Shadcn UI components
│   │   │   ├── product-card.tsx
│   │   │   ├── voice-assistant.tsx
│   │   │   └── navbar.tsx
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── use-websocket.ts
│   │   │   ├── use-auth.tsx
│   │   │   ├── use-mobile.tsx
│   │   │   └── use-toast.ts
│   │   ├── lib/                # Utility functions
│   │   ├── pages/              # Main application pages
│   │   │   ├── home-page.tsx
│   │   │   ├── auth-page.tsx
│   │   │   ├── community.tsx
│   │   │   ├── marketplace.tsx
│   │   │   └── not-found.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── public/                 # Static assets
│   ├── index.html              # HTML entry point
│   ├── tailwind.config.ts      # Tailwind CSS configuration
│   └── postcss.config.js       # PostCSS configuration
└── shared/
    └── schema.ts               # Shared database schema and types
```

## Key Features

1. **Multilingual Voice Assistant**: Primary support for Telugu language with fallback to English
2. **Profile Creation via Voice**: Users can create profiles through voice interaction
3. **Real-time Features**: WebSocket integration for bidding and voice processing
4. **Database Integration**: PostgreSQL with Drizzle ORM
5. **Community Platform**: Farmers can share knowledge and experiences
6. **Marketplace**: Platform for farmers to sell produce with bidding functionality
7. **Responsive Design**: Mobile-first approach for rural farmers

## Technical Implementation

- **Backend**: Express.js with TypeScript
- **Frontend**: React with TypeScript and Shadcn UI components
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy
- **AI Integration**: OpenAI GPT-4o for voice assistance
- **Real-time Communication**: WebSocket for voice and bidding

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   ```
   SESSION_SECRET=your_session_secret
   DATABASE_URL=your_postgres_connection_string
   OPENAI_API_KEY=your_openai_api_key (optional - will use local fallback if not provided)
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Access the application at `http://localhost:5000`