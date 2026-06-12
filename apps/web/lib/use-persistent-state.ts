'use client';

import { useEffect, useState } from 'react';
import { FileHandler } from './file-handler';

export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setValue(FileHandler.loadFromLocalStorage<T>(key, initialValue));
    setLoaded(true);
  }, [initialValue, key]);

  useEffect(() => {
    if (loaded) {
      FileHandler.saveToLocalStorage(key, value);
    }
  }, [key, loaded, value]);

  return [value, setValue] as const;
}
