// Test script to verify console event handling
// Run this in the browser console when both sender and receiver are connected

console.log('=== Cast Console Event Test ===');

// Test message structure
const testMessage = {
  type: 'CONSOLE_EVENT',
  payload: {
    action: 'manual_test',
    message: 'This is a test message from browser console',
    level: 'info',
    timestamp: Date.now(),
    data: {
      testType: 'manual',
      source: 'browser_console',
      userId: 'developer'
    }
  }
};

console.log('Test message to send:', JSON.stringify(testMessage, null, 2));

// Instructions for testing
console.log(`
Testing Instructions:
1. Ensure Cast connection is established
2. Open the Cast Debug Panel
3. Try the existing "Hello World", "Ping Test" buttons
4. Open the receiver console (Ctrl+Shift+C on receiver)
5. Verify messages appear in the receiver console display

Expected behavior:
- Messages should appear in receiver console with correct colors
- Level colors: info=blue, success=green, warning=yellow, error=red
- Sender ID should be shown
- Data should be expandable if present
`);
