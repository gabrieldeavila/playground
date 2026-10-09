export interface ChangeEvent {
  version: number;
  reason: string;
}

/** Listens to the API's Server-Sent Events; EventSource reconnects on its own. */
export function subscribeToChanges(onChange: (event: ChangeEvent) => void, onStatus: (online: boolean) => void): () => void {
  const source = new EventSource('/api/events');
  source.onmessage = (message) => onChange(JSON.parse(message.data));
  source.onopen = () => onStatus(true);
  source.onerror = () => onStatus(false);
  return () => source.close();
}
