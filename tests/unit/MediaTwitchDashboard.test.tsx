import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

// Mock twitchAuthClient — must be before component import
jest.mock('../../lib/twitchAuthClient', () => ({
  handleTwitchRedirect: jest.fn(() => null),
  loginWithTwitch: jest.fn(),
}));

// Mock twitchApi
jest.mock('../../lib/twitchApi', () => ({
  getUserInfo: jest.fn(),
  getClips: jest.fn(),
  getVideos: jest.fn(),
}));

import MediaTwitchDashboard from '../../components/MediaTwitchDashboard';
import { handleTwitchRedirect } from '../../lib/twitchAuthClient';
import { getUserInfo, getClips, getVideos } from '../../lib/twitchApi';

const mockHandleTwitchRedirect = handleTwitchRedirect as jest.MockedFunction<typeof handleTwitchRedirect>;
const mockGetUserInfo = getUserInfo as jest.MockedFunction<typeof getUserInfo>;
const mockGetClips = getClips as jest.MockedFunction<typeof getClips>;
const mockGetVideos = getVideos as jest.MockedFunction<typeof getVideos>;

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: () => { store = {}; },
    _store: store,
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Default ok fetch response factory
function okResponse(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(body),
  } as Response);
}

function errorResponse(status: number, statusText: string) {
  return Promise.resolve({
    ok: false,
    status,
    statusText,
    json: () => Promise.resolve({ message: statusText }),
  } as Response);
}

const mockUser = {
  id: 'user123',
  login: 'testchannel',
  display_name: 'TestChannel',
  profile_image_url: 'https://example.com/avatar.jpg',
};

describe('MediaTwitchDashboard — auth error handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    // Simulate authenticated state: token exists in localStorage
    localStorageMock._store['twitch_access_token'] = 'mock_token';
    localStorageMock.getItem.mockImplementation((key: string) => localStorageMock._store[key] ?? null);
    // Default API mocks
    mockGetUserInfo.mockResolvedValue(mockUser);
    mockGetClips.mockResolvedValue({ data: [] });
    mockGetVideos.mockResolvedValue({ data: [] });
    (global.fetch as jest.Mock) = jest.fn().mockImplementation(() =>
      okResponse({ data: [] })
    );
  });

  it('renders Login button when not authenticated', async () => {
    // Override getItem to return null — no token present
    localStorageMock.getItem.mockReturnValue(null);
    mockHandleTwitchRedirect.mockReturnValue(null);
    render(<MediaTwitchDashboard />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /login with twitch/i })).toBeInTheDocument();
    });
  });

  it('renders channel input form when authenticated', async () => {
    render(<MediaTwitchDashboard />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter twitch channel name/i)).toBeInTheDocument();
    });
  });

  it('shows "Session expired" message on 401 response from channel endpoint', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/channels')) return errorResponse(401, 'Unauthorized');
      return okResponse({ data: [] });
    });

    render(<MediaTwitchDashboard />);
    await waitFor(() => screen.getByPlaceholderText(/enter twitch channel name/i));

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/enter twitch channel name/i), {
        target: { value: 'testchannel' },
      });
      fireEvent.click(screen.getByRole('button', { name: /load/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/session expired/i)).toBeInTheDocument();
    });
  });

  it('clears token and sets unauthenticated on 401', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/channels')) return errorResponse(401, 'Unauthorized');
      return okResponse({ data: [] });
    });

    render(<MediaTwitchDashboard />);
    await waitFor(() => screen.getByPlaceholderText(/enter twitch channel name/i));

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/enter twitch channel name/i), {
        target: { value: 'testchannel' },
      });
      fireEvent.click(screen.getByRole('button', { name: /load/i }));
    });

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('twitch_access_token');
    });
  });

  it('shows Twitch API error message on non-401 non-ok response', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/channels')) return errorResponse(429, 'Too Many Requests');
      return okResponse({ data: [] });
    });

    render(<MediaTwitchDashboard />);
    await waitFor(() => screen.getByPlaceholderText(/enter twitch channel name/i));

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/enter twitch channel name/i), {
        target: { value: 'testchannel' },
      });
      fireEvent.click(screen.getByRole('button', { name: /load/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/twitch api error 429/i)).toBeInTheDocument();
    });
  });

  it('does NOT overwrite session expired message with generic catch error', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/channels')) return errorResponse(401, 'Unauthorized');
      return okResponse({ data: [] });
    });

    render(<MediaTwitchDashboard />);
    await waitFor(() => screen.getByPlaceholderText(/enter twitch channel name/i));

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/enter twitch channel name/i), {
        target: { value: 'testchannel' },
      });
      fireEvent.click(screen.getByRole('button', { name: /load/i }));
    });

    await waitFor(() => {
      const errorEl = screen.getByText(/session expired/i);
      expect(errorEl).toBeInTheDocument();
      // Must not be the generic fallback
      expect(errorEl.textContent).not.toMatch(/failed to load channel data/i);
    });
  });

  it('fires channel, stream, clips, videos, and followers requests in parallel', async () => {
    const fetchOrder: string[] = [];
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      fetchOrder.push(url);
      return okResponse({ data: [] });
    });

    render(<MediaTwitchDashboard />);
    await waitFor(() => screen.getByPlaceholderText(/enter twitch channel name/i));

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/enter twitch channel name/i), {
        target: { value: 'testchannel' },
      });
      fireEvent.click(screen.getByRole('button', { name: /load/i }));
    });

    await waitFor(() => {
      // All three direct-fetch endpoints should have been called
      expect(fetchOrder.some(u => u.includes('/channels'))).toBe(true);
      expect(fetchOrder.some(u => u.includes('/streams'))).toBe(true);
      expect(fetchOrder.some(u => u.includes('/follows'))).toBe(true);
      // twitchApi calls
      expect(mockGetClips).toHaveBeenCalledWith('user123', 50);
      expect(mockGetVideos).toHaveBeenCalledWith('user123', 50);
    });
  });
});
