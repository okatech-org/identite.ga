import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useConvexAuth, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { IdnFlagBars } from '@/design/mark';
import { Icon, type IconName } from '@/design/icons';
import { api } from '@/lib/api';
import { SectionH } from '@/components/chrome/section-header';
import { HOME_MODULES } from '@/data/dashboard';
import { AUDIT_ACTION_LABELS, formatRelativeDate } from '@/lib/activity-format';

const LOA_LABEL = ['', '· Faible', '· Substantiel', '· Élevé'];

type QuickAction = { l: string; icon: IconName | 'sign' | 'help'; route?: string };
const QUICK: QuickAction[] = [
  { l: 'Scanner',  icon: 'qr',   route: '/scanner' },
  { l: 'Partager', icon: 'link', route: '/id-card' },
  { l: 'Signer',   icon: 'sign', route: '/id-card' },
  { l: 'Aide',     icon: 'help' },
];

function QuickIcon({ icon, color }: { icon: QuickAction['icon']; color: string }) {
  if (icon === 'sign') return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21c5-1 8-3 13-8l3-3-4-4-3 3c-5 5-7 8-8 13z" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M14 6l4 4" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
  if (icon === 'help') return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.6} />
      <Path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5M12 17h.01" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
  return <Icon name={icon} size={20} color={color} />;
}

export default function Home() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.profile.getCurrentUser, isAuthenticated ? {} : 'skip');
  const unread = useQuery(api.notifications.unreadCount, isAuthenticated ? {} : 'skip');
  const activity = useQuery(api.activity.listMine, isAuthenticated ? { limit: 5 } : 'skip');

  if (isAuthenticated && user === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
        <View style={{ padding: 22 }}>
          <View style={{ height: 40, borderRadius: 14, backgroundColor: t.surface2 }} />
          <View style={{ height: 160, borderRadius: 18, backgroundColor: t.surface2, marginTop: 16 }} />
        </View>
      </View>
    );
  }

  const profile = user?.profile;
  const prenom = profile?.pivot?.firstName ?? '—';
  const nom = profile?.pivot?.lastName ?? '';
  const initials = `${prenom[0] ?? '?'}${nom[0] ?? ''}`.toUpperCase();
  const loa = (profile?.loa ?? 1) as 1 | 2 | 3;
  const profileType = profile?.profileType ?? '';
  const profileLabel =
    profileType === 'citizen' ? 'Citoyen Gabonais'
    : profileType === 'resident' ? 'Résident étranger'
    : profileType === 'visitor' ? 'Visiteur'
    : profileType === 'developer' ? 'Développeur'
    : '—';
  const idnId = profile?.idnId ?? '—';
  const unreadCount = unread ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 22, paddingTop: 6, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <LinearGradient colors={['#0E7C3A', '#0A5C2C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 40, height: 40, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{initials}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: t.muted, letterSpacing: 0.6 }}>Bonjour,</Text>
          <Text style={{ fontSize: 15, color: t.ink, fontWeight: '600' }}>{prenom} {nom}</Text>
        </View>
        <Pressable onPress={() => router.push('/notifications')} style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="bell" size={20} color={t.ink2} />
          {unreadCount > 0 ? (
            <View style={{ position: 'absolute', top: 7, right: 7, minWidth: 14, height: 14, borderRadius: 9999, backgroundColor: '#B83A3A', paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 4, paddingBottom: 18 }} showsVerticalScrollIndicator={false}>
        {/* ID card */}
        <LinearGradient colors={['#0E7C3A', '#0A5C2C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 18, padding: 20, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <View style={{ position: 'absolute', right: 12, bottom: 12 }}><IdnFlagBars width={36} height={3} /></View>
          <Text style={{ fontSize: 10, letterSpacing: 1.4, fontWeight: '600', color: 'rgba(255,255,255,0.78)' }}>IDENTITÉ NUMÉRIQUE</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 4 }}>{prenom} {nom}</Text>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.82)', marginTop: 2 }}>{profileLabel}</Text>
          <View style={{ marginTop: 14, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 }}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: '#fff', letterSpacing: 0.4 }}>NIVEAU {loa} {LOA_LABEL[loa]}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
            <Text style={{ fontFamily: idnTokens.mono, fontSize: 11, color: 'rgba(255,255,255,0.86)', letterSpacing: 1 }}>{idnId}</Text>
            <Pressable onPress={() => router.push('/id-card')} style={{ marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Icon name="qr" size={14} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '500' }}>Montrer le QR</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {/* Quick actions */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
          {QUICK.map((q, i) => (
            <Pressable
              key={i}
              onPress={() => q.route && router.push(q.route as any)}
              style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 4, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 14, alignItems: 'center', gap: 6 }}
            >
              <QuickIcon icon={q.icon} color={idnTokens.green} />
              <Text style={{ fontSize: 11, fontWeight: '500', color: t.ink }}>{q.l}</Text>
            </Pressable>
          ))}
        </View>

        {/* LoA upsell */}
        {loa < 3 ? (
          <Pressable
            onPress={() => router.push('/kyc/intro')}
            style={{
              marginTop: 18,
              backgroundColor: t.dark ? '#1F2316' : idnTokens.yellowSoft,
              borderWidth: 1,
              borderColor: t.dark ? '#3A3F1F' : '#E8D67E',
              borderRadius: 14,
              padding: 14,
              flexDirection: 'row',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: idnTokens.yellow, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="shield" size={20} color="#5a4a0a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: t.ink }}>Passez au Niveau {loa + 1}</Text>
              <Text style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>5 min · débloquez plus de services</Text>
            </View>
            <Icon name="arrow" size={16} color={t.ink2} />
          </Pressable>
        ) : null}

        {/* Modules — grille 2x2 (sans en-tête : ce sont les fonctionnalités
            de l'app, pas des "services" administratifs externes). */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
          {HOME_MODULES.map(m => (
            <Pressable
              key={m.id}
              onPress={() => router.push(m.route as any)}
              style={{
                width: '48.5%',
                backgroundColor: t.surface,
                borderWidth: 1,
                borderColor: t.border,
                borderRadius: 14,
                padding: 14,
                gap: 10,
              }}
            >
              <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: t.dark ? m.bgDark : m.bgLight, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={m.icon} size={22} color={m.color} />
              </View>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: t.ink }}>{m.label}</Text>
                <Text style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{m.sub}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Activité récente — branchée sur api.activity.listMine. */}
        <SectionH t={t} title="Activité récente" right="Tout voir" onRightPress={() => router.push('/activity')} />
        {activity === undefined ? (
          <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, padding: 18 }}>
            <View style={{ height: 14, backgroundColor: t.surface2, borderRadius: 4, marginBottom: 10 }} />
            <View style={{ height: 14, backgroundColor: t.surface2, borderRadius: 4, width: '70%' }} />
          </View>
        ) : activity.length === 0 ? (
          <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, padding: 18, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: t.muted }}>Aucune activité récente.</Text>
          </View>
        ) : (
          <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, paddingHorizontal: 14 }}>
            {activity.map((a, i) => {
              const label = AUDIT_ACTION_LABELS[a.action] ?? a.action;
              return (
                <View
                  key={a._id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 12,
                    borderBottomWidth: i === activity.length - 1 ? 0 : 1,
                    borderBottomColor: t.borderSoft,
                  }}
                >
                  <View style={{ width: 28, height: 28, borderRadius: 9999, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="shield" size={14} color={idnTokens.green} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontSize: 12, color: t.ink, fontWeight: '600' }}>{label}</Text>
                    <Text style={{ fontSize: 10, color: t.muted, fontFamily: idnTokens.mono, marginTop: 2 }}>{formatRelativeDate(a.createdAt)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
