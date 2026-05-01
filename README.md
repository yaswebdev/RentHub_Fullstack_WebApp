# RentHub

RentHub is a full-stack web application for renting accommodations between individuals, similar to Airbnb. The platform allows users to browse listings, view locations on a map, make reservations, pay online, and communicate with hosts.

The project is built with **React** for the frontend and **Spring Boot** for the backend, with **PostgreSQL** as the database. It also integrates **Google Maps API** for location display, **Stripe (test mode)** for payments, and **WebSocket** for real-time chat.

Main features include:
- User authentication with JWT
- Property listing management
- Search and filtering of accommodations
- Reservation workflow
- Online payment simulation with Stripe
- Review system
- Real-time messaging between tenant and host

This project was developed as part of an academic full-stack development project.

---

## Getting Started with Docker Compose

The project uses Docker Compose to run **PostgreSQL** locally.

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) installed and running

### Start the services

```bash
docker-compose up -d
```

This will start:
- **PostgreSQL 16** on port `5432` (database: `renthub_db`, user: `postgres`, password: `postgres`)

### Stop the services

```bash
docker-compose down
```

To stop and remove all data (volumes):

```bash
docker-compose down -v
```

---

## Database Migrations (Flyway)

The backend uses Flyway migrations located in `backend/com.renthub/src/main/resources/db/migration`.
On startup, Flyway will apply any new migrations automatically. For existing databases,
it will baseline at version 1 to avoid reapplying the initial schema.