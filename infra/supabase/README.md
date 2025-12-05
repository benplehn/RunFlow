# Supabase Infrastructure

Tout ce qui concerne Supabase (migrations SQL, config CLI, tests pgTAP) vit ici.

## Contenu
- `config.toml` – config Supabase CLI (ports, project ref, redirects).
- `migrations/` – migrations SQL versionnées pour local et cloud.
- `tests/` – tests pgTAP exécutés avec `supabase test`.

## Deux modes d’environnement
- **Local (Docker)** : stack Supabase complète (Postgres, auth, REST, Realtime, Storage, Studio) via `infra/docker/docker-compose.dev.yml`. Ports par défaut : Postgres `54322`, REST `54321`, Studio `54326`.
- **Cloud** : projet Supabase managé. On y pousse les mêmes migrations via le CLI.

## Démarrer en local (recommandé pour coder vite)
1. Préparer `.env.local` avec au minimum :
   - `DATABASE_URL=postgres://postgres:postgres@localhost:54322/postgres` (pas de SSL en local)
   - `SUPABASE_URL=http://localhost:54321`
   - `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` (valeurs de dev).
2. Lancer la stack Supabase locale :
   ```bash
   cd infra/docker
   docker compose -f docker-compose.dev.yml up -d
   ```
3. Appliquer les migrations (schéma + RLS) sur la base locale :
   ```bash
   pnpm db:migrate
   ```
   (SSL désactivé par défaut en local via `PGSSLMODE=disable`)
4. Lancer les tests pgTAP (vérifie extensions de base) :
   ```bash
   supabase test db --db-url "$DATABASE_URL" --workdir infra/supabase
   ```
5. Explorer :
   - Studio : http://localhost:54326
   - REST/PostgREST : `curl -H "apikey: $SUPABASE_ANON_KEY" http://localhost:54321/rest/v1/training_plans`
   - psql : `psql "$DATABASE_URL"` puis `\dt`

## Pousser sur le cloud (prod/staging)
1. Installer le CLI et se loguer : `supabase login`.
2. Lier le projet :
   ```bash
   supabase link --project-ref $SUPABASE_PROJECT_REF --workdir infra/supabase
   ```
3. `.env.cloud` (non commité) avec :
   - `DATABASE_URL` : URL Supabase de prod (SSL requis)
   - `PGSSLMODE=require` pour forcer SSL en production
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
4. Appliquer les migrations (idempotent) :
   ```bash
   PGSSLMODE=require pnpm db:migrate
   ```
   (SSL obligatoire en production)

## Commandes utiles (que fait chacune ?)
- `pnpm db:migrate` : pousse les migrations SQL de `infra/supabase/migrations` vers la base ciblée par `DATABASE_URL`.
- `pnpm db:reset` : drop la base cible puis rejoue toutes les migrations (pratique pour repartir de zéro en local).
- `pnpm db:test` : exécute les tests pgTAP de `infra/supabase/tests` sur la base cible (gère SSL automatiquement).
- `docker compose -f infra/docker/docker-compose.dev.yml up -d` : démarre la stack Supabase locale complète.
- `docker compose down -v` (dans `infra/docker`) : stoppe la stack locale et supprime les volumes (reset dur).

> Les tables sont sous RLS. Pour lire/écrire via REST ou PostgREST, utilise les clés/jets Supabase (anon/service role ou JWT issu de GoTrue).

---

## Workflow de Tests

### Exécution des Tests de Base de Données

RunFlow utilise pgTAP pour tester la base de données. Les tests vérifient la structure du schéma, les politiques RLS, les fonctions et les contraintes.

#### Démarrage Rapide
```bash
# Exécuter tous les tests de base de données
pnpm db:test

# Depuis la racine : exécuter les tests unitaires + base de données
pnpm test:all
```

#### Organisation des Tests
- `tests/001_extensions.sql` - Vérifier les extensions PostgreSQL requises
- `tests/002_schema_structure.sql` - Valider les schémas de tables, index et contraintes
- `tests/003_rls_policies.sql` - Tester les politiques Row Level Security
- `tests/004_functions.sql` - Vérifier les fonctions de base de données personnalisées

#### Écrire de Nouveaux Tests

Les tests pgTAP suivent ce pattern :

```sql
BEGIN;
SELECT plan(N); -- N = nombre d'assertions de test

-- Vos assertions de test ici
SELECT has_table('public', 'my_table', 'my_table exists');
SELECT has_pk('public', 'my_table', 'my_table has primary key');

SELECT * FROM finish();
ROLLBACK; -- Garde la base de données propre
```

**Fonctions Clés :**
- `has_table(schema, table, description)` - Tester l'existence de la table
- `has_column(schema, table, column, description)` - Tester l'existence de la colonne
- `has_pk(schema, table, description)` - Tester la clé primaire
- `has_fk(schema, table, description)` - Tester la clé étrangère
- `has_index(schema, table, index, description)` - Tester l'index
- `col_type_is(schema, table, column, type, description)` - Tester le type de colonne

Voir [documentation pgTAP](https://pgtap.org/documentation.html) pour plus.

#### Dépannage

**Problème :** Erreur de connexion SSL
```
ERROR: connection to server failed: SSL required
```

**Solution :** Le script `pnpm db:test` définit déjà `PGSSLMODE=disable` pour le développement local. Si vous exécutez des commandes supabase directement, définissez-le manuellement :
```bash
export PGSSLMODE=disable
supabase test db --db-url "$DATABASE_URL" --workdir infra/supabase
```

Ou utilisez `DATABASE_URL` avec sslmode dans la chaîne de connexion :
```env
DATABASE_URL=postgres://postgres:postgres@localhost:54322/postgres?sslmode=disable
```

**Problème :** Extension pgTAP non trouvée
```
ERROR: extension "pgtap" does not exist
```

**Solution :** pgTAP est inclus dans l'image Postgres de Supabase. Si vous voyez cette erreur, assurez-vous que vous utilisez la bonne URL de base de données pointant vers le conteneur Supabase.

---

### Workflow de Test Complet

#### Développement Local
```bash
# 1. Démarrer les services
cd infra/docker
docker compose -f docker-compose.dev.yml up -d

# 2. Appliquer les migrations
cd ../..
pnpm db:migrate

# 3. Exécuter les tests unitaires en mode watch (terminal séparé)
pnpm test:watch

# 4. Exécuter les tests de base de données
pnpm db:test

# 5. Exécuter tous les tests avant de commiter
pnpm test:all
```

#### Pipeline CI/CD
```bash
# Installer les dépendances
pnpm install

# Build les packages
pnpm build

# Lancer le linter
pnpm lint

# Exécuter tous les tests
pnpm test:all

# Générer le coverage
pnpm test:coverage
```
