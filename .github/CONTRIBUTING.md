# Contributing to RunFlow

Merci de contribuer à RunFlow ! Ce guide vous aidera à comprendre notre workflow de développement et nos standards de qualité.

## Workflow de Développement

### 1. Configuration de l'Environnement Local

```bash
# Cloner le repo
git clone <repo-url>
cd RunFlow

# Installer les dépendances
pnpm install

# Démarrer la stack Supabase locale
cd infra/docker
docker compose -f docker-compose.dev.yml up -d
cd ../..

# Appliquer les migrations
pnpm db:migrate

# Vérifier que tout fonctionne
pnpm build
pnpm test:all
```

### 2. Avant de Commiter

Avant chaque commit, assurez-vous que votre code passe toutes les vérifications :

```bash
# Formatter le code
pnpm format

# Vérifier le linting
pnpm lint

# Builder les packages
pnpm build

# Lancer tous les tests
pnpm test:all
```

Ou simplement :

```bash
# Pipeline CI complet en local
make ci
```

### 3. Standards de Qualité

#### Code Style
- Utiliser **Prettier** pour le formatage (automatique via `pnpm format`)
- Suivre les règles **ESLint** configurées
- Pas de `console.log` dans le code de production (utiliser `packages/telemetry`)

#### TypeScript
- Mode strict activé
- Pas de `any` sauf justification explicite
- Typer toutes les fonctions publiques
- Utiliser Zod pour la validation runtime

#### Tests
- Tests unitaires pour la logique métier (`packages/domain`)
- Tests pgTAP pour le schéma de base de données
- Coverage minimum : à définir par l'équipe

#### Architecture
- Respecter la séparation des packages :
  - `packages/domain` : logique métier pure (aucun I/O)
  - `packages/db` : accès base de données uniquement
  - `packages/schemas` : types et validations Zod
  - `packages/config` : configuration d'environnement
  - `apps/api` : endpoints HTTP
  - `apps/worker` : jobs asynchrones

### 4. Pull Requests

#### Avant de créer une PR :
1. ✅ Créer une branche depuis `develop` : `git checkout -b feature/ma-feature`
2. ✅ Faire vos modifications
3. ✅ Vérifier que le CI passe localement : `make ci`
4. ✅ Commiter avec des messages clairs
5. ✅ Pusher et créer la PR vers `develop`

#### Structure du message de commit :
```
type(scope): description courte

Description plus détaillée si nécessaire

Refs: #123
```

Types : `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

#### Checklist PR :
- [ ] Le code compile sans erreurs
- [ ] Les tests passent
- [ ] Le linting passe
- [ ] Le code est formaté
- [ ] La documentation est à jour
- [ ] Pas de secrets/credentials commitées
- [ ] Les migrations DB sont idempotentes (si applicable)

### 5. CI/CD Pipeline

Notre CI GitHub Actions vérifie automatiquement :

#### Étape 1 - Socle Monorepo
- ✅ Installation des dépendances
- ✅ Linting (ESLint + Prettier)
- ✅ Build (TypeScript compilation)
- ✅ Tests unitaires (Vitest)

#### Étape 2 - Infrastructure Supabase
- ✅ Provisionnement PostgreSQL
- ✅ Migrations de schéma
- ✅ Tests pgTAP (extensions, schéma, RLS, fonctions)
- ✅ Vérification de la connectivité DB

**La PR ne peut être mergée que si tous les checks passent.**

### 6. Base de Données

#### Créer une nouvelle migration :

```bash
# Créer le fichier de migration
touch infra/supabase/migrations/$(date +%Y%m%d%H%M%S)_description.sql

# Éditer le fichier avec votre schéma SQL

# Tester localement
pnpm db:migrate

# Créer les tests pgTAP correspondants
touch infra/supabase/tests/00X_description.sql

# Lancer les tests
pnpm db:test
```

#### Règles pour les migrations :
- ✅ Idempotentes (utiliser `IF NOT EXISTS`, `IF EXISTS`)
- ✅ Réversibles si possible (ou documenter la procédure de rollback)
- ✅ Testées avec pgTAP
- ✅ Ne jamais modifier une migration déjà mergée (créer une nouvelle)

#### Tests pgTAP requis :
- Vérifier l'existence des tables
- Vérifier les clés primaires/étrangères
- Vérifier les index
- Vérifier les contraintes check
- Vérifier que RLS est activé
- Vérifier que les politiques RLS existent

### 7. Troubleshooting

#### Le build échoue :
```bash
# Nettoyer et rebuilder
pnpm clean
pnpm install
pnpm build
```

#### Les tests DB échouent :
```bash
# Reset complet de la base
pnpm db:reset

# Réappliquer les migrations
pnpm db:migrate

# Relancer les tests
pnpm db:test
```

#### Problème SSL avec Supabase local :
```bash
# Vérifier que PGSSLMODE est désactivé
export PGSSLMODE=disable

# Ou utiliser la connection string avec sslmode
DATABASE_URL="postgres://postgres:postgres@localhost:54322/postgres?sslmode=disable"
```

### 8. Ressources

- [Architecture Documentation](../README.md)
- [Supabase Setup](../infra/supabase/README.md)
- [pgTAP Documentation](https://pgtap.org/documentation.html)
- [Turborepo Docs](https://turbo.build/repo/docs)
- [Vitest Docs](https://vitest.dev/)

### 9. Aide

Si vous rencontrez un problème :
1. Vérifier les [Issues existantes](../../issues)
2. Consulter la documentation
3. Demander dans le canal Slack de l'équipe
4. Créer une nouvelle issue si nécessaire

---

Merci d'aider à construire RunFlow ! 🏃‍♂️💨
