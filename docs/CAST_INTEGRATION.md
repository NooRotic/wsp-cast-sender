# Google Cast Integration

This project includes Google Cast Application Framework (CAF) sender functionality that allows the portfolio to connect to and send messages to Cast-enabled devices like Chromecast, smart TVs, and speakers.

## Features

- **Cast Discovery**: Automatically detect available Cast devices on the network
- **Session Management**: Connect to and manage Cast sessions
- **Message Sending**: Send JSON objects and string messages to connected receivers
- **Debug Interface**: Full-featured debug panel for testing Cast functionality
- **Reusable Components**: Cast button and context provider for easy integration

## Cast App ID

The project uses the default Cast App ID `CC1AD845` for testing purposes. This is Google's standard testing/development App ID that works with the default Cast receiver.

For production use, you should:

1. Register your own Cast App ID in the Google Cast Developer Console
2. Update the `NEXT_PUBLIC_CAST_APP_ID` environment variable

## Usage

### Cast Button

The Cast button is integrated into the navigation and provides one-click connection to Cast devices:

```tsx
import CastButton from '@/components/CastButton';

<CastButton variant="outline" size="sm" showText={true} />
```

### Cast Context

The Cast context provides access to Cast functionality throughout the app:

```tsx
import { useCast } from '@/contexts/CastContext';

const { isConnected, sendMessage, requestSession } = useCast();
```

### Cast Integration Hook

For sending structured messages, use the Cast integration hook:

```tsx
import { useCastIntegration } from '@/hooks/useCastIntegration';

const { sendPortfolioData, sendProjectData, sendNotification } = useCastIntegration();
```

## Debug Interface

Access the Cast debug interface at `/cast-debug` to:

- Test Cast connections
- Send custom JSON messages
- Send string messages
- View connection status and errors
- Use quick test buttons for common scenarios

## Message Types

The sender supports several message types:

### String Messages

Simple text messages sent directly to the receiver.

### JSON Messages

Structured objects with the following common types:

- `portfolio_data`: Portfolio information
- `project_showcase`: Individual project data
- `skills_showcase`: Skills and expertise data
- `contact_info`: Contact information
- `notification`: Status notifications
- `ping`: Connection test messages

## Testing

1. Start the development server: `npm run dev`
2. Navigate to `/cast-debug`
3. Connect to a Cast device or use the Chrome Cast extension
4. Send test messages using the debug interface

## Browser Support

Cast functionality requires:

- Chrome browser (recommended)
- Cast-enabled devices on the same network
- HTTPS in production (Cast API requirement)

## Environment Variables

```env
# Google Cast Configuration
NEXT_PUBLIC_CAST_APP_ID="CC1AD845"
```

## Architecture

- **CastContext**: React context for managing Cast state
- **CastButton**: Reusable Cast connection button
- **CastDebugPanel**: Debug interface for testing
- **useCastIntegration**: Hook for sending structured messages

The Cast functionality is initialized when the app loads and automatically discovers available devices. Users can connect via the Cast button in the navigation or through the debug interface.
