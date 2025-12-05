# Validation des Étapes 1 & 2

Ce document récapitule comment valider que les étapes 1 et 2 sont complètes, tant localement qu'en CI.

## 🎯 Étape 1 – Socle Monorepo & Outillage

### Objectif
Le backend doit être capable de compiler et tester de manière reproductible, avec une structure claire et des règles de qualité minimales.

### Critères de Validation

#### ✅ Compiler et tester de manière reproductible

**Localement :**
```bash
# Installer toutes les dépendances avec une seule commande
pnpm install

# Compiler l'ensemble API + worker + packages
pnpm build

# Exécuter les tests unitaires de tous les packages
pnpm test
```

**En CI :** Les jobs `install-and-cache`, `build`, et `test-unit` doivent passer.

#### ✅ Structurer le code selon l'architecture cible

**Vérification de structure :**
```
RunFlow/
├── apps/
│   ├── api/          # Serveur HTTP (Fastify)
│   └── worker/       # Jobs asynchrones (BullMQ)
├── packages/
│   ├── domain/       # Métier pur, sans I/O
│   ├── db/           # Accès Supabase
│   ├── schemas/      # Zod et types partagés
│   ├── config/       # Gestion des env
│   └── telemetry/    # Logs/metrics
└── infra/
    ├── docker/       # Docker Compose
    └── supabase/     # Migrations et tests
```

**Localement :**
```bash
# Vérifier que tous les répertoires existent
ls apps/api apps/worker
ls packages/domain packages/db packages/schemas packages/config packages/telemetry
```

**En CI :** Le job `validate-step1` vérifie la structure automatiquement.

#### ✅ Imports inter-packages corrects

**Vérification :**
- Les imports utilisent les paths TypeScript (via `tsconfig.base.json`)
- Pas de chemins relatifs cassés type `../../../../../../`
- Les packages se référencent via leur nom workspace (`@runflow/*`)

**Localement :**
```bash
# Le build ne doit avoir aucune erreur de résolution de module
pnpm build
```

#### ✅ Garantir des règles de qualité minimales

**Localement :**
```bash
# Lancer l'analyse statique
pnpm lint

# Vérifier le formatage
pnpm format --check

# Ou directement
make ci
```

**En CI :** Le job `lint` vérifie ESLint + Prettier.

### ✅ Validation Étape 1 Complète

**Commande unique :**
```bash
make ci
```

Ou manuellement :
```bash
pnpm install && pnpm lint && pnpm build && pnpm test:unit
```

**Résultat attendu :** Tous les packages compilent, tous les tests passent, aucune erreur de lint.

---

## 🎯 Étape 2 – Supabase & Infrastructure de Données

### Objectif
Le backend doit pouvoir provisionner une base Supabase from scratch, se connecter de façon typée, et vérifier l'état de la DB.

### Critères de Validation

#### ✅ Provisionner une base de données Supabase "from scratch"

**Localement :**
```bash
# 1. Démarrer la stack Supabase locale
cd infra/docker
docker compose -f docker-compose.dev.yml up -d
cd ../..

# 2. Créer une base vide mais conforme
pnpm db:migrate

# 3. Vérifier les tables
psql "$DATABASE_URL" -c "\dt public.*"
```

**Résultat attendu :** 8 tables créées (profiles, training_plans, plan_weeks, plan_sessions, workouts, clubs, club_members, workout_feedback).

**Pour recréer un environnement local propre :**
```bash
pnpm db:reset
```

**En CI :** Le job `test-database` provisionne PostgreSQL et applique les migrations automatiquement.

#### ✅ Connaître ses environnements

**Environnements distincts :**
- **Local dev** : Docker Compose (`localhost:54322`)
- **Cloud Supabase** : Staging ou prod (URL cloud)

**Configuration :**
- `.env.local` : Local dev
- `.env.cloud` : Cloud (non commité)
- `packages/config` : Chargement validé par Zod

**Vérification :**
```bash
# Vérifier que packages/config existe et expose la config
ls packages/config/src/index.ts
```

#### ✅ Se connecter à Supabase de façon typée et centralisée

**Vérification :**
```bash
# Le package db doit exporter les clients Supabase
ls packages/db/src/index.ts
```

**Clients attendus :**
- Client anon (usage futur côté "user-space")
- Client service role (usage API/worker, non exposé au client)

**En CI :** La connexion est testée implicitement lors des tests de migration.

#### ✅ Vérifier l'état de la DB

**Localement :**
```bash
# Exécuter les tests pgTAP
pnpm db:test
```

**Tests exécutés :**
- `001_extensions.sql` : Vérifier que les extensions (uuid-ossp, pgcrypto, pgtap) sont présentes
- `002_schema_structure.sql` : Valider la structure (tables, PK, FK, indexes, contraintes)
- `003_rls_policies.sql` : Vérifier que RLS est activé et que les politiques existent
- `004_functions.sql` : Vérifier les fonctions custom (set_updated_at)

**Résultat attendu :** 57 tests pgTAP passent.

**En CI :** Le job `test-database` exécute tous les tests pgTAP.

### ✅ Validation Étape 2 Complète

**Commande unique :**
```bash
# Démarrer la stack locale
cd infra/docker && docker compose -f docker-compose.dev.yml up -d && cd ../..

# Appliquer migrations
pnpm db:migrate

# Lancer tests DB
pnpm db:test
```

**En CI :** Le job `validate-step2` vérifie automatiquement tous les critères.

---

## 📊 Récapitulatif Global

### Validation Locale Complète (Étapes 1 & 2)

```bash
# 1. Installer dépendances
pnpm install

# 2. Démarrer l'infrastructure
cd infra/docker && docker compose -f docker-compose.dev.yml up -d && cd ../..

# 3. Appliquer migrations
pnpm db:migrate

# 4. Lancer le pipeline CI complet
make ci
```

**Résultat attendu :**
- ✅ Lint passe
- ✅ Build réussit (tous les packages)
- ✅ Tests unitaires passent
- ✅ Tests DB passent (57 tests pgTAP)

### Validation CI (GitHub Actions)

**Déclenchement :** Push ou PR vers `main` ou `develop`

**Jobs exécutés :**
1. ✅ `install-and-cache` - Installation et cache des dépendances
2. ✅ `lint` - ESLint + Prettier
3. ✅ `build` - Compilation TypeScript
4. ✅ `test-unit` - Tests Vitest + Coverage
5. ✅ `test-database` - Provisionnement PostgreSQL + Tests pgTAP
6. ✅ `validate-step1` - Vérification étape 1
7. ✅ `validate-step2` - Vérification étape 2
8. ✅ `ci-summary` - Résumé

**Visualisation :** Badge CI dans le README montre le statut.

### Commandes Récapitulatives

| Commande | Description |
|----------|-------------|
| `pnpm install` | Installer toutes les dépendances |
| `pnpm build` | Compiler API + worker + packages |
| `pnpm lint` | Vérifier qualité du code |
| `pnpm test` | Lancer tests unitaires |
| `pnpm test:all` | Tests unitaires + DB |
| `pnpm db:migrate` | Appliquer migrations |
| `pnpm db:reset` | Reset DB et ré-appliquer migrations |
| `pnpm db:test` | Tests pgTAP uniquement |
| `make ci` | Pipeline CI complet en local |
| `make help` | Voir toutes les commandes Make |

---

## ✅ Checklist de Validation

### Étape 1 - Socle Monorepo
- [ ] `pnpm install` fonctionne sans erreur
- [ ] `pnpm build` compile tous les packages
- [ ] `pnpm test` lance les tests unitaires
- [ ] Structure monorepo respectée (apps/ et packages/)
- [ ] `pnpm lint` ne retourne aucune erreur
- [ ] `pnpm format --check` passe

### Étape 2 - Supabase Infrastructure
- [ ] Stack Docker démarre (`docker compose up`)
- [ ] `pnpm db:migrate` applique les migrations
- [ ] `pnpm db:reset` fonctionne
- [ ] `pnpm db:test` passe tous les tests pgTAP
- [ ] Les 8 tables sont créées
- [ ] RLS est activé sur toutes les tables
- [ ] Les extensions requises sont installées

### CI/CD
- [ ] GitHub Actions configuré (`.github/workflows/ci.yml`)
- [ ] Badge CI ajouté au README
- [ ] Tous les jobs CI passent au vert
- [ ] Documentation CI complète

---

## 🚀 Prochaines Étapes

Une fois les étapes 1 et 2 validées :

1. **Étape 3** : Implémenter les endpoints API
2. **Étape 4** : Mettre en place les workers BullMQ
3. **Étape 5** : Ajouter l'authentification Supabase
4. **Étape 6** : Déploiement en production

Le monorepo est maintenant **sain, compilable, testable** et prêt pour la suite du développement ! 🎉
