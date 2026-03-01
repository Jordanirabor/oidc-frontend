# Frontend Development Guidelines

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Design Patterns](#design-patterns)
4. [Component Design](#component-design)
5. [State Management](#state-management)
6. [Custom Hooks](#custom-hooks)
7. [Type Safety](#type-safety)
8. [API Integration](#api-integration)
9. [Error Handling](#error-handling)
10. [Performance](#performance)
11. [Styling](#styling)
12. [Testing](#testing)
13. [Code Quality](#code-quality)

---

## Architecture Overview

### Next.js App Router Architecture

```
┌─────────────────────────────────────┐
│         Pages (Routes)              │  ← Route handlers
├─────────────────────────────────────┤
│         Components                  │  ← UI components
├─────────────────────────────────────┤
│         Custom Hooks                │  ← Reusable logic
├─────────────────────────────────────┤
│         Utils / Lib                 │  ← Utilities
└─────────────────────────────────────┘
```

### Key Principles
- **Component Reusability**: Extract shared UI into components
- **Custom Hooks**: Extract shared logic into hooks
- **Type Safety**: TypeScript for all code
- **Separation of Concerns**: Logic separate from presentation
- **Performance First**: Optimize rendering and data fetching

---

## Project Structure

```
src/
├── app/                      # Next.js 13+ App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── dashboard/
│   │   └── page.tsx
│   ├── consent/
│   │   └── page.tsx
│   └── api/                 # API routes
│       └── route.ts
├── components/              # Reusable UI components
│   ├── ui/                  # Base UI components (shadcn)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── input.tsx
│   ├── forms/               # Form components
│   │   └── login-form.tsx
│   └── referral-code-card.tsx
├── hooks/                   # Custom React hooks
│   └── use-referral-code.ts
├── lib/                     # Utilities and helpers
│   └── utils.ts
├── types/                   # TypeScript type definitions
│   └── referral.ts
├── contexts/                # React contexts
│   └── account-context.tsx
└── styles/                  # Global styles
    └── globals.css
```

---

## Design Patterns

### 1. Custom Hooks Pattern

**Purpose**: Extract reusable stateful logic

**Implementation**:
```typescript
// hooks/use-referral-code.ts
export function useReferralCode(accountId?: string) {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReferralCode = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchWithRetry(url, { credentials: "include" });
      if (response.ok) {
        const data: ReferralCodeResponse = await response.json();
        setReferralCode(data.referralCode);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadReferralCode();
  }, [loadReferralCode]);

  return { referralCode, isLoading, error, loadReferralCode };
}
```

**Rules**:
- ✅ Start with `use` prefix
- ✅ Return object with descriptive keys
- ✅ Include loading and error states
- ✅ Use `useCallback` for functions returned
- ✅ Use `useEffect` for side effects
- ❌ Don't return arrays (destructuring loses context)
- ❌ Don't mix UI logic with data logic

**Usage**:
```typescript
function DashboardPage() {
  const { referralCode, isLoading, error } = useReferralCode();
  
  if (isLoading) return <Loading />;
  if (error) return <Error message={error} />;
  return <div>{referralCode}</div>;
}
```

---

### 2. Compound Component Pattern

**Purpose**: Create flexible, reusable component APIs

**Implementation**:
```typescript
interface ReferralCodeCardProps {
  code: string;
  createdAt?: string | null;
  onRegenerate: () => void;
  isRegenerating: boolean;
  variant?: "default" | "consent";
}

export function ReferralCodeCard({
  code,
  createdAt,
  onRegenerate,
  isRegenerating,
  variant = "default",
}: ReferralCodeCardProps) {
  // Component implementation
}
```

**Rules**:
- ✅ Define clear prop interfaces
- ✅ Provide sensible defaults
- ✅ Support variants for different use cases
- ✅ Keep components focused (single responsibility)
- ❌ Don't make "god components" that do everything
- ❌ Don't pass more than 7-8 props (consider composition)

---

### 3. Container/Presentation Pattern

**Purpose**: Separate data fetching from presentation

**Container Component** (data logic):
```typescript
// app/dashboard/page.tsx
export default function DashboardPage() {
  const { referralCode, isLoading, isRegenerating, regenerateReferralCode } = 
    useReferralCode();
  
  return (
    <div>
      {referralCode && (
        <ReferralCodeCard
          code={referralCode}
          onRegenerate={regenerateReferralCode}
          isRegenerating={isRegenerating}
        />
      )}
    </div>
  );
}
```

**Presentation Component** (UI only):
```typescript
// components/referral-code-card.tsx
export function ReferralCodeCard({ code, onRegenerate, isRegenerating }) {
  return (
    <Card>
      <code>{code}</code>
      <Button onClick={onRegenerate} disabled={isRegenerating}>
        Regenerate
      </Button>
    </Card>
  );
}
```

---

## Component Design

### Component Structure

```typescript
"use client"; // Only if needed

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// 1. Type definitions
interface MyComponentProps {
  title: string;
  onAction: () => void;
  className?: string;
}

// 2. Component
export function MyComponent({ title, onAction, className }: MyComponentProps) {
  // 3. State
  const [isLoading, setIsLoading] = useState(false);
  
  // 4. Event handlers
  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onAction();
      toast.success("Success!");
    } catch (error) {
      toast.error("Failed!");
    } finally {
      setIsLoading(false);
    }
  };
  
  // 5. Render
  return (
    <div className={cn("container", className)}>
      <h1>{title}</h1>
      <Button onClick={handleClick} disabled={isLoading}>
        Click me
      </Button>
    </div>
  );
}
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Component | `PascalCase` | `ReferralCodeCard` |
| Hook | `use` + `camelCase` | `useReferralCode` |
| Utility | `camelCase` | `getCookie`, `fetchWithRetry` |
| Type/Interface | `PascalCase` | `ReferralCodeResponse` |
| Props Interface | Component + `Props` | `ReferralCodeCardProps` |

### File Naming

```
✅ Good:
- referral-code-card.tsx
- use-referral-code.ts
- login-form.tsx

❌ Bad:
- ReferralCodeCard.tsx (PascalCase)
- useReferralCode.tsx (wrong extension)
- LoginForm.component.tsx (unnecessary suffix)
```

---

## State Management

### Local State (useState)

**Use for component-specific state**:
```typescript
function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
  return (/* ... */);
}
```

### Derived State

**Don't store what you can calculate**:
```typescript
// ❌ Bad - redundant state
const [users, setUsers] = useState([]);
const [userCount, setUserCount] = useState(0);

// ✅ Good - derive from users
const [users, setUsers] = useState([]);
const userCount = users.length;
```

### Server State (Custom Hooks)

**Use custom hooks for API data**:
```typescript
function useReferralCode(accountId?: string) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch logic...
  
  return { data, isLoading, error, refetch };
}
```

### Context (for Global State)

**Use sparingly for truly global state**:
```typescript
// contexts/account-context.tsx
const AccountContext = createContext<AccountContextValue | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [currentAccount, setCurrentAccount] = useState(null);
  
  return (
    <AccountContext.Provider value={{ currentAccount, setCurrentAccount }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within AccountProvider');
  }
  return context;
}
```

---

## Custom Hooks

### Hook Design Principles

**1. Single Responsibility**:
```typescript
// ✅ Good - focused on referral code logic
function useReferralCode() { }

// ❌ Bad - does too much
function useUserDataAndReferralAndNotifications() { }
```

**2. Return Object (not array)**:
```typescript
// ✅ Good - clear what each value is
const { referralCode, isLoading, error } = useReferralCode();

// ❌ Bad - unclear what [0], [1], [2] represent
const [referralCode, isLoading, error] = useReferralCode();
```

**3. Include Loading & Error States**:
```typescript
interface UseReferralCodeReturn {
  referralCode: string | null;
  isLoading: boolean;
  error: string | null;
  loadReferralCode: () => Promise<void>;
  regenerateReferralCode: () => Promise<void>;
}
```

**4. Use Proper Dependencies**:
```typescript
// ✅ Good - proper dependencies
const loadData = useCallback(async () => {
  await fetch(`/api/data/${userId}`);
}, [userId]);

// ❌ Bad - missing dependencies
const loadData = useCallback(async () => {
  await fetch(`/api/data/${userId}`);
}, []); // userId should be in deps!
```

---

## Type Safety

### TypeScript Best Practices

**Always Define Types**:
```typescript
// ❌ Bad
interface Props {
  data: any;
  onClick: Function;
}

// ✅ Good
interface Props {
  data: ReferralCodeResponse;
  onClick: (id: string) => void;
}
```

**Use Type Inference**:
```typescript
// ✅ Good - type inferred
const [count, setCount] = useState(0); // number

// ❌ Unnecessary
const [count, setCount] = useState<number>(0);
```

**Type API Responses**:
```typescript
// types/referral.ts
export interface ReferralCodeResponse {
  referralCode: string;
  createdAt: string;
}

// In component
const response = await fetch('/api/referral-code');
const data: ReferralCodeResponse = await response.json();
```

**Avoid `any`**:
```typescript
// ❌ Bad
const handleError = (error: any) => { };

// ✅ Good
const handleError = (error: Error | unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
  }
};
```

---

## API Integration

### Fetch with Retry Logic

**Create reusable utility**:
```typescript
// lib/utils.ts
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < retries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      }
    }
  }
  
  throw lastError || new Error("Fetch failed after retries");
}
```

### Error Handling

**Handle all error cases**:
```typescript
const loadReferralCode = async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    const response = await fetchWithRetry(url);
    
    if (response.ok) {
      const data: ReferralCodeResponse = await response.json();
      setReferralCode(data.referralCode);
    } else {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error_description || "Failed to load";
      setError(message);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    setError(message);
  } finally {
    setIsLoading(false);
  }
};
```

### Request Debouncing

**Prevent rapid API calls**:
```typescript
// lib/utils.ts
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// In component/hook
const debouncedRegenerate = useRef(
  debounce(regenerateReferralCodeImpl, 500)
);
```

---

## Error Handling

### User-Facing Errors

**Use toast notifications**:
```typescript
import { toast } from "sonner";

try {
  await saveData();
  toast.success("Data saved successfully!");
} catch (error) {
  toast.error("Failed to save data");
}
```

**Show error states in UI**:
```typescript
if (error) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded p-4">
      <p className="text-red-400">{error}</p>
      <Button onClick={retry}>Retry</Button>
    </div>
  );
}
```

### Development Logging

**Wrap console.logs**:
```typescript
// ✅ Good
if (process.env.NODE_ENV === "development") {
  console.log("Debug data:", data);
}

// ❌ Bad - logs in production
console.log("Debug data:", data);
```

### Error Boundaries

**Catch React errors**:
```typescript
// components/error-boundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

---

## Performance

### Memoization

**Use React.memo for expensive renders**:
```typescript
// ✅ Good - prevents re-renders when props don't change
export const ReferralCodeCard = React.memo(function ReferralCodeCard({
  code,
  onRegenerate,
}: Props) {
  return (/* ... */);
});
```

**Use useMemo for expensive calculations**:
```typescript
const sortedUsers = useMemo(() => {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}, [users]);
```

**Use useCallback for functions passed as props**:
```typescript
const handleClick = useCallback((id: string) => {
  console.log("Clicked:", id);
}, []);

return <ChildComponent onClick={handleClick} />;
```

### Code Splitting

**Dynamic imports for large components**:
```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/heavy-component'), {
  loading: () => <Loading />,
  ssr: false,
});
```

### Image Optimization

**Use Next.js Image component**:
```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={150}
  height={60}
  priority // for above-the-fold images
/>
```

---

## Styling

### Tailwind CSS Best Practices

**Use utility classes**:
```typescript
<div className="flex items-center gap-4 p-6 bg-slate-900 rounded-lg">
  <h1 className="text-2xl font-bold text-white">Title</h1>
</div>
```

**Use cn() for conditional classes**:
```typescript
import { cn } from "@/lib/utils";

<Button className={cn(
  "px-4 py-2",
  isActive && "bg-blue-500",
  isDisabled && "opacity-50 cursor-not-allowed"
)} />
```

**Extract repeated patterns**:
```typescript
// ❌ Bad - repeated classes
<Card className="bg-[#0b1d2e] border-slate-800 shadow-xl" />
<Card className="bg-[#0b1d2e] border-slate-800 shadow-xl" />

// ✅ Good - extract to component or constant
const cardStyles = "bg-[#0b1d2e] border-slate-800 shadow-xl";
<Card className={cardStyles} />
```

---

## Testing

### Component Testing

**Test user interactions**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('ReferralCodeCard', () => {
  it('calls onRegenerate when button clicked', () => {
    const mockRegenerate = jest.fn();
    
    render(
      <ReferralCodeCard
        code="REF-12345"
        onRegenerate={mockRegenerate}
        isRegenerating={false}
      />
    );
    
    fireEvent.click(screen.getByTitle('Regenerate referral code'));
    expect(mockRegenerate).toHaveBeenCalled();
  });
});
```

### Hook Testing

**Test custom hooks**:
```typescript
import { renderHook, waitFor } from '@testing-library/react';

describe('useReferralCode', () => {
  it('loads referral code on mount', async () => {
    const { result } = renderHook(() => useReferralCode());
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.referralCode).toBe('REF-12345');
    });
  });
});
```

---

## Code Quality

### Code Review Checklist

- [ ] All components have proper TypeScript types
- [ ] No `any` types used
- [ ] Loading and error states handled
- [ ] API calls use `fetchWithRetry`
- [ ] Toast notifications for user feedback
- [ ] Console.logs wrapped in development checks
- [ ] Components are properly memoized
- [ ] Accessibility attributes added (aria-labels, etc.)
- [ ] Responsive design tested
- [ ] No prop drilling (use context if needed)

### Accessibility

**Use semantic HTML**:
```typescript
// ✅ Good
<button onClick={handleClick}>Click me</button>

// ❌ Bad
<div onClick={handleClick}>Click me</div>
```

**Add ARIA labels**:
```typescript
<Button
  onClick={onRegenerate}
  aria-label="Regenerate referral code"
  title="Regenerate referral code"
>
  <RefreshCw />
</Button>
```

**Keyboard navigation**:
```typescript
<input
  onKeyDown={(e) => {
    if (e.key === 'Enter') handleSubmit();
  }}
/>
```

---

## Common Anti-Patterns to Avoid

### ❌ Prop Drilling
```typescript
// ❌ Bad
<Parent data={data}>
  <Child data={data}>
    <GrandChild data={data}>
      <GreatGrandChild data={data} />
    </GrandChild>
  </Child>
</Parent>

// ✅ Good - use context
const DataContext = createContext(data);
<DataContext.Provider value={data}>
  <Parent>
    <Child>
      <GreatGrandChild /> {/* uses useContext(DataContext) */}
    </Child>
  </Parent>
</DataContext.Provider>
```

### ❌ Inline Functions in JSX
```typescript
// ❌ Bad - creates new function on every render
<Button onClick={() => handleClick(id)}>Click</Button>

// ✅ Good - memoized callback
const handleButtonClick = useCallback(() => {
  handleClick(id);
}, [id]);
<Button onClick={handleButtonClick}>Click</Button>
```

### ❌ Mixing Logic and Presentation
```typescript
// ❌ Bad
function UserProfile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Fetch logic...
  }, []);
  
  return (
    <div>
      {/* Complex UI */}
    </div>
  );
}

// ✅ Good - separate concerns
function useUser(userId: string) {
  // Fetch logic
  return { user, isLoading, error };
}

function UserProfile({ userId }: Props) {
  const { user, isLoading } = useUser(userId);
  
  if (isLoading) return <Loading />;
  return <UserProfileView user={user} />;
}
```

---

## Quick Reference

### New Component Checklist
1. Create in appropriate folder (`components/` or `app/`)
2. Define TypeScript interface for props
3. Add "use client" if using hooks/interactivity
4. Handle loading and error states
5. Use proper semantic HTML
6. Add accessibility attributes
7. Write tests

### New Hook Checklist
1. Create in `hooks/` folder
2. Start name with `use`
3. Return object (not array)
4. Include loading, error, and data states
5. Use proper dependency arrays
6. Add TypeScript return type
7. Write tests

### New Utility Checklist
1. Create in `lib/` folder
2. Make it pure (no side effects)
3. Add TypeScript types
4. Export as named export
5. Write tests
6. Document with JSDoc if complex

---

## Best Practices Summary

### Do's ✅
- Use TypeScript for everything
- Extract reusable logic into hooks
- Extract reusable UI into components
- Handle all error cases
- Show loading states
- Use toast for user feedback
- Validate user input
- Use semantic HTML
- Add accessibility attributes
- Test components and hooks
- Use `fetchWithRetry` for API calls
- Debounce rapid actions
- Memoize expensive operations

### Don'ts ❌
- Don't use `any` type
- Don't ignore errors
- Don't skip loading states
- Don't log in production
- Don't repeat code
- Don't prop drill
- Don't create inline functions in JSX
- Don't mix logic and presentation
- Don't skip accessibility
- Don't trust user input

---

**Last Updated**: December 2025  
**Version**: 1.0

