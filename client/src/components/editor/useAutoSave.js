import { useRef, useCallback } from 'react';

/**
 * Returns a debounced save function.
 * Call it with the current value; it will invoke onSave after 500ms of inactivity.
 */
export function useAutoSave(onSave, delay = 500) {
  const timerRef = useRef(null);

  const schedule = useCallback(
    (value) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onSave(value), delay);
    },
    [onSave, delay]
  );

  const flush = useCallback(() => {
    clearTimeout(timerRef.current);
  }, []);

  return { schedule, flush };
}
