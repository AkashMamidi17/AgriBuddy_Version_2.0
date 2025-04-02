# AgriBuddy - Restructured Version

This folder contains the restructured version of the AgriBuddy application, with a cleaner separation between frontend and backend code to make it more maintainable and compatible with standard development workflows.

## Project Structure

```
restructured/
├── backend/                 # Backend server code
│   ├── src/
│   │   ├── ai-assistant.ts  # Voice assistant implementation
│   │   ├── auth.ts          # Authentication logic
│   │   ├── db.ts            # Database connection
│   │   ├── index.ts         # Server entry point
│   │   ├── routes.ts        # API routes and WebSocket handling
│   │   ├── storage.ts       # Data storage implementation
│   │   ├── types.ts         # TypeScript interfaces
│   │   └── vite.ts          # Vite integration
│   └── package.json         # Backend dependencies
│
├── frontend/                # Frontend React application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── feature-sections/  # Feature section components
│   │   │   ├── ui/          # UI components (shadcn)
│   │   │   └── ...          # Additional components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   ├── pages/           # Page components
│   │   └── ...              # Other frontend files
│   ├── public/              # Public assets
│   └── package.json         # Frontend dependencies
│
└── shared/                  # Shared code between frontend and backend
    └── schema.ts            # Database schema definitions
```

## Key Features

1. **Voice Assistant**: Multilingual AI assistant with Telugu language support
2. **Marketplace**: Platform for farmers to sell products and equipment
3. **Community**: Forum for farmers to share knowledge and experiences
4. **Crop Management**: Tools for monitoring and managing crops
5. **Weather Updates**: Real-time weather information
6. **Market Insights**: Price trends and market information

## Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: WebSockets (ws)
- **AI Integration**: OpenAI API with local fallback capabilities

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key (optional, local fallback available)

### Running the Application

1. Install dependencies:
   ```
   cd restructured/backend && npm install
   cd restructured/frontend && npm install
   ```

2. Set up environment variables:
   - Create a `.env` file in the backend directory with:
     ```
     DATABASE_URL=postgres://username:password@localhost:5432/agribuddy
     OPENAI_API_KEY=your_openai_api_key (optional)
     ```

3. Start the development server:
   ```
   # Backend
   cd restructured/backend && npm run dev
   
   # Frontend
   cd restructured/frontend && npm run dev
   ```

## Development Notes

- The AI assistant can operate in a local fallback mode if the OpenAI API key is not available
- WebSocket connections are automatically reconnected if the connection is lost
- User authentication is session-based with secure password hashing
- The database schema uses Drizzle ORM for type-safe queries