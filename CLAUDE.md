# CLAUDE.md - AI Assistant Guide for DAOsail School Platform

**Last Updated:** 2025-11-21
**Repository Status:** Pre-development / Planning Phase
**Primary Language:** TypeScript/JavaScript (Frontend), Russian (Documentation & Content)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Current Repository State](#current-repository-state)
3. [Technology Stack](#technology-stack)
4. [Project Architecture](#project-architecture)
5. [Development Workflow](#development-workflow)
6. [File Structure & Conventions](#file-structure--conventions)
7. [Database Schema](#database-schema)
8. [AI Assistant Guidelines](#ai-assistant-guidelines)
9. [Code Style & Conventions](#code-style--conventions)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Process](#deployment-process)
12. [Key Resources](#key-resources)

---

## Project Overview

### What is DAOsail School Platform?

**DAOsail School Platform** is an interactive online yachting school called "Школа крейсерского яхтинга" (School of Cruising Yachting). The platform's unique feature is a personalized AI instructor that helps each student learn at their own pace.

### Primary Goals

- **MVP Goal:** Launch a working platform with one complete course: "Introduction to Yachting" (Введение в яхтинг)
- **Target Audience:**
  - Absolute beginners with no yachting experience
  - Minimally experienced sailors looking to systematize their knowledge
  - People interested in yachting who lack access to traditional schools

### Core Features (MVP)

1. **Student System:**
   - User registration and authentication
   - Personal profile with experience level
   - Student dashboard showing progress, completed lessons, and badges
   - Knowledge base with searchable yacht terminology and diagrams

2. **Educational Process:**
   - Main course: "Introduction to Yachting" (7 lessons)
   - Lesson structure: text, illustrations, short videos/animations, interactive diagrams, quizzes
   - Testing system: quiz after each lesson, final certification test
   - AI Instructor: chat interface for lesson-specific questions

3. **Course Content (7 Lessons):**
   - Lesson 1: History and basic terminology
   - Lesson 2: Sailing yacht structure
   - Lesson 3: How a yacht moves under sail
   - Lesson 4: Basics of yacht management
   - Lesson 5: Basic navigation knowledge
   - Lesson 6: Water safety rules
   - Lesson 7: Planning your first voyage

---

## Current Repository State

### What Exists

```
daosail-school-platform/
├── .git/                           # Git repository metadata
├── PROJECT_DAOSAIL_SCHOOL.md       # Master plan v1.1 (Russian)
└── CLAUDE.md                       # This file
```

- **Status:** Planning phase - no source code yet
- **Documentation:** Single master plan document in Russian
- **Latest Commit:** `d944cdf` - "Initial commit: Add project master-plan v1.1"
- **Current Branch:** `claude/claude-md-mi8xguaw974qodru-01FmBUKZjF7MU6bFjcPVmggz`

### What Needs to Be Created

- [ ] Project initialization (package.json, tsconfig.json)
- [ ] Frontend application (Next.js + React + TypeScript)
- [ ] UI components library (Tailwind CSS + Radix UI)
- [ ] Backend setup (Supabase configuration)
- [ ] Database schema (PostgreSQL via Supabase)
- [ ] Authentication system (Supabase Auth)
- [ ] AI services integration (ChatService, EmbeddingService)
- [ ] Course content management system
- [ ] Testing infrastructure
- [ ] CI/CD pipeline
- [ ] Deployment configuration

---

## Technology Stack

### Frontend

- **Framework:** Next.js (React-based, with App Router recommended)
- **Language:** TypeScript
- **UI Library:** React
- **Styling:** Tailwind CSS
- **Component Library:** Radix UI (headless components)
- **State Management:** TBD (React Context, Zustand, or Redux Toolkit)
- **Forms:** TBD (React Hook Form recommended)
- **Validation:** TBD (Zod recommended)

### Backend

- **Platform:** Supabase
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage (for images, videos)
- **Real-time:** Supabase Realtime (for chat features)

### AI Integration

- **Chat Service:** ChatService (implementation TBD)
- **Embedding Service:** EmbeddingService for RAG system
- **AI Provider:** TBD (OpenAI, Anthropic Claude, or other)

### DevOps & Tools

- **Version Control:** Git
- **Package Manager:** npm or pnpm (to be decided)
- **Code Quality:** ESLint, Prettier
- **Testing:** TBD (Jest, Vitest, Playwright recommended)
- **CI/CD:** TBD
- **Hosting:** TBD (Vercel recommended for Next.js)

---

## Project Architecture

### Architecture Foundation

The project is based on an existing DAOsail prototype architecture (referenced in `PROJECT_ARCHITECTURE.md` which is not yet in this repository). The core architecture includes:

1. **Frontend Architecture:**
   - Next.js App Router structure
   - Component-based design
   - Service layer for business logic
   - API routes for backend communication

2. **Backend Architecture:**
   - Supabase as BaaS (Backend as a Service)
   - PostgreSQL database with RLS (Row Level Security)
   - Edge functions for custom logic
   - Real-time subscriptions for live updates

3. **AI Architecture:**
   - RAG (Retrieval Augmented Generation) system
   - Vector embeddings for knowledge base
   - Chat interface with context management
   - Lesson-specific AI instructors

### Planned Directory Structure

```
daosail-school-platform/
├── .github/                    # GitHub workflows and configurations
├── .vscode/                    # VS Code settings
├── public/                     # Static assets
│   ├── images/
│   ├── videos/
│   └── fonts/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes group
│   │   ├── (dashboard)/       # Dashboard routes group
│   │   ├── courses/           # Course pages
│   │   ├── lessons/           # Lesson pages
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── ui/                # UI primitives (Radix)
│   │   ├── courses/           # Course components
│   │   ├── lessons/           # Lesson components
│   │   ├── chat/              # AI chat components
│   │   └── common/            # Shared components
│   ├── lib/                   # Utilities and libraries
│   │   ├── supabase/          # Supabase client
│   │   ├── ai/                # AI services
│   │   └── utils/             # Helper functions
│   ├── services/              # Business logic services
│   │   ├── profile.service.ts
│   │   ├── course.service.ts
│   │   ├── lesson.service.ts
│   │   ├── chat.service.ts
│   │   └── embedding.service.ts
│   ├── types/                 # TypeScript type definitions
│   ├── hooks/                 # Custom React hooks
│   └── styles/                # Global styles
├── supabase/                  # Supabase configuration
│   ├── migrations/            # Database migrations
│   ├── functions/             # Edge functions
│   └── seed.sql               # Database seed data
├── tests/                     # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                      # Documentation
├── .env.example               # Environment variables template
├── .env.local                 # Local environment (gitignored)
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
├── README.md
├── CLAUDE.md                  # This file
└── PROJECT_DAOSAIL_SCHOOL.md  # Master plan
```

---

## Development Workflow

### Branch Strategy

- **Main Branch:** `main` or `master` (to be created)
- **Feature Branches:** `feature/feature-name`
- **Bug Fix Branches:** `fix/bug-name`
- **Claude AI Branches:** `claude/session-id` (temporary, for AI assistant work)

### Git Workflow

1. Create feature branch from main
2. Develop and commit regularly with clear messages
3. Push to remote when ready
4. Create pull request for review
5. Merge to main after approval

### Commit Message Convention

Use conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

**Examples:**
```
feat(courses): add course listing page
fix(auth): resolve login redirect issue
docs(readme): update setup instructions
```

### Development Process

1. **Planning:** Review requirements in PROJECT_DAOSAIL_SCHOOL.md
2. **Design:** Create component/service designs before coding
3. **Implementation:** Write code following conventions
4. **Testing:** Write tests for new features
5. **Review:** Self-review code before committing
6. **Documentation:** Update docs as needed
7. **Commit:** Commit with clear messages
8. **Push:** Push to remote branch

---

## File Structure & Conventions

### Component Organization

**File Naming:**
- Components: PascalCase (e.g., `CourseCard.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Types: PascalCase (e.g., `User.types.ts`)
- Services: camelCase with `.service.ts` suffix (e.g., `course.service.ts`)

**Component Structure:**
```typescript
// CourseCard.tsx
import { FC } from 'react';
import { Course } from '@/types/Course.types';

interface CourseCardProps {
  course: Course;
  onSelect?: (courseId: string) => void;
}

export const CourseCard: FC<CourseCardProps> = ({ course, onSelect }) => {
  // Component logic
  return (
    // JSX
  );
};
```

### Service Organization

**Service Pattern:**
```typescript
// course.service.ts
import { supabase } from '@/lib/supabase/client';
import { Course } from '@/types/Course.types';

export class CourseService {
  async getCourses(): Promise<Course[]> {
    // Implementation
  }

  async getCourseById(id: string): Promise<Course | null> {
    // Implementation
  }

  async createCourse(data: Partial<Course>): Promise<Course> {
    // Implementation
  }
}

export const courseService = new CourseService();
```

### Type Definitions

**Type Files:**
```typescript
// Course.types.ts
export interface Course {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string;
  order: number;
  videoUrl?: string;
  quizId?: string;
}

export interface Quiz {
  id: string;
  lessonId: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}
```

---

## Database Schema

### Planned Tables (Supabase PostgreSQL)

#### Core Tables

**1. profiles**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**2. courses**
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**3. lessons**
```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content JSONB, -- Rich content structure
  order_index INTEGER NOT NULL,
  video_url TEXT,
  duration_minutes INTEGER,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, slug)
);
```

**4. quizzes**
```sql
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  passing_score INTEGER DEFAULT 70,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**5. questions**
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of options
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**6. user_progress**
```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);
```

**7. quiz_attempts**
```sql
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  answers JSONB NOT NULL, -- User's answers
  passed BOOLEAN NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**8. badges**
```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  criteria JSONB, -- Conditions for earning
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**9. user_badges**
```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);
```

**10. knowledge_base**
```sql
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  category TEXT,
  related_terms TEXT[],
  diagram_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**11. chat_sessions**
```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**12. chat_messages**
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### AI/RAG Tables

**13. embeddings**
```sql
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI ada-002 dimension
  metadata JSONB,
  source_type TEXT, -- 'lesson', 'knowledge_base', etc.
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies

Enable RLS on all tables and create appropriate policies:

```sql
-- Example: User can only view their own progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## AI Assistant Guidelines

### When Working on This Project

#### 1. Language Considerations

- **Code & Documentation:** English (comments, variable names, documentation)
- **User-Facing Content:** Russian (UI text, course content, error messages)
- **Mixed Context:** PROJECT_DAOSAIL_SCHOOL.md is in Russian - reference it for requirements

#### 2. Before Making Changes

- **Read PROJECT_DAOSAIL_SCHOOL.md** to understand project requirements
- **Check current repository state** - it's in early planning phase
- **Review existing code** before adding new features
- **Verify database schema** matches requirements
- **Check for existing services** before creating duplicates

#### 3. When Adding Features

- **Follow MVP scope:** Only implement features listed in the master plan
- **Out of scope for MVP:**
  - DAO functionality
  - Community/club features
  - Sailing expeditions
  - Multiple courses (only "Introduction to Yachting")
  - Advanced social features

#### 4. AI Services Integration

- **RAG System:** Use embeddings for knowledge base and lesson content
- **Context Management:** AI should only answer questions within lesson scope
- **Personalization:** Track user interactions for personalized learning paths
- **Safety:** Implement content filters and appropriate guardrails

#### 5. Code Quality Standards

- **Type Safety:** Use TypeScript strictly, avoid `any` types
- **Error Handling:** Always handle errors gracefully with user-friendly messages
- **Accessibility:** Follow WCAG 2.1 AA standards
- **Performance:** Optimize for mobile devices
- **Security:** Never expose secrets, use environment variables

#### 6. Testing Requirements

- **Unit Tests:** For all services and utilities
- **Integration Tests:** For API routes and database interactions
- **E2E Tests:** For critical user flows (registration, course completion)
- **AI Tests:** For chat responses and RAG accuracy

#### 7. Documentation Updates

When making changes, update:
- This CLAUDE.md file (if architecture changes)
- README.md (if setup process changes)
- Code comments (for complex logic)
- API documentation (for new endpoints)

#### 8. Database Changes

- **Use migrations:** Never modify database directly
- **Add RLS policies:** Security is critical
- **Index appropriately:** For performance
- **Backup before major changes:** Safety first

#### 9. UI/UX Guidelines

- **Mobile-first:** Design for mobile, enhance for desktop
- **Accessibility:** Keyboard navigation, screen readers
- **Russian language:** All UI text in Russian
- **Consistent design:** Follow Tailwind + Radix patterns
- **Loading states:** Always show feedback for async operations

#### 10. Common Tasks

**Adding a new lesson:**
1. Add content to database via migration
2. Create lesson page component
3. Add to course navigation
4. Create quiz if needed
5. Update AI instructor context
6. Add to knowledge base embeddings

**Adding a new service:**
1. Create service file in `src/services/`
2. Define TypeScript interfaces in `src/types/`
3. Implement with Supabase client
4. Add error handling
5. Write unit tests
6. Export from service index

**Adding a new component:**
1. Create component file in appropriate directory
2. Define props interface
3. Implement with TypeScript
4. Add Tailwind styling
5. Ensure accessibility
6. Add to component index

---

## Code Style & Conventions

### TypeScript

```typescript
// Use explicit types
const courseId: string = "abc-123";

// Use interfaces for objects
interface CourseData {
  title: string;
  description: string;
}

// Use async/await over promises
async function getCourse(id: string): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch course: ${error.message}`);
  return data;
}

// Use optional chaining
const lessonTitle = course?.lessons?.[0]?.title;

// Use nullish coalescing
const username = user?.name ?? 'Guest';
```

### React Components

```typescript
// Use functional components with TypeScript
import { FC, useState } from 'react';

interface Props {
  title: string;
  onSave?: (data: FormData) => void;
}

export const LessonForm: FC<Props> = ({ title, onSave }) => {
  const [formData, setFormData] = useState<FormData>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave?.(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form content */}
    </form>
  );
};
```

### CSS/Tailwind

```typescript
// Use Tailwind utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-900">
    {title}
  </h2>
</div>

// For complex styles, use cn() utility
import { cn } from '@/lib/utils';

<div className={cn(
  "base-class",
  isActive && "active-class",
  className
)}>
```

### Error Handling

```typescript
// API routes
export async function GET(req: Request) {
  try {
    const data = await fetchData();
    return Response.json({ data });
  } catch (error) {
    console.error('Error fetching data:', error);
    return Response.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

// Client-side
try {
  await saveCourse(data);
  toast.success('Курс сохранен');
} catch (error) {
  console.error('Failed to save course:', error);
  toast.error('Не удалось сохранить курс');
}
```

### Environment Variables

```typescript
// .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key

// Usage in code
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const apiKey = process.env.OPENAI_API_KEY!;
```

---

## Testing Strategy

### Testing Pyramid

```
        /\
       /  \      E2E Tests (Few)
      /____\     - Critical user flows
     /      \    - Course completion
    /  INTE \   Integration Tests (Some)
   /  GRATION\  - API endpoints
  /____________\ - Database operations
 /              \
/   UNIT TESTS   \ Unit Tests (Many)
------------------  - Services
                    - Utilities
                    - Hooks
```

### Unit Testing

```typescript
// course.service.test.ts
import { courseService } from './course.service';
import { supabase } from '@/lib/supabase/client';

jest.mock('@/lib/supabase/client');

describe('CourseService', () => {
  describe('getCourses', () => {
    it('should fetch all courses', async () => {
      const mockCourses = [{ id: '1', title: 'Test Course' }];
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: mockCourses, error: null })
      });

      const courses = await courseService.getCourses();
      expect(courses).toEqual(mockCourses);
    });
  });
});
```

### Integration Testing

```typescript
// api/courses/route.test.ts
import { GET } from './route';

describe('GET /api/courses', () => {
  it('should return courses list', async () => {
    const req = new Request('http://localhost:3000/api/courses');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('courses');
  });
});
```

### E2E Testing (Playwright)

```typescript
// tests/e2e/course-completion.spec.ts
import { test, expect } from '@playwright/test';

test('user can complete a course', async ({ page }) => {
  await page.goto('/courses/intro-to-yachting');
  await page.click('text=Начать курс');

  // Complete all lessons
  for (let i = 1; i <= 7; i++) {
    await page.click(`text=Урок ${i}`);
    await page.click('text=Завершить урок');
  }

  // Take final quiz
  await page.click('text=Итоговый тест');
  // ... answer questions

  await expect(page.locator('text=Поздравляем!')).toBeVisible();
});
```

---

## Deployment Process

### Environment Setup

1. **Local Development:**
   ```bash
   npm install
   cp .env.example .env.local
   # Edit .env.local with your credentials
   npm run dev
   ```

2. **Supabase Setup:**
   ```bash
   npx supabase init
   npx supabase start
   npx supabase db push
   npx supabase functions deploy
   ```

3. **Production:**
   - Deploy to Vercel (recommended for Next.js)
   - Configure environment variables in Vercel dashboard
   - Connect Supabase production instance
   - Set up CI/CD pipeline

### Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Supabase RLS policies active
- [ ] AI services configured
- [ ] Error tracking setup (Sentry)
- [ ] Analytics configured
- [ ] Performance monitoring active
- [ ] Backup strategy in place

---

## Key Resources

### Documentation

- **Master Plan:** `PROJECT_DAOSAIL_SCHOOL.md` (Russian)
- **This Guide:** `CLAUDE.md` (English)
- **Architecture:** `PROJECT_ARCHITECTURE.md` (not yet in repo)

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API](https://platform.openai.com/docs)

### Project-Specific Patterns

**Existing DAOsail Prototype Reference:**
- `ProfileService`: User profile management with roles and statistics
- `ChatService`: AI chat implementation
- `EmbeddingService`: RAG system for AI context

---

## Version History

| Version | Date       | Changes                                      |
|---------|------------|----------------------------------------------|
| 1.0     | 2025-11-21 | Initial CLAUDE.md creation                   |

---

## Contact & Support

For questions about this project:
- Review `PROJECT_DAOSAIL_SCHOOL.md` for requirements
- Check this CLAUDE.md for technical guidance
- Consult with project maintainers for clarification

---

**Remember:** This is an educational platform for yachting beginners. Focus on clarity, accessibility, and personalized learning experiences. The AI instructor should be supportive, patient, and informative.

Happy coding! ⛵
