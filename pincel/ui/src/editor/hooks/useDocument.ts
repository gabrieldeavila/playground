import { useEffect, useState } from 'react';
import { subscribeToChanges } from '../api/document-events';
import { fetchDocument } from '../api/pincel-api';
import type { DocumentSnapshot } from '../domain/types';

/** Keeps the document snapshot fresh: refetches whenever anyone (AI or user) changes it. */
export function useDocument() {
  const [doc, setDoc] = useState<DocumentSnapshot | null>(null);
  const [online, setOnline] = useState(false);
  const [lastChange, setLastChange] = useState<string>('');

  useEffect(() => {
    let latest = -1;
    const refresh = async () => {
      const next = await fetchDocument();
      if (next.version < latest) return;
      latest = next.version;
      setDoc(next);
    };
    return subscribeToChanges(
      (event) => {
        setLastChange(event.reason);
        void refresh().catch(() => setOnline(false));
      },
      setOnline,
    );
  }, []);

  return { doc, online, lastChange };
}
