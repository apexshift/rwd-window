/**
 * @module EventBus
 * @description Lightweight Pub/Sub EventBus singleton.
 *
 * Uses a 'domain:action' naming convention (e.g. 'state:viewportChanged')
 * for clarity and greppability. Listener errors are isolated so one bad
 * handler cannot interrupt the others. Minimal overhead — suitable for a
 * desktop-only rapid-prototyping tool.
 */
export class EventBus {
    static #instance = null;
    /** @type {Map<string, Set<Function>>} */
    #listeners = new Map();

    /**
     * Return the shared EventBus instance, creating it on first call.
     * @returns {EventBus}
     */
    static getInstance() {
      if (!EventBus.#instance) {
        EventBus.#instance = new EventBus();
      }
      return EventBus.#instance;
    }

    /**
     * Subscribe a callback to a named event.
     *
     * @param {string}   event    - Event name in 'domain:action' format.
     * @param {Function} callback - Handler invoked with the event payload.
     * @returns {Function} An unsubscribe function — call it to remove this specific listener.
     */
    on(event, callback) {
      if (!this.#listeners.has(event)) {
        this.#listeners.set(event, new Set());
      }
      this.#listeners.get(event).add(callback);
      return () => this.off(event, callback); // return unsubscribe function
    }

    /**
     * Unsubscribe a specific callback from an event.
     * The event entry is removed entirely once its listener set is empty.
     *
     * @param {string}   event    - The event name.
     * @param {Function} callback - The exact callback reference that was registered.
     */
    off(event, callback) {
      if (this.#listeners.has(event)) {
        this.#listeners.get(event).delete(callback);
        if (this.#listeners.get(event).size === 0) {
          this.#listeners.delete(event);
        }
      }
    }

    /**
     * Emit an event, invoking all registered listeners with the given payload.
     * Listeners are invoked in subscription order. Errors thrown by a listener
     * are caught and logged so remaining listeners continue to execute.
     *
     * @param {string} event      - The event name.
     * @param {*}      [data=null] - Payload passed to every listener.
     */
    emit(event, data = null) {
      if (this.#listeners.has(event)) {
        // Snapshot the set to avoid modification-during-iteration issues
        for (const callback of [...this.#listeners.get(event)]) {
          try {
            callback(data);
          } catch (err) {
            console.error(`EventBus error in listener for "${event}":`, err);
          }
        }
      }
    }

    /**
     * Remove all registered listeners.
     * Only active in test environments (NODE_ENV=test or import.meta.env.TEST).
     * Guards against accidental use in production.
     */
    resetForTesting() {
      if (import.meta.env?.TEST || process.env.NODE_ENV === 'test') {
        this.#listeners.clear();
      }
    }
  }

/**
 * The application-wide EventBus singleton instance.
 * Import this directly rather than calling {@link EventBus.getInstance}.
 * @type {EventBus}
 */
export const bus = EventBus.getInstance();
