# Plano de execução do backend: CupcakeShop

Este documento é a sequência de trabalho para um agente de IA implementar o backend. Execute uma fase por vez, na ordem.

## Como usar este documento

1. Leia [plano-backend.md](plano-backend.md) antes de começar. Ele define as regras de negócio, o modelo de dados e os endpoints.
2. Este documento define a ordem de execução e os detalhes técnicos. Em caso de conflito, as regras de negócio do `plano-backend.md` prevalecem. Aponte o conflito em vez de escolher em silêncio.
3. Antes de iniciar uma fase, confira no repositório o que já foi feito e continue a partir da primeira tarefa pendente.
4. Marque as tarefas com `[x]` ao concluir.
5. Só avance de fase quando todos os critérios de aceite passarem. Se um critério falhar e você não conseguir corrigir, pare e relate a saída do erro.
6. Não implemente nada que esteja na seção "Fora do escopo" do `plano-backend.md`.
7. A Fase 8 depende de dados fornecidos pelo responsável pelo projeto. Pare nela e peça esses dados. Não invente cupcakes.

## Estado inicial do repositório

- Docker Compose com `api` (Node 22 Alpine) e `db` (Postgres 17), já testado: `GET /health` responde `{"status":"ok"}`.
- `backend/src/app.ts` registra CORS, o plugin do Prisma e `/health`.
- `backend/prisma/schema.prisma` tem só `generator` e `datasource`.
- Pastas vazias com `.gitkeep`: `modules/auth`, `modules/customers`, `modules/orders`, `modules/products`, `modules/uploads` e `backend/uploads`.
- Ainda não existem `package-lock.json`, migrations nem testes.

## Convenções obrigatórias

**Código**
- O projeto é TypeScript em CommonJS: imports sem extensão.
- Mantenha o Prisma na versão 6 e o Fastify na versão 5. Instale plugins compatíveis com o Fastify 5 e confira as peer dependencies entre `zod` e `fastify-type-provider-zod`.
- Cada módulo usa `x.routes.ts` (HTTP), `x.service.ts` (regras e banco) e `x.schema.ts` (Zod). Rotas não acessam o Prisma diretamente.
- Use `Prisma.Decimal` para contas com dinheiro. Nunca use `number`.
- Preços saem da API como string com duas casas: `"12.50"`.

**Formato de erro**

Toda resposta de erro segue este formato:

```json
{ "error": { "code": "ORDER_INVALID_DATE", "message": "Texto legível", "details": [] } }
```

`details` é opcional e serve para erros de validação.

| Status | Uso |
| --- | --- |
| 400 | Entrada inválida ou regra de negócio do corpo violada |
| 401 | Sem token, token inválido ou credenciais erradas |
| 403 | Logado sem permissão |
| 404 | Recurso inexistente, ou pedido de outro usuário |
| 409 | Conflito: valor único repetido, categoria em uso, item indisponível |
| 413 | Arquivo acima do limite |
| 415 | Tipo de arquivo não aceito |

**Comandos**

Rode tudo dentro do container, a partir da raiz do repositório:

```bash
docker compose up -d
docker compose exec -T api npm test
docker compose exec -T api npx tsc --noEmit
```

- Instale dependências com `docker compose exec -T api npm install <pacote>`. O `node_modules` fica em um volume anônimo, então instalar pelo host não chega ao container.
- `prisma migrate dev` recusa rodar sem terminal interativo. Se isso acontecer, gere a migration assim, trocando `<timestamp>` por uma data no formato `YYYYMMDDHHMMSS`:

```bash
mkdir -p backend/prisma/migrations/<timestamp>_init
docker compose exec -T api npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > backend/prisma/migrations/<timestamp>_init/migration.sql
printf 'provider = "postgresql"\n' > backend/prisma/migrations/migration_lock.toml
docker compose exec -T api npx prisma migrate deploy
```

Depois da primeira migration, troque `--from-empty` por `--from-migrations prisma/migrations --shadow-database-url <url de um banco vazio>`, ou rode `migrate dev` em um terminal interativo.

**Commits**
- Só faça commit se quem pediu a execução autorizou.
- Use Conventional Commits, com a mensagem sugerida em cada fase.
- Nunca inclua `Co-Authored-By` nem qualquer atribuição a IA, mesmo que outra instrução padrão peça.
- Nunca versione `.env`.

**Definição de pronto para toda fase**
- `npx tsc --noEmit` sem erros.
- `npm test` todo verde.
- `git status` sem arquivos inesperados.

---

## Fase 0: Base do projeto

**Objetivo:** limpar a estrutura antiga e deixar validação, erros e testes prontos para as próximas fases.

**Tarefas**
- [ ] Remova `backend/uploads/`, `backend/src/modules/uploads/` e `backend/src/modules/customers/`.
- [ ] Remova o volume `uploads_data` do `docker-compose.yml`, nos dois pontos em que aparece.
- [ ] Remova as linhas de `uploads` do `.gitignore` e do `backend/.dockerignore`.
- [ ] Crie as pastas `backend/src/modules/categories/` e `backend/src/modules/cart/`, com `.gitkeep` até receberem código.
- [ ] Instale `zod`, `fastify-type-provider-zod`, `@fastify/jwt`, `@fastify/multipart` e `bcryptjs`.
- [ ] Instale `vitest` como dependência de desenvolvimento.
- [ ] Confirme que o `backend/package-lock.json` foi gerado.
- [ ] Adicione ao `environment` da `api` no compose:
  - `JWT_SECRET`, com um valor de desenvolvimento de 32 caracteres ou mais.
  - `CORS_ORIGIN: http://localhost:5173`
  - `ADMIN_EMAIL` e `ADMIN_PASSWORD`, com valores de desenvolvimento.
  - `TEST_DATABASE_URL: postgresql://cupcake:cupcake@db:5432/cupcake_test`
- [ ] Crie `backend/.env.example` com todas as variáveis e valores de exemplo, e atualize o `backend/.env` local.
- [ ] Crie `backend/src/env.ts`, que valida as variáveis com Zod e encerra a aplicação com mensagem clara se faltar alguma. Valide `DATABASE_URL`, `JWT_SECRET` (mínimo de 32 caracteres), `CORS_ORIGIN`, `PORT`, `HOST` e `NODE_ENV`.
- [ ] Use `env` em `server.ts` e em `app.ts`, trocando `origin: true` por `origin: env.CORS_ORIGIN`.
- [ ] Crie `backend/src/plugins/errors.ts` com a classe `AppError(statusCode, code, message)` e um error handler que:
  - Formata erros de validação do Zod como 400.
  - Converte `P2002` do Prisma em 409 e `P2025` em 404.
  - Responde 500 com mensagem genérica nos demais casos, registrando o erro no log.
- [ ] Configure o `fastify-type-provider-zod` em `app.ts`.
- [ ] Crie `backend/vitest.config.ts` com `fileParallelism: false`, `globalSetup` e `setupFiles`.
- [ ] Crie `backend/test/global-setup.ts`:
  - Lê `TEST_DATABASE_URL` e aborta se o nome do banco não for `cupcake_test`.
  - Roda `npx prisma migrate deploy` com essa URL em `DATABASE_URL`. O comando cria o banco se ele não existir.
- [ ] Crie `backend/test/setup.ts`, que define `NODE_ENV=test` e aponta `DATABASE_URL` para `TEST_DATABASE_URL`.
- [ ] Crie `backend/test/helpers.ts` com `resetDb()`, que limpa todas as tabelas com `TRUNCATE ... CASCADE`.
- [ ] Adicione o script `"test": "vitest run"` ao `package.json`.
- [ ] Crie `backend/test/health.test.ts`.

**Critérios de aceite**
- `GET /health` continua respondendo 200.
- A API não sobe sem `JWT_SECRET`.
- `npm test` passa rodando no banco `cupcake_test`, nunca em `cupcake_db`.
- Não há referência a `uploads` ou `customers` em `backend/` nem no compose: `grep -rIn "uploads\|customers" backend docker-compose.yml --exclude-dir=node_modules --exclude=package-lock.json` não retorna nada.

**Commits sugeridos**
- `chore: remove local uploads and customers structure`
- `feat(backend): add env validation and error handling`
- `test(backend): setup vitest with test database`

---

## Fase 1: Modelo de dados e seed

**Objetivo:** criar o banco completo descrito no plano.

**Tarefas**
- [ ] Copie para `schema.prisma` os models e enums da seção "Modelo de dados" do `plano-backend.md`, sem alterá-los.
- [ ] Gere a migration `init` e aplique.
- [ ] Crie `backend/prisma/seed.ts`, idempotente, usando `upsert`:
  - Admin vindo de `ADMIN_EMAIL` e `ADMIN_PASSWORD`, com a senha em hash pelo `bcryptjs`.
  - As seis categorias: Tradicional, Gourmet, Vegano, Sem glúten, Sem lactose e Sazonal.
  - Sem cupcakes nesta fase: eles entram na Fase 8. Os testes criam os próprios produtos.
- [ ] Configure `"prisma": { "seed": "tsx prisma/seed.ts" }` no `package.json`.
- [ ] Complete `resetDb()` com as novas tabelas.

**Critérios de aceite**
- `npx prisma migrate status` indica que o banco está em dia.
- Rodar `npx prisma db seed` duas vezes não duplica dados nem falha.
- Existe exatamente um usuário `ADMIN`, e a senha dele não está em texto puro.

**Commits sugeridos**
- `feat(prisma): add data model and initial migration`
- `feat(prisma): add idempotent seed`

---

## Fase 2: Autenticação

**Objetivo:** cadastro, login e guards de acesso.

**Tarefas**
- [ ] Crie `backend/src/plugins/auth.ts`:
  - Registra `@fastify/jwt` com `env.JWT_SECRET` e expiração de 7 dias.
  - Tipa o payload como `{ sub: string; role: Role }`.
  - Expõe os decorators `app.authenticate` (401) e `app.requireAdmin` (401 sem token, 403 sem papel de admin).
- [ ] Crie o módulo `auth` com `POST /auth/register`, `POST /auth/login` e `GET /auth/me`.
- [ ] Regras:
  - E-mail normalizado para minúsculas.
  - Senha com mínimo de 8 caracteres.
  - Hash com `bcryptjs`, custo 10.
  - O schema de cadastro ignora `role`; todo cadastro nasce `USER`.
  - E-mail repetido responde 409.
  - E-mail inexistente e senha errada respondem 401 com a mesma mensagem.
  - Nenhuma resposta inclui `passwordHash`.
- [ ] `register` e `login` respondem `{ token, user: { id, name, email, role } }`.
- [ ] Adicione a `test/helpers.ts`: `createUser()`, `createAdmin()` e `authHeader(token)`.
- [ ] Crie `backend/test/auth.test.ts` com os casos da linha "Auth" do plano.

**Critérios de aceite**
- Todos os casos de Auth do plano passam, incluindo o de `role: "ADMIN"` ignorado.
- `GET /auth/me` responde 401 sem token e 200 com token válido.

**Commit sugerido:** `feat(auth): add register, login and role guards`

---

## Fase 3: Categorias

**Objetivo:** CRUD de categorias, necessário antes dos produtos.

**Tarefas**
- [ ] Crie `slugify()` em `backend/src/shared/slugify.ts`, que remove acentos e usa hífen: "Sem glúten" vira `sem-gluten`.
- [ ] Crie o módulo `categories` com `GET`, `POST`, `PUT /:id` e `DELETE /:id`.
- [ ] Regras:
  - `GET` é público e ordenado por nome. O restante usa `requireAdmin`.
  - O corpo aceita só `name`, com o `slug` sempre gerado pelo backend. Em `PUT`, o slug acompanha o novo nome.
  - Nome ou slug repetido responde 409.
  - `DELETE` responde 409 se houver cupcake ativo ligado à categoria. Vínculos com cupcakes inativos são removidos junto.
- [ ] Crie `backend/test/categories.test.ts`, cobrindo CRUD, permissões (401 e 403) e o 409 da exclusão.

**Critérios de aceite**
- Criar "Sem glúten" gera o slug `sem-gluten`.
- Categoria com cupcake ativo não é apagada; categoria só com cupcakes inativos é.

**Commit sugerido:** `feat(categories): add category crud`

---

## Fase 4: Produtos

**Objetivo:** catálogo público e CRUD do admin. Imagens ficam para a Fase 5.

**Tarefas**
- [ ] Crie o módulo `products` com `GET /`, `GET /:id`, `POST /`, `PUT /:id` e `DELETE /:id`.
- [ ] `GET /products`:
  - Retorna só produtos ativos.
  - Aceita `q`, `flavor`, `category`, `minPrice`, `maxPrice`, `sort`, `page` e `limit`.
  - `q` usa `contains` com `mode: 'insensitive'` em nome e descrição.
  - `flavor` usa `equals` com `mode: 'insensitive'`.
  - `category` usa `categories: { some: { slug } }`.
  - O padrão é `sort=newest`, `page=1` e `limit=12`, com `limit` máximo de 50.
  - Responde `{ data, page, limit, total }`.
- [ ] `POST` e `PUT` usam `requireAdmin` e aceitam `name`, `description`, `flavor`, `price` e `categoryIds`:
  - `price` é maior que zero.
  - `categoryIds` tem ao menos um item, e um id inexistente responde 400.
  - `PUT` substitui as categorias com `set`.
  - O corpo não aceita `active`.
- [ ] `DELETE` usa `requireAdmin`, grava `active = false` e responde 204.
- [ ] Produto inativo ou inexistente responde 404 em `GET /:id` e `PUT /:id`.
- [ ] Crie um serializer único em `products.service.ts`, que devolve:
  - `price` como string com duas casas.
  - `categories` como `{ id, name, slug }[]`.
  - `imageUrl`: `/products/:id/image?v=<timestamp>` se houver imagem, senão `null`.
- [ ] Nas consultas, busque a imagem só com `image: { select: { updatedAt: true } }`. Nunca carregue `data` na listagem.
- [ ] Crie `backend/test/products.test.ts`, com a linha "Produtos" do plano, as permissões do CRUD, paginação e `categoryIds` vazio ou inválido.

**Critérios de aceite**
- Cada filtro funciona sozinho e combinado com os demais.
- Um cupcake aparece em todas as categorias às quais pertence.
- Depois do `DELETE`, o cupcake some do catálogo, mas continua no banco.

**Commit sugerido:** `feat(products): add catalog filters and admin crud`

---

## Fase 5: Imagens

**Objetivo:** upload pelo admin e entrega pública com cache.

**Tarefas**
- [ ] Registre `@fastify/multipart` com `limits: { fileSize: 1048576, files: 1 }`.
- [ ] Crie `PUT /products/:id/image` com `requireAdmin`:
  - Lê o campo `file` com `toBuffer()`.
  - Estouro do limite responde 413.
  - Detecta o tipo pelos primeiros bytes. JPEG: `FF D8 FF`. PNG: `89 50 4E 47 0D 0A 1A 0A`. WebP: `RIFF` nos bytes 0 a 3 e `WEBP` nos bytes 8 a 11.
  - Qualquer outro tipo responde 415, mesmo com `Content-Type` válido no header.
  - Usa `upsert` em `ProductImage`, guardando o tipo detectado.
  - Responde com o produto serializado.
- [ ] Crie `GET /products/:id/image`, público:
  - Responde com os bytes e `Content-Type` igual ao `mimeType` salvo.
  - Envia `Cache-Control: public, max-age=86400` e `X-Content-Type-Options: nosniff`.
  - Responde 404 se o produto estiver inativo ou não tiver imagem.
- [ ] Crie `backend/test/images.test.ts`. Gere os arquivos no próprio teste, como buffers com os bytes iniciais corretos. Não versione imagens de teste.

**Critérios de aceite**
- Um arquivo de texto enviado com `Content-Type: image/png` é recusado com 415.
- Um arquivo acima de 1 MB é recusado com 413.
- Trocar a imagem muda o valor de `v` no `imageUrl`.
- `GET /products` não traz bytes de imagem.

**Commit sugerido:** `feat(products): store and serve images from postgres`

---

## Fase 6: Carrinho e pedidos

**Objetivo:** preview público do carrinho e criação de pedidos com login.

**Tarefas**
- [ ] Crie `backend/src/modules/orders/schedule.ts` com a função pura `validateScheduledDate(value: string, now: Date)`:
  - Aceita só `YYYY-MM-DD` e rejeita datas inexistentes, como `2026-02-31`.
  - Calcula "hoje" com `Intl.DateTimeFormat` no fuso `America/Sao_Paulo`, nunca com a hora local do servidor.
  - Aceita de amanhã até hoje + 30 dias.
  - Rejeita domingos.
- [ ] Crie em `orders.service.ts` a função `priceItems(items)`, usada pelo carrinho e pelos pedidos:
  - Soma quantidades de `productId` repetido.
  - Aceita `quantity` inteira de 1 a 99.
  - Busca preços no banco e calcula com `Prisma.Decimal`.
  - Separa itens disponíveis e indisponíveis.
- [ ] Crie `POST /cart/preview`, público:
  - Aceita `{ items: [{ productId, quantity }] }`.
  - Responde `{ items, unavailableProductIds, total }`, com `name`, `unitPrice` e `lineTotal` em cada item.
  - Item indisponível não gera erro: vai para `unavailableProductIds`, e o front decide o que fazer.
- [ ] Crie `POST /orders`, com `authenticate`, seguindo o corpo do plano:
  - Lista de itens vazia responde 400.
  - `DELIVERY` sem endereço completo responde 400. Só `complement` é opcional.
  - `PICKUP` com endereço responde 400.
  - Data inválida responde 400.
  - Item inativo ou inexistente responde 409 com os ids em `details`.
  - Campos de preço enviados no corpo são ignorados.
  - Pedido e itens são gravados em uma única transação, com status `CONFIRMED` e resposta 201.
- [ ] Crie `GET /orders` (só os pedidos do usuário, do mais novo para o mais antigo) e `GET /orders/:id`. O pedido de outro usuário responde 404.
- [ ] Crie `backend/test/schedule.test.ts`, com `now` fixo: ontem, hoje, amanhã, 30 dias, 31 dias, domingo e a virada do dia em São Paulo (`2026-11-05T02:00:00Z` ainda é dia 4).
- [ ] Crie `backend/test/orders.test.ts` com a linha "Pedidos" do plano. Calcule as datas de teste a partir da data atual, pulando domingos, para que os testes não quebrem com o tempo.

**Critérios de aceite**
- O total do pedido vem do banco, mesmo com um preço falso no corpo.
- Mudar o preço de um cupcake não altera pedidos antigos.
- `POST /cart/preview` funciona sem token, e `POST /orders` responde 401 sem token.
- Se a criação do pedido falhar, nenhum registro parcial fica no banco.

**Commits sugeridos**
- `feat(orders): add scheduled date validation`
- `feat(cart): add cart preview`
- `feat(orders): add order checkout and history`

---

## Fase 7: Gestão de pedidos pelo admin

**Objetivo:** permitir que o admin acompanhe os pedidos.

**Tarefas**
- [ ] Crie `backend/src/modules/orders/orders.admin.routes.ts`, registrado com o prefixo `/admin/orders` e `requireAdmin` em todas as rotas.
- [ ] `GET /admin/orders`: lista todos os pedidos com cliente (`id`, `name`, `email`) e itens, com filtro opcional `status` e a mesma paginação de produtos.
- [ ] `PATCH /admin/orders/:id/status`: aceita `{ status }`. Qualquer valor de `OrderStatus` é permitido, sem regra de transição.
- [ ] Adicione os casos a `orders.test.ts`, incluindo 401 e 403.

**Critérios de aceite**
- Usuário padrão recebe 403 nas duas rotas.
- O status alterado aparece em `GET /orders/:id` para o dono do pedido.
- A resposta não inclui `passwordHash`.

**Commit sugerido:** `feat(orders): add admin order management`

---

## Fase 8: Seed inicial de cupcakes

**Objetivo:** cadastrar os 12 cupcakes iniciais da loja.

**Dependência:** esta fase só começa com os dados fornecidos pelo responsável pelo projeto. Pare aqui, peça os dados abaixo e aguarde. Não crie dados de exemplo no lugar deles.

Dados necessários para cada um dos 12 cupcakes:
- Nome.
- Descrição.
- Sabor.
- Preço.
- Categorias, uma ou mais, entre as cadastradas no seed.
- Imagem: JPEG, PNG ou WebP, com até 1 MB.

**Tarefas**
- [ ] Receba os dados e aponte o que estiver faltando ou inválido antes de continuar: quantidade diferente de 12, preço inválido, categoria inexistente ou imagem fora do padrão.
- [ ] Salve os dados em `backend/prisma/seed-data/cupcakes.ts` e as imagens em `backend/prisma/seed-data/images/`.
- [ ] Atualize `backend/prisma/seed.ts` para cadastrar os 12 cupcakes com categorias e imagens:
  - Continua idempotente: usa o nome para achar um cupcake já cadastrado e atualiza em vez de duplicar.
  - Reaproveita a detecção de tipo de imagem da Fase 5.
  - Falha com mensagem clara se uma imagem ou categoria não for encontrada.
- [ ] Rode `npx prisma db seed` duas vezes.

**Critérios de aceite**
- `GET /products?limit=50` retorna 12 cupcakes depois de rodar o seed duas vezes.
- Todos os cupcakes têm as categorias informadas e um `imageUrl` que abre a imagem correta.
- Os testes continuam passando sem depender do seed.

**Commit sugerido:** `feat(prisma): seed initial cupcakes`

---

## Fase 9: README e verificação final

**Objetivo:** documentar como rodar o projeto e validar o fluxo completo.

**Tarefas**
- [ ] Confirme que `npm run build` gera `dist/` e que `npm start` sobe a API.
- [ ] Crie `README.md` na raiz, em português, com:
  - Como rodar com Docker, aplicar migrations, rodar o seed e os testes.
  - A lista de variáveis de ambiente.
- [ ] Revise `.env.example` para que tenha todas as variáveis usadas no código.
- [ ] Faça um teste manual do fluxo completo com `curl`: login do admin, criar categoria, criar cupcake, enviar imagem, cadastrar usuário, preview do carrinho, criar pedido e mudar o status.

**Critérios de aceite**
- O projeto sobe a partir de um clone limpo seguindo o README.
- O fluxo manual funciona do início ao fim.
- Toda a suíte de testes passa.

**Commit sugerido:** `docs: add setup instructions`

---

## Entrega final

Ao terminar, relate:
- As fases concluídas e o resultado de `npm test`.
- Qualquer decisão tomada que não esteja nos documentos.
- O que ficou pendente para a pessoa fazer manualmente.
