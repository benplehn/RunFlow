# GitHub Actions Workflows

Ce répertoire contient les workflows GitHub Actions pour l'intégration continue (CI) du projet RunFlow.

## 📄 Workflows Disponibles

### `ci.yml` - Continuous Integration

**Déclenchement :**
- Push vers `main` ou `develop`
- Pull Request vers `main` ou `develop`

**Durée estimée :** ~5-8 minutes

**Jobs exécutés :**

#### 1. Install & Cache Dependencies
- Installe pnpm et Node.js
- Installe les dépendances avec `--frozen-lockfile`
- Cache le store pnpm pour les jobs suivants

#### 2. Lint & Format Check
- Exécute ESLint sur tout le monorepo
- Vérifie le formatage Prettier
- **Bloque la PR si échoue**

#### 3. Build All Packages
- Compile TypeScript pour tous les packages et apps
- Upload les artifacts de build pour les jobs suivants
- **Bloque la PR si échoue**

#### 4. Unit Tests
- Exécute les tests Vitest de tous les packages
- Génère les rapports de coverage
- Upload les rapports de coverage comme artifacts
- **Bloque la PR si échoue**

#### 5. Database Tests (pgTAP)
- Démarre un service PostgreSQL (Supabase Postgres 15)
- Installe le CLI Supabase
- Active l'extension pgTAP
- Applique les migrations
- Exécute 57 tests pgTAP :
  - Extensions requises
  - Structure du schéma
  - Politiques RLS
  - Fonctions custom
- **Bloque la PR si échoue**

#### 6. Validate Step 1
- Vérifie la structure du monorepo
- Confirme que tous les critères de l'étape 1 sont remplis
- Affiche un résumé de validation

#### 7. Validate Step 2
- Vérifie l'infrastructure Supabase
- Confirme que tous les critères de l'étape 2 sont remplis
- Affiche un résumé de validation

#### 8. CI Summary
- Affiche un résumé final du pipeline
- S'exécute même en cas d'échec des jobs précédents

## 🔧 Configuration

### Variables d'Environnement

```yaml
env:
  PNPM_VERSION: 9.12.2   # Version de pnpm
  NODE_VERSION: 20       # Version de Node.js
```

### Services PostgreSQL

Le workflow utilise un service PostgreSQL pour les tests de base de données :

```yaml
services:
  postgres:
    image: supabase/postgres:15.1.1.80
    env:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    ports:
      - 54322:5432
```

## 🐛 Dépannage

### Le job `lint` échoue

**Cause :** Code non formaté ou erreurs ESLint

**Solution :**
```bash
pnpm format
pnpm lint --fix
```

### Le job `build` échoue

**Cause :** Erreurs TypeScript

**Solution :**
```bash
pnpm build
# Corriger les erreurs de typage
```

### Le job `test-unit` échoue

**Cause :** Tests unitaires en échec

**Solution :**
```bash
pnpm test
# Corriger les tests ou le code
```

### Le job `test-database` échoue

**Causes possibles :**
1. Migrations SQL invalides
2. Tests pgTAP incorrects
3. Schéma de base de données incomplet

**Solution :**
```bash
# Tester localement
cd infra/docker
docker compose -f docker-compose.dev.yml up -d
cd ../..
pnpm db:migrate
pnpm db:test

# Vérifier les migrations
psql "$DATABASE_URL" -c "\dt public.*"
```

### Timeouts

Si les jobs dépassent le timeout :
- Vérifier les performances des tests
- Optimiser les étapes de build
- Vérifier la santé du runner GitHub

## 📊 Artifacts

Le workflow génère les artifacts suivants :

### `build-artifacts`
- Durée de rétention : 1 jour
- Contient : `apps/*/dist`, `packages/*/dist`
- Utilisé par : jobs dépendants du build

### `coverage-reports`
- Durée de rétention : 7 jours
- Contient : Rapports de coverage Vitest
- Utilisé par : analyse de coverage

## 🔒 Sécurité

### Secrets Requis

Aucun secret n'est requis pour le workflow de base.

Pour des workflows futurs (déploiement, etc.), vous pourriez avoir besoin de :
- `SUPABASE_ACCESS_TOKEN` - Pour les déploiements Supabase
- `DEPLOY_KEY` - Pour les déploiements
- Autres secrets selon les besoins

### Protection des Branches

Recommandations pour `main` et `develop` :

1. Aller dans Settings → Branches
2. Ajouter une règle de protection :
   - Require status checks to pass before merging
   - Sélectionner les jobs requis :
     - `lint`
     - `build`
     - `test-unit`
     - `test-database`
   - Require pull request before merging
   - Require approvals: 1

## 📈 Performance

### Optimisations Implémentées

1. **Caching pnpm** : Réduit le temps d'installation de ~2 min à ~30 sec
2. **Artifacts** : Partage les builds entre jobs (évite de rebuilder)
3. **Parallel jobs** : `lint`, `build`, `test-unit` s'exécutent en parallèle
4. **Health checks** : PostgreSQL démarre rapidement avec health checks

### Temps d'Exécution Typique

- Install & Cache: ~1 min
- Lint: ~30 sec
- Build: ~1-2 min
- Unit Tests: ~1 min
- Database Tests: ~2 min
- Validation: ~10 sec
- **Total: ~5-8 min**

## 🚀 Évolutions Futures

### Workflows à Ajouter

1. **CD (Continuous Deployment)**
   - Déploiement automatique en staging
   - Déploiement manuel en production
   - Rollback automatique en cas d'échec

2. **Release**
   - Génération de CHANGELOG
   - Tagging automatique
   - Publication de releases GitHub

3. **Dependency Updates**
   - Dependabot ou Renovate
   - Tests automatiques des mises à jour
   - Auto-merge pour patches

4. **Performance Tests**
   - Tests de charge
   - Benchmarks
   - Alertes si régression

5. **Security Scans**
   - SAST (Static Application Security Testing)
   - Dependency vulnerability scanning
   - Secret scanning

## 📚 Ressources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [pnpm CI Guide](https://pnpm.io/continuous-integration)
- [Turborepo CI Guide](https://turbo.build/repo/docs/ci)
- [Supabase CLI Reference](https://supabase.com/docs/guides/cli)
- [pgTAP Documentation](https://pgtap.org/)

## 🤝 Contribution

Pour modifier les workflows :

1. Tester localement avec [act](https://github.com/nektos/act) si possible
2. Créer une PR avec les modifications
3. Vérifier que tous les jobs passent
4. Demander une revue de code
5. Merger une fois approuvé

---

Maintenu par l'équipe RunFlow 🏃‍♂️💨
