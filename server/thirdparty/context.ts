import { AsyncLocalStorage } from 'async_hooks';

// AsyncLocalStorage to share request context in Express RPC environment
export const authContext = new AsyncLocalStorage<{
    cookies: Record<string, string>;
    headers: Record<string, string>;
}>();
