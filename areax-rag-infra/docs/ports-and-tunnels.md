# Ports and tunnels

All services on the VPS publish ports **only on `127.0.0.1`**. You reach them from your machine through an SSH tunnel.

| Service | Port on the VPS (`127.0.0.1`) | Tunnel port on your machine |
|---|---|---|
| Postgres | 5432 | 5432 (use 5433 if you already run Postgres locally) |
| Kafka (EXTERNAL listener) | 9094 | 9094 |
| Floci | 4566 | 4566 |
| Floci UI (container `floci-aws-ui`) | 4500 | 4500 |

Why `127.0.0.1`: Docker's published ports bypass `ufw`. A port published as `5432:5432` is open to the internet even if the firewall says otherwise. Always write `127.0.0.1:5432:5432`. The compose files in [`../compose/`](../compose/) already do this.

## Opening the tunnel

Use the helper script with a host alias from your own `~/.ssh/config`:

```bash
SSH_ALIAS=<your-ssh-alias> ./scripts/tunnel.sh open     # also: close, status
```

It forwards the four ports above, skips any local port that is already in use, and uses a control socket so `close` and `status` work. Override ports with `LOCAL_POSTGRES_PORT`, `LOCAL_KAFKA_PORT`, `LOCAL_FLOCI_PORT`, `LOCAL_FLOCI_UI_PORT`.

You may instead keep `LocalForward` lines in your SSH config. Do not do both for the same port.

## SSH config (placeholders only)

Keep your real config in `~/.ssh/config`. Do not commit it.

```
Host <your-ssh-alias>
    HostName <VPS_HOST>
    User <SSH_USER>
    IdentityFile ~/.ssh/<your-key>
    ServerAliveInterval 30
    ServerAliveCountMax 3
```

`autossh` can reconnect automatically if the tunnel drops. When the tunnel is down, the application and services on your machine lose their connections and must reconnect.

## Kafka listeners (not yet tested)

Kafka clients connect to the bootstrap address, then reconnect to whatever address the broker **advertises**. Through a tunnel that address must be `localhost:9094`, otherwise the client hangs even though the tunnel is open.

With a single broker, [`../compose/kafka.compose.yml`](../compose/kafka.compose.yml) uses two listeners:

| Listener | Address | Used by |
|---|---|---|
| `INTERNAL` | `kafka:9092` | other containers on the VPS (not published) |
| `EXTERNAL` | advertised as `localhost:9094`, published on `127.0.0.1:9094` | your machine through the tunnel |

Because the advertised address is fixed to `localhost:9094`, clients on your machine must use local port **9094** (do not remap it).

Check from your machine after opening the tunnel: connect a Kafka client to `localhost:9094`, list topics, produce and consume one message. Record the result in [`known-risks.md`](known-risks.md).

## Floci

- Endpoint through the tunnel: `http://localhost:4566`.
- UI through the tunnel: `http://localhost:4500/` (separate container `floci-aws-ui` on the VPS, not yet in `floci.compose.yml`).
- [`../compose/floci.compose.yml`](../compose/floci.compose.yml) sets `FLOCI_STORAGE_MODE` explicitly (the default image uses `memory` and loses everything on restart). `hybrid` keeps data across restarts but can lose the latest writes after a sudden stop.
- Data is in a named volume.
- Unsupported CloudFormation resource types fail loudly (`FLOCI_SERVICES_CLOUDFORMATION_ALLOW_STUB_UNSUPPORTED_RESOURCE_TYPES=false`).
- The `/var/run/docker.sock` mount is **off** by default because it grants very high privileges on the host. Turn it on only if Floci needs it for the services you use.

## Postgres

- Published as `127.0.0.1:5432:5432`.
- A dedicated role and database are created on first start from `compose/.env`; the admin account is used only for that.
- The application role has `CREATEDB` because `prisma migrate dev` needs a shadow database. It is not a superuser.
- The application owns the schema (Prisma migrations). Python services read and write rows but never change the schema.
