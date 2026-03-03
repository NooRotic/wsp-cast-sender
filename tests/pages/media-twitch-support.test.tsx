import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import MediaTwitchSupportPage from '../../app/media-twitch-support/page'

describe('Media Twitch Support Page', () => {
  it('renders without crashing', () => {
    render(<MediaTwitchSupportPage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('displays correct page title', () => {
    render(<MediaTwitchSupportPage />)
    expect(screen.getByText('Media Twitch Support')).toBeInTheDocument()
  })

  it('shows under construction message', () => {
    render(<MediaTwitchSupportPage />)
    expect(screen.getByText('This page is under construction.')).toBeInTheDocument()
  })

  it('has proper heading structure', () => {
    render(<MediaTwitchSupportPage />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Media Twitch Support')
  })

  it('has basic page content', () => {
    render(<MediaTwitchSupportPage />)
    expect(screen.getByText(/under construction/i)).toBeInTheDocument()
  })

  it('uses semantic HTML structure', () => {
    render(<MediaTwitchSupportPage />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('is accessible with proper markup', () => {
    render(<MediaTwitchSupportPage />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
  })
})
