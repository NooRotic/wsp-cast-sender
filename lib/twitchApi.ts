// Twitch API utility (no streamer.bot or LLM code)
const CLIENT_ID = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!;
const TWITCH_API_BASE = 'https://api.twitch.tv/helix';

function getAccessToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('twitch_access_token');
}


async function twitchApiFetch(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${TWITCH_API_BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated with Twitch');
  if (!CLIENT_ID) throw new Error('Twitch Client ID not set');
  const res = await fetch(url.toString(), {
    headers: {
      'Client-ID': CLIENT_ID,
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    let errMsg = await res.text();
    try { errMsg = JSON.parse(errMsg).message; } catch {}
    throw new Error(`Twitch API error: ${res.status} ${errMsg}`);
  }
  return res.json();
}


// Get user info (id, display name, etc) for a given username
export async function getUserInfo(username: string) {
  const data = await twitchApiFetch('users', { login: username });
  if (!data.data || !data.data[0]) throw new Error('User not found');
  return data.data[0];
}

// Get clips for a broadcaster (by user id)
export async function getClips(userId: string, first: number = 20) {
  return twitchApiFetch('clips', { broadcaster_id: userId, first: String(first) });
}

export async function getVideos(userId: string, first: number = 20) {
  return twitchApiFetch('videos', { user_id: userId, first: String(first) });
}

