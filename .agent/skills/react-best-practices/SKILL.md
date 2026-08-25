---
name: react-best-practices
description: Use this skill when developing frontend components using React 19, optimizing component state, custom hooks, and ensuring premium UI performance.
---

# React 19 Best Practices

This guide provides guidelines and runbooks for writing high-performance, clean, and type-safe React 19 components in this project.

## React 19 Core Features

Since this project uses React 19, leverage modern APIs and patterns:

### 1. React Actions & Form Status
For forms and server interactions, use Actions instead of manual loading and error states:
- **`useActionState`**: For managing action state (data, loading status) automatically.
- **`useFormStatus`**: In child components to read parent form submitting state (e.g., to disable submit buttons).
- **Example**:
  ```tsx
  import { useActionState } from 'react';

  async function updateProfile(prevState: any, queryData: FormData) {
    const res = await fetch('/api/user/profile', { method: 'POST', body: queryData });
    return res.json();
  }

  export function ProfileForm() {
    const [state, formAction, isPending] = useActionState(updateProfile, null);
    
    return (
      <form action={formAction}>
        <input name="name" type="text" />
        <button type="submit" disabled={isPending}>
          {isPending ? 'Updating...' : 'Update'}
        </button>
        {state?.error && <p className="text-red-500">{state.error}</p>}
      </form>
    );
  }
  ```

### 2. Document Metadata
React 19 supports rendering `<title>`, `<meta>`, and `<link>` tags anywhere in your component tree. They will automatically be hoisted to the document `<head>`.
*(Note: In Next.js App Router, prefer the built-in `Metadata` object configuration in Page/Layout files over inline tags).*

---

## State Management and Component Performance

### 1. Minimal State Representation
Avoid redundant state. Derive values during render instead of caching them in state.
- **Bad**: Storing `fullName` and `firstName` + `lastName` in separate state.
- **Good**: Store `firstName` and `lastName` in state, derive `fullName = `${firstName} ${lastName}`` on render.

### 2. Dependency Arrays in `useEffect` and `useCallback`
- Include all reactive variables (props, state, derived helpers) referenced inside the hooks.
- **Cleanup Functions**: Always return a cleanup function in `useEffect` to unsubscribe from Socket.io events, clear timers, or abort fetch controllers.
  ```tsx
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);
    socket.on('newOrder', handleNewOrder);
    
    // Cleanup
    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.disconnect();
    };
  }, []); // Empty array ensures connection is only established once on mount
  ```

### 3. Proper Key Usage
Never use array indices as `key` props when the list order can change or items can be filtered/deleted. Use unique IDs (like product slug, ID) to avoid rendering bugs and state mismatch.
