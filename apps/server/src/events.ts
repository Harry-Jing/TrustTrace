import type { ProgressEventDto } from "./types";

type ProgressListener = (event: ProgressEventDto) => void;

export class ProgressEventBus {
  private readonly listenersByCheckId = new Map<string, Set<ProgressListener>>();

  subscribe(checkId: string, listener: ProgressListener): () => void {
    const listeners = this.listenersByCheckId.get(checkId) ?? new Set<ProgressListener>();
    listeners.add(listener);
    this.listenersByCheckId.set(checkId, listeners);

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listenersByCheckId.delete(checkId);
      }
    };
  }

  publish(event: ProgressEventDto): void {
    this.listenersByCheckId.get(event.checkId)?.forEach((listener) => {
      listener(event);
    });
  }
}
