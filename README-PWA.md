## PWA Support

Fonctionnalités ajoutées:

- `manifest.webmanifest` avec icônes multiples (192/512 + maskable)
- Enregistrement d'un Service Worker (`public/sw.js`)
- Stratégie cache: cache-first fallback network avec mise en cache dynamique
- Invalidation simple par version (`synapflow-cache-v1`)

### Mise à jour du Service Worker

Incrémenter `CACHE_NAME` dans `public/sw.js` pour forcer l'invalidation lors de changements significatifs.

### Test rapide

1. Build: `npm run build`
2. Servir le dossier dist via `npx serve dist` ou équivalent
3. Ouvrir DevTools > Application > Manifeste (vérifier installable)
4. Passer en mode offline => recharger: l'app doit rester fonctionnelle (pages déjà visitées)

### Améliorations futures

- Pré-cache ciblé des chunks critiques (analyser `dist`)
- Stratégie Stale-While-Revalidate pour API / données dynamiques
- Badge de mise à jour quand un nouveau SW attend l'activation
- Stockage local plan + score synchronisé (déjà localStorage, mais versionner)

---

Ajouté automatiquement par l'assistant.
