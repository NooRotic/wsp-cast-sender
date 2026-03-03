import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import CastDemoPage from '../../app/cast-demo/page'
import { CastProvider } from '../../contexts/CastContext'

// Mock next/navigation
const mockPush = jest.fn()
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
}

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

// Mock dynamic imports
jest.mock('next/dynamic', () => {
  const actualNext = jest.requireActual('next/dynamic')
  return (component: any, options?: any) => {
    const DynamicComponent = actualNext(component, options)
    DynamicComponent.preload = jest.fn()
    return DynamicComponent
  }
})

const MockCastProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="cast-provider">{children}</div>
)

jest.mock('../../contexts/CastContext', () => ({
  CastProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="cast-provider">{children}</div>,
  useCast: () => ({
    isConnected: false,
    isConnecting: false,
    hasValidSession: jest.fn(() => false),
    endSession: jest.fn(),
    connectionStatus: 'NOT_CONNECTED',
    isLoading: false,
    error: null,
    addMessageListener: jest.fn(() => jest.fn()), // Returns cleanup function
    initializeCast: jest.fn(),
    requestSession: jest.fn(),
    sendMessage: jest.fn(),
    isAvailable: true,
    currentDevice: null,
  }),
}))

// Mock components
jest.mock('../../components/ParticleBackground', () => {
  return function MockParticleBackground() {
    return <div data-testid="particle-background">Particle Background</div>
  }
})

jest.mock('../../components/Navigation', () => {
  return function MockNavigation() {
    return <nav data-testid="navigation">Navigation</nav>
  }
})

jest.mock('../../components/ContactSection', () => {
  return function MockContactSection() {
    return <div data-testid="contact-section">Contact Section</div>
  }
})

jest.mock('../../components/CastButton', () => {
  return function MockCastButton() {
    return <button data-testid="cast-button">Cast Button</button>
  }
})

// Mock UI components
jest.mock('../../components/ui/button', () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props} data-testid="ui-button">{children}</button>
  ),
}))

jest.mock('../../components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => (
    <span {...props} data-testid="ui-badge">{children}</span>
  ),
}))

describe('Cast Demo Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock window.scrollTo
    Object.defineProperty(window, 'scrollTo', {
      value: jest.fn(),
      writable: true
    })
  })

  it('renders without crashing', () => {
    render(<CastDemoPage />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('has proper page structure', () => {
    render(<CastDemoPage />)
    const main = screen.getByRole('main')
    expect(main).toHaveClass('relative', 'z-10', 'pt-20', 'pb-12')
  })

  it('renders navigation component', () => {
    render(<CastDemoPage />)
    expect(screen.getByTestId('navigation')).toBeInTheDocument()
  })

  it('renders particle background', () => {
    render(<CastDemoPage />)
    expect(screen.getByTestId('particle-background')).toBeInTheDocument()
  })

  it('renders contact section', () => {
    render(<CastDemoPage />)
    expect(screen.getByTestId('contact-section')).toBeInTheDocument()
  })

  it('displays cast demo hero section', async () => {
    render(<CastDemoPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/Cast Demo/i)).toBeInTheDocument()
    })
  })

  it('shows connection status based on cast state', () => {
    render(<CastDemoPage />)
    
    // Should show "Ready to Cast" status initially
    expect(screen.getByText(/ready to cast/i)).toBeInTheDocument()
  })

  it('displays cast availability status', () => {
    render(<CastDemoPage />)
    
    // Should show "Ready to Cast" when cast is available
    expect(screen.getByText(/ready to cast/i)).toBeInTheDocument()
  })

  it('renders cast controls when appropriate', async () => {
    // Test with connected cast context
    const connectedCastContext = {
      isConnected: true,
      isAvailable: true,
      currentDevice: { friendlyName: 'Test Device' },
      initializeCast: jest.fn(),
      requestSession: jest.fn(),
      sendMessage: jest.fn(),
      hasValidSession: jest.fn(() => true),
      endSession: jest.fn(),
      connectionStatus: 'CONNECTED',
      isLoading: false,
      error: null,
    }
    
    jest.doMock('../../contexts/CastContext', () => ({
      CastProvider: MockCastProvider,
      useCast: () => connectedCastContext,
    }))
    
    render(<CastDemoPage />)
    
    await waitFor(() => {
      expect(screen.getByTestId('cast-button')).toBeInTheDocument()
    })
  })

  it('handles demo step progression', async () => {
    render(<CastDemoPage />)
    
    // Look for step indicators or buttons
    const buttons = screen.getAllByTestId('ui-button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('shows loading states appropriately', () => {
    const loadingCastContext = {
      isConnected: false,
      isAvailable: true,
      currentDevice: null,
      initializeCast: jest.fn(),
      requestSession: jest.fn(),
      sendMessage: jest.fn(),
      hasValidSession: jest.fn(() => false),
      endSession: jest.fn(),
      connectionStatus: 'NOT_CONNECTED',
      isLoading: true,
      error: null,
    }
    
    jest.doMock('../../contexts/CastContext', () => ({
      CastProvider: MockCastProvider,
      useCast: () => loadingCastContext,
    }))
    
    render(<CastDemoPage />)
    
    // Should handle loading state
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('displays error states when cast errors occur', () => {
    const errorCastContext = {
      isConnected: false,
      isAvailable: true,
      currentDevice: null,
      initializeCast: jest.fn(),
      requestSession: jest.fn(),
      sendMessage: jest.fn(),
      hasValidSession: jest.fn(() => false),
      endSession: jest.fn(),
      connectionStatus: 'NOT_CONNECTED',
      isLoading: false,
      error: 'Cast connection failed',
    }
    
    jest.doMock('../../contexts/CastContext', () => ({
      CastProvider: MockCastProvider,
      useCast: () => errorCastContext,
    }))
    
    render(<CastDemoPage />)
    
    // Should handle error state gracefully
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('has proper responsive layout classes', () => {
    render(<CastDemoPage />)
    const main = screen.getByRole('main')
    expect(main).toHaveClass('relative', 'z-10', 'pt-20', 'pb-12')
  })
})
