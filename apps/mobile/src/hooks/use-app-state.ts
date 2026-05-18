import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const KEY_ONBOARDING = 'idn.onboardingDone';
const KEY_LOGGED_IN  = 'idn.loggedIn';

export type AppState = {
  ready: boolean;
  onboardingDone: boolean;
  loggedIn: boolean;
};

export function useAppState() {
  const [state, setState] = useState<AppState>({ ready: false, onboardingDone: false, loggedIn: false });
  useEffect(() => {
    (async () => {
      const [o, l] = await Promise.all([
        AsyncStorage.getItem(KEY_ONBOARDING),
        AsyncStorage.getItem(KEY_LOGGED_IN),
      ]);
      setState({ ready: true, onboardingDone: o === '1', loggedIn: l === '1' });
    })();
  }, []);
  return state;
}

export async function setOnboardingDone(v = true) {
  await AsyncStorage.setItem(KEY_ONBOARDING, v ? '1' : '0');
}

export async function setLoggedIn(v: boolean) {
  await AsyncStorage.setItem(KEY_LOGGED_IN, v ? '1' : '0');
}
