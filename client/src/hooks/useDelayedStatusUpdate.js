import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_DELAY_MS = 5000;

// Simple: This removes or clears the key.
const removeKey = (obj, key) => {
  const copy = { ...obj };
  delete copy[key];
  return copy;
};

export const useDelayedStatusUpdate = ({
  delayMs = DEFAULT_DELAY_MS,
  onCommit,
  onError,
}) => {
  const [pendingUpdates, setPendingUpdates] = useState({});
  const [now, setNow] = useState(Date.now());
  const pendingRef = useRef({});

  useEffect(() => {
    pendingRef.current = pendingUpdates;
  }, [pendingUpdates]);

  useEffect(() => {
    const hasPending = Object.keys(pendingUpdates).length > 0;
    if (!hasPending) {
      return undefined;
    }

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => clearInterval(timer);
  }, [pendingUpdates]);

  const executeCommit = useCallback(async (update) => {
    if (!update) return;

    try {
      await onCommit(update);
    } catch (error) {
      if (onError) {
        onError(error, update);
      }
    }
  }, [onCommit, onError]);

  const commitPendingUpdateNow = useCallback(async (itemId) => {
    const existing = pendingRef.current[itemId];
    if (!existing) return;

    clearTimeout(existing.timerId);

    setPendingUpdates((prev) => removeKey(prev, itemId));
    await executeCommit(existing);
  }, [executeCommit]);

  const cancelPendingUpdate = useCallback((itemId) => {
    setPendingUpdates((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;

      clearTimeout(existing.timerId);
      return removeKey(prev, itemId);
    });
  }, []);

  const queueStatusUpdate = useCallback((itemId, fromStatus, toStatus, meta = {}) => {
    setPendingUpdates((prev) => {
      const existing = prev[itemId];
      if (existing) {
        clearTimeout(existing.timerId);
      }

      const expiresAt = Date.now() + delayMs;
      const timerId = setTimeout(async () => {
        const update = pendingRef.current[itemId];
        if (!update) return;

        setPendingUpdates((current) => removeKey(current, itemId));
        await executeCommit(update);
      }, delayMs);

      return {
        ...prev,
        [itemId]: {
          itemId,
          fromStatus,
          toStatus,
          expiresAt,
          timerId,
          meta,
        },
      };
    });
  }, [delayMs, executeCommit]);

  useEffect(() => {
    return () => {
      Object.values(pendingRef.current).forEach((pending) => {
        clearTimeout(pending.timerId);
      });
    };
  }, []);

  const getPendingUpdate = useCallback((itemId) => pendingUpdates[itemId] || null, [pendingUpdates]);

  const getRemainingSeconds = useCallback((itemId) => {
    const pending = pendingUpdates[itemId];
    if (!pending) return 0;

    return Math.max(0, Math.ceil((pending.expiresAt - now) / 1000));
  }, [now, pendingUpdates]);

  const hasPendingUpdates = useMemo(() => Object.keys(pendingUpdates).length > 0, [pendingUpdates]);

  return {
    pendingUpdates,
    hasPendingUpdates,
    queueStatusUpdate,
    cancelPendingUpdate,
    commitPendingUpdateNow,
    getPendingUpdate,
    getRemainingSeconds,
  };
};

export default useDelayedStatusUpdate;
