# RentHub WebApp — Project Ecosystem Summary

> Last updated: 2026-04-07

---

## 1. Project Overview

RentHub is an Airbnb-like property rental platform. It allows hosts to list properties (annonces) and tenants (locataires) to search, book, pay, and review them. The project is in early-stage backend development — the data model and infrastructure are in place, but most API logic and the frontend have not been built yet.

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
├── docker-compose.yml        # PostgreSQL 16 container
├── README.md
└── summary.md                # This file
```

---

## 3. Frontend

**Status**: NOT YET IMPLEMENTED — directory exists but is empty.

Planned stack per README:
- **Framework**: React
- **Maps**: Google Maps API (property location display)
- **Payments**: Stripe UI
- **Messaging**: Real-time chat over WebSocket
- **Auth**: User login / registration UI

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

| Dependency | Purpose |
|------------|---------|
| spring-boot-starter-web | REST APIs |
| spring-boot-starter-data-jpa | ORM / database access |
| spring-boot-starter-security | Security scaffolding |
| spring-boot-starter-validation | Bean Validation (JSR-380) |
| postgresql | JDBC driver |
| lombok | Boilerplate reduction |

**Missing** (features promised in README but not yet in pom.xml):
- JWT library (authentication tokens)
- `spring-boot-starter-websocket` (real-time messaging)
- `stripe-java` (payment processing)
- Google Maps client

### 4.3 Package Layout

```
src/main/java/com/renthub/
├── config/
│   └── SecurityConfig.java       # Permissive dev config (all requests allowed)
├── controller/
│   └── UserController.java       # GET /api/users
├── entity/                       # 8 JPA entities
├── repository/                   # 7 Spring Data repositories
├── service/
│   └── UserService.java          # getAllUsers()
├── dto/                          # Empty — not implemented yet
└── RenthubBackendApplication.java
```

### 4.4 Entities

| Entity | Key Fields | Relationships |
|--------|-----------|---------------|
| **User** | id, nom, email, password, role (LOCATAIRE/HOTE/ADMIN), photoUrl, createdAt | One-to-many → Annonce |
| **Annonce** | id, titre, description, prixNuit, adresse, latitude, longitude, disponibilite, createdAt | Many-to-one → User; One-to-many → Photo |
| **Reservation** | id, dateDebut, dateFin, createdAt | Many-to-one → Annonce, User |
| **Photo** | id, photoUrl | Many-to-one → Annonce |
| **Message** | id, contenu, lu, dateEnvoi | Many-to-one → Reservation, User (expediteur) |
| **Paiement** | id, montant, statut, stripePaymentIntentId, createdAt | One-to-one → Reservation |
| **Avis** | id, note (1–5), commentaire, createdAt | One-to-one → Reservation |

### 4.5 Repositories

All extend `JpaRepository` with standard CRUD. Only `UserRepository` has a custom method:

```java
Optional<User> findByEmail(String email);
```

Custom queries still needed for: filtering annonces, fetching messages by reservation, finding reservations by tenant/host, etc.

### 4.6 Services & Controllers

Only one service (`UserService`) and one controller (`UserController`) exist:

```
GET /api/users  →  UserService.getAllUsers()  →  userRepository.findAll()
```

All other domain services and controllers need to be implemented.

### 4.7 Security Configuration

```java
// SecurityConfig.java — current state (development only)
csrf().disable()
authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
```

No JWT validation, no CORS config, no role-based access control.

### 4.8 Application Properties

```properties
spring.application.name=renthub-backend
spring.datasource.url=jdbc:postgresql://localhost:5433/renthub_db
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

`ddl-auto=validate` means Hibernate validates the schema at startup but does not create or alter tables — the schema must exist first (managed via `schema.sql` + Docker).

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
users
├── id SERIAL PK
├── nom VARCHAR(100)
├── email VARCHAR(150) UNIQUE
├── password VARCHAR(255)
├── role VARCHAR(20) CHECK IN (LOCATAIRE, HOTE, ADMIN)
├── photo_url TEXT
└── created_at TIMESTAMP

annonces
├── id SERIAL PK
├── user_id FK → users (CASCADE DELETE)
├── titre VARCHAR(200)
├── description TEXT
├── prix_nuit DECIMAL(10,2)
├── adresse TEXT
├── latitude DECIMAL(10,8)
├── longitude DECIMAL(11,8)
├── disponibilite BOOLEAN
└── created_at TIMESTAMP

photos
├── id SERIAL PK
├── annonce_id FK → annonces (CASCADE DELETE)
└── url TEXT

reservations
├── id SERIAL PK
├── annonce_id FK → annonces (CASCADE DELETE)
├── locataire_id FK → users (CASCADE DELETE)
├── date_debut DATE
├── date_fin DATE CHECK (date_debut < date_fin)
├── statut VARCHAR(20) CHECK IN (EN_ATTENTE, CONFIRMEE, REFUSEE, PAYEE, ANNULEE, TERMINEE)
├── montant NUMERIC(10,2)
└── created_at TIMESTAMP

paiements
├── id SERIAL PK
├── reservation_id FK → reservations UNIQUE (CASCADE DELETE)
├── montant NUMERIC(10,2)
├── statut VARCHAR(20) CHECK IN (EN_ATTENTE, PAYE, ECHEC)
├── stripe_payment_intent_id VARCHAR(255)
└── created_at TIMESTAMP

avis
├── id SERIAL PK
├── reservation_id FK → reservations UNIQUE (CASCADE DELETE)
├── note INTEGER CHECK (1–5)
├── commentaire TEXT
└── created_at TIMESTAMP

messages
├── id SERIAL PK
├── reservation_id FK → reservations (CASCADE DELETE)
├── expediteur_id FK → users (CASCADE DELETE)
├── contenu TEXT
├── date_envoi TIMESTAMP
└── lu BOOLEAN
```

### 5.3 Indexes

```
idx_annonces_user               ON annonces(user_id)
idx_reservations_annonce        ON reservations(annonce_id)
idx_reservations_locataire      ON reservations(locataire_id)
idx_messages_reservation        ON messages(reservation_id)
idx_messages_expediteur         ON messages(expediteur_id)
idx_photos_annonce              ON photos(annonce_id)
idx_paiement_reservation        ON paiements(reservation_id)
idx_avis_reservation            ON avis(reservation_id)
```

---

## 6. Docker & Infrastructure

**File**: `docker-compose.yml` (version 3.9)

```yaml
services:
  postgres:
    image: postgres:16
    container_name: renthub-db
    restart: always
    ports:
      - "5433:5432"
    environment:
      POSTGRES_DB: renthub_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Commands**:
```bash
docker-compose up -d        # Start DB
docker-compose down         # Stop DB
docker-compose down -v      # Stop DB + wipe data
```

After starting the container, apply the schema manually:
```bash
psql -h localhost -p 5433 -U postgres -d renthub_db -f database/schema.sql
```

---

## 7. Git History

| Commit | Message | Date |
|--------|---------|------|
| 565e840 | Fixing: Annonce and Photo File | 2026-03-25 |
| 0ef63c3 | Add Spring Boot backend: entities, repositories, services, security config | 2026-03-25 |
| 6109a92 | Add frontend/backend folders and SQL Schema | 2026-03-09 |
| d0cee6c | Pushing docker-compose yaml file for PostgreSQL setup | 2026-03-09 |
| 4851833 | Initial commit: Add Readme File | 2026-03-06 |

---

## 8. Implementation Status

### Done
- PostgreSQL schema with all tables, indexes, and constraints
- Docker Compose for local database
- Spring Boot project skeleton (Java 21, Maven)
- 8 JPA entities with proper relationships and Lombok annotations
- 7 Spring Data repositories (basic CRUD)
- `UserController` + `UserService` (GET /api/users)
- Permissive `SecurityConfig` for development
- `application.properties` connected to Docker PostgreSQL

### Not Yet Implemented
- All REST controllers except UserController
- All services except UserService
- DTOs (directory exists, no files)
- JWT authentication
- CORS configuration
- Role-based access control
- WebSocket for real-time messaging
- Stripe payment integration
- Google Maps integration
- Custom repository query methods
- Exception handling / error responses
- OpenAPI/Swagger documentation
- Spring profiles (dev / prod / test)
- Environment variable management for secrets
- Unit and integration tests
- Frontend (React)

---

## 9. Known Issues & Risks

| Issue | Severity | Notes |
|-------|----------|-------|
| All endpoints publicly accessible | Critical | SecurityConfig permits everything |
| Database credentials hardcoded | High | Use env vars or Spring profiles |
| No password hashing | Critical | BCryptPasswordEncoder must be added |
| No CORS config | High | Frontend calls will be blocked |
| No DTOs | Medium | Entities exposed directly to API — coupling and data leak risk |
| `Reservation.statut` missing from entity | Medium | Present in DB schema, absent in entity class |
| JWT + WebSocket + Stripe not in pom.xml | Medium | Cannot implement features without adding dependencies |
