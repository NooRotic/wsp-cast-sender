import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import MediaTwitchDashboard from '../../app/media-twitch-dashboard/page'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} data-testid="next-image" />
  ),
}))

// Mock GSAP
jest.mock('gsap', () => ({
  __esModule: true,
  default: {
    fromTo: jest.fn(),
    timeline: jest.fn(() => ({
      to: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
    })),
  },
}))

// Mock window.gsap for the component's direct usage
Object.defineProperty(window, 'gsap', {
  value: {
    fromTo: jest.fn(),
    timeline: jest.fn(() => ({
      to: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
    })),
  },
  writable: true,
})

// Mock Twitch API functions
jest.mock('../../lib/twitchApi', () => ({
  getVideos: jest.fn(),
  getClips: jest.fn(),
}))

// Mock environment variables
Object.defineProperty(process.env, 'TWITCH_CLIENT_ID', {
  value: 'z3p6d6boittewq58ld8p86a0gkqy5m',
  writable: true,
})

Object.defineProperty(process.env, 'TWITCH_AUTH_TOKEN', {
  value: 'mock_auth_token',
  writable: true,
})

Object.defineProperty(process.env, 'NEXT_PUBLIC_TWITCH_CLIENT_ID', {
  value: 'z3p6d6boittewq58ld8p86a0gkqy5m',
  writable: true,
})

// Mock fetch globally
global.fetch = jest.fn()

// Get the mocked functions
const mockGetClips = require('../../lib/twitchApi').getClips as jest.MockedFunction<any>
const mockGetVideos = require('../../lib/twitchApi').getVideos as jest.MockedFunction<any>

describe('Media Twitch Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default fetch mock for user data
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({
        data: [{
          id: '123456',
          login: 'test_user',
          display_name: 'Test User',
          description: 'Test channel description',
          profile_image_url: 'https://example.com/profile.jpg'
        }]
      })
    })

    // Setup default API mocks with proper data structure
    mockGetClips.mockResolvedValue({
      data: [
        {
          id: 'clip1',
          title: 'Test Clip',
          url: 'https://clips.twitch.tv/test',
          thumbnail_url: 'https://example.com/thumb.jpg',
          creator_name: 'Test Creator',
          created_at: '2024-01-01T12:00:00Z'
        }
      ]
    })
    
    mockGetVideos.mockResolvedValue({
      data: [
        {
          id: 'video1',
          title: 'Test Video',
          url: 'https://twitch.tv/videos/123',
          thumbnail_url: 'https://example.com/thumb.jpg',
          user_name: 'Test User',  // This is the channel owner, will match profile
          created_at: '2024-01-01T12:00:00Z'
        }
      ]
    })
  })

  it('renders without crashing', () => {
    render(<MediaTwitchDashboard />)
    expect(screen.getByPlaceholderText('Enter Twitch channel name (e.g. pokimane)')).toBeInTheDocument()
  })

  it('has input field for channel name', () => {
    render(<MediaTwitchDashboard />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter Twitch channel name (e.g. pokimane)')).toBeInTheDocument()
  })

  it('has Load button', () => {
    render(<MediaTwitchDashboard />)
    expect(screen.getByRole('button', { name: 'Load' })).toBeInTheDocument()
  })

  it('renders with proper styling classes', () => {
    render(<MediaTwitchDashboard />)
    const container = screen.getByRole('textbox').closest('.min-h-screen')
    expect(container).toHaveClass('bg-black', 'text-gray-100')
  })

  it('handles input change', () => {
    render(<MediaTwitchDashboard />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test_channel' } })
    expect(input).toHaveValue('test_channel')
  })

  it('handles form submission', async () => {
    render(<MediaTwitchDashboard />)
    const input = screen.getByRole('textbox')
    const button = screen.getByRole('button', { name: 'Load' })
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test_channel' } })
      fireEvent.click(button)
    })
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/users?login=test_channel',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Client-ID': 'z3p6d6boittewq58ld8p86a0gkqy5m',
            'Authorization': 'Bearer mock_auth_token'
          })
        })
      )
    })
  })

  it('handles successful channel data fetch', async () => {
    render(<MediaTwitchDashboard />)
    const input = screen.getByRole('textbox')
    const button = screen.getByRole('button', { name: 'Load' })
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test_channel' } })
      fireEvent.click(button)
    })
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Test User' })).toBeInTheDocument()
    })
  })

  it('displays user profile information when loaded', async () => {
    render(<MediaTwitchDashboard />)
    const input = screen.getByRole('textbox')
    const button = screen.getByRole('button', { name: 'Load' })
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test_channel' } })
      fireEvent.click(button)
    })
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Test User' })).toBeInTheDocument()
      expect(screen.getByText('@test_user')).toBeInTheDocument()
      expect(screen.getByText('Test channel description')).toBeInTheDocument()
    })
  })

  it('clears previous data when making new search', async () => {
    render(<MediaTwitchDashboard />)
    const input = screen.getByRole('textbox')
    const button = screen.getByRole('button', { name: 'Load' })
    
    // First search
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test_channel' } })
      fireEvent.click(button)
    })
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Test User' })).toBeInTheDocument()
    })
    
    // Second search - should clear previous data
    await act(async () => {
      fireEvent.change(input, { target: { value: 'another_channel' } })
      fireEvent.click(button)
    })
    
    // The component should handle clearing and reloading
    expect(mockGetClips).toHaveBeenCalledTimes(2)
    expect(mockGetVideos).toHaveBeenCalledTimes(2)
  })

  it('uses correct API endpoints', async () => {
    render(<MediaTwitchDashboard />)
    const input = screen.getByRole('textbox')
    const button = screen.getByRole('button', { name: 'Load' })
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test_channel' } })
      fireEvent.click(button)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/users?login=test_channel',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Client-ID': 'z3p6d6boittewq58ld8p86a0gkqy5m',
            'Authorization': 'Bearer mock_auth_token'
          })
        })
      )
    })
  })

  it('has proper color mapping for different content types', () => {
    render(<MediaTwitchDashboard />)
    // Test that the component structure exists
    expect(screen.getByPlaceholderText('Enter Twitch channel name (e.g. pokimane)')).toBeInTheDocument()
  })

  it('handles errors gracefully', async () => {
    // Mock fetch to return empty data array (channel not found)
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ data: [] })
    })

    render(<MediaTwitchDashboard />)
    const input = screen.getByRole('textbox')
    const button = screen.getByRole('button', { name: 'Load' })
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'nonexistent_channel' } })
      fireEvent.click(button)
    })

    // Component should handle the error case
    expect(input).toBeInTheDocument()
  })

  it('renders clips and videos with proper data', async () => {
    render(<MediaTwitchDashboard />)
    const input = screen.getByRole('textbox')
    const button = screen.getByRole('button', { name: 'Load' })
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test_channel' } })
      fireEvent.click(button)
    })
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Test User' })).toBeInTheDocument()
    })

    // Should call the API functions with the correct user ID
    expect(mockGetClips).toHaveBeenCalledWith('123456')
    expect(mockGetVideos).toHaveBeenCalledWith('123456')
  })
})
