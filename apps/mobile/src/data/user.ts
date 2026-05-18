export type DemoUser = {
  prenom: string;
  nom: string;
  profil: string;
  loa: 1 | 2 | 3;
  idnId: string;
  email: string;
  dob: string;
};

export const DEMO_USER: DemoUser = {
  prenom: 'Aïssatou',
  nom: 'Mboumba',
  profil: 'Citoyen Gabonais',
  loa: 3,
  idnId: 'GA-7K3J-9Q2L',
  email: 'aissatou.mboumba@example.ga',
  dob: '14 mars 1992',
};
