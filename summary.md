# RentHub WebApp — Project Ecosystem Summary

> Last updated: 2026-04-11

---

## 1. Project Overview

RentHub is an Airbnb-like property rental platform. It allows hosts to list properties (annonces) and tenants (locataires) to search, book, pay, and review them. The backend auth layer is complete and working — JWT register/login, BCrypt password hashing, CORS, and a JWT filter are all in place. The next phase is building the domain APIs (annonces, reservations, etc.) and starting the React frontend.

**Repository**: https://github.com/yaswebdev/RentHub_Fullstack_WebApp  
**Author**: yaswebdev (Yassine Rami)  
**Current branch**: main

---

## 2. Top-Level Structure

```
RentHub_WebApp/
├── backend/
│   └── com.renthub/          # Spring Boot Maven project
├── frontend/                 # Empty — React app not yet created
├── database/
│   └── schema.sql            # PostgreSQL DDL
├── postman/
│   ├── RentHub.postman_collection.json
│   └── RentHub.local.postman_environment.json
├── docker-compose.yml        # PostgreSQL 16 container
├── README.md
└── summary.md                # This file
```

---

## 3. Frontend

**Status**: NOT YET IMPLEMENTED — directory exists but is empty.

Planned stack per README:
- **Framework**: React (Vite — CORS is already pre-configured for `http://localhost:5173`)
- **Maps**: Google Maps API (property location display)
- **Payments**: Stripe UI
- **Messaging**: Real-time chat over WebSocket
- **Auth**: User login / registration UI (backend ready)

---

## 4. Backend — Spring Boot REST API

### 4.1 Runtime & Build

| Item | Value |
|------|-------|
| Framework | Spring Boot 4.0.3 |
| Language | Java 21 |
| Build tool | Maven (`mvnw` wrapper) |
| Root package | `com.renthub` |
| Entry point | `RenthubBackendApplication.java` |

### 4.2 Dependencies (`pom.xml`)

| Dependency | Purpose | Status |
|------------|---------|--------|
| spring-boot-starter-webmvc | REST APIs | ✅ |
| spring-boot-starter-data-jpa | ORM / database access | ✅ |
| spring-boot-starter-security | Security scaffolding | ✅ |
| spring-boot-starter-validation | Bean Validation (JSR-380) | ✅ |
| postgresql | JDBC driver | ✅ |
| lombok | Boilerplate reduction | ✅ |
| jjwt-api / jjwt-impl / jjwt-jackson (0.12.6) | JWT token generation & validation | ✅ added |
| spring-boot-starter-websocket | Real-time messaging | ✅ added (not yet wired) |
| stripe-java (26.3.0) | Payment processing | ✅ added (not yet wired) |
| Google Maps client | Location display | ❌ not yet added |

### 4.3 Package Layout

```
src/main/java/com/renthub/
├── config/
│   ├── SecurityConfig.java           # JWT filter, BCrypt, CORS, stateless session
│   └── GlobalExceptionHandler.java   # @RestControllerAdvice error handling
├── controller/
│   ├── AuthController.java           # POST /api/auth/register, /login
│   └── UserController.java           # GET /api/users
├── dto/
│   ├── RegisterRequest.java          # nom, email, password, role (validated)
│   ├── LoginRequest.java             # email, password (validated)
│   ├── AuthResponse.java             # token + UserDTO
│   └── UserDTO.java                  # id, nom, email, role, photoUrl, createdAt
├── entity/                           # 8 JPA entities (see §4.4)
├── repository/                       # 7 Spring Data repositories
├── security/
│   ├── JwtUtils.java                 # generateToken, extractEmail, isTokenValid
│   ├── JwtAuthFilter.java            # OncePerRequestFilter — Bearer token validation
│   └── UserDetailsServiceImpl.java   # loadUserByUsername (email-based)
├── service/
│   ├── AuthService.java              # register(), login()
│   └── UserService.java              # getAllUsers()
└── RenthubBackendApplication.java
```

### 4.4 Entities

| Entity | Key Fields | Relationships |
|--------|-----------|---------------|
| **User** | id (Integer), nom, email, password, role (LOCATAIRE/HOTE/ADMIN), photoUrl, createdAt | One-to-many → Annonce |
| **Annonce** | id, titre, description, prixNuit, adresse, latitude, longitude, disponibilite, createdAt | Many-to-one → User; One-to-many → Photo |
| **Reservation** | id, dateDebut, dateFin, createdAt | Many-to-one → Annonce, User; ⚠️ missing `statut` field |
| **Photo** | id, photoUrl | Many-to-one → Annonce |
| **Message** | id, contenu, lu, dateEnvoi | Many-to-one → Reservation, User (expediteur) |
| **Paiement** | id, montant, statut, stripePaymentIntentId, createdAt | One-to-one → Reservation |
| **Avis** | id, note (1–5), commentaire, createdAt | One-to-one → Reservation |

### 4.5 Repositories

All extend `JpaRepository` with standard CRUD. Custom methods so far:

```java
// UserRepository
Optional<User> findByEmail(String email);
```

Custom queries still needed: filter annonces, fetch messages by reservation, find reservations by tenant/host, check availability overlap, etc.

### 4.6 Auth Layer (fully implemented)

```
POST /api/auth/register  →  AuthService.register()  →  BCrypt hash + save + JWT
POST /api/auth/login     →  AuthService.login()     →  AuthenticationManager + JWT
GET  /api/users          →  UserService.getAllUsers()  (requires valid JWT)
```

- All `/api/auth/**` and `/ws/**` routes are public.
- All other routes require a valid `Authorization: Bearer <token>` header.
- JWT secret and expiration are in `application.properties` (`app.jwt.secret`, `app.jwt.expiration=86400000` ms = 24 h).
- Stripe secret key is read from env var `STRIPE_SECRET_KEY` (not hardcoded).

### 4.7 Security Configuration (current state)

```java
// SecurityConfig.java
csrf().disable()
cors → localhost:5173 (GET, POST, PUT, DELETE, OPTIONS, credentials allowed)
sessionManagement → STATELESS
authorizeHttpRequests:
  /api/auth/** → permitAll
  /ws/**       → permitAll
  anyRequest   → authenticated
JwtAuthFilter inserted before UsernamePasswordAuthenticationFilter
BCryptPasswordEncoder bean registered
```

### 4.8 Exception Handling

`GlobalExceptionHandler` (`@RestControllerAdvice`) covers:
- `RuntimeException` → 400 `{ "error": "..." }`
- `MethodArgumentNotValidException` → 400 `{ "fieldName": "message", ... }`
- `AccessDeniedException` → 403 `{ "error": "Accès refusé" }`

### 4.9 Application Properties

```properties
spring.datasource.url=jdbc:postgresql://localhost:5433/renthub_db
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.jpa.hibernate.ddl-auto=validate
app.jwt.secret=renthub-super-secret-key-256-bits-long-change-in-prod-2026
app.jwt.expiration=86400000
stripe.secret.key=${STRIPE_SECRET_KEY}     # must be set as env var
google.maps.api.key=YOUR_GOOGLE_MAPS_KEY   # placeholder
```

---

## 5. Database — PostgreSQL

### 5.1 Infrastructure

| Item | Value |
|------|-------|
| Engine | PostgreSQL 16 (Docker) |
| Host | localhost:5433 (mapped from 5432 inside container) |
| Database | renthub_db |
| Credentials | postgres / postgres |
| Volume | `postgres_data` (persistent) |

### 5.2 Tables

```
users, annonces, photos, reservations, paiements, avis, messages
```
(Full DDL unchanged — see `database/schema.sql`)

Known schema/entity gap:
- `reservations.statut` column exists in SQL but is **missing** from `Reservation.java`.

### 5.3 Indexes

```
idx_annonces_user, idx_reservations_annonce, idx_reservations_locataire,
idx_messages_reservation, idx_messages_expediteur, idx_photos_annonce,
idx_paiement_reservation, idx_avis_reservation
```

---

## 6. Tests

| Test class | Type | Coverage |
|------------|------|---------|
| `AuthServiceTest` | Unit (Mockito) | register success, duplicate email, login success, user not found (4 cases) |
| `AuthControllerIntegrationTest` | Controller slice (MockMvc + Mockito) | POST /register returns token+user, POST /login returns token+role |
| `RenthubBackendApplicationTests` | Spring context load | Context starts without error |

---

## 7. Postman

```
postman/
├── RentHub.postman_collection.json          # Auth endpoints (register, login)
└── RentHub.local.postman_environment.json   # baseUrl=http://localhost:8080
```

---

## 8. Docker & Infrastructure

**File**: `docker-compose.yml` (version 3.9)

```bash
docker-compose up -d        # Start DB
docker-compose down         # Stop DB
docker-compose down -v      # Stop DB + wipe data

# Apply schema after first start:
psql -h localhost -p 5433 -U postgres -d renthub_db -f database/schema.sql
```

---

## 9. Git History

| Commit | Message |
|--------|---------|
| 1ccf330 | Add auth unit/integration tests and fix register response |
| d2419de | Fix DTO id type and secure Stripe config |
| c22c7d5 | Fix schema-entity alignment and auth module setup |
| 565e840 | Fixing: Annonce and Photo File |
| 0ef63c3 | Add Spring Boot backend: entities, repositories, services, security config |
| 6109a92 | Add frontend/backend folders and SQL Schema |
| d0cee6c | Pushing docker-compose yaml file for PostgreSQL setup |
| 4851833 | Initial commit: Add Readme File |

---

## 10. Implementation Status

### Done
- PostgreSQL schema with all tables, indexes, and constraints
- Docker Compose for local database
- Spring Boot project skeleton (Java 21, Maven)
- 8 JPA entities with proper relationships and Lombok annotations
- 7 Spring Data repositories (basic CRUD + `findByEmail`)
- `UserController` + `UserService` (GET /api/users)
- **Auth module**: `AuthController`, `AuthService`, `JwtUtils`, `JwtAuthFilter`, `UserDetailsServiceImpl`
- **DTOs**: `RegisterRequest`, `LoginRequest`, `AuthResponse`, `UserDTO`
- **JWT** (jjwt 0.12.6): token generation, validation, extraction
- **BCrypt** password hashing
- **CORS** configured for Vite frontend (`localhost:5173`)
- **Stateless session** (no HttpSession)
- **GlobalExceptionHandler** for validation + runtime + 403 errors
- **JWT `app.jwt.secret`** in properties; **Stripe key** via env var `STRIPE_SECRET_KEY`
- JWT + WebSocket + Stripe dependencies added to `pom.xml`
- Unit tests: `AuthServiceTest` (4 cases)
- Controller tests: `AuthControllerIntegrationTest` (2 cases, MockMvc)
- Postman collection for auth endpoints

### Not Yet Implemented

#### Backend — Domain APIs
- `AnnonceController` + `AnnonceService` (CRUD, search/filter, availability)
- `ReservationController` + `ReservationService` (create, confirm, cancel, list by user)
- `PaiementController` + `PaiementService` (Stripe PaymentIntent create/confirm/webhook)
- `AvisController` + `AvisService` (post review, get by annonce)
- `MessageController` + `MessageService` (REST + WebSocket)
- Domain DTOs for each entity (AnnonceDTO, ReservationDTO, PaiementDTO, AvisDTO, MessageDTO)
- Custom repository queries (availability overlap, messages by reservation, etc.)
- Fix: add `statut` field to `Reservation.java` to match DB schema

#### Backend — Infrastructure
- Role-based access control (`@PreAuthorize`) on protected endpoints
- WebSocket config (`@EnableWebSocketMessageBroker`, STOMP broker)
- Stripe webhook endpoint + signature verification
- Spring profiles: `dev`, `prod`, `test`
- Environment variable management for DB credentials and JWT secret in prod
- OpenAPI / Swagger documentation
- Integration tests against real DB (currently all tests use mocks)

#### Frontend (React + Vite)
- Project scaffold (`npm create vite`)
- Auth pages: Register, Login (call `/api/auth/register` and `/api/auth/login`)
- JWT storage + Axios interceptor
- Home / listing page: browse annonces
- Annonce detail page (photos, map, availability, book button)
- Reservation flow + Stripe payment UI
- User dashboard (my bookings, my listings)
- Messaging UI (WebSocket/STOMP)
- Google Maps integration
- Reviews display

---

## 11. Known Issues & Risks

| Issue | Severity | Notes |
|-------|----------|-------|
| `Reservation.statut` missing from entity | High | Column exists in DB — Hibernate `validate` will fail if entity doesn't match |
| JWT secret hardcoded in `application.properties` | High | Must be moved to env var before any deployment |
| Database credentials hardcoded in `application.properties` | High | Use Spring profiles / env vars in prod |
| No role-based access control yet | Medium | `SecurityConfig` authenticates all non-auth routes but does not restrict by role |
| No WebSocket config class | Medium | Dependency is in pom.xml but no `@EnableWebSocketMessageBroker` yet |
| Stripe not wired | Medium | Dependency in pom.xml; `STRIPE_SECRET_KEY` env var required at runtime |
| No domain DTOs | Medium | Entities will be exposed directly to API if controllers are added without DTOs |
| All tests use mocks, no DB integration tests | Low | Real DB behaviour untested |
| Google Maps API key placeholder | Low | `YOUR_GOOGLE_MAPS_KEY` must be replaced |
