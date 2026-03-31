import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string; value: string }>;
      if (customEvent.detail.key === key) {
        try {
          const newValue = JSON.parse(customEvent.detail.value);
          setStoredValue(newValue);
        } catch (error) {
          console.error(`Error parsing ${key} from storage event:`, error);
        }
      }
    };

    window.addEventListener('localStorageChange', handleStorageChange as EventListener);
    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange as EventListener);
    };
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      const stringValue = JSON.stringify(valueToStore);
      window.localStorage.setItem(key, stringValue);
      
      window.dispatchEvent(new CustomEvent('localStorageChange', {
        detail: { key, value: stringValue }
      }));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  return [storedValue, setValue] as const;
}
