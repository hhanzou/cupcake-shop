# Plano de implementação do backend: CupcakeShop

Trabalho de faculdade: a prioridade é funcionar de ponta a ponta em serviços gratuitos, com o mínimo de peças.

## Resumo das decisões

| Tema | Decisão | Motivo |
| --- | --- | --- |
| Usuários | Uma tabela `User` com `role` (`USER` ou `ADMIN`) | Evita duplicar login; `customers` deixa de existir |
| Login | JWT no header `Authorization: Bearer`, senha com `bcryptjs` | Funciona com front e API em domínios diferentes, sem problemas de cookie |
| Carrinho | Fica no front (`localStorage`); o backend só valida e calcula | Permite comprar sem login até o pagamento, sem tabela de carrinho |
| Pagamento | Simulado no front; o pedido só é criado depois da simulação | Nenhum endpoint de pagamento é necessário |
| Imagens | Guardadas no Postgres, em tabela própria | É a única opção que sobrevive no plano gratuito sem serviço de bucket (ver seção Imagens) |
| Validação | `zod` com `fastify-type-provider-zod` | Valida a entrada e gera os tipos |
| Testes | `vitest` com `app.inject()` e um banco de teste | Testa as rotas sem subir servidor |

## Regras de negócio

**Visitante (sem login)**
- Vê o catálogo, filtra, pesquisa e monta o carrinho.
- O login só é exigido ao finalizar a compra.

**Usuário padrão**
- Tudo o que o visitante faz, mais finalizar a compra e ver os próprios pedidos.

**Admin**
- CRUD de cupcakes, incluindo a imagem.
- CRUD de categorias. Uma categoria ligada a um cupcake ativo não pode ser apagada: a API responde 409 até o admin remover o vínculo.
- Vê todos os pedidos e muda o status deles.
- Criado pelo seed. Nenhuma rota pública cria admin, e o cadastro ignora qualquer `role` enviado no corpo.

**Compra**
- O cliente escolhe `PICKUP` (buscar na loja) ou `DELIVERY` (entrega no endereço).
- Nos dois casos há uma data planejada, só o dia, sem horário: a partir do dia seguinte e até 30 dias à frente, exceto domingos, considerando o fuso `America/Sao_Paulo`.
- O endereço é obrigatório em `DELIVERY` e proibido em `PICKUP`.
- O backend ignora preços vindos do front: recalcula tudo a partir do banco e copia o preço para o item do pedido, para que mudanças futuras não alterem pedidos antigos.
- Só cupcakes ativos podem ser comprados.

**Remoção de cupcake**
- `DELETE` é lógico (`active = false`), porque itens de pedidos antigos apontam para o produto.

## Modelo de dados

```prisma
enum Role {
  USER
  ADMIN
}

enum FulfillmentType {
  PICKUP
  DELIVERY
}

enum OrderStatus {
  CONFIRMED
  PREPARING
  READY
  COMPLETED
  CANCELED
}

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role     @default(USER)
  orders       Order[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Category {
  id        String    @id @default(uuid())
  name      String    @unique
  slug      String    @unique
  products  Product[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Product {
  id          String        @id @default(uuid())
  name        String
  description String?
  flavor      String
  categories  Category[]
  price       Decimal       @db.Decimal(10, 2)
  active      Boolean       @default(true)
  image       ProductImage?
  orderItems  OrderItem[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([flavor])
}

model ProductImage {
  productId String   @id
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  data      Bytes
  mimeType  String
  updatedAt DateTime @updatedAt
}

model Order {
  id              String          @id @default(uuid())
  userId          String
  user            User            @relation(fields: [userId], references: [id])
  status          OrderStatus     @default(CONFIRMED)
  fulfillmentType FulfillmentType
  scheduledDate   DateTime        @db.Date
  total           Decimal         @db.Decimal(10, 2)
  street          String?
  number          String?
  complement      String?
  district        String?
  city            String?
  state           String?
  zipCode         String?
  items           OrderItem[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([userId])
}

model OrderItem {
  id        String  @id @default(uuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product @relation(fields: [productId], references: [id])
  quantity  Int
  unitPrice Decimal @db.Decimal(10, 2)

  @@index([orderId])
}
```

Observações:
- `Category` e `Product` têm relação muitos-para-muitos: um cupcake pode ter várias categorias, e o Prisma cria a tabela de ligação. O admin precisa escolher ao menos uma.
- O `slug` é gerado a partir do nome, e o seed cria as categorias iniciais: Tradicional, Gourmet, Vegano, Sem glúten, Sem lactose e Sazonal.
- O endereço fica no próprio pedido. Não há tabela de endereços salvos.
- `scheduledDate` é só data, sem hora, o que evita problemas de fuso.
- `Decimal` chega ao JSON como string: as respostas devem devolver o preço como string (`"12.50"`) ou o front precisa convertê-lo. Definir isso uma vez só, no serializer de produto e pedido.

## Endpoints

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET | `/health` | Público | Verifica se a API está de pé |
| POST | `/auth/register` | Público | Cria conta e devolve o token |
| POST | `/auth/login` | Público | Devolve o token |
| GET | `/auth/me` | Logado | Dados do usuário atual |
| GET | `/products` | Público | Lista ativos, com filtros |
| GET | `/products/:id` | Público | Detalhe do cupcake |
| GET | `/products/:id/image` | Público | Bytes da imagem |
| POST | `/products` | Admin | Cria cupcake |
| PUT | `/products/:id` | Admin | Atualiza cupcake |
| DELETE | `/products/:id` | Admin | Desativa cupcake |
| PUT | `/products/:id/image` | Admin | Envia ou troca a imagem (multipart) |
| GET | `/categories` | Público | Lista as categorias |
| POST | `/categories` | Admin | Cria categoria |
| PUT | `/categories/:id` | Admin | Atualiza categoria |
| DELETE | `/categories/:id` | Admin | Apaga categoria sem cupcakes ativos |
| POST | `/cart/preview` | Público | Valida itens e devolve preços e total atuais |
| POST | `/orders` | Logado | Cria o pedido após o pagamento simulado |
| GET | `/orders` | Logado | Pedidos do próprio usuário |
| GET | `/orders/:id` | Logado | Detalhe; só o dono acessa |
| GET | `/admin/orders` | Admin | Lista todos os pedidos, com filtro por status |
| PATCH | `/admin/orders/:id/status` | Admin | Muda o status do pedido |

Filtros de `GET /products`: `q` (nome e descrição, sem diferenciar maiúsculas), `flavor` (sem diferenciar maiúsculas), `category` (slug da categoria), `minPrice`, `maxPrice`, `sort` (`price_asc`, `price_desc`, `newest`), `page` e `limit`.

Corpo de `POST /orders`:

```json
{
  "items": [{ "productId": "uuid", "quantity": 2 }],
  "fulfillmentType": "DELIVERY",
  "scheduledDate": "2026-11-20",
  "address": {
    "street": "Rua das Flores",
    "number": "123",
    "district": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01000-000"
  }
}
```

## Fluxo de compra

1. O visitante adiciona cupcakes ao carrinho, salvo no `localStorage` do front.
2. Na tela do carrinho, o front chama `POST /cart/preview` para mostrar preços e total atualizados.
3. O cliente escolhe retirada ou entrega, a data e, se for entrega, o endereço.
4. Ao ir para o pagamento, o front exige login ou cadastro e mantém o carrinho.
5. O front simula o pagamento.
6. Com a simulação aprovada, o front chama `POST /orders`.
7. O backend valida tudo, recalcula o total e grava o pedido e os itens em uma transação. O pedido nasce `CONFIRMED`.

## Imagens

O plano anterior era gravar em disco (`backend/uploads` com volume Docker), mas isso não funciona no Render Free: o disco é efêmero, os arquivos somem a cada deploy, reinício ou spin down, e disco persistente é recurso pago.

| Opção | Upload pelo admin | Sem serviço externo | Sobrevive ao deploy gratuito |
| --- | --- | --- | --- |
| Disco local | Sim | Sim | Não |
| Bucket ou Cloudinary | Sim | Não | Sim |
| Arquivos fixos no repositório | Não | Sim | Sim |
| **Postgres (escolhida)** | **Sim** | **Sim** | **Sim** |

Como vai funcionar:
- Os bytes ficam em `ProductImage`, separados de `Product`, para que a listagem não carregue imagens.
- `PUT /products/:id/image` recebe o arquivo com `@fastify/multipart`.
- São aceitos JPEG, PNG e WebP, com limite de 1 MB por imagem. O tipo é conferido pelo conteúdo do arquivo, não só pelo header.
- `GET /products/:id/image` responde com `Cache-Control: public, max-age=86400`.
- As respostas de produto trazem `imageUrl` no formato `/products/:id/image?v=<timestamp>`, assim uma imagem trocada não fica presa no cache.

Cabe nos limites do Neon Free: 0,5 GB de armazenamento e 5 GB de transferência por mês. Com 50 cupcakes a 1 MB, são no máximo 50 MB. Atingir um limite suspende o banco até o mês seguinte, por isso o limite de tamanho e o cache não são opcionais.

Numa loja real, imagens no banco não seriam a melhor escolha. Aqui é uma troca consciente, e vale citá-la no relatório do trabalho.

## Estrutura de pastas

```text
backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── modules/
│   │   ├── auth/       (rotas, serviço e schemas)
│   │   ├── products/   (inclui as rotas de imagem)
│   │   ├── categories/
│   │   ├── cart/
│   │   └── orders/
│   ├── plugins/
│   │   ├── prisma.ts
│   │   ├── auth.ts     (authenticate e requireAdmin)
│   │   └── errors.ts   (formato padrão de erro)
│   ├── app.ts
│   └── server.ts
└── test/
```

Cada módulo segue o padrão `x.routes.ts`, `x.service.ts` e `x.schema.ts`.

Mudanças em relação ao que já está no repositório:
- Remover `backend/uploads/`, o volume `uploads_data` e o módulo `uploads`.
- Remover o módulo `customers` e criar `categories` e `cart`.

## Etapas

1. **Base:** aplicar as mudanças acima; adicionar `zod`, `.env.example`, `JWT_SECRET`, `package-lock.json` e o handler de erros.
2. **Dados:** escrever o schema, criar a primeira migration e o seed com admin e categorias.
3. **Autenticação:** cadastro, login, `/auth/me` e os guards `authenticate` e `requireAdmin`.
4. **Catálogo:** categorias, listagem com filtros, detalhe e CRUD do admin.
5. **Imagens:** upload e entrega com cache.
6. **Compra:** `POST /cart/preview`, as rotas de pedidos e a gestão de pedidos pelo admin.
7. **Seed inicial de cupcakes:** cadastrar os 12 cupcakes iniciais da loja. Esta etapa depende do responsável pelo projeto, que vai fornecer os dados.

Os testes de cada etapa são escritos junto com ela.

## Testes

`vitest` com `app.inject()`, usando um banco `cupcake_test` no mesmo container Postgres. Rodam com `npm test`, e as tabelas são limpas entre os testes.

| Área | Casos |
| --- | --- |
| Health | Responde 200 |
| Auth | Cadastro funciona; e-mail repetido é recusado; senha errada dá 401 |
| Auth | `role: "ADMIN"` no cadastro é ignorado |
| Produtos | Pesquisa e filtros por sabor e categoria retornam os itens certos; inativos não aparecem |
| Permissões | Sem login dá 401; usuário padrão no CRUD dá 403; admin consegue |
| Categorias | Apagar categoria ligada a cupcake ativo dá 409 |
| Imagens | Tipo inválido e arquivo acima do limite são recusados |
| Pedidos | Sem login dá 401; retirada e entrega válidas criam o pedido |
| Pedidos | Entrega sem endereço, data passada e domingo dão 400 |
| Pedidos | O total vem do banco, mesmo que o corpo envie outro preço |
| Pedidos | Um usuário não acessa o pedido de outro |
| Pedidos | Só o admin lista todos os pedidos e muda o status |

## Fora do escopo

- Deploy: fica para um momento posterior.
- Pagamento real.
- Controle de estoque.
- Taxa de entrega e área de cobertura.
- Recuperação de senha e confirmação de e-mail.
- Carrinho sincronizado entre dispositivos.
- Refresh token: o token expira em 7 dias e o usuário faz login de novo.
