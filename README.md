# PR Network

> **Nombre de trabajo — no validado legalmente ni registrado como marca.**

**Track it. Beat it. Share it.**

Red social de récords deportivos personales orientada a estudiantes de high school. Los usuarios registran sus PRs (personal records), comparan marcas con amigos y su escuela, participan en retos y comparten tarjetas visuales de sus logros.

Ámbito inicial: **Massachusetts, Estados Unidos.**

---

## Estado actual del repositorio

> **IMPORTANTE:** Este repositorio contiene el código de la aplicación **AuraRank** — una plataforma de rating social donde los usuarios publican fotos/videos y la comunidad los puntúa con un "aura score" de 0–100. AuraRank es la base de código que se reutilizará para construir PR Network. **El código existente NO implementa las funcionalidades de PR Network.** La infraestructura técnica (auth, base de datos, middleware, componentes UI) es reutilizable; el modelo de dominio y la UI deben reemplazarse.

### Divergencia de esquema detectada

- `db/schema.sql` define tablas con prefijo `pr_` (`pr_users`, `pr_posts`, `pr_ratings`, etc.) — aparentemente un borrador del nuevo esquema, **nunca ejecutado en producción según evidencia disponible**.
- Todos los API routes actuales consultan tablas con prefijo `aura_` (`aura_users`, `aura_posts`, etc.) — el esquema activo en Supabase.
- **Decisión pendiente:** confirmar con el propietario cuál es el esquema activo antes de cualquier migración.

---

## Stack tecnológico (confirmado)

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js App Router + Turbopack | 16.3.2 |
| Estilos | Tailwind CSS | ^4 |
| Utilidades CSS | clsx + tailwind-merge | 2.x / 3.x |
| Animaciones | Framer Motion | ^13.1 |
| Iconos | Lucide React | ^1.33 |
| Base de datos | Supabase (PostgreSQL) | @supabase/supabase-js 2.x |
| Auth | Google OAuth 2.0 + JWT HS256 (httpOnly cookie) | — |
| Email | Resend | ^6.25 |
| Captura de frames | Puppeteer Core + @sparticuz/chromium-min | 25.x / 149.x |
| Validación | Zod | ^4.4 |
| Lenguaje | TypeScript | ^5 |
| Fuentes | Manrope + JetBrains Mono | Google Fonts |
| Despliegue | VPS con pm2 (`deploy.sh`) | — |

> **Inconsistencia detectada:** el README anterior indicaba Vercel; `deploy.sh` usa `git pull + npm ci + pm2 reload`. Pendiente de confirmar la plataforma de despliegue definitiva.

---

## Instalación y configuración local

### 1. Prerequisitos

- Node.js ≥ 18 (verificar con `node -v`)
- npm ≥ 9 (verificar con `npm -v`)
- Cuenta en Supabase con las tablas creadas (ver sección Modelo de datos)
- Proyecto OAuth 2.0 configurado en Google Cloud Console

### 2. Instalar dependencias

```bash
npm install
```

### 3. Variables de entorno

Crear un archivo `.env.local` en la raíz con las siguientes variables (nunca commitear valores reales):

```bash
# Supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-server-only-never-expose-to-client

# JWT (session cookies)
JWT_SECRET=random-string-minimum-32-characters-long

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=same-value-as-GOOGLE_CLIENT_ID

# Email (Resend)
RESEND_API_KEY=re_your_resend_api_key

# Soporte (actualmente hardcodeado en src/lib/email.ts — pendiente de mover a env)
# REPLY_TO_EMAIL=support@yourapp.com
```

> `SUPABASE_SERVICE_ROLE_KEY` otorga acceso completo que omite las políticas RLS. Solo se usa en código servidor; nunca se expone al cliente.

### 4. Crear tablas en Supabase

Ejecutar el archivo `db/schema.sql` en el SQL Editor de Supabase.

> **Nota:** El schema actual (`db/schema.sql`) define tablas `pr_*` para PR Network. Las tablas `aura_*` del código existente son del producto anterior (AuraRank). Confirmar cuál es el esquema activo antes de ejecutar cualquier migración. Ver sección de decisiones abiertas.

### 5. Google OAuth

En [Google Cloud Console](https://console.cloud.google.com):
- Crear un OAuth 2.0 Client ID (aplicación web)
- Añadir `http://localhost:3000` a **Authorized JavaScript origins**
- Añadir el dominio de producción a origins y redirect URIs

### 6. Ejecutar en desarrollo

```bash
npm run dev
```

El servidor arranca en `http://localhost:3000` por defecto (Turbopack). El proceso de producción usa el puerto 3003 según `package.json`.

### 7. Build de producción

```bash
npm run build
npm start
```

### 8. Lint

```bash
npm run lint
```

> **Pruebas automáticas:** no se detectó suite de tests (Vitest, Jest, Playwright). Pendiente de implementar.

---

## Estructura de carpetas

```
goatprapp/
├── db/
│   └── schema.sql              # Esquema propuesto para PR Network (pr_* tables)
├── docs/
│   ├── goarprAPP.png           # Mockup de referencia visual
│   └── pr_network_project_brief_for_claude_code.md
├── public/
│   ├── admin.html              # Panel de admin (static HTML — ver hallazgo SEC-001)
│   ├── AuraRank-Squared.png    # Favicon actual (AuraRank — sustituir)
│   ├── aurarank-logo.png       # Logo actual (AuraRank — sustituir)
│   └── ...                     # Otros assets de AuraRank
├── src/
│   ├── app/
│   │   ├── api/                # Todos los endpoints backend
│   │   │   ├── auth/           # Google sign-in, JWT verify, logout, /me
│   │   │   ├── posts/          # Feed, crear, borrar, posts del usuario
│   │   │   ├── ratings/        # Enviar rating
│   │   │   ├── rankings/       # Global / weekly / friends
│   │   │   ├── follows/        # Follow / unfollow
│   │   │   ├── groups/         # Grupos e invitaciones
│   │   │   ├── notifications/  # Leer y marcar notificaciones
│   │   │   ├── account/        # Borrado de cuenta
│   │   │   ├── admin/          # Stats, users, posts, errors (protegido por rol)
│   │   │   └── errors/         # Ingestión de logs de errores
│   │   ├── [username]/         # Perfil público /@username
│   │   ├── account/            # Ajustes de cuenta y borrado
│   │   ├── create/             # Creación de posts
│   │   ├── feed/               # Feed principal
│   │   ├── groups/             # Grupos
│   │   ├── help/               # Ayuda
│   │   ├── login/              # Login con Google
│   │   ├── my-posts/           # Posts propios
│   │   ├── privacy/            # Política de privacidad
│   │   ├── profile/            # Edición de perfil
│   │   ├── rankings/           # Leaderboards
│   │   ├── setup/              # Configuración inicial (claim de username)
│   │   ├── signup/             # Registro (pendiente de verificar si difiere de login)
│   │   ├── terms/              # Términos de servicio
│   │   ├── layout.tsx          # Layout raíz, metadata, fuentes
│   │   ├── page.tsx            # Landing page
│   │   ├── robots.ts           # robots.txt (dominio hardcodeado: aurarank.me)
│   │   └── sitemap.ts          # sitemap.xml (dominio hardcodeado: aurarank.me)
│   ├── components/
│   │   ├── layout/             # Sidebar, BottomNav, TopBar, RootProviders
│   │   ├── ui/                 # Button, Input, Avatar, Toast, Modal, Slider…
│   │   └── composed/           # PostCard, RatingModal, ClaimBanner…
│   ├── hooks/                  # useCurrentUser, useI18n, useAuthGuard…
│   └── lib/
│       ├── admin-auth.ts       # requireAdmin() — consulta aura_users (ver SEC-007)
│       ├── constants.ts        # AURA_LEVELS, POST_CATEGORIES, TOTAL_USERS (falso)
│       ├── email.ts            # sendWelcomeEmail con Resend (email hardcodeado)
│       ├── jwt.ts              # signToken / verifyToken HS256
│       ├── logger.ts           # logError (client) + logServerError (server)
│       ├── rate-limit.ts       # Rate limiter in-memory (ver SEC-002)
│       ├── supabase.ts         # Cliente Supabase con service role key
│       ├── types.ts            # Tipos TypeScript del dominio AuraRank
│       └── i18n/               # Traducciones en / es
├── deploy.sh                   # Deploy a VPS con pm2
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Modelo de datos

### Esquema actual en producción (AuraRank — tablas `aura_*`)

Confirmado por los API routes. Tablas inferidas (no verificadas directamente en Supabase):

| Tabla | Propósito |
|---|---|
| `aura_users` | Usuario base: provider OAuth, email, avatar, rol |
| `aura_usernames` | Handles únicos; separados del registro de auth |
| `aura_profiles` | Bio, ciudad, país — extiende aura_users |
| `aura_posts` | Posts: foto/video/youtube, caption, aura_score, rating_count |
| `aura_ratings` | Un rating por (usuario, post) — trigger actualiza aura_score |
| `aura_follows` | Grafo follower/following |
| `aura_notifications` | Notificaciones in-app (ratings, follows, invitaciones) |
| `aura_groups` | Grupos con owner, ciudad, país |
| `aura_group_members` | Membresías de grupos |
| `aura_group_invites` | Invitaciones pendientes |
| `aura_error_logs` | Log de errores frontend y backend |
| `aura_score_snapshots` | Snapshot diario para calcular movimiento en ranking |

### Esquema propuesto para PR Network (tablas `pr_*` — `db/schema.sql`)

Definido en `db/schema.sql`. Estado: **borrador no ejecutado** (pendiente de confirmar).

| Tabla | Propósito |
|---|---|
| `pr_users` | Idéntico a aura_users |
| `pr_usernames` | Idéntico a aura_usernames |
| `pr_posts` | Posts con `pr_score` — nomenclatura AuraRank aún; pendiente de migrar al concepto PR |
| `pr_ratings` | Ratings de posts con trigger de sincronización |
| `pr_score_snapshots` | Snapshot diario de puntuación |
| `pr_follows` | Grafo de seguimiento |
| `pr_profiles` | Bio, ciudad, país |
| `pr_notifications` | Notificaciones in-app |
| `pr_reports` | Cola de moderación de contenido |

### Entidades pendientes de diseñar para PR Network

Las siguientes entidades son necesarias para el producto objetivo pero **no existen en ningún esquema actual**:

- `schools` — Directorio verificado de escuelas (MA DESE / NCES)
- `user_school_memberships` — Pertenencia de usuarios a escuelas
- `exercises` — Catálogo de ejercicios y disciplinas deportivas
- `personal_records` — El registro central del producto (ejercicio, marca, unidad, fecha)
- `challenges` — Retos entre usuarios o comunidades
- `challenge_participants` — Participantes en retos
- `blocks` — Bloqueo entre usuarios
- `school_claim_requests` — Solicitudes de nuevas escuelas o reclamaciones
- `school_import_batches` — Historial de importaciones de directorios oficiales
- `audit_logs` — Log de acciones sensibles
- `subscriptions` / `entitlements` — Tier Pro y B2B

---

## Funcionalidades existentes (AuraRank — confirmadas en código)

- Google Sign-In con JWT HS256 en cookie httpOnly
- Flujo de claim de username con validación de formato
- Creación de posts: foto con recorte, YouTube embed, captura de frame con Puppeteer
- Feed con scroll infinito y filtros por categoría
- Rating 0–100 — uno por usuario por post, sin edición
- Sistema de niveles: NPC → Rookie → Rising → Aura Farmer → Elite → Legendary
- Leaderboards global, semanal y de amigos (top 50 + posición propia)
- Perfiles públicos en `/@username`
- Upload de avatar y edición de perfil (bio, ciudad, país)
- Follow / unfollow con notificaciones
- Grupos: crear, invitar miembros, gestionar
- Centro de notificaciones in-app
- Borrado de cuenta con cascade y limpieza de Supabase Storage
- i18n: inglés y español
- Panel de administración (stats, users, posts, errores) — HTML estático en `/public/admin.html`
- Logger de errores frontend + backend con prioridad
- Email de bienvenida con Resend (en / es)
- SEO: OG image generada en edge, sitemap.xml, robots.txt, metadata + keywords
- Headers de seguridad: CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy
- Rate limiting en endpoint de auth (in-memory)
- Geolocalización inversa (endpoint `/api/geo/reverse`)

---

## Especificaciones pendientes para PR Network

Las siguientes funcionalidades están definidas en el brief pero **no existen en el código actual**:

- Registro de PRs (ejercicio, marca, unidad, fecha, contexto)
- Directorio de escuelas verificado (MA DESE / NCES)
- Búsqueda y selección de escuela sin crear duplicados
- Solicitud de nueva escuela con revisión pendiente
- Comparación de marcas con amigos
- Clasificaciones escolares con reglas transparentes
- Retos deportivos con criterios explícitos
- Tarjetas visuales compartibles para nuevos PRs
- Control de privacidad por PR (público / solo amigos / privado)
- Reportar y bloquear usuarios
- Eliminación y exportación de datos personales
- Panel administrativo migrado a ruta protegida
- Sistema freemium / Pro con Stripe
- Pruebas automatizadas (Vitest + Playwright)
- COPPA / revisión legal para menores de edad
- Planes B2B para escuelas, equipos y gimnasios

---

## Diagnóstico de seguridad

> Las siguientes tablas documentan hallazgos basados en revisión estática del código. No se ejecutaron pruebas dinámicas ni escaneos contra sistemas externos. No se declara cumplimiento OWASP sin evidencia verificada.

### Hallazgos abiertos

| ID | Área | Hallazgo | Severidad | Evidencia | Recomendación | Estado |
|---|---|---|---|---|---|---|
| SEC-001 | Admin panel | `public/admin.html` es un archivo estático en la carpeta pública; accesible sin middleware; la verificación de rol es client-side JS | Alta | `public/admin.html` + matcher de `src/middleware.ts` | Migrar a `src/app/admin/page.tsx` protegido por middleware, o añadir `/admin` al matcher | Abierto |
| SEC-002 | Rate limiter | `src/lib/rate-limit.ts` usa `Map` en memoria; no persiste entre deploys ni funciona en entornos serverless o multi-proceso | Alta | `src/lib/rate-limit.ts` | Reemplazar por Redis / Upstash / KV según infraestructura | Abierto |
| SEC-003 | Email hardcodeado | `src/lib/email.ts` contiene un email personal hardcodeado como `REPLY_TO` | Media | `src/lib/email.ts` línea 12 | Mover a variable de entorno `REPLY_TO_EMAIL` | Abierto |
| SEC-004 | .gitignore ausente | No se detectó `.gitignore` en la raíz del repositorio | Media | Búsqueda de archivos | Crear `.gitignore` con `.env*`, `node_modules/`, `.next/`, `*.tsbuildinfo` | Abierto |
| SEC-005 | robots.txt incompleto | `/feed`, `/rankings`, `/groups` (rutas autenticadas) están permitidas para bots | Baja | `src/app/robots.ts` | Añadir rutas autenticadas a `disallow` | Abierto |
| SEC-006 | CSP `unsafe-inline` | `script-src` incluye `'unsafe-inline'` en producción | Baja/Info | `src/middleware.ts` línea 21 | Evaluar nonces cuando el stack lo permita | Informativo |
| SEC-007 | Tabla incorrecta en admin-auth | `requireAdmin` consulta `aura_users`; fallará si el esquema migra a `pr_*` | Media | `src/lib/admin-auth.ts` línea 13 | Sincronizar nombre de tabla con la decisión de esquema | Pendiente |
| SEC-008 | Dato falso en UI | `TOTAL_USERS = 48200` en `constants.ts` es un número hardcodeado usado como prueba social | Baja | `src/lib/constants.ts` línea 71 | Eliminar o consultar dinámicamente | Abierto |
| SEC-009 | Analytics de terceros | `analytics.weblify.me/script.js` cargado en `layout.tsx`; implicaciones de privacidad no documentadas | Informativo | `src/app/layout.tsx` líneas 82–87 | Revisar términos antes de aplicar a menores | Pendiente |
| SEC-010 | Audiencia de menores | El producto objetivo incluye estudiantes de high school (posibles menores). COPPA, privacidad por defecto y restricciones de publicidad aplican | Crítico (diseño) | Brief §5.3 | Obtener revisión legal cualificada antes del lanzamiento | Fuera de alcance técnico |

### Controles de seguridad confirmados

| Control | Evidencia |
|---|---|
| JWT HS256 con `timingSafeEqual` | `src/lib/jwt.ts` |
| Cookie httpOnly, secure, sameSite: lax | `src/app/api/auth/google/route.ts` línea 131 |
| Validación de audience en Google tokeninfo | `src/app/api/auth/google/route.ts` línea 48 |
| Prevención de auto-rating | `src/app/api/ratings/route.ts` línea 33 |
| Headers HTTP de seguridad (CSP, HSTS, X-Frame-Options, etc.) | `src/middleware.ts` líneas 8–33 |
| Validación de input con Zod | `src/app/api/auth/google/route.ts` |
| Errores manejados sin exponer stack al cliente | API routes revisados |
| `noindex` en `public/admin.html` | `public/admin.html` línea 6 |

> **No se verificó:** Row Level Security en Supabase, configuración de buckets de Storage, CORS de Supabase, autorización a nivel de objeto en endpoints no revisados, escaneo de dependencias vulnerables (sin `npm audit` ejecutado).

---

## SEO y rendimiento

| Aspecto | Estado |
|---|---|
| `sitemap.xml` | Presente (`src/app/sitemap.ts`) — dominio hardcodeado: `aurarank.me` |
| `robots.txt` | Presente (`src/app/robots.ts`) — dominio y rutas pendientes de actualizar |
| OG + Twitter Cards | Presentes en `src/app/layout.tsx` |
| OG image dinámica | Presente (`src/app/opengraph-image.tsx`) |
| Google Search Console | Archivo de verificación en `public/google675f6b0b8304817b.html` |
| Metadata base | `metadataBase` apunta a `aurarank.me` — pendiente de actualizar |
| Core Web Vitals | No verificados — requiere servidor activo |
| Lighthouse | No ejecutado |
| Accesibilidad automatizada | No detectada (sin Axe, sin Playwright) |
| `prefers-reduced-motion` | No detectado en componentes con Framer Motion |

---

## Accesibilidad y UX

- Landing page construida con estilos inline extensos — auditoría de contraste pendiente
- No se detectaron tests de accesibilidad automatizados
- Mobile-first declarado en el brief; verificación dinámica pendiente (requiere servidor activo)
- Objetivo WCAG 2.2 AA indicado en el brief; cumplimiento **no verificado**

---

## Plan de trabajo por fases

### Fase 1 — Auditoría (esta fase) ✓
Inventario, stack, arquitectura, revisión de seguridad estática, README.

### Fase 2 — Plan de remediación
- Clasificar hallazgos por severidad y prioridad de lanzamiento
- Decisiones de arquitectura: esquema de tablas, dominio, despliegue
- Propuesta de migración desde el código base de AuraRank
- Confirmación del propietario antes de cambios importantes

### Fase 3 — Seguridad y base técnica
- Corregir SEC-001 (admin panel) y SEC-002 (rate limiter)
- Mover SEC-003 (email hardcodeado) a env var
- Crear `.gitignore` (SEC-004)
- Configurar Row Level Security en Supabase
- Auditar y actualizar dependencias (`npm audit`)
- Configurar pruebas automatizadas básicas

### Fase 4 — Sistema visual y branding
- Definir tokens de diseño para PR Network (paleta, tipografía, iconografía)
- Reemplazar assets de AuraRank (logo, favicon, OG image)
- Actualizar dominio en metadata, sitemap, robots, CSP
- Diseño mobile-first de pantallas core: perfil PR, registro de PR, leaderboard

### Fase 5 — Funciones MVP
- Directorio de escuelas (MA DESE / NCES) con prevención de duplicados
- Catálogo de ejercicios y unidades
- Registro y edición de PRs
- Perfil con historial de PRs y privacidad por entrada
- Tarjetas compartibles para nuevos PRs
- Amigos / conexiones con controles de privacidad
- Clasificaciones escolares y globales con reglas transparentes
- Retos básicos
- Reportar, bloquear y moderar
- Eliminación y exportación de datos de cuenta

### Fase 6 — SEO y rendimiento
- Actualizar metadata, H1, alt texts, canonical, sitemap, robots
- Indexación selectiva (solo páginas públicas con valor real)
- Core Web Vitals y optimización móvil

### Fase 7 — QA y piloto
- Pruebas funcionales, de seguridad, accesibilidad y usabilidad
- Solo datos ficticios durante pruebas
- Piloto pequeño en Massachusetts (una escuela)
- Métricas de activación y retención
- Plan de respuesta a incidentes

---

## Decisiones abiertas (requieren aprobación del propietario)

1. **Esquema de tablas activo:** ¿Las tablas `aura_*` siguen activas en Supabase, o las `pr_*` de `db/schema.sql` ya están en producción? Esto determina el riesgo de migración.
2. **Dominio definitivo:** ¿Cuál es el dominio de PR Network? Afecta sitemap, robots, CSP, email y metadataBase.
3. **Plataforma de despliegue:** ¿VPS con pm2 (confirmado en `deploy.sh`) o Vercel (indicado en README previo)?
4. **Nombre y marca:** "PR Network" es nombre de trabajo; pendiente de validación legal y disponibilidad de dominio/handle.
5. **Admin panel:** ¿Migrar `public/admin.html` a ruta protegida por middleware o mantener temporalmente?
6. **Rate limiter:** ¿El proceso corre en VPS (Map en memoria es funcional) o serverless (necesita KV externo)?
7. **Analytics:** ¿Mantener `analytics.weblify.me` o reemplazar antes de aplicar a una audiencia que puede incluir menores?
8. **Revisión legal:** ¿Se ha iniciado revisión sobre COPPA, leyes de privacidad de Massachusetts, y restricciones de monetización para menores?

---

## Audit status

| Área | Estado |
|---|---|
| Stack e inventario de archivos | ✅ Completado — basado en archivos reales |
| Arquitectura observada | ✅ Completado |
| Revisión estática de seguridad | ✅ Completado — sin pruebas dinámicas |
| Revisión de dependencias vulnerables | ⚠️ Pendiente — `npm audit` no ejecutado |
| Row Level Security en Supabase | ⚠️ Pendiente — requiere acceso al proyecto |
| CORS y configuración de Supabase Storage | ⚠️ Pendiente |
| Pruebas de autorización por objeto | ⚠️ Pendiente |
| Core Web Vitals / Lighthouse | ⚠️ Pendiente — requiere servidor activo |
| Accesibilidad WCAG 2.2 AA | ⚠️ Pendiente — no se declara cumplimiento |
| OWASP Top 10 completo | ⚠️ Pendiente — inspección parcial solo estática |
| Pruebas funcionales | ⚠️ Pendiente — no existe suite de tests |
| Revisión legal (COPPA / privacidad de menores) | ⚠️ Pendiente — fuera del alcance técnico |

> Este README documenta el estado real del repositorio a fecha de la auditoría. No declara cumplimiento de ningún estándar de seguridad, accesibilidad o privacidad sin evidencia verificada.

---

## Licencia

Privada. Todos los derechos reservados.
