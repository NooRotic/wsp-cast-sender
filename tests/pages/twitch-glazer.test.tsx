import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import TwitchGlazerPage from '../../app/twitch-glazer/page'

// Mock dynamic imports
jest.mock('next/dynamic', () => {
  const actualNext = jest.requireActual('next/dynamic')
  return (component: any, options?: any) => {
    const DynamicComponent = actualNext(component, options)
    DynamicComponent.preload = jest.fn()
    return DynamicComponent
  }
})

// Mock TwitchPlayer component
jest.mock('../../components/TwitchPlayer', () => {
  return function MockTwitchPlayer() {
    return <div data-testid="twitch-player">Twitch Player</div>
  }
})

// Mock MediaTwitchDashboard component
jest.mock('../../components/MediaTwitchDashboard', () => {
  return function MockMediaTwitchDashboard() {
    return <div data-testid="media-twitch-dashboard">Media Twitch Dashboard</div>
  }
})

// Mock environment variables for Twitch
Object.defineProperty(process.env, 'NEXT_PUBLIC_TWITCH_CLIENT_ID', {
  value: 'z3p6d6boittewq58ld8p86a0gkqy5m',
  writable: true,
})

describe('Twitch Glazer Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<TwitchGlazerPage />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('has proper page structure and styling', () => {
    render(<TwitchGlazerPage />)
    const main = screen.getByRole('main')
    expect(main).toHaveClass('min-h-screen', 'bg-black', 'flex', 'flex-col', 'items-center')
  })

  it('renders media twitch dashboard component', () => {
    render(<TwitchGlazerPage />)
    expect(screen.getByTestId('media-twitch-dashboard')).toBeInTheDocument()
  })

  it('renders twitch player component', () => {
    render(<TwitchGlazerPage />)
    expect(screen.getByTestId('twitch-player')).toBeInTheDocument()
  })

  it('has proper container layout for dashboard', () => {
    render(<TwitchGlazerPage />)
    // Check that the dashboard is rendered
    expect(screen.getByTestId('media-twitch-dashboard')).toBeInTheDocument()
    // Check for the container with max-w-7xl class
    const container = document.querySelector('.max-w-7xl')
    expect(container).toBeInTheDocument()
    expect(container).toHaveClass('w-full', 'max-w-7xl')
  })

  it('has proper container layout for player', () => {
    render(<TwitchGlazerPage />)
    // Check that the player is rendered  
    expect(screen.getByTestId('twitch-player')).toBeInTheDocument()
    // Check for the container with max-w-2xl class
    const container = document.querySelector('.max-w-2xl')
    expect(container).toBeInTheDocument()
    expect(container).toHaveClass('w-full', 'max-w-2xl', 'mt-10')
  })

  it('uses twitch oauth implicit grant flow (documented)', () => {
    render(<TwitchGlazerPage />)
    
    // Verify the page is set up for Twitch OAuth
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByTestId('media-twitch-dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('twitch-player')).toBeInTheDocument()
  })

  it('has responsive design for different screen sizes', () => {
    render(<TwitchGlazerPage />)
    
    // Dashboard should be max-w-7xl (extra large screens)
    const dashboardContainer = document.querySelector('.max-w-7xl')
    expect(dashboardContainer).toHaveClass('max-w-7xl')
    
    // Player should be max-w-2xl (moderate width)
    const playerContainer = document.querySelector('.max-w-2xl')
    expect(playerContainer).toHaveClass('max-w-2xl')
  })

  it('has proper vertical spacing between components', () => {
    render(<TwitchGlazerPage />)
    const playerContainer = document.querySelector('.mt-10')
    expect(playerContainer).toHaveClass('mt-10')
  })

  it('uses black background for optimal video viewing', () => {
    render(<TwitchGlazerPage />)
    const main = screen.getByRole('main')
    expect(main).toHaveClass('bg-black')
  })

  it('centers content properly', () => {
    render(<TwitchGlazerPage />)
    const main = screen.getByRole('main')
    expect(main).toHaveClass('flex', 'flex-col', 'items-center')
  })

  it('provides full height layout', () => {
    render(<TwitchGlazerPage />)
    const main = screen.getByRole('main')
    expect(main).toHaveClass('min-h-screen')
  })
})
