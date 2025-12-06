# @runflow/api

API REST Fastify pour RunFlow. Backend pour l'application de running avec clans et entraînement personnalisé.

## 📦 Installation

```bash
pnpm install
```

## 🎯 Objectif

API HTTP fiable avec :
- ✅ Serveur Fastify avec logging structuré (Pino)
- ✅ Health checks pour monitoring
- ✅ Intégration Supabase (PostgreSQL)
- ✅ CORS configuré
- ✅ Graceful shutdown
- ✅ Hot-reload en développement

## 🚀 Démarrage rapide

### 1. Configuration

Créez un fichier `.env.local` à la racine du monorepo :

```env
# Supabase
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API
PORT=4000
NODE_ENV=development
LOG_LEVEL=debug
```

### 2. Démarrer Supabase (local)

```bash
# Depuis la racine du monorepo
supabase start --workdir infra/supabase
```

### 3. Lancer l'API en développement

```bash
pnpm dev
```

L'API sera accessible sur `http://localhost:4000`

### 4. Lancer l'API en production

```bash
pnpm build
pnpm start
```

## 🛣️ Routes

### Health Checks

#### `GET /health`

Health check basique de l'API.

**Réponse (200 OK) :**
```json
{
  "status": "ok",
  "timestamp": "2025-12-06T12:00:00.000Z"
}
```

**Exemple :**
```bash
curl http://localhost:4000/health
```

#### `GET /health/db`

Health check avec vérification de la connexion à la base de données.

**Réponse (200 OK) :**
```json
{
  "status": "ok",
  "timestamp": "2025-12-06T12:00:00.000Z",
  "database": {
    "connected": true
  }
}
```

**Réponse (503 Service Unavailable) :**
```json
{
  "status": "error",
  "timestamp": "2025-12-06T12:00:00.000Z",
  "details": "Database connection failed",
  "database": {
    "connected": false
  }
}
```

**Exemple :**
```bash
curl http://localhost:4000/health/db
```

## 🏗️ Architecture

### Structure des fichiers

```
apps/api/
├── src/
│   ├── index.ts              # Point d'entrée, lance le serveur
│   ├── server.ts             # Factory du serveur Fastify
│   ├── config.ts             # Configuration et validation env vars
│   ├── types.ts              # Types TypeScript et extensions Fastify
│   ├── routes/
│   │   ├── index.ts          # Registration des routes
│   │   └── health.ts         # Routes de health check
│   └── __tests__/
│       ├── server.test.ts    # Tests du serveur
│       └── health.test.ts    # Tests des routes health
├── dist/                     # Code compilé (TypeScript → JavaScript)
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Pattern Factory

Le serveur utilise un **factory pattern** pour la testabilité :

```typescript
// server.ts - Factory qui crée le serveur
export async function createServer(config: ApiConfig): Promise<FastifyInstance> {
  const fastify = Fastify({ /* ... */ });
  // Configuration du serveur
  return fastify;
}

// index.ts - Point d'entrée qui utilise la factory
const server = await createServer(config);
await server.listen({ port: 4000 });
```

Avantages :
- Testable avec `server.inject()` (pas besoin de vrais appels HTTP)
- Réutilisable dans différents contextes
- Configuration injectable

### Clients Supabase

L'API dispose de deux clients Supabase :

```typescript
server.db.anon     // Client avec clé anonyme (respecte RLS)
server.db.service  // Client avec service role (bypass RLS)
```

Les health checks utilisent le **service client** car ils ne dépendent pas d'un utilisateur authentifié.

## 🔧 Configuration

### Variables d'environnement

| Variable | Description | Défaut | Requis |
|----------|-------------|--------|--------|
| `PORT` | Port du serveur | `4000` | Non |
| `NODE_ENV` | Environnement (development/production) | `development` | Non |
| `LOG_LEVEL` | Niveau de log (debug/info/warn/error) | `debug` (dev), `info` (prod) | Non |
| `SUPABASE_URL` | URL Supabase | - | **Oui** |
| `SUPABASE_ANON_KEY` | Clé anonyme Supabase | - | **Oui** |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Supabase | - | **Oui** |

### Validation au démarrage

L'API **refuse de démarrer** si les variables requises sont manquantes :

```
Configuration error: Error: Configuration validation failed:
SUPABASE_URL is required
SUPABASE_ANON_KEY is required
SUPABASE_SERVICE_ROLE_KEY is required
```

## 🧪 Tests

### Lancer les tests

```bash
pnpm test
```

### Tests en watch mode

```bash
pnpm test:watch
```

### Coverage

```bash
pnpm test -- --coverage
```

### Tests disponibles

- ✅ Initialisation du serveur
- ✅ Registration des routes
- ✅ Health check basique (`/health`)
- ✅ Health check DB success (`/health/db` avec DB up)
- ✅ Health check DB failure (`/health/db` avec DB down)

Les tests utilisent :
- **Vitest** pour le framework de test
- **Fastify inject()** pour simuler les requêtes HTTP (pas de réseau)
- **Mocks** pour simuler les erreurs de base de données

## 📊 Logging

### Développement

En développement, les logs sont **pretty-printed** avec couleurs :

```
[12:00:00 UTC] INFO: Server listening on port 4000
[12:00:01 UTC] INFO: incoming request
    reqId: "req-1"
    req: {
      "method": "GET",
      "url": "/health"
    }
```

### Production

En production, les logs sont en **JSON** pour parsing automatique :

```json
{"level":30,"time":1701864000000,"msg":"Server listening on port 4000"}
{"level":30,"time":1701864001000,"reqId":"req-1","req":{"method":"GET","url":"/health"},"msg":"incoming request"}
```

## 🔒 Sécurité

### CORS

- **Développement** : Permissif (`origin: true`)
- **Production** : Restrictif (`origin: false` par défaut)

À configurer en production pour les domaines autorisés.

### Service Role Key

⚠️ **Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté client !**

Cette clé est utilisée uniquement côté serveur pour :
- Health checks DB
- Opérations administratives
- Bypass des politiques RLS quand nécessaire

## 🚀 Déploiement

### Build pour production

```bash
pnpm build
```

Génère le code JavaScript dans `dist/`.

### Lancer en production

```bash
NODE_ENV=production pnpm start
```

### Variables d'environnement production

Configurez ces variables dans votre environnement de déploiement :

```env
NODE_ENV=production
PORT=4000
LOG_LEVEL=info
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-key
```

### Graceful Shutdown

L'API gère proprement les signaux `SIGINT` et `SIGTERM` :

```bash
# Arrêt propre avec Ctrl+C
^C
[12:00:00 UTC] INFO: Received SIGINT, closing server gracefully...
[12:00:00 UTC] INFO: Server closed
```

## 📈 Monitoring

### Health checks

Utilisez `/health` et `/health/db` pour :

- **Load balancers** : Vérifier que l'instance est vivante
- **Kubernetes** : Liveness et readiness probes
- **Monitoring** : Alertes si status ≠ 200

Exemple Kubernetes :

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 4000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /health/db
    port: 4000
  initialDelaySeconds: 5
  periodSeconds: 10
```

## 🛠️ Scripts

- `pnpm dev` - Lance l'API avec hot-reload (tsx watch)
- `pnpm build` - Compile TypeScript → JavaScript
- `pnpm start` - Lance l'API compilée (production)
- `pnpm test` - Lance les tests unitaires
- `pnpm test:watch` - Tests en mode watch
- `pnpm lint` - Vérifie le code avec ESLint

## 🔄 Hot Reload

En développement, l'API utilise `tsx watch` pour le hot-reload :

```bash
pnpm dev
```

Modifiez n'importe quel fichier `.ts` et le serveur redémarre automatiquement.

## 📚 Documentation

- [Fastify Documentation](https://fastify.dev/)
- [Pino Logger](https://getpino.io/)
- [Supabase Documentation](https://supabase.com/docs)

## 🤝 Contribution

### Ajouter une nouvelle route

1. Créez un fichier dans `src/routes/` :

```typescript
// src/routes/users.ts
import type { FastifyInstance } from 'fastify';

export async function usersRoutes(fastify: FastifyInstance) {
  fastify.get('/users', async (request, reply) => {
    // Votre logique
  });
}
```

2. Enregistrez la route dans `src/routes/index.ts` :

```typescript
import { usersRoutes } from './users';

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(healthRoutes);
  await fastify.register(usersRoutes);
}
```

3. Ajoutez des tests dans `src/__tests__/users.test.ts`

### Ajouter un plugin Fastify

Dans `src/server.ts` :

```typescript
import myPlugin from '@fastify/my-plugin';

await fastify.register(myPlugin, {
  // Configuration
});
```

## ⚡ Performance

- **Singleton DB clients** : Réutilisation des connexions Supabase
- **Fastify** : Un des frameworks Node.js les plus rapides
- **Pino** : Logger haute performance
- **Pas de middleware inutile** : Seulement ce qui est nécessaire

## 🐛 Troubleshooting

### L'API ne démarre pas

**Erreur : Configuration validation failed**

→ Vérifiez que toutes les variables d'environnement requises sont définies dans `.env.local`

### `/health/db` retourne 503

**Erreur : Database connection failed**

→ Vérifiez que Supabase est démarré :
```bash
supabase status --workdir infra/supabase
```

→ Si non démarré :
```bash
supabase start --workdir infra/supabase
```

### Hot reload ne fonctionne pas

→ Vérifiez que `tsx` est installé :
```bash
pnpm --filter @runflow/api add -D tsx
```

### Les tests échouent

→ Assurez-vous que les dépendances sont installées :
```bash
pnpm install
```

→ Construisez `@runflow/db` d'abord :
```bash
pnpm --filter @runflow/db build
```
