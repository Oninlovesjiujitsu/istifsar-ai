# Istifsar Mobile

Istifsar Mobile is the React Native companion to the Istifsar AI historiography platform, focused on Philippine history. Built with **Expo SDK 53** and **EAS Dev Builds** (no Expo Go). The app provides chat-based RAG queries, document browsing, citation exploration, and role-adaptive navigation.

## Tech Stack

- **Framework:** Expo SDK 53 + expo-router (file-based routing)
- **Backend:** Supabase JS client (direct CRUD) + Next.js API for RAG
- **Styling:** NativeWind (Tailwind for RN)
- **State:** zustand (auth, chat), TanStack Query (server data), MMKV (offline cache)
- **Animation:** react-native-reanimated
- **UI:** @gorhom/bottom-sheet, react-native-svg, victory-native (charts), react-native-markdown-display
- **Auth:** @supabase/supabase-js with AsyncStorage adapter

## Directory Structure

```
app/                  # Expo Router file-based routes
  (tabs)/             # Bottom tab navigator (role-adaptive)
  (auth)/             # Login, signup, forgot-password
  chat/[id].tsx       # Conversation screen
  document/[id].tsx   # Document detail
components/           # Shared UI components
  chat/               # MessageBubble, CitationChip, ChatInput, SSEStreamHandler
  document/           # DocumentCard, DocumentList
  explore/            # ArchiveCard, BountyFilters
  layout/             # TabBar, Header, BottomSheet wrappers
  shared/             # ContentionView, VoteButton
lib/                  # Utilities and clients
  supabase.ts         # Supabase client init
  api.ts              # Next.js API client (RAG, chat)
  sse.ts              # Custom SSE streaming client
  theme.ts            # Color tokens, font config
  storage.ts          # MMKV wrapper
types/                # TypeScript types (mirrors web repo)
stores/               # Zustand stores (auth, chat, ui)
assets/               # Fonts, images
```

## Backend Integration

- **Direct Supabase client** for all CRUD: documents, profiles, votes, citations, conversations.
- **Next.js API** (`POST /api/chat`) for RAG chat streaming. Base URL from `EXPO_PUBLIC_API_BASE_URL` env var.
- **Auth:** Bearer token in `Authorization` header for API calls. Get the token from `supabase.auth.getSession()`.
- Never call Supabase Edge Functions directly from mobile — go through the Next.js API.

## Auth

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // required for RN
  },
});
```

- Roles from `session.user.app_metadata.role`: `reader`, `verified_historian`, `admin`
- No magic link auth — email/password only
- No cookie-based auth — token-based via AsyncStorage

## Navigation

- **Expo Router** file-based routing with layout groups
- **Role-adaptive bottom tabs:** readers see explore/chat/settings; historians also see publications/upload; admins see admin panel
- **Auth stack:** unauthenticated users see `(auth)/` routes only
- Use `<Redirect>` from expo-router for auth guards in layout files

## Design System

### Colors
| Token | Value |
|-------|-------|
| Gold (accent) | `#d4af37` |
| Light background | `#faf7f2` |
| Dark background | `#1a1a2e` |
| Sepia tint | `#f5f0e8` |
| Text primary (light) | `#2d2d2d` |
| Text primary (dark) | `#e8e0d4` |

### Fonts
- **Figtree** — UI text (body, buttons, labels)
- **Playfair Display** — headings, historian names
- **Noto Serif** — document content, blockquotes

Load via `expo-font`. Configure in `app/_layout.tsx`.

### Liquid Glass (iOS 26+)
- Use `UIModule.liquidGlass` effects on iOS 26+ where available
- Fallback: sepia-tinted glassmorphism using `BlurView` + semi-transparent overlay
- Always provide the fallback — liquid glass is iOS 26+ only

## Chat Streaming

Do **not** use `@ai-sdk/react` or `useChat` — these are web-only. Instead:

1. Custom SSE client in `lib/sse.ts` that reads the stream from `POST /api/chat`
2. Parse the **AI SDK UI message stream protocol** (data-stream format):
   - `0:` — text delta
   - `8:` — tool call result (citations)
   - `d:` — finish reason
   - `e:` — error
3. Citations arrive as tool call results. Render as pressable chips (`<Pressable>`) that open a `@gorhom/bottom-sheet` with source details.
4. Use `fetch` with a `ReadableStream` reader — no EventSource polyfill needed.

## State Management

- **zustand** stores for auth state (`stores/authStore.ts`) and chat state (`stores/chatStore.ts`)
- **TanStack Query** for all server data fetching (documents, catalog, profiles, citations)
- **MMKV** (`lib/storage.ts`) for offline caching and persisting zustand stores
- Do not use React Context for global state — use zustand

## Conventions

- **Styling:** NativeWind `className` prop only. No inline `style` objects unless NativeWind can't express it (e.g., dynamic reanimated values).
- **Responsive:** Use `useWindowDimensions()` to adapt layouts for phone vs tablet. No CSS media queries.
- **No secrets client-side:** Only `EXPO_PUBLIC_*` env vars are available. Supabase anon key is fine; service role key must never be in mobile code.
- **No web patterns:** No `document`, `window`, `localStorage`, `cookies`, Next.js server actions, or Tailwind classes unsupported by NativeWind.
- **Imports:** Use `@/` path alias mapped to project root.
- **Types:** Share types with web repo via `types/` directory. Keep in sync manually.
- **Testing:** Use Jest + React Native Testing Library. Test files colocated as `__tests__/Component.test.tsx`.
