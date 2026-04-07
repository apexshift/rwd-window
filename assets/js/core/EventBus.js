/**
 * Lightweight Pub/Sub EventBus singleton.
 * Uses 'domain:action' naming convention for clarity and greppability.
 * Minimal overhead, suitable for desktop-only rapid-prototyping tool.
 */
export class EventBus {
    static #instance = null;
    #listeners = new Map();
  
    static getInstance() {
      if (!EventBus.#instance) {
        EventBus.#instance = new EventBus();
      }
      return EventBus.#instance;
    }
  
    on(event, callback) {
      if (!this.#listeners.has(event)) {
        this.#listeners.set(event, new Set());
      }
      this.#listeners.get(event).add(callback);
      return () => this.off(event, callback); // return unsubscribe function
    }
  
    off(event, callback) {
      if (this.#listeners.has(event)) {
        this.#listeners.get(event).delete(callback);
        if (this.#listeners.get(event).size === 0) {
          this.#listeners.delete(event);
        }
      }
    }
  
    emit(event, data = null) {
      if (this.#listeners.has(event)) {
        // Use a copy to avoid modification-during-iteration issues
        for (const callback of [...this.#listeners.get(event)]) {
          try {
            callback(data);
          } catch (err) {
            console.error(`EventBus error in listener for "${event}":`, err);
          }
        }
      }
    }
  }
  
  // Export singleton instance for easy import
  export const bus = EventBus.getInstance();