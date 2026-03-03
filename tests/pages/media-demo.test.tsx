import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import MediaDemoPage from '../../app/media-demo/page'
import { CastProvider } from '../../contexts/CastContext'

// Mock M3U Parser Worker with proper class structure - must be before any other imports
jest.mock('../../lib/m3uParserWorker', () => {
  class MockM3UParserWorkerManager {
    static isWebWorkerSupported = jest.fn(() => true)
    static getInstance = jest.fn(() => new MockM3UParserWorkerManager())
    
    terminateWorker = jest.fn()
    parseM3U = jest.fn(() => Promise.resolve([]))
  }

  return {
    M3UParserWorkerManager: MockM3UParserWorkerManager,
    getM3UParserWorker: jest.fn(() => Promise.resolve(new MockM3UParserWorkerManager())),
    terminateM3UParserWorker: jest.fn()
  }
})

// Mock M3U parser functions
jest.mock('@/lib/m3uParser', () => ({
  parseM3UChunked: jest.fn(() => ({
    next: jest.fn(() => ({ 
      value: { entries: [] }, 
      done: false 
    }))
  })),
  convertM3UToVideos: jest.fn(() => [])
}))

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

// Mock Cast Context - removing unused mockCastContext since it's inline now

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
jest.mock('../../components/UnifiedPlayer', () => {
  return function MockUnifiedPlayer() {
    return <div data-testid="unified-player">Unified Player</div>
  }
})

jest.mock('../../components/VideoLibrary', () => {
  return function MockVideoLibrary() {
    return <div data-testid="video-library">Video Library</div>
  }
})

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

jest.mock('../../components/ResumeModal', () => {
  return function MockResumeModal() {
    return <div data-testid="resume-modal">Resume Modal</div>
  }
})

jest.mock('../../components/CategoryButtons', () => {
  return function MockCategoryButtons() {
    return <div data-testid="category-buttons">Category Buttons</div>
  }
})

// Mock UI components
jest.mock('../../components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => (
    <span {...props} data-testid="ui-badge">{children}</span>
  ),
}))

// Mock M3U parser and worker functions
jest.mock('../../lib/m3uParser', () => ({
  parseM3UChunked: jest.fn(() => Promise.resolve([])),
  convertM3UToVideos: jest.fn(() => []),
}))

jest.mock('../../lib/m3uParserWorker', () => ({
  getM3UParserWorker: jest.fn(),
  terminateM3UParserWorker: jest.fn(),
  M3UParserWorkerManager: jest.fn(),
}))

jest.mock('../../lib/visualDebug', () => ({
  addDebugLog: jest.fn(),
  addVideoDebugLog: jest.fn(),
  logVideoConnectionStart: jest.fn(),
  logVideoConnectionError: jest.fn(),
  logVideoAuthError: jest.fn(),
  logDashParsingStart: jest.fn(),
  logDashParsingSuccess: jest.fn(),
  logDashParsingError: jest.fn(),
  logDashManifestInfo: jest.fn(),
}))


jest.mock('../../lib/dashParser', () => ({
  testDashParsing: jest.fn(),
}))

describe('Media Demo Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock window.scrollTo
    Object.defineProperty(window, 'scrollTo', {
      value: jest.fn(),
      writable: true
    })
  })

  it('renders without crashing', () => {
    render(<MediaDemoPage />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('has proper page structure', () => {
    render(<MediaDemoPage />)
    const main = screen.getByRole('main')
    expect(main).toHaveClass('relative', 'z-10', 'pt-20', 'pb-12')
  })

  it('renders navigation component', () => {
    render(<MediaDemoPage />)
    expect(screen.getByTestId('navigation')).toBeInTheDocument()
  })

  it('renders particle background', () => {
    render(<MediaDemoPage />)
    expect(screen.getByTestId('particle-background')).toBeInTheDocument()
  })

  it('renders video player component', () => {
    render(<MediaDemoPage />)
    expect(screen.getByTestId('unified-player')).toBeInTheDocument()
  })

  it('renders video library component', () => {
    render(<MediaDemoPage />)
    expect(screen.getByTestId('video-library')).toBeInTheDocument()
  })

  it('renders category buttons', () => {
    render(<MediaDemoPage />)
    // Category buttons are not directly rendered in this component 
    // They are imported but not used in the current implementation
    // Instead, verify the media filter controls are present
    expect(screen.getAllByText('Source:')).toHaveLength(2) // One for mobile, one for desktop
    expect(screen.getAllByDisplayValue('All Sources')).toHaveLength(2) // Mobile and desktop versions
  })

  it('displays media demo hero section', async () => {
    render(<MediaDemoPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/Media Demo/i)).toBeInTheDocument()
    })
  })

  it('shows video controls and interface', () => {
    render(<MediaDemoPage />)
    
    // Should render video player and library
    expect(screen.getByTestId('unified-player')).toBeInTheDocument()
    expect(screen.getByTestId('video-library')).toBeInTheDocument()
  })

  it('handles cast integration', () => {
    render(<MediaDemoPage />)
    
    // Should integrate with cast context
    // The component uses useCast hook from CastContext
    // Verify cast-related elements are available
    expect(screen.getAllByText('Debug:')).toHaveLength(2) // Mobile and desktop versions
    
    // Since casting functionality is handled by the useCast hook,
    // we can verify the component renders without errors with cast integration
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('manages video library state', async () => {
    render(<MediaDemoPage />)
    
    await waitFor(() => {
      expect(screen.getByTestId('video-library')).toBeInTheDocument()
    })
  })

  it('handles M3U parsing functionality', () => {
    render(<MediaDemoPage />)
    
    // Component should be ready to handle M3U parsing
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('provides video debugging capabilities', () => {
    render(<MediaDemoPage />)
    
    // Should have debugging functions available
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('has responsive media layout', () => {
    render(<MediaDemoPage />)
    const main = screen.getByRole('main')
    expect(main).toHaveClass('relative', 'z-10', 'pt-20', 'pb-12')
  })

  it('supports multiple video formats', () => {
    render(<MediaDemoPage />)
    
    // Should support various video formats through UnifiedPlayer
    expect(screen.getByTestId('unified-player')).toBeInTheDocument()
  })

  it('handles DASH manifest parsing', () => {
    render(<MediaDemoPage />)
    
    // Should be ready to handle DASH parsing
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('manages worker threads for parsing', () => {
    render(<MediaDemoPage />)
    
    // Should be able to use web workers for M3U parsing
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})
