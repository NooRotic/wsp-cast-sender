import React from 'react'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import Navigation from '../../components/Navigation'

let mockPathname = '/'

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('../../contexts/AnimationContext', () => ({
  useAnimation: () => ({
    heroAnimationsComplete: true,
    userHasScrolled: true,
    setUserHasScrolled: jest.fn(),
  }),
}))

jest.mock('../../components/CastButton', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => (
    <button data-testid="cast-button">{children}</button>
  ),
}))

jest.mock('../../components/ResumeDownloadButton', () => ({
  __esModule: true,
  default: () => <button data-testid="resume-button">Resume</button>,
}))

const NEW_SITE_URL = 'https://portfolio.pollardjr.com/'

describe.each([
  '/blog',
  '/blog/',
  '/blog/2026-05-22-canvas-starfield',
  '/now',
  '/now/',
])('menu on %s', (path) => {
  beforeEach(() => {
    mockPathname = path
    render(<Navigation />)
  })

  it('links only to Now, Blog and the new portfolio', () => {
    const hrefs = within(screen.getByRole('navigation')).getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(['/now', '/blog', NEW_SITE_URL])
  })

  it('has no Resume button, Cast buttons or links into the rest of the site', () => {
    expect(screen.queryByTestId('resume-button')).toBeNull()
    expect(screen.queryByTestId('cast-button')).toBeNull()
    for (const label of ['Home', 'Skills', 'Projects', 'Contact', 'Timeline', 'Demos']) {
      expect(screen.queryByText(label)).toBeNull()
    }
  })
})

describe.each(['/', '/timeline', '/cast-demo'])('menu on %s', (path) => {
  beforeEach(() => {
    mockPathname = path
    render(<Navigation />)
  })

  it('keeps the full menu', () => {
    expect(screen.getByTestId('resume-button')).toBeInTheDocument()
    expect(screen.getAllByTestId('cast-button').length).toBeGreaterThan(0)
    for (const label of ['Home', 'Skills', 'Projects', 'Contact', 'Timeline', 'Demos']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
  })
})
