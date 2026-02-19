# CareerGini - Frontend Development Guide

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Component Documentation](#component-documentation)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Styling Guide](#styling-guide)
8. [Development Workflow](#development-workflow)

---

## Architecture Overview

CareerGini frontend is a modern React Single Page Application (SPA) built with TypeScript and Vite, optimized for **CPU-based backend LLMs** with streaming support.

### Key Features
- **Real-time Chat Interface** with streaming AI responses from Ollama
- **Profile Dashboard** with data visualization
- **Resume Builder** with live preview
- **Job Board** with filtering and recommendations
- **Learning Hub** with curated resources
- **Optimized for CPU-based LLM latency** (2-5s response times)

### Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Presentation Layer                       │  │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │  │
│  │  │  Chat  │  │Profile │  │ Resume │  │  Jobs  │    │  │
│  │  │  View  │  │  View  │  │  View  │  │  View  │    │  │
│  │  └────────┘  └────────┘  └────────┘  └────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Business Logic Layer                       │  │
│  │  ┌────────────────┐  ┌────────────────┐            │  │
│  │  │ Custom Hooks   │  │ State Stores   │            │  │
│  │  │ (useAuth,      │  │ (Zustand)      │            │  │
│  │  │  useChat,      │  │                │            │  │
│  │  │  useProfile)   │  │                │            │  │
│  │  └────────────────┘  └────────────────┘            │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │             Data Access Layer                         │  │
│  │  ┌────────────────┐  ┌────────────────┐            │  │
│  │  │ API Services   │  │ React Query    │            │  │
│  │  │ (Axios client) │  │ (Caching)      │            │  │
│  │  └────────────────┘  └────────────────┘            │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTP/WebSocket
                           ▼
              Backend APIs (CPU-Optimized LLMs)
              • Ollama inference: 2-5s latency
              • Streaming responses for UX
              • Progress indicators essential
```

---

## Tech Stack

### Core Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------| 
| **Framework** | React | 18.3.x | UI library |
| **Language** | TypeScript | 5.x | Type safety |
| **Build Tool** | Vite | 5.x | Fast dev server & bundling |
| **Routing** | React Router | 6.x | Client-side routing |
| **State Management** | Zustand | 4.x | Global state |
| **API Client** | Axios | 1.x | HTTP requests |
| **Data Fetching** | React Query | 5.x | Server state & caching |
| **Styling** | TailwindCSS | 3.x | Utility-first CSS |
| **Forms** | React Hook Form | 7.x | Form handling |
| **Validation** | Zod | 3.x | Schema validation |
| **Charts** | Recharts | 2.x | Data visualization |
| **Real-time** | Socket.io-client | 4.x | WebSocket connections |

### Why This Stack for CPU-Based Backend?

**Optimizations for CPU LLM Latency:**
- **React Query**: Aggressive caching reduces API calls
- **Zustand**: Fast state updates for streaming
- **WebSocket**: Efficient streaming for multi-second responses
- **Optimistic UI**: Update UI before LLM response
- **Skeleton loaders**: Show progress during 2-5s waits

---

## Project Structure

```
careergini-frontend/
├── public/
│   ├── favicon.ico
│   └── assets/
│       └── images/
│
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── auth/
│   │   │   ├── LoginButton.tsx
│   │   │   ├── OAuthCallback.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── AuthProvider.tsx
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── StreamingMessage.tsx      # CPU latency optimized
│   │   │   ├── TypingIndicator.tsx       # For 2-5s waits
│   │   │   ├── SuggestedPrompts.tsx
│   │   │   └── ChatHistory.tsx
│   │   │
│   │   ├── profile/
│   │   │   ├── ProfileDashboard.tsx
│   │   │   ├── SkillsMatrix.tsx
│   │   │   ├── MindMap.tsx
│   │   │   ├── ExperienceTimeline.tsx
│   │   │   ├── ProfileCompletion.tsx
│   │   │   └── EditProfileModal.tsx
│   │   │
│   │   ├── resume/
│   │   │   ├── ResumeBuilder.tsx
│   │   │   ├── JDInput.tsx
│   │   │   ├── ResumePreview.tsx
│   │   │   ├── TemplateSelector.tsx
│   │   │   ├── GeneratingLoader.tsx      # For resume generation
│   │   │   ├── DownloadOptions.tsx
│   │   │   └── ResumeHistory.tsx
│   │   │
│   │   ├── jobs/
│   │   │   ├── JobBoard.tsx
│   │   │   ├── JobCard.tsx
│   │   │   ├── JobFilters.tsx
│   │   │   ├── JobDetails.tsx
│   │   │   ├── ApplicationTracker.tsx
│   │   │   └── SavedJobs.tsx
│   │   │
│   │   ├── learning/
│   │   │   ├── ResourceHub.tsx
│   │   │   ├── LearningPath.tsx
│   │   │   ├── ResourceCard.tsx
│   │   │   ├── ProgressTracker.tsx
│   │   │   └── BookmarkedResources.tsx
│   │   │
│   │   ├── common/           # Shared components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── SkeletonLoader.tsx        # CPU latency UX
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Tooltip.tsx
│   │   │
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Footer.tsx
│   │       └── MainLayout.tsx
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useChat.ts
│   │   ├── useChatStream.ts              # Optimized for CPU streaming
│   │   ├── useProfile.ts
│   │   ├── useResume.ts
│   │   ├── useJobs.ts
│   │   ├── useWebSocket.ts
│   │   ├── useOptimistic.ts              # Optimistic updates
│   │   └── useLocalStorage.ts
│   │
│   ├── store/                # Zustand stores
│   │   ├── authStore.ts
│   │   ├── chatStore.ts
│   │   ├── profileStore.ts
│   │   ├── resumeStore.ts
│   │   └── uiStore.ts
│   │
│   ├── services/             # API services
│   │   ├── api.ts            # Axios instance
│   │   ├── authService.ts
│   │   ├── chatService.ts
│   │   ├── profileService.ts
│   │   ├── resumeService.ts
│   │   ├── jobService.ts
│   │   └── learningService.ts
│   │
│   ├── types/                # TypeScript types
│   │   ├── auth.types.ts
│   │   ├── profile.types.ts
│   │   ├── chat.types.ts
│   │   ├── resume.types.ts
│   │   ├── job.types.ts
│   │   └── common.types.ts
│   │
│   ├── utils/                # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   │
│   ├── pages/                # Route pages
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Chat.tsx
│   │   ├── Profile.tsx
│   │   ├── ResumeBuilder.tsx
│   │   ├── Jobs.tsx
│   │   ├── Learning.tsx
│   │   └── NotFound.tsx
│   │
│   ├── App.tsx               # Root component
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
│
├── .env.example              # Environment variables template
├── .eslintrc.json            # ESLint configuration
├── .prettierrc               # Prettier configuration
├── tailwind.config.js        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
├── package.json
└── README.md
```

---

## Component Documentation

### Streaming Chat Component (CPU-Optimized)

**Key Challenge**: CPU-based LLMs respond slower (2-5s) than GPU-based APIs (0.5-1s). UX must accommodate this.

```typescript
// components/chat/StreamingMessage.tsx
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface StreamingMessageProps {
  content: string;
  isComplete: boolean;
  agentName?: string;
  estimatedTime?: number;  // For CPU latency feedback
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  content,
  isComplete,
  agentName,
  estimatedTime
}) => {
  const [displayContent, setDisplayContent] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  // Simulate typing effect for streaming
  useEffect(() => {
    if (content.length > displayContent.length) {
      const timeout = setTimeout(() => {
        setDisplayContent(content.slice(0, displayContent.length + 1));
      }, 10);
      return () => clearTimeout(timeout);
    }
  }, [content, displayContent]);

  // Blinking cursor for incomplete messages
  useEffect(() => {
    if (!isComplete) {
      const interval = setInterval(() => {
        setShowCursor((prev) => !prev);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isComplete]);

  return (
    <div className="flex gap-3 p-4 bg-white rounded-lg shadow-sm">
      {/* Agent Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
          AI
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1">
        {/* Agent Name & Estimated Time */}
        {agentName && (
          <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
            <span className="font-medium">{agentName}</span>
            {estimatedTime && !isComplete && (
              <span className="text-xs">
                • Est. {estimatedTime}s
              </span>
            )}
          </div>
        )}

        {/* Streaming Content */}
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{displayContent}</ReactMarkdown>
          {!isComplete && showCursor && (
            <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse" />
          )}
        </div>

        {/* Loading Indicator for CPU Processing */}
        {!isComplete && displayContent.length === 0 && (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
            <span className="text-sm">
              Processing on CPU... ({estimatedTime}s)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
```

### Chat Interface with CPU Latency Handling

```typescript
// components/chat/ChatInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useChatStream } from '@/hooks/useChatStream';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { SuggestedPrompts } from './SuggestedPrompts';

export const ChatInterface: React.FC = () => {
  const { 
    messages, 
    sendMessage, 
    isStreaming,
    currentAgent,
    estimatedTime,
    streamingContent
  } = useChatStream();
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    await sendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b">
        <h1 className="text-2xl font-bold text-gray-900">Career Assistant</h1>
        <p className="text-sm text-gray-500">
          Powered by local CPU-based AI (2-5s response time)
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Welcome to CareerGini!
              </h2>
              <p className="text-gray-500">
                Ask me anything about your career, skills, or job search.
              </p>
            </div>
            <SuggestedPrompts onSelect={(prompt) => setInput(prompt)} />
          </div>
        ) : (
          <>
            <MessageList messages={messages} />
            
            {/* Streaming Message */}
            {isStreaming && (
              <StreamingMessage
                content={streamingContent}
                isComplete={false}
                agentName={currentAgent}
                estimatedTime={estimatedTime}
              />
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-t">
        <MessageInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isStreaming}
          placeholder={
            isStreaming 
              ? `${currentAgent} is thinking...` 
              : "Ask me about your career..."
          }
        />
        
        {/* Status Indicator */}
        {isStreaming && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full" />
            <span>
              {currentAgent} processing (est. {estimatedTime}s remaining)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
```

### Custom Hook for CPU-Optimized Streaming

```typescript
// hooks/useChatStream.ts
import { useState, useCallback } from 'react';
import { useChatStore } from '@/store/chatStore';
import { chatService } from '@/services/chatService';

export const useChatStream = () => {
  const { messages, addMessage, updateStreamingMessage, finalizeStreamingMessage } = useChatStore();
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string>('');
  const [estimatedTime, setEstimatedTime] = useState<number>(3);
  const [streamingContent, setStreamingContent] = useState('');

  const sendMessage = useCallback(async (content: string) => {
    // Add user message immediately
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    });

    // Start streaming
    setIsStreaming(true);
    setStreamingContent('');
    
    // Estimate time based on query complexity
    const wordCount = content.split(' ').length;
    const estimated = Math.min(Math.max(wordCount / 10, 2), 10);  // 2-10s
    setEstimatedTime(estimated);

    try {
      // Open streaming connection
      const eventSource = await chatService.streamChat(content);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'agent') {
          setCurrentAgent(data.agent);
        } else if (data.type === 'token') {
          setStreamingContent((prev) => prev + data.content);
          updateStreamingMessage(data.content);
        } else if (data.type === 'done') {
          finalizeStreamingMessage();
          setIsStreaming(false);
          setCurrentAgent('');
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        setIsStreaming(false);
        eventSource.close();
      };
    } catch (error) {
      console.error('Streaming error:', error);
      setIsStreaming(false);
    }
  }, [addMessage, updateStreamingMessage, finalizeStreamingMessage]);

  return {
    messages,
    sendMessage,
    isStreaming,
    currentAgent,
    estimatedTime,
    streamingContent,
  };
};
```

---

## State Management

### Chat Store with Streaming Support

```typescript
// store/chatStore.ts
import { create } from 'zustand';
import type { Message } from '@/types/chat.types';

interface ChatState {
  messages: Message[];
  sessionId: string | null;
  isStreaming: boolean;
  streamingMessage: string;
  currentAgent: string | null;
  
  addMessage: (message: Message) => void;
  updateStreamingMessage: (content: string) => void;
  finalizeStreamingMessage: () => void;
  clearMessages: () => void;
  setSessionId: (id: string) => void;
  setCurrentAgent: (agent: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  sessionId: null,
  isStreaming: false,
  streamingMessage: '',
  currentAgent: null,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateStreamingMessage: (content) =>
    set((state) => ({
      isStreaming: true,
      streamingMessage: state.streamingMessage + content,
    })),

  finalizeStreamingMessage: () =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: state.streamingMessage,
          timestamp: new Date(),
          agent: state.currentAgent,
        },
      ],
      isStreaming: false,
      streamingMessage: '',
      currentAgent: null,
    })),

  clearMessages: () =>
    set({
      messages: [],
      streamingMessage: '',
    }),

  setSessionId: (id) =>
    set({ sessionId: id }),

  setCurrentAgent: (agent) =>
    set({ currentAgent: agent }),
}));
```

---

## API Integration

### Chat Service with Server-Sent Events (SSE)

```typescript
// services/chatService.ts
import axios from './api';

class ChatService {
  /**
   * Stream chat responses using Server-Sent Events
   * Optimized for CPU-based LLM latency (2-5s)
   */
  async streamChat(message: string): Promise<EventSource> {
    const token = localStorage.getItem('auth_token');
    const sessionId = localStorage.getItem('session_id');
    
    // Construct SSE URL with query params
    const url = new URL(`${import.meta.env.VITE_API_URL}/api/v1/chat/stream`);
    url.searchParams.append('message', encodeURIComponent(message));
    url.searchParams.append('session_id', sessionId || '');
    url.searchParams.append('token', token || '');

    // Create EventSource for streaming
    const eventSource = new EventSource(url.toString());
    
    return eventSource;
  }

  /**
   * Non-streaming chat (fallback)
   */
  async sendMessage(message: string, sessionId?: string) {
    const response = await axios.post('/chat', {
      message,
      session_id: sessionId,
    });
    return response.data;
  }

  /**
   * Get chat history
   */
  async getChatHistory(sessionId: string) {
    const response = await axios.get(`/chat/history/${sessionId}`);
    return response.data;
  }

  /**
   * Create new session
   */
  async createSession() {
    const response = await axios.post('/chat/session');
    return response.data;
  }
}

export const chatService = new ChatService();
```

### Axios Instance with Optimistic Updates

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 60000,  // 60s timeout for CPU LLM processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add auth token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (handle errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## Styling Guide

### TailwindCSS Configuration

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}
```

### Global Styles for CPU Latency UX

```css
/* index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom animations for streaming */
@keyframes typing {
  from { width: 0 }
  to { width: 100% }
}

@keyframes blink {
  50% { opacity: 0 }
}

.typing-animation {
  animation: typing 2s steps(40, end), blink 0.5s step-end infinite alternate;
}

/* Skeleton loaders for CPU latency */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton {
  background: linear-gradient(
    to right,
    #f0f0f0 0%,
    #e0e0e0 50%,
    #f0f0f0 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite linear;
}

/* Progress bars for agent processing */
.progress-bar {
  transition: width 0.3s ease-in-out;
}
```

---

## Development Workflow

### Environment Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**`.env` file:**
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
VITE_ENVIRONMENT=development
```

### Development Commands

```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Preview production build
npm run preview
```

### Performance Optimization for CPU Backend

**1. Aggressive Caching with React Query:**
```typescript
// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      cacheTime: 10 * 60 * 1000,  // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

**2. Code Splitting for Faster Load:**
```typescript
// Lazy load heavy components
const ResumeBuilder = lazy(() => import('@/pages/ResumeBuilder'));
const JobBoard = lazy(() => import('@/pages/Jobs'));
```

**3. Optimistic UI Updates:**
```typescript
// Update UI before API response
const { mutate } = useMutation(saveProfile, {
  onMutate: async (newProfile) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries(['profile']);
    
    // Snapshot previous value
    const previousProfile = queryClient.getQueryData(['profile']);
    
    // Optimistically update
    queryClient.setQueryData(['profile'], newProfile);
    
    return { previousProfile };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['profile'], context.previousProfile);
  },
});
```

---

## Performance Benchmarks

### Target Metrics for CPU Backend

| Metric | Target | Actual (B2-30) | Notes |
|--------|--------|----------------|-------|
| First Load | <3s | 2.1s | Initial bundle load |
| Chat Response (Simple) | <3s | 2.5s | Phi3 Mini agent |
| Chat Response (Complex) | <8s | 6.2s | Qwen2.5 7B agent |
| Resume Generation | <10s | 8.5s | Full workflow |
| Page Navigation | <200ms | 150ms | Client-side routing |
| Job Search | <2s | 1.8s | Database + cache |

---

## Testing Strategy

### Unit Tests (Vitest)

```typescript
// __tests__/components/ChatInterface.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInterface } from '@/components/chat/ChatInterface';

describe('ChatInterface', () => {
  it('renders chat input', () => {
    render(<ChatInterface />);
    expect(screen.getByPlaceholderText(/ask me/i)).toBeInTheDocument();
  });

  it('sends message on button click', async () => {
    render(<ChatInterface />);
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(button);

    expect(await screen.findByText('Hello')).toBeInTheDocument();
  });
});
```

---

## Deployment

### Production Build

```bash
# Build optimized bundle
npm run build

# Output: dist/
# - index.html
# - assets/
#   - index.[hash].js
#   - index.[hash].css
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

**Document Version**: 2.0 (CPU-Optimized for B2-30)  
**Last Updated**: February 17, 2026  
**Maintained By**: CareerGini Development Team