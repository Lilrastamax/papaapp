// ========== UTILITAIRES ==========
export const $ = (s, c = document) => c.querySelector(s);
export const $$ = (s, c = document) => [...c.querySelectorAll(s)];
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const fmt = (d, opts) => d ? new Date(d).toLocaleDateString('fr-FR', opts) : '';
export const fmtLong = d => fmt(d, { day: 'numeric', month: 'long', year: 'numeric' });
export const fmtShort = d => fmt(d, { day: 'numeric', month: 'short' });
export const fmtToday = () => new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
export const daysUntil = d => { if (!d) return 9999; const a = new Date(d), b = new Date(); a.setHours(0, 0, 0, 0); b.setHours(0, 0, 0, 0); return Math.ceil((a - b) / 86400000); };
export const childAge = bd => Math.floor((Date.now() - new Date(bd)) / 31557600000);
export const dateISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const todayISO = () => dateISO(new Date());
export async function sha256(m) { const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(m)); return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join(''); }
export const apptIcon = (t) => { const x = (t || '').toLowerCase(); if (x.includes('pédiatre') || x.includes('medecin') || x.includes('dentiste') || x.includes('ophtalmo') || x.includes('orl') || x.includes('kiné') || x.includes('vaccin') || x.includes('orthophoniste')) return '🩺'; if (x.includes('voiture') || x.includes('révision') || x.includes('contrôle')) return '🚗'; if (x.includes('coiffeur') || x.includes('barbier')) return '💇'; if (x.includes('admin') || x.includes('banque') || x.includes('impôt')) return '📋'; if (x.includes('travail') || x.includes('boulot')) return '💼'; return '📅'; };
export const isMedical = (t) => { const x = (t || '').toLowerCase(); return x.includes('pédiatre') || x.includes('medecin') || x.includes('dentiste') || x.includes('ophtalmo') || x.includes('orl') || x.includes('kiné') || x.includes('vaccin') || x.includes('orthophoniste') || x.includes('hôpital') || x.includes('infirmier'); };
export const activiteIcon = (t) => { const x = (t || '').toLowerCase(); if (x.includes('sport') || x.includes('foot') || x.includes('muscu')) return '⚽'; if (x.includes('musique') || x.includes('chant') || x.includes('piano')) return '🎵'; if (x.includes('danse')) return '💃'; if (x.includes('piscine') || x.includes('natation')) return '🏊'; if (x.includes('arts') || x.includes('dessin') || x.includes('peinture')) return '🎨'; if (x.includes('loisir') || x.includes('jeu')) return '🎮'; return '🎯'; };
