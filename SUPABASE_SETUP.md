# Supabase Setup Guide

This guide explains how to add Supabase manually to DalaranSiege.

Recommended architecture:

- Angular uses Supabase Auth for login/register.
- Spring Boot remains the API layer.
- Spring Boot validates Supabase JWT tokens.
- Supabase Postgres stores users, heroes, items, shops, and builds.
- Build write/read permissions are enforced in Spring Boot first, and optionally with Supabase Row Level Security.

## 1. Create Supabase Project

1. Go to https://supabase.com.
2. Create a new project.
3. Save these values from `Project Settings > API`:
   - Project URL
   - anon public key
   - JWT secret or JWKS settings
4. Save your database connection string from `Project Settings > Database`.

Do not commit secrets to GitHub.

## 2. Suggested Database Schema

Use Supabase SQL Editor to create the app tables.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  created_at timestamptz not null default now()
);

create table public.heroes (
  id text primary key,
  name text not null,
  hero_class text not null,
  roles text[] not null default '{}',
  icon_url text not null
);

create table public.shops (
  id text primary key,
  name text not null
);

create table public.items (
  id text primary key,
  name text not null,
  item_class text not null,
  price integer not null,
  bonuses text[] not null default '{}',
  description text not null,
  range integer,
  stats jsonb not null default '{}',
  requirements jsonb not null default '[]',
  shop_ids text[] not null default '{}',
  icon_url text not null
);

create table public.builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hero_id text not null references public.heroes(id),
  name text not null,
  notes text not null default '',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.build_items (
  build_id uuid not null references public.builds(id) on delete cascade,
  item_id text not null references public.items(id),
  slot_index integer not null,
  primary key (build_id, slot_index)
);
```

## 3. Optional Row Level Security

If Angular talks directly to Supabase tables, enable RLS.

```sql
alter table public.profiles enable row level security;
alter table public.builds enable row level security;
alter table public.build_items enable row level security;

create policy "profiles are readable by owner"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles are insertable by owner"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "users can read own or public builds"
on public.builds
for select
using (is_public = true or auth.uid() = user_id);

create policy "users can create own builds"
on public.builds
for insert
with check (auth.uid() = user_id);

create policy "users can update own builds"
on public.builds
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can delete own builds"
on public.builds
for delete
using (auth.uid() = user_id);
```

If all writes go through Spring Boot using a backend database connection, RLS is still useful defense-in-depth, but Spring Security remains the main guard.

## 4. Angular Auth Setup

Install Supabase client:

```powershell
cd D:\dalaranS\frontend
npm install @supabase/supabase-js
```

Create an environment file by copying the committed example:

```powershell
cd D:\dalaranS\frontend\src\environments
copy environment.example.ts environment.ts
```

Then fill in `environment.ts`. This file is ignored by git.

```ts
// frontend/src/environments/environment.ts
export const environment = {
  supabaseUrl: 'YOUR_SUPABASE_PROJECT_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

Create a Supabase client service:

```ts
import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

  signUp(email: string, password: string) {
    return this.client.auth.signUp({ email, password });
  }

  signIn(email: string, password: string) {
    return this.client.auth.signInWithPassword({ email, password });
  }

  signOut() {
    return this.client.auth.signOut();
  }

  getSession() {
    return this.client.auth.getSession();
  }
}
```

When calling Spring Boot, send the Supabase access token:

```ts
const session = await this.supabase.client.auth.getSession();
const token = session.data.session?.access_token;

return this.http.post('/api/builds', body, {
  headers: token ? { Authorization: `Bearer ${token}` } : {}
});
```

## 5. Spring Boot Dependencies

The project now has the PostgreSQL JDBC driver, Spring Data JPA/Hibernate, and Flyway installed.

Flyway migrations live here:

```text
backend/src/main/resources/db/migration
```

The first migration is:

```text
V1__create_initial_tables.sql
```

It creates the initial Supabase/Postgres tables for profiles, heroes, shops, items, builds, and build_items.

When moving heroes/items/builds into database entities, keep schema changes in new migration files:

```xml
V2__seed_game_data.sql
V3__add_build_votes.sql
```

## 6. Spring Boot Database Config

The backend reads local values from `backend/.env` when running from the backend directory. It can also read root `.env` when running from the project root.

Set environment variables locally:

```powershell
$env:SUPABASE_DB_URL='jdbc:postgresql://YOUR_HOST:5432/postgres'
$env:SUPABASE_DB_USER='postgres'
$env:SUPABASE_DB_PASSWORD='YOUR_DATABASE_PASSWORD'
```

You can also copy the backend example file and load it manually in your shell:

```powershell
cd D:\dalaranS\backend
copy .env.example .env
```

`backend/.env` is ignored by git.

Then configure `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=${SUPABASE_DB_URL}
spring.datasource.username=${SUPABASE_DB_USER}
spring.datasource.password=${SUPABASE_DB_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.hibernate.ddl-auto=validate
spring.jpa.open-in-view=false

spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
```

Use Flyway migrations instead of `ddl-auto=update`.

Current connection check endpoint:

```text
GET http://localhost:8081/api/supabase/status
```

Expected connected response:

```json
{
  "configured": true,
  "connected": true,
  "message": "PostgreSQL"
}
```

## 7. Spring Boot JWT Validation

Preferred approach: validate Supabase access tokens as JWT bearer tokens in Spring Security.

Add env var:

```powershell
$env:SUPABASE_JWT_ISSUER='https://YOUR_PROJECT_REF.supabase.co/auth/v1'
```

Add property:

```properties
spring.security.oauth2.resourceserver.jwt.issuer-uri=${SUPABASE_JWT_ISSUER}
```

Then create a security config:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/api/items", "/api/shops", "/api/v1/heroes").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()))
            .build();
    }
}
```

In protected controllers, get the Supabase user id from the JWT `sub` claim:

```java
@PostMapping("/api/builds")
public BuildDto createBuild(@AuthenticationPrincipal Jwt jwt, @RequestBody CreateBuildRequest request) {
    String userId = jwt.getSubject();
    return buildService.createBuild(userId, request);
}
```

## 8. Build API To Add Later

Useful endpoints:

```text
GET    /api/builds/public
GET    /api/me/builds
GET    /api/builds/{id}
POST   /api/builds
PUT    /api/builds/{id}
DELETE /api/builds/{id}
```

Rules:

- Anyone can read public builds.
- Logged-in users can create builds.
- Users can edit/delete only their own builds.
- Admin role can moderate builds later.

## 9. Migration Plan From Current JSON

1. Keep JSON files working while building Supabase support.
2. Create database tables.
3. Seed heroes/items/shops into Supabase.
4. Add JPA repositories and services.
5. Switch read endpoints from JSON services to database services.
6. Add build save/load endpoints.
7. Add Angular login/register UI.
8. Replace localStorage build saving with backend API calls.

## 10. Security Checklist

- Never expose database password in Angular.
- Only use the Supabase anon key in Angular.
- Keep service role key server-side only, or avoid it entirely.
- Validate JWT in Spring Boot for every protected endpoint.
- Do not trust user ids sent from Angular body data; use JWT `sub`.
- Use RLS if Angular reads/writes Supabase tables directly.
- Use Flyway migrations for schema changes.
