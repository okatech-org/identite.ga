export type Session = {
  dev: string;
  loc: string;
  ip: string;
  ts: string;
  current?: boolean;
  warn?: boolean;
};

export const SESSIONS: Session[] = [
  { dev: 'iPhone 14 Pro · Safari', loc: 'Libreville, GA',  ip: '41.222.18.92', ts: 'Active maintenant', current: true },
  { dev: 'MacBook Pro · Chrome',   loc: 'Libreville, GA',  ip: '41.222.18.92', ts: 'Il y a 2 h' },
  { dev: 'Firefox · Linux',        loc: 'Paris, FR',       ip: '81.92.144.7',  ts: 'Hier 18:42', warn: true },
  { dev: 'Android · Chrome',       loc: 'Port-Gentil, GA', ip: '197.232.40.4', ts: 'Il y a 6 j' },
];
