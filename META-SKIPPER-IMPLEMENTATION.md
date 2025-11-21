# META-SKIPPER-IMPLEMENTATION.md
**Версия:** 1.0 · **Цель:** минимально-жизнеспособная интеграция «Мета‑Шкипера» (оркестратор) с под-агентами, RAG (Supabase), MCP‑коннектором и фронтендом чата.

---

## 0) Быстрый план (TL;DR)
1. **Supabase**: создать таблицы `chat_messages`, `knowledge_chunks`; добавить RPC `match_docs`.
2. **Embeddings пайплайн**: загрузить .md/.txt в чанки → записать в `knowledge_chunks`.
3. **Edge Function `handle_agent_chat`**: маршрутизация запроса → RAG → вызов агента → лог в `chat_messages`.
4. **Agents SDK**: описать «Мета‑Шкипера» + 3 под-агента (FAQ, Тренер, DAO) + инструменты.
5. **MCP (минимум)**: локальный MCP‑сервер с инструментом `match_docs` (унифицированный доступ к БЗ).
6. **Фронтенд**: чат-страница, мягкий e‑mail‑гейтинг после 3 ответов, показ источников/цитат.
7. **Guardrails**: “отвечай только из контекста”, policy на тон/длину, блок внешних фактов без цитат.

---

## 1) Схема данных (Supabase / Postgres)
### 1.1 Таблица: `chat_messages`
```sql
create table if not exists public.chat_messages (
  id           uuid primary key default gen_random_uuid(),
  session_id   text not null,                 -- группировка диалога
  role         text not null check (role in ('user','assistant','system','tool')),
  content      text not null,
  agent        text not null,                 -- meta, faq, trainer, dao, tool-name
  created_at   timestamptz not null default now(),
  meta         jsonb default '{}'::jsonb
);
create index on public.chat_messages (session_id, created_at);
```

### 1.2 Таблица: `knowledge_chunks`
```sql
create table if not exists public.knowledge_chunks (
  id              bigserial primary key,
  doc_id          text not null,       -- путь/имя исходника
  chunk_idx       int  not null,
  text            text not null,
  embedding       vector(1536),        -- размер под выбранную модель эмбеддингов
  accessible_roles text[] not null default array['public'],
  tags            text[] not null default array[]::text[],
  url             text,                -- ссылка на первоисточник
  updated_at      timestamptz not null default now()
);
create index on public.knowledge_chunks using ivfflat (embedding) with (lists = 100);
create index on public.knowledge_chunks using gin (accessible_roles);
create index on public.knowledge_chunks (doc_id, chunk_idx);
```

### 1.3 RPC: `match_docs`
```sql
create or replace function public.match_docs(
  query_embedding vector(1536),
  match_count int default 8,
  roles text[] default array['public'],
  min_similarity float default 0.75
) returns table (
  id bigserial,
  doc_id text,
  chunk_idx int,
  text text,
  url text,
  similarity float
) language sql stable as $$
  select kc.id, kc.doc_id, kc.chunk_idx, kc.text, kc.url,
         1 - (kc.embedding <=> query_embedding) as similarity
  from public.knowledge_chunks kc
  where kc.accessible_roles && roles
  order by kc.embedding <=> query_embedding
  limit match_count
$$;
```

---

## 2) Embeddings пайплайн (минимум)
- Парсим `.md/.txt` → режем на чанки ~500–800 токенов с overlap 100–150.
- Получаем эмбеддинги (любая доступная embedding‑модель) → upsert в `knowledge_chunks`.
- В `accessible_roles` пишем роли доступа: `['public']`, `['passenger']`, `['sailor']`, `['captain']`, `['council']`.

**Псевдокод upsert (TS):**
```ts
type Chunk = { doc_id: string; chunk_idx: number; text: string; embedding: number[];
               accessible_roles: string[]; tags?: string[]; url?: string };

// supabase.from('knowledge_chunks').upsert(chunks, { onConflict: 'doc_id,chunk_idx' })
```

---

## 3) Edge Function: `handle_agent_chat`
**Назначение:** один HTTP‑вход для фронта. Делает: intent‑routing → RAG → вызов агента (Agents SDK) → логирование.

### 3.1 Контракт
**POST** `/functions/v1/handle_agent_chat`
```json
{
  "session_id": "abc123",
  "user_message": "Вопрос пользователя",
  "user_role": "public | passenger | sailor | captain | council",
  "prefs": { "lang": "ru" }
}
```
**Ответ (stream/offline):**
```json
{
  "agent": "meta|faq|trainer|dao",
  "final_text": "…",
  "citations": [
    {"doc_id":"faq.md","url":"https://…","chunk_idx":12,"similarity":0.86}
  ],
  "trace": { "intent":"faq", "tools":["rag"], "latency_ms": 532 }
}
```

### 3.2 Логика (упрощённо)
1. Сохранить `user_message` в `chat_messages`.
2. Классифицировать намерение (FAQ/Обучение/DAO/Другое).
3. Сформировать `roles[]` из `user_role`.
4. Получить embedding вопроса → `match_docs` (roles) → взять top‑k.
5. Если нет релевантных чанков, ответ: **«нет данных в базе знаний»**.
6. Сформировать подсказку для агента: *«Отвечай только по контексту. Если факта нет — скажи 'нет данных'.»*
7. Вызвать нужного агента (Agents SDK), передать контекст (top‑k тексты + ссылки).
8. Сохранить ответ в `chat_messages` (role=`assistant`, agent=`faq|trainer|dao|meta`).
9. Вернуть ответ + `citations` фронту.

---

## 4) Конфигурация агентов (Agents SDK)
**Общее:** один «мета»‑агент‑маршрутизатор + под‑агенты.

### 4.1 Инструкции (кратко)
- **meta:** определяет намерение и делает handoff. Ничего не придумывает, без цитат не добавляет внешних фактов.
- **faq:** коротко, строго из RAG‑контекста. Если контекст пуст — «нет данных».
- **trainer:** обучающие ответы, может предлагать шаги/ссылки из БЗ.
- **dao:** про DAO, правила, голосования. Только факты из БЗ.

### 4.2 Инструменты агентов
- `knowledge_base_search(query, roles[])` → вызывает RPC `match_docs`.
- (позже) `web_search(query)` → **разрешён только, если включён и обязаны вернуть цитаты**.

---

## 5) MCP (минимальный сервер)
Цель — единый интерфейс для доступа к БЗ и внешним источникам (позже: Notion/GitHub/CRM).  
На старте достаточно 1 инструмента:
- `match_docs_mcp(query: string, roles: string[]): { text, url, doc_id, similarity }[]`  
Внутри вызывает ту же RPC `match_docs`.

---

## 6) Фронтенд (Next.js 14)
### 6.1 Чат‑страница
- Поля: **ввод**, **история**, **ссылки/цитаты**, **плашка роли**.
- Счётчик ответов ассистента → после 3‑его показать мягкое окно «Оставьте e‑mail, чтобы продолжить».

### 6.2 Вызов API
```ts
const res = await fetch('/api/handle_agent_chat', {
  method: 'POST',
  body: JSON.stringify({ session_id, user_message, user_role, prefs:{lang:'ru'} })
});
const data = await res.json();
```

### 6.3 Показ цитат (если есть)
- Рядом с ответом: список источников (`doc_id`/`url`), при клике — открыть.

---

## 7) Guardrails (минимум)
- «Отвечай только из предоставленного контекста. Если факт отсутствует — скажи “нет данных”.»
- «Не используй внешние факты без ссылок/цитат.»
- «Тон: вежливо, кратко, практично. Без приукрашивания.»
- Лимит длины ответа (например, ≤1200 символов), если не просили иначе.

---

## 8) Переменные окружения
```
SUPABASE_URL=…
SUPABASE_ANON_KEY=…
SERVICE_ROLE_KEY=… (только в защищённых функциях)
EMBEDDINGS_MODEL=… (id модели)
AGENTS_CONFIG=./agents.config.json
```

---

## 9) Мини‑тесты (критерии готовности)
- [ ] Вопрос из `faq.md` отвечает корректно и кратко.
- [ ] Вопрос вне БЗ → ответ «нет данных».
- [ ] В ответе показываются `citations`.
- [ ] В `chat_messages` пишется полный лог диалога.
- [ ] Хэнд‑офф на `trainer`/`dao` по ключевым словам работает.
- [ ] Мягкий e‑mail‑гейтинг срабатывает после 3 ответов.

---

## 10) Примеры
### 10.1 Пример payload в Edge Function
```json
{
  "session_id": "sess_2025_09_25_001",
  "user_message": "Что такое суб-DAO в DAOsail?",
  "user_role": "public",
  "prefs": {"lang":"ru"}
}
```

### 10.2 Пример трассировки ответа
```json
{
  "agent": "faq",
  "final_text": "Суб‑DAO — подгруппа для конкретного направления...",
  "citations": [
    {"doc_id":"06_DAO_и_токеномика.md","url":null,"chunk_idx":3,"similarity":0.89}
  ],
  "trace": {"intent":"faq","tools":["rag"],"latency_ms":612}
}
```

---

## 11) Рекомендованные коммиты
- `chore(db): create chat_messages and knowledge_chunks tables`
- `feat(db): add match_docs RPC for role-aware semantic search`
- `feat(edge): handle_agent_chat function (routing + rag + logging)`
- `feat(agents): meta + faq + trainer + dao base configs`
- `feat(mcp): minimal MCP server with match_docs tool`
- `feat(ui): chat page with email soft-gating and citations`
- `docs: add META-SKIPPER-IMPLEMENTATION.md`

---

## 12) Что дальше (после 1.0)
- Добавить `web_search` с обязательными цитатами.
- Ролевые политики доступа к агентам (map роль→разрешённые инструменты).
- Версионирование БЗ и авто‑переиндексация при изменениях.
- Трассировка/метрики в Supabase (latency, tool‑usage, handoff‑rates).
- E2E‑тест: регресс на «нет данных» и корректность цитат.
