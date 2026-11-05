#!/bin/sh
# Runs once, the first time the Postgres data volume is initialized.
# Creates the application role and database from environment variables.
# Re-running is harmless: both statements are skipped when the objects already exist.
#
# The role gets CREATEDB because "prisma migrate dev" needs a shadow database. It is not a superuser.
# Passwords come from the environment (compose/.env), never from this file.

set -eu

: "${APP_DB_USER:?APP_DB_USER is required}"
: "${APP_DB_PASSWORD:?APP_DB_PASSWORD is required}"
: "${APP_DB_NAME:?APP_DB_NAME is required}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" \
  -v app_user="$APP_DB_USER" -v app_password="$APP_DB_PASSWORD" -v app_db="$APP_DB_NAME" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN CREATEDB PASSWORD %L', :'app_user', :'app_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'app_user') \gexec

SELECT format('CREATE DATABASE %I OWNER %I', :'app_db', :'app_user')
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'app_db') \gexec
SQL
