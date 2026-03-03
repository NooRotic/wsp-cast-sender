'use client';

import React, { useState, useEffect } from 'react';
import { useCast } from '@/contexts/CastContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, Cast, Send, Trash2, RotateCcw } from 'lucide-react';
import SessionResumeButton from '@/components/SessionResumeButton';
import VideoControl from '@/components/VideoControl';
import { CastSessionStorage } from '@/lib/sessionStorage';

const CastDebugPanel: React.FC = () => {
  const {
    isConnected,
    isAvailable,
    currentDevice,
    initializeCast,
    requestSession,
    forceDeviceDiscovery,
    hasValidSession,
    endSession,
    sendMessage,
    sendStringMessage,
    connectionStatus,
    error,
    addMessageListener,
  } = useCast();

  const [stringMessage, setStringMessage] = useState('');
  const [jsonMessage, setJsonMessage] = useState('{\n  "type": "test",\n  "data": "Hello from sender!"\n}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [debugPanelVisible, setDebugPanelVisible] = useState(false);
  const [debugWindowVisible, setDebugWindowVisible] = useState(false);
  const [consoleMessages, setConsoleMessages] = useState<Array<{
    id: string;
    timestamp: number;
    type: 'sent' | 'received' | 'info';
    level: 'info' | 'success' | 'warning' | 'error';
    message: string;
    data?: any;
  }>>([]);

  // Add console message
  const addConsoleMessage = (type: 'sent' | 'received' | 'info', level: 'info' | 'success' | 'warning' | 'error', message: string, data?: any) => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setConsoleMessages(prev => [...prev.slice(-49), { // Keep last 50 messages
      id,
      timestamp: Date.now(),
      type,
      level,
      message,
      data
    }]);
  };

  // Listen for incoming messages
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = addMessageListener((message) => {
      if (message.type === 'MESSAGE_ACKNOWLEDGMENT') {
        addConsoleMessage('received', 'success', `Message acknowledged: ${message.acknowledgedMessageId}`, message);
      } else if (message.type === 'RECEIVER_STATUS') {
        addConsoleMessage('received', 'info', `Receiver status: ${message.status || 'status update'}`, message);
      } else if (message.type === 'RECEIVER_ERROR') {
        addConsoleMessage('received', 'error', `Receiver error: ${message.error}`, message);
      } else if (message.type === 'CONSOLE_EVENT_RESPONSE') {
        addConsoleMessage('received', message.level || 'info', `Console response: ${message.message}`, message);
      } else {
        addConsoleMessage('received', 'info', `Received: ${message.type}`, message);
      }
    });

    return unsubscribe;
  }, [isConnected, addMessageListener]);

  const handleClearSession = () => {
    CastSessionStorage.clearSession();
    console.log('📱 Manually cleared stored session');
  };

  const handleSendString = async () => {
    if (!stringMessage.trim()) return;

    try {
      addConsoleMessage('sent', 'info', `String message: "${stringMessage}"`);
      await sendStringMessage(stringMessage);
      setStringMessage('');
      addConsoleMessage('info', 'success', 'String message sent successfully');
    } catch (err) {
      console.error('Failed to send string message:', err);
      addConsoleMessage('info', 'error', `Failed to send string: ${err}`);
    }
  };

  const handleSendJson = async () => {
    try {
      const parsed = JSON.parse(jsonMessage);
      setJsonError(null);
      
      addConsoleMessage('sent', 'info', `JSON message: ${parsed.type || 'unknown type'}`, parsed);
      await sendMessage(parsed);
      addConsoleMessage('info', 'success', 'JSON message sent successfully');
    } catch (err) {
      if (err instanceof SyntaxError) {
        setJsonError('Invalid JSON format');
        addConsoleMessage('info', 'error', 'Invalid JSON format');
      } else {
        setJsonError('Failed to send JSON message');
        addConsoleMessage('info', 'error', `Failed to send JSON: ${err}`);
        console.error('Failed to send JSON message:', err);
      }
    }
  };

  const toggleDebugWindow = async () => {
    const newVisibility = !debugWindowVisible;
    setDebugWindowVisible(newVisibility);

    const message = {
      type: 'DEBUG_WINDOW_CONTROL',
      payload: {
        action: 'toggle_visibility',
        visible: newVisibility,
        timestamp: Date.now()
      }
    };

    console.log('🪟 Sending DEBUG_WINDOW_CONTROL message:', message);

    try {
      await sendMessage(message);
      console.log('✅ Debug window toggle message sent successfully');
    } catch (err) {
      console.error('❌ Failed to toggle debug window:', err);
      // Revert state on error
      setDebugWindowVisible(!newVisibility);
    }
  };

  const toggleDebugPanel = async () => {
    const newVisibility = !debugPanelVisible;
    setDebugPanelVisible(newVisibility);

    const message = {
      type: 'CONSOLE_CONTROL',
      payload: {
        action: 'toggle_visibility',
        visible: newVisibility,
        timestamp: Date.now()
      }
    };

    console.log('🎛️ Sending CONSOLE_CONTROL message:', message);

    try {
      await sendMessage(message);
      console.log('✅ Debug panel toggle message sent successfully');
    } catch (err) {
      console.error('❌ Failed to toggle debug panel:', err);
      // Revert state on error
      setDebugPanelVisible(!newVisibility);
    }
  };

  const validateJson = (value: string) => {
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (err) {
      setJsonError('Invalid JSON format');
    }
  };

  const getStatusColor = () => {
    if (error) return 'destructive';
    if (isConnected) return 'default';
    if (isAvailable) return 'secondary';
    return 'outline';
  };

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="h-4 w-4" />;
    if (isConnected) return <CheckCircle className="h-4 w-4" />;
    return <Cast className="h-4 w-4" />;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cast className="h-5 w-5" />
            Google Cast Debug Panel
          </CardTitle>
          <CardDescription>
            Debug and test Google Cast functionality with connected receivers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Badge variant={getStatusColor()} className="flex items-center gap-1">
                {getStatusIcon()}
                {isConnected ? 'Connected' : isAvailable ? 'Available' : 'Disconnected'}
              </Badge>
              <span className="text-sm text-muted-foreground">{connectionStatus}</span>
            </div>
            <div className="text-right">
              {currentDevice && (
                <div className="text-sm font-medium text-foreground">Device: {currentDevice}</div>
              )}
              {(() => {
                const storedSession = CastSessionStorage.getSession();
                if (storedSession) {
                  const ageMinutes = Math.round((Date.now() - storedSession.timestamp) / 1000 / 60);
                  const ageDisplay = ageMinutes < 60 ? `${ageMinutes}m` : `${Math.round(ageMinutes / 60)}h`;
                  return (
                    <div className="text-xs text-muted-foreground">
                      Session: {storedSession.sessionId.slice(-8)} ({ageDisplay} old)
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Connection Controls */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              onClick={initializeCast}
              variant="outline"
              disabled={isConnected}
              size="sm"
            >
              Initialize Cast
            </Button>
            <Button
              onClick={requestSession}
              disabled={!isAvailable || isConnected}
              size="sm"
            >
              Connect to Device
            </Button>
            <Button
              onClick={forceDeviceDiscovery}
              variant="outline"
              size="sm"
              className="border-blue-500/20 hover:border-blue-500/40 text-blue-400 hover:text-blue-300"
              title="Force device scanning"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Force Scan
            </Button>
            <Button
              onClick={endSession}
              variant="destructive"
              disabled={!isConnected}
              size="sm"
            >
              Disconnect
            </Button>
            <SessionResumeButton size="sm" />
            {hasValidSession() && (
              <Button
                onClick={handleClearSession}
                variant="outline"
                size="sm"
                className="border-orange-500/20 hover:border-orange-500/40 text-orange-400 hover:text-orange-300"
                title="Clear stored session data"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Session
              </Button>
            )}
          </div>

          <Separator />

          {/* Message Sending */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* String Message */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Send String Message</CardTitle>
                <CardDescription>Send a simple text message to the receiver</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="string-message">Message</Label>
                  <Input
                    id="string-message"
                    type="text"
                    placeholder="Enter your message..."
                    value={stringMessage}
                    onChange={(e) => setStringMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendString()}
                  />
                </div>
                <Button
                  onClick={handleSendString}
                  disabled={!isConnected || !stringMessage.trim()}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send String
                </Button>
              </CardContent>
            </Card>

            {/* JSON Message */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Send JSON Message</CardTitle>
                <CardDescription>Send a structured JSON object to the receiver</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="json-message">JSON Message</Label>
                  <Textarea
                    id="json-message"
                    placeholder="Enter JSON object..."
                    value={jsonMessage}
                    onChange={(e) => {
                      setJsonMessage(e.target.value);
                      validateJson(e.target.value);
                    }}
                    rows={6}
                    className="font-mono text-sm"
                  />
                  {jsonError && (
                    <p className="text-sm text-destructive">{jsonError}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSendJson}
                    disabled={!isConnected || !!jsonError}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send JSON
                  </Button>
                  <Button
                    onClick={() => setJsonMessage('{\n  "type": "test",\n  "data": "Hello from sender!"\n}')}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Test Messages</CardTitle>
              <CardDescription>Send predefined messages for testing - These will trigger custom events on receiver</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                <Button
                  onClick={async () => {
                    const message = {
                      type: 'CONSOLE_EVENT',
                      payload: {
                        action: 'greeting',
                        message: 'Hello World from Sender!',
                        timestamp: Date.now(),
                        level: 'info'
                      }
                    };
                    addConsoleMessage('sent', 'info', 'Hello World message', message);
                    await sendMessage(message);
                  }}
                  disabled={!isConnected}
                  variant="outline"
                  size="sm"
                >
                  Hello World
                </Button>
                <Button
                  onClick={() => sendMessage({
                    type: 'CONSOLE_EVENT',
                    payload: {
                      action: 'ping',
                      message: 'Ping test from sender',
                      timestamp: Date.now(),
                      level: 'success',
                      duration: 2000
                    }
                  })}
                  disabled={!isConnected}
                  variant="outline"
                  size="sm"
                >
                  Ping Test
                </Button>
                <Button
                  onClick={() => sendMessage({
                    type: 'CONSOLE_EVENT',
                    payload: {
                      action: 'visual_effect',
                      message: 'Triggering visual effect on receiver',
                      timestamp: Date.now(),
                      level: 'warning',
                      effect: 'flash_screen'
                    }
                  })}
                  disabled={!isConnected}
                  variant="outline"
                  size="sm"
                >
                  Visual Effect
                </Button>
                <Button
                  onClick={() => sendMessage({
                    type: 'CONSOLE_EVENT',
                    payload: {
                      action: 'system_test',
                      message: 'System test command executed',
                      timestamp: Date.now(),
                      level: 'error',
                      data: { testId: Math.random(), status: 'executed' }
                    }
                  })}
                  disabled={!isConnected}
                  variant="outline"
                  size="sm"
                >
                  System Test
                </Button>
                <Button
                  onClick={() => sendMessage({
                    type: 'CONSOLE_EVENT',
                    payload: {
                      action: 'performance_test',
                      message: 'Performance metrics collected',
                      timestamp: Date.now(),
                      level: 'info',
                      data: {
                        cpu: Math.floor(Math.random() * 100),
                        memory: Math.floor(Math.random() * 100),
                        latency: Math.floor(Math.random() * 50) + 10
                      }
                    }
                  })}
                  disabled={!isConnected}
                  variant="outline"
                  size="sm"
                >
                  Performance
                </Button>
                <Button
                  onClick={() => sendMessage({
                    type: 'CONSOLE_EVENT',
                    payload: {
                      action: 'debug_message',
                      message: `Debug timestamp: ${new Date().toISOString()}`,
                      timestamp: Date.now(),
                      level: 'success',
                      data: {
                        debugMode: true,
                        sender: 'Cast Debug Panel',
                        messageCount: Math.floor(Math.random() * 1000)
                      }
                    }
                  })}
                  disabled={!isConnected}
                  variant="outline"
                  size="sm"
                >
                  Debug Info
                </Button>
                <Button
                  onClick={() => sendMessage({
                    type: 'CONSOLE_EVENT',
                    payload: {
                      action: 'connection_test',
                      message: 'Testing bidirectional communication',
                      timestamp: Date.now(),
                      level: 'warning',
                      data: {
                        testType: 'bidirectional',
                        expectedResponse: 'ack',
                        timeout: 5000
                      }
                    }
                  })}
                  disabled={!isConnected}
                  variant="outline"
                  size="sm"
                >
                  Conn Test
                </Button>
                <Button
                  onClick={() => sendMessage({
                    type: 'CONSOLE_EVENT',
                    payload: {
                      action: 'error_simulation',
                      message: 'Simulated error for testing purposes',
                      timestamp: Date.now(),
                      level: 'error',
                      data: {
                        errorCode: 'TEST_ERROR_' + Math.floor(Math.random() * 9999),
                        errorType: 'simulation',
                        stackTrace: 'at testFunction (debug-panel.js:123)\n  at onClick (button.tsx:45)'
                      }
                    }
                  })}
                  disabled={!isConnected}
                  variant="outline"
                  size="sm"
                >
                  Error Test
                </Button>
              </div>

              {/* Comprehensive Test Section */}
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-foreground mb-2">Comprehensive Testing</h4>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      const messages = [
                        {
                          type: 'CONSOLE_EVENT',
                          payload: {
                            action: 'batch_test_start',
                            message: 'Starting comprehensive console test...',
                            level: 'info',
                            data: { testSuite: 'console_display', totalTests: 4 }
                          }
                        },
                        {
                          type: 'CONSOLE_EVENT',
                          payload: {
                            action: 'test_info',
                            message: 'Information level message test',
                            level: 'info',
                            data: { step: 1, category: 'display' }
                          }
                        },
                        {
                          type: 'CONSOLE_EVENT',
                          payload: {
                            action: 'test_success',
                            message: 'Success level message test',
                            level: 'success',
                            data: { step: 2, category: 'display' }
                          }
                        },
                        {
                          type: 'CONSOLE_EVENT',
                          payload: {
                            action: 'test_warning',
                            message: 'Warning level message test',
                            level: 'warning',
                            data: { step: 3, category: 'display' }
                          }
                        },
                        {
                          type: 'CONSOLE_EVENT',
                          payload: {
                            action: 'test_error',
                            message: 'Error level message test',
                            level: 'error',
                            data: { step: 4, category: 'display' }
                          }
                        },
                        {
                          type: 'CONSOLE_EVENT',
                          payload: {
                            action: 'batch_test_complete',
                            message: 'Console display test completed successfully!',
                            level: 'success',
                            data: { testSuite: 'console_display', result: 'passed', duration: '2.5s' }
                          }
                        }
                      ];

                      for (let i = 0; i < messages.length; i++) {
                        await sendMessage(messages[i]);
                        // Add small delay between messages
                        await new Promise(resolve => setTimeout(resolve, 500));
                      }
                    }}
                    disabled={!isConnected}
                    variant="default"
                    size="sm"
                  >
                    Run Console Test Suite
                  </Button>
                </div>
              </div>

              {/* Additional Actions */}
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-foreground mb-2">Navigation & Media</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    onClick={() => sendMessage({
                      type: 'LOAD_PAGE',
                      payload: {
                        pageType: 'media',
                        title: 'Debug Test Video',
                        mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
                      }
                    })}
                    disabled={!isConnected}
                    variant="outline"
                    size="sm"
                  >
                    Load Media
                  </Button>
                  <Button
                    onClick={() => sendMessage({
                      type: 'NEXT_PAGE',
                      payload: {
                        action: 'navigate_next',
                        message: 'Navigate to next page',
                        timestamp: Date.now()
                      }
                    })}
                    disabled={!isConnected}
                    variant="outline"
                    size="sm"
                  >
                    Next Page
                  </Button>
                  <Button
                    onClick={() => sendMessage({
                      type: 'CONSOLE_EVENT',
                      payload: {
                        action: 'animation_trigger',
                        message: 'Triggering 3D animation sequence',
                        timestamp: Date.now(),
                        level: 'info',
                        animation: 'rotate_cards'
                      }
                    })}
                    disabled={!isConnected}
                    variant="outline"
                    size="sm"
                  >
                    3D Animation
                  </Button>
                  <Button
                    onClick={() => sendMessage({
                      type: 'CONSOLE_EVENT',
                      payload: {
                        action: 'emergency_stop',
                        message: 'Emergency stop signal sent',
                        timestamp: Date.now(),
                        level: 'error',
                        urgent: true
                      }
                    })}
                    disabled={!isConnected}
                    variant="destructive"
                    size="sm"
                  >
                    Emergency Stop
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debug Window Control */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">TV Debug Window Control</CardTitle>
              <CardDescription>Control the visibility of the debug window on the TV receiver</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={debugWindowVisible ? "default" : "secondary"}>
                    Debug Window: {debugWindowVisible ? "Visible" : "Hidden"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Control debug window visibility on TV screen
                  </span>
                </div>
                <Button
                  onClick={toggleDebugWindow}
                  disabled={!isConnected}
                  variant={debugWindowVisible ? "destructive" : "default"}
                  size="sm"
                >
                  {debugWindowVisible ? "Hide Debug Window" : "Show Debug Window"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Debug Panel Control */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">TV Debug Panel Control</CardTitle>
              <CardDescription>Control the visibility of the debug console on the TV receiver</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={debugPanelVisible ? "default" : "secondary"}>
                    Debug Panel: {debugPanelVisible ? "Visible" : "Hidden"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Control cast console visibility on TV screen
                  </span>
                </div>
                <Button
                  onClick={toggleDebugPanel}
                  disabled={!isConnected}
                  variant={debugPanelVisible ? "destructive" : "default"}
                  size="sm"
                >
                  {debugPanelVisible ? "Hide Debug Panel" : "Show Debug Panel"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Video Control */}
          <VideoControl />

          {/* Console Messages Display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Cast Message Console</span>
                <Button
                  onClick={() => setConsoleMessages([])}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </CardTitle>
              <CardDescription>Real-time message flow between sender and receiver</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto bg-black/90 rounded-lg p-4 font-mono text-sm space-y-1">
                {consoleMessages.length === 0 ? (
                  <div className="text-gray-500">No messages yet. Send a message to see the console output.</div>
                ) : (
                  consoleMessages.map((msg) => (
                    <div key={msg.id} className="flex gap-2">
                      <span className="text-gray-500 shrink-0">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`shrink-0 uppercase ${
                        msg.type === 'sent' ? 'text-blue-400' : 
                        msg.type === 'received' ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        [{msg.type}]
                      </span>
                      <span className={`shrink-0 ${
                        msg.level === 'error' ? 'text-red-400' :
                        msg.level === 'warning' ? 'text-yellow-400' :
                        msg.level === 'success' ? 'text-green-400' : 'text-blue-400'
                      }`}>
                        {msg.level.toUpperCase()}:
                      </span>
                      <span className="text-white">{msg.message}</span>
                      {msg.data && (
                        <button
                          onClick={() => console.log('Message data:', msg.data)}
                          className="text-gray-400 hover:text-white ml-2"
                          title="Click to log data to browser console"
                        >
                          [📋]
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

export default CastDebugPanel;
