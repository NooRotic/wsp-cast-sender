"use client";

import { useEffect } from "react";
import { useCast } from "@/contexts/CastContext";

/**
 * KeyboardShortcutHandler: Global keyboard shortcuts for sender app.
 * - Ctrl+Shift+D: Toggle debug console on receiver (if session active)
 * Add more shortcuts as needed.
 */
export default function KeyboardShortcutHandler() {
  const { isConnected, sendMessage } = useCast();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+D: Toggle debug console on receiver
      if (event.ctrlKey && event.shiftKey && event.key === "D") {
        event.preventDefault();
        if (isConnected) {
          sendMessage({
            type: "CONSOLE_CONTROL",
            payload: {
              action: "toggle_visibility",
              timestamp: Date.now(),
            },
          });
        }
      }
      // Add more shortcuts here as needed
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConnected, sendMessage]);

  return null;
}
