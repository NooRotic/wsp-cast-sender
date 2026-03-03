import '@testing-library/jest-dom'

// Global test setup
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock GSAP
jest.mock('gsap', () => ({
  timeline: jest.fn(() => ({
    to: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    fromTo: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    kill: jest.fn().mockReturnThis(),
    progress: jest.fn().mockReturnThis(),
    pause: jest.fn().mockReturnThis(),
    play: jest.fn().mockReturnThis(),
    reverse: jest.fn().mockReturnThis(),
    restart: jest.fn().mockReturnThis(),
    onComplete: jest.fn().mockReturnThis(),
  })),
  gsap: {
    timeline: jest.fn(() => ({
      to: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      fromTo: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      kill: jest.fn().mockReturnThis(),
    })),
    to: jest.fn(),
    from: jest.fn(),
    fromTo: jest.fn(),
    set: jest.fn(),
    registerPlugin: jest.fn(),
  },
  ScrollTrigger: {
    create: jest.fn(),
    refresh: jest.fn(),
    update: jest.fn(),
  },
  TextPlugin: {},
  SplitText: jest.fn(() => ({
    chars: [],
    words: [],
    lines: [],
    revert: jest.fn(),
  })),
}))

// Mock GSAP TextPlugin specifically
jest.mock('gsap/TextPlugin', () => ({
  TextPlugin: {},
}))

// Mock Split-Type
jest.mock('split-type', () => {
  return jest.fn().mockImplementation(() => ({
    chars: [],
    words: [],
    lines: [],
    revert: jest.fn(),
  }))
})

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js navigation (App Router)
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_CAST_APP_ID = '44453EED'
process.env.NEXT_PUBLIC_CAST_NAMESPACE = 'urn:x-cast:com.nrx.cast.skills'
process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID = 'z3p6d6boittewq58ld8p86a0gkqy5m'
process.env.TWITCH_CLIENT_ID = 'z3p6d6boittewq58ld8p86a0gkqy5m'
process.env.TWITCH_AUTH_TOKEN = 'mock_auth_token'
process.env.NEXT_PUBLIC_DEVELOPER_NAME = 'Walter S. Pollard Jr.'
process.env.NEXT_PUBLIC_DEVELOPER_TITLE = 'Senior Software Engineer'

// Mock intersection observer
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Suppress console warnings for tests
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: An update to') ||
       args[0].includes('act(...)') ||
       args[0].includes('Consider adding an error boundary') ||
       args[0].includes('TypeError: Cannot read properties of undefined (reading \'slice\')'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('An error occurred in the') ||
       args[0].includes('Consider adding an error boundary'))
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})
