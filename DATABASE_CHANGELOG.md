# Database Changes Log

**Проект:** DAOsail Prototype - Next.js App
**Цель:** Отслеживание изменений в базе данных Supabase

---

## 📊 Migration History

### **Migration 008** - Email Leads System (2025-01-25)
**Файл:** `supabase/migrations/008_create_email_leads_table.sql`

**Добавлено:**
- ✅ **Таблица `email_leads`** - сохранение email адресов гостевых пользователей
- ✅ **RLS политики** - безопасный доступ только для админов и создание лидов
- ✅ **Функции управления** - `update_email_lead_stats()`, `convert_lead_to_user()`
- ✅ **Индексы** - оптимизация поиска по email, source, дате создания

**Структура таблицы:**
```sql
CREATE TABLE email_leads (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'guest_chat',
  conversation_topic TEXT,
  messages_count INTEGER DEFAULT 0,
  first_interaction TIMESTAMPTZ DEFAULT NOW(),
  last_interaction TIMESTAMPTZ DEFAULT NOW(),
  converted_to_user BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Migration 009** - Profiles Email Integration (2025-01-25)
**Файл:** `supabase/migrations/009_fix_profiles_email_integration.sql`

**Добавлено:**
- ✅ **Колонка `email`** в таблицу `profiles`
- ✅ **Обновление функции** `create_profile_for_user()` - теперь сохраняет email при регистрации
- ✅ **Синхронизация email** - триггер для обновления email в профиле при изменении в auth.users
- ✅ **Заполнение данных** - обновление существующих профилей email'ами из auth.users

**Исправленные проблемы:**
1. **Email не сохранялся** при регистрации пользователя
2. **Email не отображался** в профиле пользователя
3. **Невозможно было редактировать** профиль через интерфейс

---

## 🔧 Code Changes

### **TypeScript Types** - `lib/supabase/types.ts`
**Обновлено:**
- ✅ **Interface Database.profiles** - добавлено поле `email: string | null`
- ✅ **ProfileRow, ProfileInsert, ProfileUpdate** - поддержка email во всех операциях

### **Profile Service** - `lib/supabase/profile-service.ts`
**Исправлено:**
- ✅ **transformToAppProfile()** - теперь загружает email из базы данных
- ✅ Убран хардкод `email: ''` - теперь `email: profile.email || ''`

---

## 📋 Планируемые изменения

### **Phase 8.1: Email Leads Integration**
- [ ] API endpoint для сохранения email гостей из формы `email-capture`
- [ ] Интеграция с существующим `chat-box` для трекинга гостевых сессий
- [ ] Dashboard для просмотра лидов (админ панель)

### **Migration 010** - FAQ Agent RAG System (2025-09-26) ✅
**Файл:** `supabase/migrations/20250926000001_create_faq_tables.sql`

**Добавлено:**
- ✅ **Vector extension** - включен pgvector для семантического поиска
- ✅ **Таблица `chat_messages`** - логирование сообщений FAQ агента
- ✅ **Таблица `knowledge_chunks`** - векторная база знаний с эмбеддингами
- ✅ **RPC функция `match_docs`** - семантический поиск с role-based доступом
- ✅ **RLS политики** - безопасный доступ к knowledge base
- ✅ **Permissions** - права для anon/authenticated пользователей

**Структура таблиц:**
```sql
-- FAQ агент чат-логи
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  role TEXT CHECK (role IN ('user','assistant','system','tool')),
  content TEXT NOT NULL,
  agent TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  meta JSONB DEFAULT '{}'
);

-- Векторная база знаний
CREATE TABLE knowledge_chunks (
  id BIGSERIAL PRIMARY KEY,
  doc_id TEXT NOT NULL,
  chunk_idx INT NOT NULL,
  text TEXT NOT NULL,
  embedding VECTOR(1536),
  accessible_roles TEXT[] DEFAULT ARRAY['public'],
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPC: Семантический поиск с role filtering
CREATE FUNCTION match_docs(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 8,
  roles TEXT[] DEFAULT ARRAY['public'],
  min_similarity FLOAT DEFAULT 0.75
) RETURNS TABLE (id BIGINT, doc_id TEXT, chunk_idx INT, text TEXT, url TEXT, similarity FLOAT);
```

**Индексы:**
- ✅ **ivfflat index** на embedding колонку для быстрого vector поиска
- ✅ **GIN index** на accessible_roles для эффективной фильтрации ролей
- ✅ **B-tree indexes** на session_id, agent, doc_id для быстрых запросов

---

### **Phase 9: Advanced RAG Features**
- [ ] Multi-document knowledge base expansion
- [ ] Conversation memory для FAQ агента
- [ ] Advanced chunking strategies
- [ ] Performance optimization (sub-second responses)

### **Phase 8.2** - FAQ Agent Unification (2025-10-01) 🔄

**Цель:** Унификация FAQ агента на существующую таблицу `chunks` вместо дублирования в `knowledge_chunks`

**Изменения в БД:**
- ✅ **Таблица chunks расширена** - добавлены колонки `accessible_roles TEXT[]` и `tags TEXT[]`
- ✅ **RPC функция match_chunks_docs** - создана с role-based фильтрацией
- ✅ **Индексы GIN** - добавлены для efficient role и tags queries
- ✅ **Data migration** - существующие 85684+ записей получили accessible_roles: ['public']

**Структура обновленной таблицы chunks:**
```sql
CREATE TABLE chunks (
  id BIGSERIAL PRIMARY KEY,
  source TEXT,
  path TEXT,
  content TEXT,
  metadata JSONB,
  embedding VECTOR(1536),
  accessible_roles TEXT[] NOT NULL DEFAULT ARRAY['public'],  -- NEW!
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]               -- NEW!
);

-- Индексы для role-based поиска
CREATE INDEX idx_chunks_accessible_roles ON chunks USING GIN (accessible_roles);
CREATE INDEX idx_chunks_tags ON chunks USING GIN (tags);
```

**RPC функция match_chunks_docs:**
```sql
CREATE FUNCTION match_chunks_docs(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 8,
  roles TEXT[] DEFAULT ARRAY['public'],
  min_similarity FLOAT DEFAULT 0.75
) RETURNS TABLE (
  id BIGINT, source TEXT, path TEXT, content TEXT,
  metadata JSONB, similarity FLOAT
) AS $$
  SELECT
    chunks.id, chunks.source, chunks.path,
    chunks.content, chunks.metadata,
    1 - (chunks.embedding <=> query_embedding) AS similarity
  FROM chunks
  WHERE chunks.accessible_roles && roles  -- Role-based filtering
    AND (1 - (chunks.embedding <=> query_embedding)) >= min_similarity
  ORDER BY chunks.embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql STABLE;
```

**Преимущества:**
- ✅ Одна таблица для всех embeddings - нет дублирования
- ✅ Role-based access control встроен в chunks
- ✅ Использование существующих 85684+ embeddings
- ✅ Возможность фильтрации по tags в будущем

**Изменения в коде:**
- ✅ Edge Function `handle-faq/index.ts` - переключен на match_chunks_docs
- ✅ Mapping результатов - match.content вместо match.text, match.path вместо match.doc_id

**Статус:**
- ✅ Edge Function задеплоен
- ✅ Тестирование завершено

### **Phase 8.3** - Steward RAG Integration (2025-10-02) 🚧

**Цель:** Интегрировать RAG поиск в Steward ассистента через /api/chat

**Изменения в коде (БД не изменялась):**
- ✅ **RAG Search в /api/chat** - добавлен векторный поиск для assistantType === 'steward'
- ✅ **Steward Prompt** - создан специальный промпт: строго по базе + гибкая подача
- ✅ **Citations Support** - добавлена поддержка citations в streaming режиме
- ✅ **FAQ Assistant удален** - убран дублирующий тип 'faq' из lib/types/assistants.ts
- ✅ **Logging добавлен** - подробное логирование RAG поиска для диагностики

**Использует существующую инфраструктуру:**
```typescript
// Steward использует match_chunks_docs() RPC функцию
const { data: matches } = await supabase.rpc('match_chunks_docs', {
  query_embedding: queryEmbedding,
  match_count: 5,
  roles: [userRole.toLowerCase(), 'public'],
  min_similarity: 0.7
});
```

**Проблемы обнаружены:**
- ⚠️ **user_chats.session_id отсутствует** - миграция 005 не применена
  - Ошибка: `column user_chats.session_id does not exist`
  - Решение: Применить ALTER TABLE вручную в Supabase Dashboard

**SQL Fix для user_chats:**
```sql
ALTER TABLE user_chats ADD COLUMN IF NOT EXISTS session_id UUID DEFAULT gen_random_uuid();
ALTER TABLE user_chats ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE user_chats ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_chats_session_id ON user_chats(session_id);
```

**Текущий статус:**
- ⚠️ В процессе диагностики - Steward отвечает, но не использует базу знаний
- 🔍 Требуется проверка: есть ли данные в chunks, работает ли match_chunks_docs()

---

*Последнее обновление: 2025-10-02*
*Версия проекта: 0.8.3-dev (Steward RAG Integration - диагностика)*