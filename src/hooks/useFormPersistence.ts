import { useState, useEffect, useCallback } from 'react';

interface FormPersistenceOptions {
  storageKey: string;
  debounceMs?: number;
}

export const useFormPersistence = <T extends Record<string, any>>(
  initialData: T,
  options: FormPersistenceOptions
) => {
  const { storageKey, debounceMs = 1000 } = options;
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsedData = JSON.parse(saved);
        setData({ ...initialData, ...parsedData });
        setLastSaved(new Date(parsedData._timestamp || Date.now()));
      }
    } catch (error) {
      console.warn('Failed to load form data from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  // Debounced save to localStorage
  useEffect(() => {
    if (isLoading) return;

    const timeoutId = setTimeout(() => {
      try {
        const dataToSave = {
          ...data,
          _timestamp: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        setLastSaved(new Date());
      } catch (error) {
        console.warn('Failed to save form data to localStorage:', error);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [data, storageKey, debounceMs, isLoading]);

  const updateField = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateData = useCallback((updates: Partial<T>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const clearData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setData(initialData);
      setLastSaved(null);
    } catch (error) {
      console.warn('Failed to clear form data from localStorage:', error);
    }
  }, [storageKey, initialData]);

  const resetToSaved = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsedData = JSON.parse(saved);
        setData({ ...initialData, ...parsedData });
      }
    } catch (error) {
      console.warn('Failed to reset to saved data:', error);
    }
  }, [storageKey, initialData]);

  return {
    data,
    updateField,
    updateData,
    clearData,
    resetToSaved,
    isLoading,
    lastSaved
  };
};