// Twitch OAuth Implicit Grant Flow for static web apps
// See: https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#implicit-grant-flow
const CLIENT_ID = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!;
const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/twitch-glazer` : '';
const SCOPES = [
  'user:read:broadcast',
];

// Initiates the Twitch OAuth Implicit Grant Flow
export function loginWithTwitch() {
  const state = Math.random().toString(36).substring(2);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'token', // Implicit Grant Flow
    scope: SCOPES.join(' '),
    state,
  });
  window.location.href = `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
}

// Handles the redirect from Twitch and extracts the access token from the URL fragment
export function handleTwitchRedirect() {
  if (typeof window === 'undefined') return;
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  if (accessToken) {
    localStorage.setItem('twitch_access_token', accessToken);
    // Optionally: remove token from URL
    window.location.hash = '';
    return accessToken;
  }
  return null;
}
