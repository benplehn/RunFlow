# Validation des Étapes 1, 2, 3, 4 & 5

Ce document récapitule comment valider le projet, de l'infrastructure de base jusqu'aux fonctionnalités utilisateur (Auth & Profils).

> [!IMPORTANT]
> **Cloud First** : Le développement se fait désormais directement contre l'instance Supabase Cloud (Staging/Prod).
> Assurez-vous d'avoir les variables d'environnement correctes dans `.env` :
> `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`.

---

## 🎯 Étape 1 – Socle Monorepo & Outillage

### Objectif
Le backend doit être capable de compiler et tester de manière reproductible.

### Commandes de Validation
```bash
# 1. Installer les dépendances
pnpm install

# 2. Vérifier la qualité du code
pnpm lint

# 3. Compiler tout le projet
pnpm build

# 4. Lancer les tests unitaires
pnpm test
```

**Résultat attendu :** Tout passe au vert (lint, build, tests).

---

## 🎯 Étape 2 – Infrastructure de Données (Cloud)

### Objectif
Le backend doit pouvoir se connecter à l'instance Supabase Cloud et valider le schéma.

### Commandes de Validation
```bash
# 1. Appliquer les migrations sur le Cloud
pnpm db:migrate

# 2. Vérifier l'état de la base (pgTAP tests)
# Note: Assurez-vous que DATABASE_URL pointe bien vers le Cloud
pnpm db:test
```

**Résultat attendu :**
- Les migrations s'appliquent sans erreur.
- Les tests pgTAP (s'ils sont configurés pour tourner contre le cloud) passent : 57 tests.

---

## 🎯 Étape 3 – API & Health Checks

### Objectif
L'API doit démarrer et se connecter correctement à la base de données Cloud.

### Commandes de Validation
```bash
# 1. Démarrer l'API
pnpm dev:api

# 2. Dans un autre terminal, vérifier les health checks
curl http://localhost:4000/health
curl http://localhost:4000/health/db
```

**Résultat attendu :**
- `/health` -> 200 OK `{"status":"ok"}`
- `/health/db` -> 200 OK `{"database":{"connected":true}}`

---

## 🎯 Étape 4 – Authentification

### Objectif
L'utilisateur doit pouvoir s'inscrire, se connecter et être identifié par l'API via le token Supabase.

### Scénarios de Test

#### 1. Inscription & Connexion (Frontend/ClientSupabase)
- Utiliser le client Supabase (ou l'interface de gestion Supabase) pour créer un utilisateur.
- Récupérer son `access_token` (JWT).

#### 2. Identification API (`GET /me`)
- **Sans Token** :
  ```bash
  curl -i http://localhost:4000/me
  ```
  -> **401 Unauthorized**

- **Avec Token Valide** :
  ```bash
  curl -i -H "Authorization: Bearer <VOTRE_TOKEN>" http://localhost:4000/me
  ```
  -> **200 OK**
  -> Body contient l'objet user (`id`, `email`, etc.).

### Tests Automatisés
```bash
pnpm --filter @runflow/api test src/__tests__/auth.test.ts
```
*(Note : Ces tests mockent généralement Supabase, mais garantissent que le middleware fonctionne)*

---

## 🎯 Étape 5 – Profils Utilisateur & Validation

### Objectif
L'utilisateur peut gérer son profil. Les données sont validées strictement (Zod) et la sécurité est assurée par la base de données (RLS).

### Scénarios de Test

#### 1. Récupération du Profil (`GET /me/profile`)
```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:4000/me/profile
```
-> **200 OK**
-> Retourne `{ "id": "...", "email": "...", "displayName": "..." }`

#### 2. Mise à jour du Profil (`PUT /me/profile`)
**Cas Valide :**
```bash
curl -X PUT -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"displayName": "New Name"}' \
  http://localhost:4000/me/profile
```
-> **200 OK** + Données mises à jour.

**Cas Invalide (Validation Zod) :**
Envoyer un champ interdit ou mal formaté.
-> **400 Bad Request** + Détails de l'erreur.

#### 3. Sécurité RLS (Row Level Security)
- Tenter d'accéder aux données d'un autre utilisateur via l'API (impossible par design car `/me` utilise le token).
- Côté DB, les policies empêchent `UPDATE` ou `SELECT` sur les autres profils.

### Tests Automatisés
```bash
pnpm --filter @runflow/api test src/__tests__/profile.test.ts
```

---

## 🚀 Récapitulatif Global pour passer à l'étape suivante

Pour valider que tout est prêt pour l'étape 6 :

1.  **Code** : `pnpm build` et `pnpm lint` sont OK.
2.  **Tests** : `pnpm test:all` passe.
3.  **DB Cloud** : Migrations à jour (`pnpm db:migrate`).
4.  **Runtime** : L'API démarre et répond aux appels authentifiés (`/me`, `/me/profile`) avec un vrai token Supabase Cloud.

[ ] J'ai validé l'Auth (Step 4)
[ ] J'ai validé les Profils (Step 5)
[ ] Je suis connecté au Cloud Supabase
