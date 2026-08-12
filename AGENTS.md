# PapaApp — Règles de travail

## Le projet
- App web mobile (PWA) pour gérer l'enfant (garde, santé, école, activités, maison).
- `app.js` (toute la logique), `app.css` (styles), `index.html` (structure), `manifest.json`, `sw.js`.
- Données : `localStorage` (offline-first) + synchronisation Supabase (cloud).
- Serveur local : `serve.ps1` → http://localhost:8080, `server.ps1` → http://IP:8080 (iPhone sur le même réseau).

## Règles (à appliquer à CHAQUE modification)

1. **Rafraîchir suffit** : après une modif, un simple refresh de la page doit afficher les changements. Pas besoin de relancer le serveur.
2. **Ne jamais perdre les données** : les données saisies doivent survivre à un refresh. Elles sont dans `localStorage` + Supabase.
3. **Toujours tester après chaque implémentation** : vérifier qu'il n'y a aucune erreur (syntaxe, console navigateur, etc.) avant de considérer une modif comme finie.
4. **Bumper la version** : quand on modifie `app.js` (ou `app.css`), incrémenter `?v=N` dans le `<script>` / `<link>` de `index.html`, sinon le navigateur peut afficher une version en cache.
5. **Ne jamais vider les données** : jamais `localStorage.clear()`, jamais supprimer la base Supabase. Faire une sauvegarde avant une grosse modif.
6. **Un commit git par modif qui marche** : message clair en français, pour pouvoir revenir en arrière.
7. **Pas de secrets dans le code** : jamais la clé `service_role` de Supabase, jamais de vrai mot de passe ou PIN. (La clé `anon` est OK, c'est du public.)
8. **Tout en français** : interface et messages de commit.

## Tester
- Pas de `node` installé : pas de check syntaxe automatique (`node --check`).
- Le test = ouvrir la page, rafraîchir, et vérifier la **console du navigateur** (F12) qu'il n'y a aucune erreur rouge.
