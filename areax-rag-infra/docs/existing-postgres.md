# Using a Postgres that already runs

If you keep a Postgres container you already run, do not start `compose/postgres.compose.yml`. Create a separate role and database for areax-rag inside the existing server instead, so the other databases are not touched.

Replace the placeholders. Use a long random password and never commit it.

```bash
docker exec -i <postgres-container> psql -U <admin-user> <<'SQL'
CREATE ROLE areax_app LOGIN PASSWORD '<strong-password>' CREATEDB;
CREATE DATABASE areax_rag OWNER areax_app;
SQL
```

`CREATEDB` lets Prisma create its shadow database during `prisma migrate dev`; the role is not a superuser. The connection string for the application and the services is then:

```
postgresql://areax_app:<strong-password>@localhost:5432/areax_rag
```

## Check the exposure first

The old compose file in your own docker folder publishes `5432:5432` on every interface. On the VPS, check:

```bash
docker ps --format '{{.Names}}\t{{.Ports}}'
ss -ltnp | grep 5432
```

`0.0.0.0:5432` means Postgres is reachable from the internet. Bind it to `127.0.0.1:5432` (`ports: ["127.0.0.1:5432:5432"]`), change the default password, and reach it through the SSH tunnel.

## Tables

The application creates its tables (`prisma migrate`) once the server side exists. Nothing else is needed here.
