# Postgres

One Postgres 16 container (`postgres`) on the VPS, defined in `compose/postgres.compose.yml`.

## Access

- It listens on `127.0.0.1:5432` of the VPS only. **Never publish it on all interfaces.** A Postgres that was exposed with a default password was taken over on this VPS and used to mine cryptocurrency.
- From your machine, use the SSH tunnel (`scripts/tunnel.sh`): Postgres is then at `localhost:5432`.
- The user is `postgres` and the password is `POSTGRES_PASSWORD` in `compose/.env` on the VPS (never committed). The user is a superuser of this private cluster.

## Create a database

The container starts with only the `postgres` database. Create each application database by hand, once:

```bash
# on the VPS
docker exec -it postgres psql -U postgres -c "CREATE DATABASE areax_rag;"
docker exec -it postgres psql -U postgres -Atc "select datname from pg_database where not datistemplate"
```

Or from your machine through the tunnel, with any Postgres client, connecting to `localhost:5432` as `postgres`.

The application's connection string then is:

```
postgresql://postgres:<POSTGRES_PASSWORD>@localhost:5432/areax_rag
```

Tables are created by the application (`prisma migrate`), not here.

## Notes

- `POSTGRES_DB`, `POSTGRES_USER` and `POSTGRES_PASSWORD` apply only when the data volume is first created. To change the password later, run `ALTER USER postgres PASSWORD '...'` inside `psql`, then update `compose/.env` and the application's `DATABASE_URL`.
- There is no backup. Removing the volume `areax-rag-postgres-data` deletes every database.
- Because the user is a superuser, the application is not restricted to its own database. If that matters later, create a separate role with `CREATE ROLE ... LOGIN PASSWORD '...'` and `CREATE DATABASE ... OWNER ...`, and point the application at it.
