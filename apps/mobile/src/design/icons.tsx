import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  // Base set (déjà utilisé)
  | 'user' | 'userPlus' | 'login' | 'mail' | 'lock' | 'shield' | 'check'
  | 'arrow' | 'arrowL' | 'doc' | 'camera' | 'qr' | 'bell' | 'link'
  | 'search' | 'plus' | 'more' | 'copy' | 'eye' | 'home' | 'grid' | 'activity'
  | 'torch' | 'gridSm' | 'flip' | 'face' | 'pin'
  // Nouveaux pour modules iCarte / iBoîte / iDocument / Notifications
  | 'wallet' | 'cc' | 'car' | 'bus' | 'heart' | 'briefcase' | 'globe' | 'vote' | 'gift' | 'users' | 'flag' | 'palette'
  | 'edit' | 'trash' | 'grip' | 'eyeOff' | 'rotate' | 'share' | 'download'
  | 'mail2' | 'package' | 'chat' | 'pinLoc' | 'chevDn' | 'star' | 'starO'
  | 'inbox' | 'send' | 'clock' | 'reply' | 'forward' | 'printer' | 'archive' | 'truck' | 'paper' | 'building' | 'alert'
  | 'baby' | 'cap' | 'file' | 'folderO' | 'upload' | 'sparkles' | 'scale' | 'checkCir' | 'seal'
  | 'close' | 'minus' | 'calendar';

type Props = { name: IconName; size?: number; color?: string };

export function Icon({ name, size = 20, color = '#000' }: Props) {
  const sw = 1.6;
  switch (name) {
    case 'user':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={sw} />
          <Path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'userPlus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={10} cy={8} r={4} stroke={color} strokeWidth={sw} />
          <Path d="M2 21c1.4-3.7 4.2-5.6 7.5-5.6" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M18 13v6M15 16h6" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'login':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M10 17l5-5-5-5M3 12h12" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'mail':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={5} width={18} height={14} rx={2} stroke={color} strokeWidth={sw} />
          <Path d="M3 7l9 6 9-6" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'lock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={4} y={11} width={16} height={10} rx={2} stroke={color} strokeWidth={sw} />
          <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'shield':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 3l8 3v5c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-3z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
        </Svg>
      );
    case 'check':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M5 12l5 5 9-11" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'arrow':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'arrowL':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M19 12H5M11 6l-6 6 6 6" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'doc':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M14 3v6h6M8 13h8M8 17h6" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'camera':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={6} width={18} height={14} rx={2} stroke={color} strokeWidth={sw} />
          <Circle cx={12} cy={13} r={4} stroke={color} strokeWidth={sw} />
          <Path d="M9 6l1.5-2h3L15 6" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'qr':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={3} width={7} height={7} stroke={color} strokeWidth={sw} strokeLinejoin="round" />
          <Rect x={14} y={3} width={7} height={7} stroke={color} strokeWidth={sw} strokeLinejoin="round" />
          <Rect x={3} y={14} width={7} height={7} stroke={color} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M14 14h3v3M21 14v7M14 21h3" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M6 9a6 6 0 1 1 12 0v4l2 3H4l2-3V9zM10 19a2 2 0 0 0 4 0" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'link':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M10 14l4-4M9 7h-2a4 4 0 0 0 0 8h2M15 17h2a4 4 0 0 0 0-8h-2" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'search':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={1.7} />
          <Path d="M21 21l-4.5-4.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'more':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <Circle cx={6} cy={12} r={1.6} />
          <Circle cx={12} cy={12} r={1.6} />
          <Circle cx={18} cy={12} r={1.6} />
        </Svg>
      );
    case 'copy':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={9} y={9} width={11} height={11} rx={2} stroke={color} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M5 15V5a2 2 0 0 1 2-2h10" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'eye':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={sw} />
        </Svg>
      );
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'grid':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={3} width={7} height={7} rx={1.5} stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
          <Rect x={14} y={3} width={7} height={7} rx={1.5} stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
          <Rect x={3} y={14} width={7} height={7} rx={1.5} stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
          <Rect x={14} y={14} width={7} height={7} rx={1.5} stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
        </Svg>
      );
    case 'activity':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 13h4l2-5 3 11 3-7 2 4h4" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'torch':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M9 2h6l-1 4 3 4-7 12-1-9H6l3-4z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
        </Svg>
      );
    case 'gridSm':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 9h18M3 15h18M9 3v18M15 3v18" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'flip':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M21 8a9 9 0 0 0-15-3M3 16a9 9 0 0 0 15 3" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M21 3v5h-5M3 21v-5h5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'face':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M5 11c0-3 3-7 7-7s7 4 7 7" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
          <Path d="M8 13c0-2.2 1.8-4 4-4s4 1.8 4 4v2" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
          <Path d="M12 15v6" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
          <Path d="M5 17c0 3.3 3.1 4 7 4M19 14v3" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
        </Svg>
      );
    case 'pin':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={6} cy={12} r={2} fill={color} />
          <Circle cx={12} cy={12} r={2} fill={color} />
          <Circle cx={18} cy={12} r={2} fill={color} />
        </Svg>
      );

    // ─── Cartes / iCarte ──────────────────────────────
    case 'wallet':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 7a2 2 0 0 1 2-2h14l2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M16 14h4v-4h-4a2 2 0 0 0 0 4z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'cc':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={6} width={18} height={13} rx={2} stroke={color} strokeWidth={sw} />
          <Path d="M3 10h18M7 15h3" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'car':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M5 16V11l2-5h10l2 5v5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M5 16h14v3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={8} cy={14} r={1} stroke={color} strokeWidth={sw} />
          <Circle cx={16} cy={14} r={1} stroke={color} strokeWidth={sw} />
        </Svg>
      );
    case 'bus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M5 17h14V7a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M5 11h14M8 17v2M16 17v2" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Circle cx={8.5} cy={14.5} r={1} stroke={color} strokeWidth={sw} />
          <Circle cx={15.5} cy={14.5} r={1} stroke={color} strokeWidth={sw} />
        </Svg>
      );
    case 'heart':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'briefcase':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={7} width={18} height={13} rx={2} stroke={color} strokeWidth={sw} />
          <Path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'globe':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={sw} />
          <Path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'vote':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M5 21h14a2 2 0 0 0 2-2v-9l-9-7-9 7v9a2 2 0 0 0 2 2z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'gift':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 12v8h16v-8M2 8h20v4H2zM12 8v12M8 8a2 2 0 1 1 0-4c2 0 4 4 4 4M16 8a2 2 0 1 0 0-4c-2 0-4 4-4 4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'users':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={9} cy={8} r={3.5} stroke={color} strokeWidth={sw} />
          <Path d="M2 21c1-3.5 3.5-5.5 7-5.5s6 2 7 5.5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Circle cx={17} cy={7} r={2.5} stroke={color} strokeWidth={sw} />
          <Path d="M16 13c2.5 0 5 1.6 6 4" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'flag':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 3v18M4 4h12l-2 4 2 4H4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'palette':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2 0-1.5-1-2 0-3s5 0 5-4a9 9 0 0 0-7-9z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={7} cy={10} r={1.2} fill={color} />
          <Circle cx={9.5} cy={6.5} r={1.2} fill={color} />
          <Circle cx={14.5} cy={6.5} r={1.2} fill={color} />
          <Circle cx={17} cy={10} r={1.2} fill={color} />
        </Svg>
      );
    case 'edit':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 21h4l11-11-4-4L3 17z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M14 6l4 4" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
      );
    case 'trash':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'grip':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <Circle cx={9} cy={6} r={1.3} />
          <Circle cx={15} cy={6} r={1.3} />
          <Circle cx={9} cy={12} r={1.3} />
          <Circle cx={15} cy={12} r={1.3} />
          <Circle cx={9} cy={18} r={1.3} />
          <Circle cx={15} cy={18} r={1.3} />
        </Svg>
      );
    case 'eyeOff':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 3l18 18M10.5 6.4A10.5 10.5 0 0 1 12 6c6.5 0 10 6 10 6s-1 1.7-3 3.4M6.7 7.9C3.7 9.6 2 12 2 12s3.5 6 10 6c1.6 0 3-.4 4.3-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'rotate':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'share':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={6} cy={12} r={2.5} stroke={color} strokeWidth={sw} />
          <Circle cx={18} cy={6} r={2.5} stroke={color} strokeWidth={sw} />
          <Circle cx={18} cy={18} r={2.5} stroke={color} strokeWidth={sw} />
          <Path d="M8.2 11l7.6-3.8M8.2 13l7.6 3.8" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'download':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 4v12M7 11l5 5 5-5M5 21h14" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    // ─── Boîte / iBoîte ───────────────────────────────
    case 'mail2':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={5} width={18} height={14} rx={2} stroke={color} strokeWidth={1.7} />
          <Path d="M3 7l9 6 9-6" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
      );
    case 'package':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M21 8l-9-5-9 5v8l9 5 9-5z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M3 8l9 5 9-5M12 13v10" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chat':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M21 12a8 8 0 0 1-12 7l-5 1 1-4a8 8 0 1 1 16-4z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'pinLoc':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 21s-7-6-7-12a7 7 0 1 1 14 0c0 6-7 12-7 12z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={12} cy={9} r={2.5} stroke={color} strokeWidth={1.7} />
        </Svg>
      );
    case 'chevDn':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'star':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <Path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
        </Svg>
      );
    case 'starO':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
        </Svg>
      );
    case 'inbox':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 12l3-8h12l3 8v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M3 12h5l2 3h4l2-3h5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'send':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'clock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.7} />
          <Path d="M12 7v5l3 2" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
      );
    case 'reply':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M9 10L4 15l5 5M4 15h11a5 5 0 0 1 5 5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'forward':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M15 10l5 5-5 5M20 15H9a5 5 0 0 1-5-5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'printer':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M6 9V3h12v6M6 17H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
          <Rect x={6} y={13} width={12} height={8} stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
        </Svg>
      );
    case 'archive':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={3} width={18} height={5} rx={1} stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
          <Path d="M5 8v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'truck':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M1 17V6a1 1 0 0 1 1-1h13v12M15 8h4l3 5v4h-7" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={6} cy={18} r={2} stroke={color} strokeWidth={1.7} />
          <Circle cx={17} cy={18} r={2} stroke={color} strokeWidth={1.7} />
        </Svg>
      );
    case 'paper':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M21 11l-9 9a5 5 0 0 1-7-7l9-9a3 3 0 0 1 4 4l-9 9a1 1 0 0 1-2-2l8-8" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'building':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={4} y={3} width={16} height={18} rx={1} stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
          <Path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
      );
    case 'alert':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
          <Path d="M12 8v5M12 16v.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );

    // ─── Documents / iDocument ─────────────────────────
    case 'baby':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={9} r={4} stroke={color} strokeWidth={1.7} />
          <Path d="M9 13l-3 4 6 4 6-4-3-4" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M10 8h.5M13.5 8h.5M10 11c1 .5 3 .5 4 0" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
      );
    case 'cap':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 9l9-4 9 4-9 4-9-4zM7 11v5l5 2 5-2v-5M21 9v6" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'file':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M14 3v6h6" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
        </Svg>
      );
    case 'folderO':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 8a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'upload':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 16V4M7 9l5-5 5 5M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'sparkles':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 3l1.5 5 5 1.5-5 1.5L12 16l-1.5-5-5-1.5 5-1.5z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M19 14v3M17.5 15.5h3M5 4v2M4 5h2" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
      );
    case 'scale':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 3v18M5 9l-3 6h6zM19 9l-3 6h6zM5 9l7-3 7 3M5 21h14" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'checkCir':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
          <Path d="M8 12l3 3 5-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'seal':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.4} />
          <Path d="M9 13c0-3 1.5-5 3-5s3 2 3 5" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
          <Path d="M12 8V6M9 16h6" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
        </Svg>
      );

    case 'close':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'minus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M5 12h14" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={5} width={18} height={16} rx={2} stroke={color} strokeWidth={sw} />
          <Path d="M3 10h18M8 3v4M16 3v4" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
  }
}
