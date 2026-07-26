# Ember — A calm task manager

Ember is a warm, focused task manager built on the Lovable stack: TanStack Start (React 19, SSR), TanStack Router, TanStack Query, Tailwind CSS v4, shadcn/ui, and Lovable Cloud (Postgres + Auth + Row-Level Security).

## Features

- Email/password and Google sign-in
- Per-user tasks with title, notes, status (todo / in progress / done), priority, due date
- Optimistic-feeling CRUD with toast notifications and skeletons
- Zod validation on both client and server function inputs
- Row-Level Security so users only ever touch their own rows
- Responsive layout, semantic design tokens, warm editorial palette
- SEO-ready: per-route `head()` metadata, sitemap.xml, robots.txt

## Folder structure

```
src/
  routes/
    __root.tsx                 # Root layout, head defaults, Toaster
    index.tsx                  # Landing page
    auth.tsx                   # Sign in / sign up
    _authenticated/
      route.tsx                # Auth gate (ssr:false, redirects to /auth)
      dashboard.tsx            # Tasks dashboard
    sitemap[.]xml.ts           # Dynamic sitemap
  lib/
    task-schemas.ts            # Zod schemas + inferred types
    tasks.functions.ts         # createServerFn RPCs (list/create/update/delete)
  integrations/supabase/       # Auto-generated clients (do not edit)
  components/ui/               # shadcn primitives
  styles.css                   # Design tokens (@theme, oklch)
public/
  robots.txt
```

## Database schema

Managed via Lovable Cloud migrations.

- `public.profiles` — one row per auth user, auto-created via `on_auth_user_created` trigger
- `public.tasks` — `user_id`, `title`, `description`, `status`, `priority`, `due_date`, timestamps
- Enums: `task_status`, `task_priority`
- RLS: every table restricts SELECT/INSERT/UPDATE/DELETE to `auth.uid() = user_id`

## Server "API"

App-internal RPCs use `createServerFn` (typed, same-origin, bearer-attached):

| Function     | Method | Input                     | Description        |
| ------------ | ------ | ------------------------- | ------------------ |
| `listTasks`  | GET    | –                         | Current user tasks |
| `createTask` | POST   | `{title, description?, priority, status, due_date?}` | Insert task |
| `updateTask` | POST   | `{id, ...partial}`        | Patch task fields  |
| `deleteTask` | POST   | `{id}`                    | Delete task        |

## Local development

```bash
bun install
bun run dev
```

## Deployment

Publish directly from Lovable — hosting, SSR, and the Cloud backend are provisioned together. Every deploy runs pending migrations. Custom domains are configured in project settings.

## Future improvements

- Recurring tasks and reminders (via pg_cron + a server route)
- Realtime sync across devices
- Sub-tasks, tags, and saved filters
- Keyboard-first quick add
- Native dark-mode toggle with persisted preference
- Team workspaces
