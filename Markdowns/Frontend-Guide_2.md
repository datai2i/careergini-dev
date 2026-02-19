# CareerGini - Frontend Development Guide

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [State Management](#state-management)
4. [Component Library](#component-library)
5. [API Integration](#api-integration)
6. [Routing & Navigation](#routing--navigation)
7. [Styling & Design System](#styling--design-system)

---

## Architecture Overview

CareerGini frontend is built with **React 18 + TypeScript + Vite** following a modular component architecture with centralized state management.

### Tech Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | React | 18.3.x | UI library |
| **Language** | TypeScript | 5.x | Type safety |
| **Build Tool** | Vite | 5.x | Dev server & bundler |
| **State Management** | Zustand | 4.x | Global state |
| **Data Fetching** | React Query | 5.x | Server state caching |
| **HTTP Client** | Axios | 1.x | API requests |
| **Routing** | React Router | 6.x | Client-side routing |
| **Styling** | TailwindCSS | 3.x | Utility-first CSS |
| **Forms** | React Hook Form | 7.x | Form handling |
| **Validation** | Zod | 3.x | Schema validation |
| **WebSocket** | socket.io-client | 4.x | Real-time chat |
| **Charts** | Recharts | 2.x | Data visualization |
| **Markdown** | react-markdown | 9.x | Chat message rendering |

---

## Project Structure

```
frontend/
├── public/
│   ├── logo.svg
│   └── favicon.ico
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── vite-env.d.ts
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginButton.tsx
│   │   │   ├── OAuthCallback.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── chat/
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── StreamingMessage.tsx
│   │   │   └── SuggestedPrompts.tsx
│   │   ├── profile/
│   │   │   ├── ProfileDashboard.tsx
│   │   │   ├── ProfileHeader.tsx
│   │   │   ├── SkillsMatrix.tsx
│   │   │   ├── ExperienceTimeline.tsx
│   │   │   ├── CareerGoals.tsx
│   │   │   ├── SyncButtons.tsx
│   │   │   └── ProfileMindMap.tsx
│   │   ├── resume/
│   │   │   ├── ResumeBuilder.tsx
│   │   │   ├── JDInput.tsx
│   │   │   ├── ResumePreview.tsx
│   │   │   ├── TemplateSelector.tsx
│   │   │   ├── SectionEditor.tsx
│   │   │   └── ExportOptions.tsx
│   │   ├── jobs/
│   │   │   ├── JobBoard.tsx
│   │   │   ├── JobCard.tsx
│   │   │   ├── JobFilters.tsx
│   │   │   ├── ApplicationTracker.tsx
│   │   │   └── JobDetails.tsx
│   │   ├── learning/
│   │   │   ├── ResourceHub.tsx
│   │   │   ├── LearningPath.tsx
│   │   │   ├── ResourceCard.tsx
│   │   │   ├── ProgressTracker.tsx
│   │   │   └── SkillRoadmap.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── Card.tsx
│   │       ├── Spinner.tsx
│   │       ├── Toast.tsx
│   │       ├── Badge.tsx
│   │       └── Avatar.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Chat.tsx
│   │   ├── Profile.tsx
│   │   ├── Resume.tsx
│   │   ├── Jobs.tsx
│   │   └── Learning.tsx
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── chatStore.ts
│   │   ├── profileStore.ts
│   │   ├── resumeStore.ts
│   │   └── uiStore.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── chatService.ts
│   │   ├── profileService.ts
│   │   ├── resumeService.ts
│   │   ├── jobService.ts
│   │   └── learningService.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useChat.ts
│   │   ├── useProfile.ts
│   │   └── useDebounce.ts
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── profile.types.ts
│   │   ├── chat.types.ts
│   │   ├── resume.types.ts
│   │   └── job.types.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   └── styles/
│       └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

---

## State Management

### Zustand Stores

#### 1. Auth Store

```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: (token, user) => set({
        token,
        user,
        isAuthenticated: true,
      }),
      
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
      }),
      
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
```

#### 2. Chat Store

```typescript
// store/chatStore.ts
import { create } from 'zustand';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatState {
  messages: Message[];
  sessionId: string | null;
  isLoading: boolean;
  streamingMessage: string;
  suggestedPrompts: string[];
  
  addMessage: (message: Message) => void;
  updateStreamingMessage: (content: string) => void;
  finalizeStreamingMessage: () => void;
  clearMessages: () => void;
  setSessionId: (id: string) => void;
  setSuggestedPrompts: (prompts: string[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  sessionId: null,
  isLoading: false,
  streamingMessage: '',
  suggestedPrompts: [],
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  
  updateStreamingMessage: (content) => set({
    streamingMessage: content,
    isLoading: true,
  }),
  
  finalizeStreamingMessage: () => set((state) => ({
    messages: [
      ...state.messages,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: state.streamingMessage,
        timestamp: new Date(),
      },
    ],
    streamingMessage: '',
    isLoading: false,
  })),
  
  clearMessages: () => set({
    messages: [],
    sessionId: null,
  }),
  
  setSessionId: (id) => set({ sessionId: id }),
  
  setSuggestedPrompts: (prompts) => set({ suggestedPrompts: prompts }),
}));
```

#### 3. Profile Store

```typescript
// store/profileStore.ts
import { create } from 'zustand';

interface Profile {
  id: string;
  userId: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  experienceLevel: string;
  careerGoals: string[];
  linkedinSynced: boolean;
  githubSynced: boolean;
}

interface Experience {
  company: string;
  role: string;
  duration: string;
  description: string;
}

interface Education {
  institution: string;
  degree: string;
  year: string;
}

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  
  setProfile: (profile: Profile) => void;
  updateSkills: (skills: string[]) => void;
  updateCareerGoals: (goals: string[]) => void;
  setLinkedinSynced: (synced: boolean) => void;
  setGithubSynced: (synced: boolean) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,
  
  setProfile: (profile) => set({ profile }),
  
  updateSkills: (skills) => set((state) => ({
    profile: state.profile ? { ...state.profile, skills } : null,
  })),
  
  updateCareerGoals: (careerGoals) => set((state) => ({
    profile: state.profile ? { ...state.profile, careerGoals } : null,
  })),
  
  setLinkedinSynced: (linkedinSynced) => set((state) => ({
    profile: state.profile ? { ...state.profile, linkedinSynced } : null,
  })),
  
  setGithubSynced: (githubSynced) => set((state) => ({
    profile: state.profile ? { ...state.profile, githubSynced } : null,
  })),
}));
```

---

## Component Library

### 1. Common Components

#### Button Component

```typescript
// components/common/Button.tsx
import React from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Spinner size="sm" className="mr-2" />
      ) : leftIcon && (
        <span className="mr-2">{leftIcon}</span>
      )}
      {children}
      {rightIcon && !isLoading && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  );
};
```

### 2. Chat Components

#### ChatInterface Component

```typescript
// components/chat/ChatInterface.tsx
import React, { useEffect, useRef } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { SuggestedPrompts } from './SuggestedPrompts';
import { useChatStore } from '../../store/chatStore';
import { chatService } from '../../services/chatService';

export const ChatInterface: React.FC = () => {
  const { messages, suggestedPrompts, addMessage, updateStreamingMessage, finalizeStreamingMessage } = useChatStore();
  const [isLoading, setIsLoading] = React.useState(false);
  
  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
      timestamp: new Date(),
    };
    addMessage(userMessage);
    
    // Send to backend with streaming
    setIsLoading(true);
    try {
      await chatService.sendMessage(content, {
        onChunk: (chunk: string) => {
          updateStreamingMessage(chunk);
        },
        onComplete: () => {
          finalizeStreamingMessage();
          setIsLoading(false);
        },
        onError: (error: Error) => {
          console.error('Chat error:', error);
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    }
  };
  
  return (
    <div className=\"flex flex-col h-screen bg-gray-50\">
      <div className=\"flex-1 overflow-y-auto p-4\">
        {messages.length === 0 ? (
          <div className=\"flex flex-col items-center justify-center h-full\">
            <h2 className=\"text-2xl font-bold text-gray-800 mb-4\">
              Welcome to CareerGini
            </h2>
            <p className=\"text-gray-600 mb-8\">
              Your AI-powered career advisor
            </p>
            <SuggestedPrompts
              prompts={[
                \"Analyze my profile\",
                \"Find me data science jobs\",
                \"Create a resume\",
                \"Show my skill gaps\",
              ]}
              onPromptClick={handleSendMessage}
            />
          </div>
        ) : (
          <>
            <MessageList messages={messages} />
            {suggestedPrompts.length > 0 && (
              <SuggestedPrompts
                prompts={suggestedPrompts}
                onPromptClick={handleSendMessage}
              />
            )}
          </>
        )}
      </div>
      
      <MessageInput
        onSend={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
};
```

---

## API Integration

### Axios Instance Configuration

```typescript
// services/api.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      useAuthStore.getState().logout();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Service Examples

```typescript
// services/chatService.ts
import api from './api';
import { io, Socket } from 'socket.io-client';

interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

class ChatService {
  private socket: Socket | null = null;
  
  async sendMessage(message: string, callbacks: StreamCallbacks) {
    try {
      const response = await api.post('/chat/message', {
        message,
      });
      
      const sessionId = response.data.sessionId;
      
      // Connect to WebSocket for streaming
      if (!this.socket) {
        this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');
      }
      
      this.socket.emit('chat:subscribe', sessionId);
      
      this.socket.on('chat:chunk', callbacks.onChunk);
      this.socket.once('chat:complete', callbacks.onComplete);
      this.socket.on('chat:error', callbacks.onError);
      
    } catch (error) {
      callbacks.onError(error as Error);
    }
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const chatService = new ChatService();
```

---

## Routing & Navigation

```typescript
// App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Resume from './pages/Resume';
import Jobs from './pages/Jobs';
import Learning from './pages/Learning';
import OAuthCallback from './components/auth/OAuthCallback';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to=\"/\" replace />;
};

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path=\"/\" element={<Home />} />
          <Route path=\"/auth/callback/:provider\" element={<OAuthCallback />} />
          
          <Route
            path=\"/dashboard\"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path=\"/chat\"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          
          <Route
            path=\"/profile\"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          
          <Route
            path=\"/resume\"
            element={
              <ProtectedRoute>
                <Resume />
              </ProtectedRoute>
            }
          />
          
          <Route
            path=\"/jobs\"
            element={
              <ProtectedRoute>
                <Jobs />
              </ProtectedRoute>
            }
          />
          
          <Route
            path=\"/learning\"
            element={
              <ProtectedRoute>
                <Learning />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

---

## Styling & Design System

### TailwindCSS Configuration

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    \"./index.html\",
    \"./src/**/*.{js,ts,jsx,tsx}\",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          50: '#f9fafb',
          500: '#6b7280',
          700: '#374151',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

---

**Document Version**: 1.0  
**Last Updated**: February 17, 2026  
**Maintained By**: CareerGini Development Team