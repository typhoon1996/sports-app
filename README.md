# Sports App - PWA MVP

A Progressive Web App for organizing and discovering casual sports activities in your area.

## Project Structure

```
sports-app/
├── frontend/          # Next.js React frontend
├── backend/           # Node.js Express backend
├── docs/              # Documentation
└── README.md          # This file
```

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Docker Desktop (for PostgreSQL)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd sports-app
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../backend
   npm install
   ```

4. **Set up PostgreSQL with Docker**
   ```bash
   docker run --name sports-db -e POSTGRES_PASSWORD=sports2025 -p 5432:5432 -d postgres
   ```

5. **Set up Environment Variables**
   - Copy `.env.example` to `.env` in both frontend and backend folders
   - Fill in the required values

### Development

1. **Start the database**
   ```bash
   docker start sports-db
   ```

2. **Start the backend**
   ```bash
   cd backend
   npm run dev
   ```

3. **Start the frontend**
   ```bash
   cd frontend
   npm run dev
   ```

## Features (MVP)

- [x] User authentication (signup/login)
- [x] User profiles
- [x] Match creation and discovery
- [x] Real-time chat
- [x] Location-based search
- [x] Ratings and reviews
- [x] PWA capabilities (offline, installable)

## Tech Stack

### Frontend
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- PWA features

### Backend
- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM
- JWT Authentication
- Socket.io (real-time features)

### Infrastructure
- Docker (PostgreSQL)
- Google Cloud Platform (deployment)
- Firebase (push notifications)

## Development Progress

- [x] Sprint 0: Environment setup and project initialization
- [ ] Sprint 1: Backend APIs and database design
- [ ] Sprint 2: User authentication and profiles
- [ ] Sprint 3: Match discovery and creation
- [ ] Sprint 4: Real-time chat and notifications
- [ ] Sprint 5: Ratings and reviews
- [ ] Sprint 6: PWA optimization and testing
- [ ] Sprint 7: Pre-launch preparation
- [ ] Sprint 8: Launch and monitoring

## Contributing

This is a personal project for learning purposes. Feel free to fork and experiment!

## License

MIT
