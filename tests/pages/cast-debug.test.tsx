import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import CastDebugPage from '../../app/cast-debug/page'

// Mock CastDebugPanel component
jest.mock('../../components/CastDebugPanel', () => {
  return function MockCastDebugPanel() {
    return <div data-testid="cast-debug-panel">Cast Debug Panel</div>
  }
})

// Mock ContactSection component
jest.mock('../../components/ContactSection', () => {
  return function MockContactSection() {
    return <div data-testid="contact-section">Contact Section</div>
  }
})

describe('Cast Debug Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<CastDebugPage />)
    expect(screen.getByText('Cast Debug Interface')).toBeInTheDocument()
  })

  it('has proper page structure and styling', () => {
    render(<CastDebugPage />)
    // Look for the main container with the expected classes
    const container = document.querySelector('.min-h-screen.bg-background.py-8')
    expect(container).toBeInTheDocument()
    expect(container).toHaveClass('min-h-screen', 'bg-background', 'py-8')
  })

  it('displays page title and description', () => {
    render(<CastDebugPage />)
    expect(screen.getByText('Cast Debug Interface')).toBeInTheDocument()
    expect(screen.getByText(/Test Google Cast functionality/i)).toBeInTheDocument()
  })

  it('renders cast debug panel component', () => {
    render(<CastDebugPage />)
    expect(screen.getByTestId('cast-debug-panel')).toBeInTheDocument()
  })

  it('renders contact section', () => {
    render(<CastDebugPage />)
    expect(screen.getByTestId('contact-section')).toBeInTheDocument()
  })

  it('has proper heading structure', () => {
    render(<CastDebugPage />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Cast Debug Interface')
    expect(heading).toHaveClass('text-3xl', 'font-bold', 'text-foreground', 'mb-2')
  })

  it('has centered header layout', () => {
    render(<CastDebugPage />)
    const headerContainer = screen.getByText('Cast Debug Interface').closest('div')
    expect(headerContainer).toHaveClass('text-center', 'mb-8')
  })

  it('has responsive container layout', () => {
    render(<CastDebugPage />)
    const mainContainer = screen.getByText('Cast Debug Interface').closest('div')?.parentElement
    expect(mainContainer).toHaveClass('max-w-6xl', 'mx-auto', 'px-4')
  })

  it('displays footer with copyright information', () => {
    render(<CastDebugPage />)
    expect(screen.getByText(/© 2025 WSP - Senior Software Engineer/i)).toBeInTheDocument()
  })

  it('shows technology stack in footer', () => {
    render(<CastDebugPage />)
    expect(screen.getByText(/Built with Next.js, TypeScript, GSAP, and Tailwind CSS/i)).toBeInTheDocument()
  })

  it('has proper footer styling', () => {
    render(<CastDebugPage />)
    const footer = screen.getByText(/© 2025 WSP/i).closest('footer')
    expect(footer).toHaveClass('pt-10', 'text-center', 'text-gray-400', 'relative', 'z-10')
  })

  it('provides debug interface description', () => {
    render(<CastDebugPage />)
    expect(screen.getByText(/send messages to connected receivers/i)).toBeInTheDocument()
  })

  it('has accessible heading hierarchy', () => {
    render(<CastDebugPage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toBeInTheDocument()
  })

  it('uses semantic layout structure', () => {
    render(<CastDebugPage />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
    expect(screen.getByTestId('cast-debug-panel')).toBeInTheDocument()
    expect(screen.getByTestId('contact-section')).toBeInTheDocument()
  })

  it('has proper responsive design classes', () => {
    render(<CastDebugPage />)
    const footerContainer = screen.getByText(/© 2025 WSP/i).closest('div')
    expect(footerContainer).toHaveClass('max-w-4xl', 'mx-auto', 'px-4')
  })
})
