# @runflow/db

Package de connexion à Supabase pour RunFlow. Fournit des clients Supabase singleton avec gestion des permissions RLS.

## 📦 Installation

```bash
pnpm install
```

## 🎯 Objectif

Ce package fournit une abstraction pour se connecter à Supabase avec deux types de clients :
- **Anon Client** : Utilise la clé anonyme (`SUPABASE_ANON_KEY`) - respecte les politiques RLS
- **Service Client** : Utilise la service role key (`SUPABASE_SERVICE_ROLE_KEY`) - bypass les politiques RLS (backend uniquement)

## 🚀 Usage

### Configuration

Créez un fichier `.env.local` à la racine du monorepo avec :

```env
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Utilisation du client anonyme

```typescript
import { createAnonClient } from '@runflow/db';

const client = createAnonClient({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
});

// Les requêtes respectent les politiques RLS
const { data, error } = await client
  .from('profiles')
  .select('*');
```

### Utilisation du client service (backend)

```typescript
import { createServiceClient } from '@runflow/db';

const client = createServiceClient({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
});

// Les requêtes bypassent les politiques RLS
const { data, error } = await client
  .from('profiles')
  .select('*');
```

## 🏗️ Architecture

### Pattern Singleton

Les clients sont créés une seule fois et réutilisés :

```typescript
const client1 = createAnonClient(config);
const client2 = createAnonClient(config);
// client1 === client2 (même instance)
```

### Réinitialisation (tests)

Pour les tests, vous pouvez réinitialiser les singletons :

```typescript
import { resetClients } from '@runflow/db';

beforeEach(() => {
  resetClients();
});
```

## 📝 API

### `createAnonClient(config: SupabaseClientConfig)`

Crée ou retourne le client anonyme singleton.

**Paramètres :**
- `config.supabaseUrl` (string) - URL de votre instance Supabase
- `config.supabaseAnonKey` (string) - Clé anonyme Supabase

**Retourne :** `SupabaseClient<Database>`

**Throws :** Erreur si la configuration est invalide

### `createServiceClient(config: SupabaseClientConfig)`

Crée ou retourne le client service singleton.

**Paramètres :**
- `config.supabaseUrl` (string) - URL de votre instance Supabase
- `config.supabaseAnonKey` (string) - Clé anonyme Supabase
- `config.supabaseServiceRoleKey` (string) - Service role key Supabase

**Retourne :** `SupabaseClient<Database>`

**Throws :** Erreur si la configuration est invalide

### `resetClients()`

Réinitialise les instances singleton (utile pour les tests).

### `testConnection(client: SupabaseClient)`

Teste la connexion à la base de données.

**Retourne :** `Promise<boolean>` - `true` si la connexion fonctionne

## 🧪 Tests

### Lancer les tests

```bash
pnpm test
```

### Coverage

```bash
pnpm test -- --coverage
```

### Tests en watch mode

```bash
pnpm test:watch
```

## 🔒 Sécurité

### ⚠️ Important : Service Role Key

**Ne jamais exposer la `SUPABASE_SERVICE_ROLE_KEY` côté client !**

Cette clé donne un accès complet à votre base de données et bypass toutes les politiques RLS.

✅ **Bon usage :**
- Backend API (Node.js, Fastify, Express)
- Scripts d'administration
- Workers/Jobs en arrière-plan

❌ **Mauvais usage :**
- Code frontend (React, Vue, etc.)
- Applications mobiles
- Code client en général

### Clé anonyme

La `SUPABASE_ANON_KEY` peut être utilisée côté client car elle respecte les politiques RLS.

## 🔄 Future : Types générés

Actuellement, le type `Database` utilise `any` pour les tables. Dans une future version, nous générerons les types TypeScript depuis le schéma Supabase :

```bash
supabase gen types typescript --local > packages/db/src/database.types.ts
```

Cela permettra l'autocomplétion et la vérification de types pour toutes les requêtes.

## 📚 Documentation Supabase

- [Documentation officielle Supabase](https://supabase.com/docs)
- [supabase-js Reference](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)

## 🛠️ Scripts

- `pnpm build` - Compile le package TypeScript
- `pnpm test` - Lance les tests unitaires
- `pnpm test:watch` - Tests en mode watch
- `pnpm lint` - Vérifie le code avec ESLint
