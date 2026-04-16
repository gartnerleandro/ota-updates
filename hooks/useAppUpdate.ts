import * as Updates from "expo-updates";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutos entre checks
const INITIAL_DELAY_MS = 5_000; // 5s después del cold start

export function useAppUpdate() {
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const lastCheckRef = useRef(0);

  const checkForUpdate = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled) return;

    const now = Date.now();
    if (now - lastCheckRef.current < COOLDOWN_MS) return;
    lastCheckRef.current = now;

    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) return;

      const fetchResult = await Updates.fetchUpdateAsync();
      if (fetchResult.isNew) {
        setIsUpdateReady(true);
      }
    } catch {
      // Silent failure — sin red o CDN caído
    }
  }, []);

  const applyUpdate = useCallback(() => {
    void Updates.reloadAsync();
  }, []);

  // Check 5s después del cold start
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    const timer = setTimeout(() => {
      void checkForUpdate();
    }, INITIAL_DELAY_MS);

    return () => clearTimeout(timer);
  }, [checkForUpdate]);

  // Check cuando la app vuelve a foreground
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        void checkForUpdate();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, [checkForUpdate]);

  return { isUpdateReady, applyUpdate };
}
