# AgriBuddy: Agricultural Support Platform

AgriBuddy is a multilingual, AI-powered farming platform that provides comprehensive agricultural support through integrated technologies.

## Features

- **Voice Assistant**: Multilingual support (Telugu, English, Hindi) with AI-powered responses
- **Marketplace**: Buy/sell agricultural products with bidding functionality
- **Community**: Share knowledge, videos, and posts with other farmers
- **Crop Management**: Track and manage your crops with expert advice
- **Equipment Tracking**: Monitor and maintain farming equipment
- **Weather Updates**: Get real-time weather information relevant to farming
- **Market Insights**: Track pricing trends and market opportunities

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/agribudddy.git
   cd agribudddy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file in the project root with the following variables:
   ```
   DATABASE_URL=your_postgres_db_url
   OPENAI_API_KEY=your_openai_api_key
   SESSION_SECRET=your_session_secret
   ```

4. Set up the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:5000`

## User Roles

- **Farmers**: Can access all features including crop management, equipment tracking, marketplace listings
- **Consumers**: Can access marketplace, community posts, and contact farmers

## Project Structure

```
agribudddy/
├── client/            # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions and libraries
│   │   ├── pages/       # Application pages
│   │   ├── App.tsx      # Main application component
│   │   └── main.tsx     # Entry point
│   └── index.html      # HTML template
│
├── server/            # Backend Express server
│   ├── ai-assistant.ts  # Voice assistant implementation
│   ├── auth.ts          # Authentication logic
│   ├── db.ts            # Database connection
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Data storage interface
│   ├── types.ts         # TypeScript types
│   ├── index.ts         # Server entry point
│   └── vite.ts          # Vite configuration
│
├── shared/            # Shared code between client and server
│   └── schema.ts       # Database schema definitions
│
├── public/            # Static files
├── docs/              # Documentation
├── scripts/           # Utility scripts
├── .env               # Environment variables (create this file)
├── package.json       # Project dependencies
└── README.md          # Project documentation
```

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL, Drizzle ORM
- **AI**: OpenAI API (GPT-4o, Whisper, DALL-E 3)
- **Authentication**: Passport.js

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.