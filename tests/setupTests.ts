import React from 'react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// 1. Mock Next.js routing helpers
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    query: {},
    pathname: '/',
  }),
}));

// 2. Mock next/font to avoid calling Next.js-specific runtime
vi.mock('next/font/google', () => {
  const createFont = (fontName: string) => () => ({
    className: `${fontName.toLowerCase()}-font`,
    variable: `--font-${fontName.toLowerCase()}`,
    style: { fontFamily: fontName },
  });

  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (typeof prop !== 'string') {
          return undefined;
        }
        return createFont(prop);
      },
    },
  );
});

// 3. Mock next/link as a plain anchor
vi.mock('next/link', () => {
  type NextLinkProps = Omit<React.ComponentProps<'a'>, 'href'> & {
    href?: string | { pathname?: string };
  };

  const Link = React.forwardRef<HTMLAnchorElement, NextLinkProps>(({ href = '#', children, ...rest }, ref) => {
    const resolvedHref = typeof href === 'string' ? href : href?.pathname ?? '#';
    return React.createElement('a', { ref, href: resolvedHref, ...rest }, children);
  });

  Link.displayName = 'NextLinkMock';

  return {
    __esModule: true,
    default: Link,
  };
});

// 5. Mock next/script to a noop component
vi.mock('next/script', () => {
  const Script: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    return React.createElement(React.Fragment, null, children ?? null);
  };
  Script.displayName = 'NextScriptMock';
  return { __esModule: true, default: Script };
});

// 6. Mock framer-motion to avoid hydration errors in jsdom/happy-dom
vi.mock('framer-motion', () => {
  // Simple passthrough component for any motion.* element
  const MockMotionComponent = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(({ children, ...rest }, ref) =>
    React.createElement('div', { ref, ...rest }, children),
  );
  MockMotionComponent.displayName = 'MockMotionComponent';

  const motion = new Proxy(
    {},
    {
      get: () => MockMotionComponent,
    },
  );

  return {
    __esModule: true,
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    LayoutGroup: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    useScroll: () => ({
      scrollY: { on: vi.fn(), get: vi.fn(() => 0) },
      scrollYProgress: { on: vi.fn(), get: vi.fn(() => 0) },
    }),
    useTransform: (...args: any[]) => {
      const source = args[0];
      // If second arg is a transformer fn, invoke it with current value
      if (typeof args[1] === 'function') {
        const current = typeof source === 'object' && source?.get ? source.get() : source;
        return args[1](current);
      }
      return source;
    },
    useMotionTemplate: (strings: TemplateStringsArray, ...values: any[]) => {
      const combined = strings.reduce((acc, curr, idx) => acc + curr + (values[idx] ?? ''), '');
      return {
        get: vi.fn(() => combined),
        set: vi.fn(),
        on: vi.fn(),
      };
    },
    useAnimation: () => ({
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
      set: vi.fn(),
    }),
    useMotionValue: (initial = 0) => ({
      get: vi.fn(() => initial),
      set: vi.fn(),
      on: vi.fn(),
    }),
    motionValue: (initial = 0) => ({
      get: vi.fn(() => initial),
      set: vi.fn(),
      on: vi.fn(),
    }),
    useSpring: (value: any) => ({
      get: vi.fn(() => (typeof value === 'object' && value?.get ? value.get() : value)),
      set: vi.fn(),
      on: vi.fn(),
    }),
    useMotionValueEvent: (motionValue: any, callback: (v: any) => void) => {
      // If a motion value with an `on` method is provided, attach a listener stub
      if (motionValue && typeof motionValue.on === 'function') {
        motionValue.on('change', callback);
      }
      return;
    },
    useReducedMotion: () => false,
    useAnimate: () => [vi.fn(), { start: vi.fn(), stop: vi.fn() }] as const,
    useInView: () => true,
    animate: vi.fn(() => ({ stop: vi.fn() })),
  };
});

// 4. Mock browser dialog APIs (happy-dom doesn't implement these)
globalThis.alert = vi.fn();
globalThis.confirm = vi.fn(() => true);
globalThis.prompt = vi.fn(() => '');

// 5. Mock matchMedia (for Antd and other UI libs)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
