# CupcakeShop

Backend da loja de cupcakes: API REST em Node 22, Fastify 5, Prisma 6 e PostgreSQL 17, tudo rodando em Docker.

A documentação de projeto está em [docs/plano-backend.md](docs/plano-backend.md) (regras de negócio, modelo de dados e endpoints).

## Como rodar

Pré-requisito: Docker com Docker Compose.

```bash
# 1. Sobe a API (porta 3000) e o Postgres (porta 5432)
docker compose up -d --build

# 2. Aplica as migrations
docker compose exec -T api npx prisma migrate deploy

# 3. Cria o admin e as categorias iniciais
docker compose exec -T api npx prisma db seed

# 4. Confere
curl http://localhost:3000/health
```

O compose já define as variáveis de ambiente de desenvolvimento, então não é preciso criar um `.env` para rodar com Docker. O admin criado pelo seed usa `ADMIN_EMAIL` e `ADMIN_PASSWORD` (por padrão `admin@cupcakeshop.local` / `admin12345`).

> O `tsx watch` pode não perceber mudanças de arquivos no Windows. Se o código novo não aparecer, rode `docker compose restart api`.

### Testes

```bash
docker compose exec -T api npm test            # roda a suíte no banco cupcake_test
docker compose exec -T api npm run typecheck   # checagem de tipos de src, test e prisma
```

Os testes usam um banco separado, `cupcake_test`, criado e migrado automaticamente. Eles recusam rodar em qualquer outro banco.

### Build de produção

```bash
docker compose exec -T api npm run build   # gera dist/
docker compose exec -T api npm start       # sobe a API a partir de dist/
```

### Migrations

Em um terminal interativo: `docker compose exec api npx prisma migrate dev --name <nome>`.

Sem terminal interativo, gere o SQL com `prisma migrate diff` (veja `docs/plano-execucao.md`) e aplique com `prisma migrate deploy`.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | Sim | URL de conexão do Postgres |
| `JWT_SECRET` | Sim | Segredo para assinar os tokens (mínimo de 32 caracteres) |
| `CORS_ORIGIN` | Sim | Origem do front-end liberada no CORS (ex.: `http://localhost:5173`) |
| `PORT` | Não | Porta da API (padrão `3000`) |
| `HOST` | Não | Endereço de escuta (padrão `0.0.0.0`) |
| `NODE_ENV` | Não | `development`, `test` ou `production` (padrão `development`) |
| `ADMIN_EMAIL` | Só no seed | E-mail do admin criado pelo seed |
| `ADMIN_PASSWORD` | Só no seed | Senha do admin criado pelo seed |
| `TEST_DATABASE_URL` | Só nos testes | URL do banco de testes (o nome do banco deve ser `cupcake_test`) |

Veja [backend/.env.example](backend/.env.example). A API não sobe se alguma variável obrigatória estiver ausente ou inválida.

## Endpoints

| Método | Rota | Acesso |
| --- | --- | --- |
| GET | `/health` | Público |
| POST | `/auth/register`, `/auth/login` | Público |
| GET | `/auth/me` | Logado |
| GET | `/products`, `/products/:id`, `/products/:id/image` | Público |
| POST, PUT, DELETE | `/products`, `/products/:id` | Admin |
| PUT | `/products/:id/image` | Admin |
| GET | `/categories` | Público |
| POST, PUT, DELETE | `/categories`, `/categories/:id` | Admin |
| POST | `/cart/preview` | Público |
| POST, GET | `/orders`, `/orders/:id` | Logado |
| GET, PATCH | `/admin/orders`, `/admin/orders/:id/status` | Admin |

Autenticação por JWT no header `Authorization: Bearer <token>`. Erros seguem o formato `{ "error": { "code", "message", "details" } }`.

## Estrutura

```text
backend/
├── prisma/        schema, migrations e seed
├── src/
│   ├── modules/   auth, categories, products, cart, orders (routes, service, schema)
│   ├── plugins/   prisma, auth e errors
│   ├── shared/    slugify, dinheiro e detecção de imagem
│   ├── app.ts
│   ├── env.ts
│   └── server.ts
└── test/
```
