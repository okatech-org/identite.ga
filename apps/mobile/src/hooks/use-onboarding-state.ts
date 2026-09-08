import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * État local du tunnel d'inscription mobile, mémoire courte (AsyncStorage).
 * On persiste profileType et pivot entre les étapes pour pouvoir survivre à
 * un changement de route ou une mise en arrière-plan rapide. Le compte
 * Better Auth et le profil ne sont créés qu'après confirmation du PIN — avant
 * ça, rien n'existe côté backend.
 *
 * Effacé à la fin du tunnel (étape `done`).
 */

const KEY_PROFILE = 'idn.onboarding.profile';
const KEY_PIVOT = 'idn.onboarding.pivot';
const KEY_HANDLE = 'idn.onboarding.handle';

export type OnboardingProfile = 'citizen' | 'resident' | 'visitor' | 'developer';

export type OnboardingPivot = {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO YYYY-MM-DD
  gender: 'M' | 'F' | 'O' | 'N';
  birthPlace: string;
  nationality: string;
  phone?: string;
};

export async function setOnboardingProfile(profile: OnboardingProfile): Promise<void> {
  await AsyncStorage.setItem(KEY_PROFILE, profile);
}

export async function getOnboardingProfile(): Promise<OnboardingProfile | null> {
  const v = await AsyncStorage.getItem(KEY_PROFILE);
  if (v === 'citizen' || v === 'resident' || v === 'visitor' || v === 'developer') return v;
  return null;
}

export async function setOnboardingPivot(pivot: OnboardingPivot): Promise<void> {
  await AsyncStorage.setItem(KEY_PIVOT, JSON.stringify(pivot));
}

export async function getOnboardingPivot(): Promise<OnboardingPivot | null> {
  const raw = await AsyncStorage.getItem(KEY_PIVOT);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OnboardingPivot;
    if (
      typeof parsed?.firstName === 'string' &&
      typeof parsed?.lastName === 'string' &&
      typeof parsed?.dateOfBirth === 'string' &&
      (parsed.gender === 'M' || parsed.gender === 'F' || parsed.gender === 'O' || parsed.gender === 'N') &&
      typeof parsed?.birthPlace === 'string' &&
      typeof parsed?.nationality === 'string'
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function setOnboardingHandle(handle: string): Promise<void> {
  await AsyncStorage.setItem(KEY_HANDLE, handle);
}

export async function getOnboardingHandle(): Promise<string | null> {
  return AsyncStorage.getItem(KEY_HANDLE);
}

export async function clearOnboarding(): Promise<void> {
  await Promise.all([AsyncStorage.removeItem(KEY_PROFILE), AsyncStorage.removeItem(KEY_PIVOT), AsyncStorage.removeItem(KEY_HANDLE)]);
}
