
// Use centralized LogEntry interface from types.ts
import { LogEntry } from '../types';

class Logger {
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  // Add a new entry to the logs and notify all active subscribers
  log(message: string, type: LogEntry['type'] = 'info') {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    this.logs.push(entry);
    console.log(`[${entry.type.toUpperCase()}] ${message}`);
    this.notify();
  }

  // Allow components to subscribe to log changes for real-time updates
  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    listener(this.logs);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.logs]));
  }

  getLogs() {
    return this.logs;
  }

  // Formats logs into a text file and triggers a browser download
  downloadLogs() {
    const text = this.logs
      .map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `philia_debug_log_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const logger = new Logger();
