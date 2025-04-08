# Responsive Website with Marketplace and Community Features
# AgriBuddy Project is to create an AI Assistant for Farmers to help in Agriculture and to use AI to its extent to help Farmers. 

A full-stack web application built with React, TypeScript, and Express.js that includes marketplace and community features.

## Features

- User authentication (login/register)
- Marketplace for product listings and bidding
- Community page with video sharing
- Responsive design
- Real-time updates

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend: Express.js, TypeScript
- Authentication: Passport.js
- Database: In-memory storage (for demo purposes)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd ResponsiveWebsite
```

2. Install dependencies for both client and server:
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Create a `.env` file in the server directory with the following variables:
```
PORT=5000
NODE_ENV=development
SESSION_SECRET=your-secret-key
```

4. Start the development servers:
```bash
# Start the backend server
cd server
npm run dev

# Start the frontend server (in a new terminal)
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3001
- Backend: http://localhost:5000

## Project Structure

```
ResponsiveWebsite/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utility functions
├── server/                # Backend Express application
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Express middleware
│   │   └── models/       # Data models
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
