```
docker run \
 -e POSTGRES_USER=postgres \
 -e POSTGRES_PASSWORD=postgres \
 -e PGDATA=/var/lib/postgresql/data/pgdata \
 -p 5432:5432 -it postgres:15.1-alpine
```

Run these in parallel

```
VARIANT=a node --loader ts-node/esm main.ts
```

```
VARIANT=b node --loader ts-node/esm main.ts
```
