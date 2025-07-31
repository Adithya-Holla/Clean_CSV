// Simple utility to prevent browser tab from becoming unresponsive
import { API_ENDPOINTS } from './api';

export const keepAlive = () => {
  let interval: NodeJS.Timeout;
  
  const start = () => {
    // Ping every 30 seconds to keep the connection alive (reduced frequency)
    interval = setInterval(() => {
      try {
        // Force a small DOM update to keep the browser responsive
        const timestamp = Date.now();
        const element = document.getElementById('keep-alive-timestamp');
        if (element) {
          element.textContent = timestamp.toString();
        } else {
          // Create hidden element if it doesn't exist
          const hiddenDiv = document.createElement('div');
          hiddenDiv.id = 'keep-alive-timestamp';
          hiddenDiv.style.display = 'none';
          hiddenDiv.textContent = timestamp.toString();
          document.body.appendChild(hiddenDiv);
        }

        // Simple background ping without await to prevent blocking
        fetch(API_ENDPOINTS.health, {
          method: 'GET',
          // Use manual timeout implementation for better browser compatibility
        }).then(() => {
          console.debug('Keep-alive ping successful');
        }).catch((e) => {
          // Silently fail - backend might be busy processing
          console.debug('Keep-alive ping failed:', e);
        });
        
      } catch (error) {
        console.debug('Keep-alive error:', error);
      }
    }, 30000); // Every 30 seconds (reduced from 10)
  };
  
  const stop = () => {
    if (interval) {
      clearInterval(interval);
    }
  };
  
  return { start, stop };
};

// Helper to chunk long-running operations
export const chunkOperation = <T>(
  items: T[],
  operation: (item: T) => void,
  chunkSize: number = 100,
  delay: number = 10
): Promise<void> => {
  return new Promise((resolve) => {
    let index = 0;
    
    const processChunk = () => {
      const endIndex = Math.min(index + chunkSize, items.length);
      
      for (let i = index; i < endIndex; i++) {
        operation(items[i]);
      }
      
      index = endIndex;
      
      if (index < items.length) {
        setTimeout(processChunk, delay);
      } else {
        resolve();
      }
    };
    
    processChunk();
  });
};
