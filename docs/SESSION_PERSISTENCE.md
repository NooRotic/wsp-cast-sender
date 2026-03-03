# Cast Session Persistence

This feature enables automatic session recovery for Cast connections between sender and receiver applications.

## Overview

When a Cast session is established, both the sender and receiver save the session ID to localStorage. If the sender page is refreshed or reconnected, it will automatically attempt to resume the existing session with the receiver.

## Features

- **Automatic Session Saving**: Session IDs are automatically saved to localStorage when a connection is established
- **Session Resume**: Senders can resume sessions after page refreshes or disconnections
- **Session Expiration**: Sessions automatically expire after 30 minutes of inactivity
- **Multi-Sender Support**: Receivers can track multiple sender IDs within the same session
- **UI Indicators**: Both sender and receiver show session status in the UI

## How It Works

### Sender Side (skills-jet-sender)

1. **Session Creation**: When a Cast session is established, the session ID is saved to localStorage
2. **Page Load**: On page load, the app checks for existing sessions and attempts to resume them
3. **Resume Process**: If a stored session exists, the sender attempts to reconnect to the same receiver
4. **Session Messages**: A `SESSION_RESUME` message is sent to the receiver with the session ID

### Receiver Side (skills-jet-receiver)

1. **Session Tracking**: When senders connect, session data is saved including sender IDs
2. **Resume Handling**: When receiving a `SESSION_RESUME` message, the receiver updates its session state
3. **Sender Management**: The receiver tracks connected/disconnected senders and updates session data
4. **Session Cleanup**: Sessions are cleared when all senders disconnect

## Implementation Files

### Sender (skills-jet-sender)

- `lib/sessionStorage.ts` - Session storage utility
- `contexts/CastContext.tsx` - Updated with session persistence logic
- `components/SessionResumeButton.tsx` - UI component for manual session resume
- `components/CastDebugPanel.tsx` - Added session resume button for testing

### Receiver (skills-jet-receiver)

- `utils/sessionStorage.ts` - Session storage utility for receiver
- `hooks/castReceiver.ts` - Updated with session tracking and resume handling
- `pages/WelcomePage.tsx` - Added session status display
- `types/index.ts` - Updated message types to include session data

## Usage

### For Developers

1. **Testing Session Resume**:
   - Open the Cast Debug Panel (`/cast-debug`)
   - Connect to a receiver
   - Refresh the sender page
   - Click "Resume Session" button or wait for automatic resume

2. **Monitoring Sessions**:
   - Check browser console for session-related logs
   - Receiver shows session ID in the welcome page
   - Debug panel shows session status

### For Users

The session persistence is automatic and requires no user intervention. Users will see:

- Faster reconnection times when refreshing sender pages
- Seamless continuation of cast sessions
- Visual indicators showing session status

## Session Data Structure

```typescript
interface CastSessionData {
  sessionId: string;
  timestamp: number;
  deviceName?: string;
  applicationId?: string;
  namespace?: string;
  senderIds?: string[]; // Receiver only
}
```

## Configuration

- **Session Expiry**: 30 minutes (configurable in sessionStorage.ts)
- **Storage Key**: `cast_session_data`
- **Resume Delay**: 1 second after Cast framework initialization

## Troubleshooting

### Common Issues

1. **Session Not Resuming**:
   - Check if session has expired (30 minutes)
   - Verify Cast framework is properly loaded
   - Check browser console for errors

2. **Multiple Sessions**:
   - Sessions are device-specific
   - Each browser tab may have its own session
   - Clear localStorage to reset sessions

3. **Receiver Not Responding**:
   - Ensure receiver is still running
   - Check network connectivity
   - Verify receiver session hasn't expired

### Debug Commands

```javascript
// Check stored session
const session = localStorage.getItem('cast_session_data');
console.log(JSON.parse(session));

// Clear session
localStorage.removeItem('cast_session_data');

// Check session validity
import { CastSessionStorage } from './lib/sessionStorage';
console.log(CastSessionStorage.hasValidSession());
```

## Future Enhancements

- Cross-device session sharing
- Session migration between different receivers
- Enhanced session analytics and monitoring
- Automatic session cleanup on receiver shutdown
