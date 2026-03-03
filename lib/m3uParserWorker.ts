// M3U Parser Web Worker Manager
// Provides a clean interface for using the M3U parser web worker

export interface M3UParseProgress {
  progress: number;
  totalProcessed: number;
  isComplete: boolean;
}

export interface M3UParseResult {
  videos: any[];
  totalCount: number;
  processingTime: number;
}

export interface M3UParseError {
  message: string;
  stack?: string;
}

export type M3UWorkerMessageType = 
  | 'WORKER_READY'
  | 'PARSE_STARTED'
  | 'PARSE_PROGRESS'
  | 'PARSE_COMPLETE'
  | 'ERROR';

export interface M3UWorkerMessage {
  type: M3UWorkerMessageType;
  data?: M3UParseProgress | M3UParseResult;
  message?: string;
}

export class M3UParserWorkerManager {
  private worker: Worker | null = null;
  private isReady: boolean = false;
  private readyPromise: Promise<void> | null = null;

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker(): void {
    try {
      this.worker = new Worker('/workers/m3uParserWorker.js');
      
      this.readyPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Worker initialization timeout'));
        }, 5000);

        const handleMessage = (event: MessageEvent<M3UWorkerMessage>) => {
          if (event.data.type === 'WORKER_READY') {
            this.isReady = true;
            clearTimeout(timeout);
            this.worker?.removeEventListener('message', handleMessage);
            resolve();
          }
        };

        this.worker?.addEventListener('message', handleMessage);
      });

    } catch (error) {
      console.error('Failed to initialize M3U parser worker:', error);
      throw new Error('Web Worker not supported or failed to initialize');
    }
  }

  async ensureReady(): Promise<void> {
    if (this.isReady) return;
    if (this.readyPromise) {
      await this.readyPromise;
    } else {
      throw new Error('Worker not initialized');
    }
  }

  async parseM3UChunked(
    content: string,
    options: {
      chunkSize?: number;
      onProgress?: (progress: M3UParseProgress) => void;
      onStart?: () => void;
    } = {}
  ): Promise<M3UParseResult> {
    await this.ensureReady();
    
    if (!this.worker) {
      throw new Error('Worker not available');
    }

    const { chunkSize = 100, onProgress, onStart } = options;

    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent<M3UWorkerMessage>) => {
        const { type, data, message } = event.data;

        switch (type) {
          case 'PARSE_STARTED':
            if (onStart) onStart();
            break;

          case 'PARSE_PROGRESS':
            if (onProgress && data) {
              onProgress(data as M3UParseProgress);
            }
            break;

          case 'PARSE_COMPLETE':
            this.worker?.removeEventListener('message', handleMessage);
            resolve(data as M3UParseResult);
            break;

          case 'ERROR':
            this.worker?.removeEventListener('message', handleMessage);
            reject(new Error(message || 'Unknown worker error'));
            break;
        }
      };

      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }

      this.worker.addEventListener('message', handleMessage);

      // Send parsing request
      this.worker.postMessage({
        type: 'PARSE_M3U_CHUNKED',
        data: { content, chunkSize }
      });
    });
  }

  async parseM3USimple(content: string): Promise<M3UParseResult> {
    await this.ensureReady();
    
    if (!this.worker) {
      throw new Error('Worker not available');
    }

    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent<M3UWorkerMessage>) => {
        const { type, data, message } = event.data;

        switch (type) {
          case 'PARSE_COMPLETE':
            this.worker?.removeEventListener('message', handleMessage);
            resolve(data as M3UParseResult);
            break;

          case 'ERROR':
            this.worker?.removeEventListener('message', handleMessage);
            reject(new Error(message || 'Unknown worker error'));
            break;
        }
      };

      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }

      this.worker.addEventListener('message', handleMessage);

      // Send parsing request
      this.worker.postMessage({
        type: 'PARSE_M3U_SIMPLE',
        data: { content, startTime: performance.now() }
      });
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      this.readyPromise = null;
    }
  }

  isWorkerReady(): boolean {
    return this.isReady;
  }

  // Fallback method for environments without Web Worker support
  static isWebWorkerSupported(): boolean {
    return typeof Worker !== 'undefined';
  }
}

// Singleton instance for app-wide usage
let workerManager: M3UParserWorkerManager | null = null;

export function getM3UParserWorker(): M3UParserWorkerManager {
  if (!M3UParserWorkerManager.isWebWorkerSupported()) {
    throw new Error('Web Workers are not supported in this environment');
  }

  if (!workerManager) {
    workerManager = new M3UParserWorkerManager();
  }
  
  return workerManager;
}

export function terminateM3UParserWorker(): void {
  if (workerManager) {
    workerManager.terminate();
    workerManager = null;
  }
}
