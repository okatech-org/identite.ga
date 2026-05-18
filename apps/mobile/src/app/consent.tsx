import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { Icon, type IconName } from '@/design/icons';
import { IdnButton } from '@/design/components/idn-button';
import { api } from '@/lib/api';
import { authClient } from '@/lib/auth-client';

// Map OIDC scopes → libellés citoyens
const SCOPE_LABELS: Record<string, { l: string; s: string; icon: IconName }> = {
  openid:        { l: 'Identifiant IDN',           s: 'GA-XXXX-XXXX (votre numéro public)',                       icon: 'shield' },
  profile:       { l: 'Identité pivot',            s: 'Prénom, nom, date et lieu de naissance',                   icon: 'user' },
  email:         { l: 'Adresse email',             s: 'Pour les notifications du service',                        icon: 'mail' },
  phone:         { l: 'Numéro de téléphone',       s: 'Pour les codes de vérification',                           icon: 'bell' },
  address:       { l: 'Adresse postale',           s: 'Pour les envois physiques',                                 icon: 'doc' },
  'idn:loa:2':   { l: 'Niveau de garantie ≥ 2',    s: 'Pièce d\'identité vérifiée',                              icon: 'shield' },
  'idn:loa:3':   { l: 'Niveau de garantie ≥ 3',    s: 'Identité vérifiée par un contrôleur',                     icon: 'shield' },
  'idn:doc:cni': { l: 'Carte d\'identité scannée', s: 'Pour vérification administrative',                         icon: 'doc' },
  'idn:doc:birth': { l: 'Acte de naissance numérique', s: 'Pour les démarches d\'état civil',                    icon: 'doc' },
};

function scopeMeta(scope: string) {
  return SCOPE_LABELS[scope] ?? { l: scope, s: 'Demandé par l\'application', icon: 'doc' as IconName };
}

export default function Consent() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ clientId?: string; scope?: string; state?: string }>();
  const clientId = params.clientId ?? '';
  const requestedScopes = (params.scope ?? '').split(' ').filter(Boolean);

  const app = useQuery(api.oauthAuthorize.getAppForConsent, clientId ? { clientId } : 'skip');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function authorize() {
    if (!clientId || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      // Better Auth OAuth plugin attend que le client appelle le endpoint
      // /api/auth/oauth2/consent. Le SDK Better Auth Expo n'expose pas encore
      // cette méthode typée — on l'appelle via authClient.fetch.
      await (authClient as any).$fetch?.('/oauth2/consent', {
        method: 'POST',
        body: { client_id: clientId, scopes: requestedScopes, action: 'allow' },
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d\'enregistrer le consentement.');
      setSubmitting(false);
    }
  }

  async function deny() {
    if (!clientId || submitting) return;
    setSubmitting(true);
    try {
      await (authClient as any).$fetch?.('/oauth2/consent', {
        method: 'POST',
        body: { client_id: clientId, scopes: requestedScopes, action: 'deny' },
      });
    } catch { /* ignore */ }
    router.back();
  }

  const appName = app?.name ?? 'Application';
  const appIcon = app?.icon ?? null;
  const initial = appName[0]?.toUpperCase() ?? 'A';
  const scopesToShow: string[] = (app?.requestedScopes ?? requestedScopes).filter(Boolean);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: 14, paddingBottom: 14, alignItems: 'center' }}>
        <View style={{ width: 36, height: 4, borderRadius: 9999, backgroundColor: t.borderSoft }} />
      </View>
      <View style={{ paddingHorizontal: 22, paddingVertical: 14, alignItems: 'center' }}>
        <Text style={{ fontSize: 11, color: t.muted, letterSpacing: 1.2, fontWeight: '600' }}>CONNEXION À</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 }}>
          <LinearGradient colors={['#0E7C3A', '#0A5C2C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 44, height: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>A</Text>
          </LinearGradient>
          <Text style={{ fontSize: 18, color: t.muted, letterSpacing: 4 }}>···</Text>
          <View style={{ width: 44, height: 44, borderRadius: 11, backgroundColor: appIcon ? 'transparent' : '#dac5a0', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#5a4a0a', fontSize: 16, fontWeight: '600' }}>{initial}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: t.ink, marginTop: 16 }}>{appName}</Text>
        {app?.requiredLoA ? (
          <Text style={{ fontSize: 12, color: t.muted, marginTop: 4, textAlign: 'center' }}>
            Niveau de garantie requis : {app.requiredLoA}
          </Text>
        ) : null}
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 18 }}>
        <Text style={{ fontSize: 13, color: t.ink2, lineHeight: 20, paddingVertical: 12 }}>
          Cette application souhaite accéder à ces informations de votre compte IDN :
        </Text>
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 14, overflow: 'hidden' }}>
          {scopesToShow.length === 0 ? (
            <View style={{ padding: 14 }}>
              <Text style={{ fontSize: 12, color: t.muted }}>Aucun champ demandé.</Text>
            </View>
          ) : scopesToShow.map((scope: string, i: number) => {
            const meta = scopeMeta(scope);
            return (
              <View key={scope} style={{
                flexDirection: 'row', alignItems: 'flex-start', gap: 12,
                padding: 14,
                borderBottomWidth: i === scopesToShow.length - 1 ? 0 : 1,
                borderBottomColor: t.borderSoft,
              }}>
                <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={meta.icon} size={18} color={idnTokens.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: t.ink }}>{meta.l}</Text>
                  <Text style={{ fontSize: 11, color: t.muted, marginTop: 2, lineHeight: 16 }}>{meta.s}</Text>
                </View>
              </View>
            );
          })}
        </View>
        <View style={{
          backgroundColor: t.dark ? '#10243A' : idnTokens.blueSoft,
          marginTop: 12, padding: 12, borderRadius: 12,
          flexDirection: 'row', gap: 10, alignItems: 'flex-start',
        }}>
          <Icon name="shield" size={20} color={idnTokens.blue} />
          <Text style={{ flex: 1, fontSize: 12, color: t.ink2, lineHeight: 18 }}>
            Vous pouvez révoquer cet accès à tout moment depuis <Text style={{ fontWeight: '700' }}>Profil → Consentements</Text>.
          </Text>
        </View>
        {error ? (
          <View style={{ marginTop: 12, backgroundColor: t.dark ? '#3A1212' : '#FBE5E5', borderRadius: 10, padding: 12 }}>
            <Text style={{ color: '#B83A3A', fontSize: 12, lineHeight: 17 }}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>
      <View style={{
        paddingHorizontal: 22, paddingTop: 14,
        paddingBottom: Math.max(insets.bottom, 22),
        gap: 8,
        borderTopWidth: 1, borderTopColor: t.borderSoft,
        backgroundColor: t.surface,
      }}>
        <IdnButton t={t} variant="primary" size="lg" full onPress={authorize} disabled={submitting || !clientId}>
          {submitting ? 'Envoi…' : 'Autoriser'}
        </IdnButton>
        <IdnButton t={t} variant="quiet" size="md" full onPress={deny} disabled={submitting}>Refuser</IdnButton>
      </View>
    </View>
  );
}
