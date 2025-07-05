# Sports App - PWA MVP

A Progressive Web App for organizing and discovering casual sports activities in your area.

## 🚀 Project Structure (Optimized)

```
sports-app/
├── frontend/              # Next.js 15 React frontend (Turbopack)
│   ├── src/
│   │   ├── app/          # App Router structure
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility libraries
│   │   ├── services/     # API service layer
│   │   ├── store/        # Zustand state management
│   │   └── types/        # TypeScript type definitions
│   ├── public/           # Static assets
│   └── package.json      # Frontend dependencies
├── backend/               # Node.js Express backend (Optimized)
│   ├── src/
│   │   ├── config/       # Database & app configuration
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Custom middleware (performance, auth)
│   │   ├── models/       # Sequelize ORM models
│   │   ├── routes/       # API route definitions
│   │   ├── socket/       # Socket.io real-time handlers
│   │   └── utils/        # Helper functions
│   ├── db/              # Database initialization
│   ├── logs/            # Application logs
│   └── package.json     # Backend dependencies
├── scripts/             # Development & deployment scripts
├── docs/               # Documentation
├── docker-compose.yml  # PostgreSQL & Redis containers
├── start-dev.ps1       # Enhanced development launcher
└── package.json        # Monorepo workspace configuration
```

## ⚡ Quick Start (Enhanced)

### Prerequisites
- Node.js (v18+ required, v20+ recommended)
- npm (v9+ required)
- Docker Desktop (for PostgreSQL & Redis)
- Git
- PowerShell (Windows) or Bash (macOS/Linux)

### 🚀 One-Command Setup

```powershell
# Windows PowerShell
.\start-dev.ps1 -Setup

# Or step by step:
.\scripts\setup-env.ps1     # Setup environment
npm install                 # Install all dependencies
.\start-dev.ps1            # Start development environment
```

### Manual Installation (if preferred)

1. **Clone and install**
   ```bash
   git clone <your-repo-url>
   cd sports-app
   npm install  # Installs all workspace dependencies
   ```

2. **Environment setup**
   ```powershell
   .\scripts\setup-env.ps1
   # This creates .env files and directory structure
   ```

3. **Start services**
   ```powershell
   .\start-dev.ps1
   # Starts Docker containers and development servers
   ```

## 🔧 Development Commands

### Enhanced Startup Script
```powershell
.\start-dev.ps1            # Start development environment
.\start-dev.ps1 -Setup     # Initial project setup
.\start-dev.ps1 -Status    # Check service status
.\start-dev.ps1 -Logs      # View Docker logs
.\start-dev.ps1 -Clean     # Clean and restart everything
.\start-dev.ps1 -Stop      # Stop all services
.\start-dev.ps1 -Help      # Show help
```

### Workspace Commands (from root)
```bash
npm run dev                # Start both frontend and backend
npm run dev:frontend       # Start only frontend
npm run dev:backend        # Start only backend
npm run build              # Build both projects
npm run lint               # Lint frontend code
npm run type-check         # Type check both projects
npm run clean              # Clean build artifacts
npm run docker:up          # Start Docker services
npm run docker:down        # Stop Docker services
npm run docker:logs        # View Docker logs
```

### Individual Project Commands
```bash
# Backend specific
cd backend
npm run dev                # Start with ts-node-dev (fast reload)
npm run build              # Build TypeScript
npm run start:prod         # Start production build
npm run type-check         # TypeScript type checking
npm run db:seed            # Seed database
npm run clean              # Clean dist folder

# Frontend specific  
cd frontend
npm run dev                # Start with Turbopack (fast)
npm run build              # Production build
npm run start:prod         # Start production server
npm run lint:fix           # Fix linting issues
npm run analyze            # Bundle size analysis
```

## 🎯 Features (MVP)

- [x] 🔐 User authentication (signup/login)
- [x] 👤 User profiles with ratings
- [x] ⚽ Match creation and discovery
- [x] 💬 Real-time chat with Socket.io
- [x] 🗺️ Location-based search with Google Maps
- [x] ⭐ Ratings and reviews system
- [x] 📱 PWA capabilities (offline, installable)
- [x] 📊 Performance monitoring (development)
- [x] 🔍 Enhanced developer experience

## 🚀 Tech Stack (Optimized)

### Frontend
- **Next.js 15** (React 19, App Router)
- **Turbopack** (Ultra-fast bundler)
- **TypeScript 5** (Type safety)
- **Tailwind CSS 4** (Styling)
- **Zustand** (State management)
- **Socket.io Client** (Real-time)
- **React Hook Form + Zod** (Form validation)
- **PWA Features** (Service Worker, Manifest)

### Backend
- **Node.js 20+** (JavaScript runtime)
- **Express.js** (Web framework)
- **TypeScript 5** (Type safety)
- **ts-node-dev** (Fast development reload)
- **PostgreSQL 15** (Primary database)
- **Redis 7** (Caching & sessions)
- **Sequelize ORM** (Database modeling)
- **JWT** (Authentication)
- **Socket.io** (Real-time features)
- **Performance Monitoring** (Custom middleware)

### Infrastructure & DevOps
- **Docker Compose** (Local development)
- **Monorepo Workspaces** (npm workspaces)
- **Enhanced PowerShell Scripts** (Development automation)
- **Adminer** (Database management UI)
- **Redis Commander** (Redis management UI)
- **Bundle Analyzer** (Performance insights)

## Development Progress

- [x] Sprint 0: Environment setup and project initialization
- [x] Sprint 1: Backend APIs and database design
- [x] Sprint 2: User authentication and profiles
- [x] Sprint 3: Match discovery and creation
- [x] Sprint 4: Real-time chat and notifications
- [x] Sprint 5: Ratings and reviews
- [ ] Sprint 6: PWA optimization and testing
- [ ] Sprint 7: Pre-launch preparation
- [ ] Sprint 8: Launch and monitoring

### 🔥 Current Sprint Status
**Completed Sprints 0-5 + Optimization Sprint:** Full-featured sports app with enhanced developer experience!

**🎆 Latest Optimizations (v2.0):**
- ✅ **Monorepo workspace** with unified dependency management
- ✅ **Enhanced startup script** with multiple command options
- ✅ **Performance monitoring** middleware for development
- ✅ **Optimized build processes** (Turbopack, ts-node-dev)
- ✅ **Docker optimization** with development overrides
- ✅ **Database management UI** (Adminer + Redis Commander)
- ✅ **Automated environment setup** scripts
- ✅ **Comprehensive health checks** with metrics
- ✅ **Bundle analysis** and performance insights
- ✅ **Enhanced TypeScript configurations**

**Sprint 5 Completed Features:**
- ✅ Complete ratings and reviews system
- ✅ Post-match rating functionality with 1-5 star ratings
- ✅ User reputation system with average ratings
- ✅ Backend APIs for creating, updating, and fetching ratings
- ✅ Pending ratings dashboard for post-match feedback
- ✅ User and match-specific rating endpoints

**🚪 Next Sprint (Sprint 6):** PWA optimization and testing
- Service Worker implementation for offline functionality
- Web App Manifest for installation
- Caching strategies for better performance
- Push notification integration
- Comprehensive testing setup (Jest, Playwright)
- Production deployment pipeline

## 📊 Performance Optimizations

### Development Experience
- **Fast Reload**: ts-node-dev + Turbopack for instant updates
- **Monorepo Management**: Unified dependency management
- **Smart Scripts**: Context-aware development commands
- **Health Monitoring**: Real-time performance metrics
- **Error Tracking**: Enhanced logging and debugging

### Runtime Performance  
- **Database Optimization**: Tuned PostgreSQL settings
- **Memory Management**: Performance monitoring middleware
- **Bundle Optimization**: Next.js 15 + Turbopack
- **Caching Strategy**: Redis for sessions and data
- **Image Optimization**: WebP/AVIF support

### Developer Tools
```bash
# Access development tools
http://localhost:8080    # Adminer (Database UI)
http://localhost:8081    # Redis Commander
http://localhost:3001/health    # Health metrics
http://localhost:3001/metrics   # Performance data
```

## Contributing

This is a personal project for learning purposes. Feel free to fork and experiment!

## License

MIT
