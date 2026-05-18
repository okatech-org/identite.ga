import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * État local du tunnel d'inscription mobile, mémoire courte (AsyncStorage).
 * Mirroir du `use-onboarding-state.ts` web : on persiste profileType et
 * email entre les étapes pour pouvoir survivre à un changement de route ou
 * une mise en arrière-plan rapide.
 *
 * Effacé à la fin du tunnel (étape `done`).
 */

const KEY_PROFILE = 'idn.onboarding.profile';
const KEY_EMAIL   = 'idn.onboarding.email';

export type OnboardingProfile = 'citizen' | 'resident' | 'visitor' | 'developer';

export async function setOnboardingProfile(profile: OnboardingProfile): Promise<void> {
  await AsyncStorage.setItem(KEY_PROFILE, profile);
}

export async function getOnboardingProfile(): Promise<OnboardingProfile | null> {
  const v = await AsyncStorage.getItem(KEY_PROFILE);
  if (v === 'citizen' || v === 'resident' || v === 'visitor' || v === 'developer') return v;
  return null;
}

export async function setOnboardingEmail(email: string): Promise<void> {
  await AsyncStorage.setItem(KEY_EMAIL, email);
}

export async function getOnboardingEmail(): Promise<string | null> {
  return AsyncStorage.getItem(KEY_EMAIL);
}

export async function clearOnboarding(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(KEY_PROFILE),
    AsyncStorage.removeItem(KEY_EMAIL),
  ]);
}
