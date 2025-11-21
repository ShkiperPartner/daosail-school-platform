# DAOsail Prototype

**Version:** 0.7.2
**Status:** Active Development - Phase 7.2 Architecture Analysis Complete

A Next.js-based prototype for DAOsail - an educational platform combining sailing knowledge with DAO governance and AI assistance.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (for database)
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd daosail-prototype
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

4. **Start development server**
```bash
npm run dev
```

5. **Open in browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
npm run audit        # Security audit
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (main)/            # Main application pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── layout/           # Layout components
├── lib/                  # Utilities and services
│   ├── contexts/         # React contexts
│   ├── services/         # Business logic services
│   └── supabase/         # Database client
├── supabase/            # Database migrations
└── data/                # Mock data and configurations
```

## 🎯 Core Features

- **AI Assistants**: Multiple specialized AI assistants for different domains
- **Role-based Access**: Progressive user roles (Guest → Passenger → Crew)
- **Knowledge Base**: RAG-powered search across sailing and DAO content
- **Profile System**: User profiles with achievements and statistics
- **Multilingual**: Support for Russian and English interfaces

## 🛠 Tech Stack

- **Frontend**: Next.js 15.5.3, React 18, TypeScript
- **UI**: Tailwind CSS, Radix UI components
- **Database**: Supabase (PostgreSQL + Real-time)
- **AI**: OpenAI GPT-4o-mini, text-embedding-ada-002
- **Auth**: Supabase Auth

## 📚 Documentation

- [**PROJECT_ARCHITECTURE.md**](./PROJECT_ARCHITECTURE.md) - Complete project architecture
- [**REVIEW.md**](./REVIEW.md) - Production readiness checklist
- [**CLAUDE.md**](./CLAUDE.md) - Development guidelines and patterns

## 🔐 Environment Variables

Required variables (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `OPENAI_API_KEY` - OpenAI API key for AI features

## 🚦 Current Status

**Phase 7.2 Completed** (January 2025):
- ✅ Architectural review with Claude 4.5 analysis
- ✅ Security improvements (ENV validation, CORS)
- ✅ Code quality tools (TypeScript ES2015, npm audit)
- ✅ Migration consolidation
- ✅ Professional README.md and REVIEW.md
- ✅ Zero security vulnerabilities

**Recently Completed**:
- Phase 7.1: File Upload System
- Phase 7.0: Content Pages & Community Links
- Phase 6.1: Assistant System Redesign

## 🤝 Development

This project follows the architectural patterns described in `REVIEW.md`. Before making changes:

1. Read `PROJECT_ARCHITECTURE.md` for current implementation status
2. Follow patterns in `CLAUDE.md` for code conventions
3. Use `REVIEW.md` checklist for production readiness

## 📄 License

[License information - to be added]

---

**Note**: This is a prototype in active development. Features and APIs may change rapidly.