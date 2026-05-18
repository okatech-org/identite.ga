import React from 'react';
import { Icon, type IconName } from '@/design/icons';

export function CardArtIcon({ name, color = '#fff', size = 18 }: { name: IconName; color?: string; size?: number }) {
  return <Icon name={name} size={size} color={color} />;
}
