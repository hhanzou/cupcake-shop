# Projeto de Intervenção: CupcakeShop

Documentação do projeto desenvolvido no PIT I, revisada e atualizada no PIT II com o que foi efetivamente construído: API, front-end e publicação.

| | |
| --- | --- |
| **Estudante** | Erick Victor de Souza de Oliveira |
| **Situação-problema** | 1: aplicativo de vendas online para uma loja de cupcakes gourmet |
| **Repositório** | https://github.com/hhanzou/cupcake-shop |
| **Versão publicada** | v1.0.1 |

## Sumário

1. [Situação-problema](#1-situação-problema)
2. [Objetivo](#2-objetivo)
3. [Revisão de conceito](#3-revisão-de-conceito)
4. [Metodologia](#4-metodologia)
5. [Histórias de usuário](#5-histórias-de-usuário)
6. [Backlog priorizado e sprints](#6-backlog-priorizado-e-sprints)
7. [Regras de negócio](#7-regras-de-negócio)
8. [Arquitetura e tecnologias](#8-arquitetura-e-tecnologias)
9. [Tempo](#9-tempo)
10. [Procedimento e materiais](#10-procedimento-e-materiais)
11. [Resultado e discussão](#11-resultado-e-discussão)
12. [O que mudou em relação ao PIT I](#12-o-que-mudou-em-relação-ao-pit-i)

---

## 1. Situação-problema

A situação-problema escolhida aborda o desenvolvimento de um aplicativo para uma loja de cupcakes gourmet com foco em vendas online. O sistema deve permitir a visualização de produtos, a realização de pedidos, o pagamento e o acompanhamento das entregas, usando conceitos de requisitos ágeis para organizar o desenvolvimento.

## 2. Objetivo

No PIT I, o objetivo era levantar e estruturar os requisitos do aplicativo, criando histórias de usuário e organizando as funcionalidades em um backlog priorizado.

No PIT II, o objetivo passa a ser **entregar o sistema funcionando a partir desse backlog**:

- Refinar as histórias de usuário com critérios de aceite verificáveis.
- Implementar a API, o banco de dados e a loja web.
- Cobrir as regras de negócio com testes automatizados.
- Publicar a aplicação com um processo de entrega automatizado.
- Manter a documentação rastreável: cada história aponta para a entrega que a atendeu.

## 3. Revisão de conceito

| Conceito | Como foi aplicado no projeto |
| --- | --- |
| Levantamento e análise de requisitos | Identificação dos atores (visitante, cliente e administrador) e das necessidades de cada um |
| Histórias de usuário | Cada funcionalidade foi escrita no formato "Como... quero... para...", com critérios de aceite |
| Backlog de produto e priorização | Histórias agrupadas em épicos e priorizadas com MoSCoW (Must, Should, Could, Won't) |
| Desenvolvimento iterativo e incremental | Entrega em sprints: requisitos, API, loja web, publicação e melhorias |
| Regras de negócio | Documentadas na seção 7 e validadas no servidor, que é a autoridade sobre preços, datas e permissões |
| Arquitetura em camadas | API organizada em módulos, cada um com rotas (HTTP), serviço (regras e banco) e esquema (validação) |
| Modelagem de dados | Banco relacional com usuários, categorias, produtos, imagens, pedidos e itens de pedido |
| Testes de software | Testes automatizados de integração na API e unitários no front-end |
| Segurança | Senhas com hash, autenticação por token, controle de acesso por papel e validação de toda entrada |
| Versionamento | Git com mensagens padronizadas (Conventional Commits) e versões marcadas com tags |
| Integração e entrega contínuas | Pipeline que testa, gera a imagem, aplica as migrations e publica a cada versão |

## 4. Metodologia

Foi usada uma abordagem ágil, iterativa e incremental.

1. **Levantamento:** análise do cenário da loja e identificação dos atores.
2. **Histórias de usuário:** escrita das histórias e dos critérios de aceite.
3. **Priorização:** organização do backlog com MoSCoW. O que é essencial para vender (catálogo, carrinho, pedido e conta) veio primeiro.
4. **Planejamento técnico:** antes de cada sprint de desenvolvimento, as histórias foram detalhadas em um plano com decisões técnicas, tarefas e critérios de aceite.
5. **Desenvolvimento em sprints:** cada sprint entregou um incremento utilizável.
6. **Definição de pronto:** uma tarefa só é considerada pronta com checagem de tipos sem erros, todos os testes passando e o repositório sem arquivos inesperados.
7. **Revisão:** ao fim de cada sprint, o fluxo completo foi testado manualmente, e o que surgiu de ajuste virou história nova no backlog (sprint 4).

O acompanhamento é feito pelo histórico do Git: cada história corresponde a um ou mais commits, com mensagens no padrão Conventional Commits (`feat`, `fix`, `docs`, `test`, `ci`).

## 5. Histórias de usuário

**Atores**

- **Visitante:** pessoa sem login. Vê o catálogo e monta o carrinho.
- **Cliente:** usuário com conta. Finaliza a compra e acompanha os pedidos.
- **Administrador:** gerencia cupcakes, categorias e pedidos.

**Prioridade (MoSCoW):** Must = essencial, Should = importante, Could = desejável.

**Status:** todas as histórias abaixo estão concluídas, exceto quando indicado.

### Épico 1: Catálogo

| ID | História | Prioridade | Critérios de aceite | Sprint |
| --- | --- | --- | --- | --- |
| HU01 | Como visitante, quero ver os cupcakes disponíveis com foto, nome, descrição e preço, para escolher o que comprar. | Must | Só cupcakes ativos aparecem. O preço aparece em reais. A lista é paginada. | 1 e 2 |
| HU02 | Como visitante, quero pesquisar e filtrar por sabor, categoria e faixa de preço, para encontrar um cupcake mais rápido. | Must | Os filtros funcionam sozinhos e combinados. A pesquisa ignora maiúsculas. Os filtros ficam na URL, então a busca pode ser compartilhada. | 1 e 2 |
| HU03 | Como visitante, quero ordenar por preço ou por novidade, para comparar as opções. | Should | Há três ordenações: menor preço, maior preço e mais recentes. | 1 e 2 |
| HU04 | Como visitante, quero abrir a página de um cupcake, para ver os detalhes antes de comprar. | Must | A página mostra foto, descrição, sabor, categorias e preço. Um cupcake removido responde "não encontrado". | 1 e 2 |
| HU05 | Como visitante, quero ver com clareza quais filtros estão ativos, para entender o resultado da busca. | Could | Os filtros ativos aparecem como etiquetas removíveis. Há um indicador enquanto a lista carrega. | 4 |

### Épico 2: Conta e acesso

| ID | História | Prioridade | Critérios de aceite | Sprint |
| --- | --- | --- | --- | --- |
| HU06 | Como visitante, quero criar uma conta, para finalizar compras. | Must | O e-mail é único. A senha nunca é guardada em texto puro. O cadastro nunca cria administrador. | 1 e 2 |
| HU07 | Como cliente, quero entrar com e-mail e senha, para acessar meus pedidos. | Must | E-mail inexistente e senha errada devolvem a mesma mensagem. A sessão dura 7 dias. | 1 e 2 |
| HU08 | Como cliente, quero que a loja exija uma senha forte no cadastro, para proteger a minha conta. | Should | Mínimo de 8 caracteres, com maiúscula, minúscula, número e caractere especial. A tela mostra quais regras faltam enquanto a pessoa digita. | 4 |
| HU09 | Como dono da loja, quero que só administradores acessem a área de gestão, para proteger os dados. | Must | Sem login, a API responde 401. Cliente comum recebe 403. | 1 e 2 |

### Épico 3: Carrinho

| ID | História | Prioridade | Critérios de aceite | Sprint |
| --- | --- | --- | --- | --- |
| HU10 | Como visitante, quero montar um carrinho sem precisar de login, para decidir a compra com calma. | Must | O carrinho sobrevive ao recarregar a página. O login só é pedido no pagamento. | 1 e 2 |
| HU11 | Como visitante, quero ver preços e total sempre atualizados, para saber quanto vou pagar. | Must | O total é calculado pelo servidor com os preços atuais. Itens que saíram do catálogo aparecem marcados e bloqueiam o avanço. | 1 e 2 |
| HU12 | Como cliente, quero escrever uma observação em cada cupcake, para personalizar o pedido. | Could | Até 200 caracteres por item. O mesmo cupcake pode ter observações diferentes. A observação aparece para o cliente e para o administrador. | 4 |

### Épico 4: Pedido e pagamento

| ID | História | Prioridade | Critérios de aceite | Sprint |
| --- | --- | --- | --- | --- |
| HU13 | Como cliente, quero escolher entre retirar na loja e receber em casa, para ter flexibilidade. | Must | Na entrega, o endereço completo é obrigatório. Na retirada, o endereço não é aceito. | 1 e 2 |
| HU14 | Como cliente, quero agendar a data do pedido, para recebê-lo quando preciso. | Must | A data vai do dia seguinte até 30 dias à frente, sem domingos, no horário de Brasília. | 1 e 2 |
| HU15 | Como cliente, quero informar um endereço válido, para que a entrega não falhe. | Should | O estado só aceita as 27 siglas oficiais. O CEP tem 8 dígitos. | 2 e 4 |
| HU16 | Como cliente, quero pagar e receber a confirmação do pedido, para ter certeza de que a compra foi feita. | Must | O pedido nasce com o status "Confirmado". Preços enviados pelo navegador são ignorados. O valor de pedidos antigos não muda quando o preço do cupcake muda. O pagamento é simulado (veja a seção 11). | 1 e 2 |

### Épico 5: Acompanhamento

| ID | História | Prioridade | Critérios de aceite | Sprint |
| --- | --- | --- | --- | --- |
| HU17 | Como cliente, quero ver o histórico dos meus pedidos, para consultar o que já comprei. | Must | A lista mostra só os pedidos do próprio cliente, do mais novo para o mais antigo. Um cliente não acessa o pedido de outro. | 1 e 2 |
| HU18 | Como cliente, quero acompanhar o status do pedido, para saber quando ele chega. | Must | Uma linha do tempo mostra as etapas: confirmado, em preparo, pronto e concluído. Um pedido cancelado é indicado. | 1 e 2 |
| HU19 | Como cliente, quero repetir um pedido anterior, para comprar de novo mais rápido. | Could | O botão "pedir novamente" leva os itens para o carrinho, com as observações. | 2 |

### Épico 6: Administração

| ID | História | Prioridade | Critérios de aceite | Sprint |
| --- | --- | --- | --- | --- |
| HU20 | Como administrador, quero cadastrar, editar e remover cupcakes, para manter o catálogo. | Must | O preço é maior que zero. Todo cupcake tem ao menos uma categoria. A remoção tira o cupcake da vitrine, mas preserva os pedidos antigos. | 1 e 2 |
| HU21 | Como administrador, quero enviar a foto do cupcake, para deixar a vitrine atrativa. | Must | São aceitos JPEG, PNG e WebP com até 1 MB. O tipo é conferido pelo conteúdo do arquivo, não pelo nome. | 1 e 2 |
| HU22 | Como administrador, quero gerenciar as categorias, para organizar o catálogo. | Should | Nomes não se repetem. Uma categoria com cupcake ativo não pode ser apagada. | 1 e 2 |
| HU23 | Como administrador, quero ver todos os pedidos e mudar o status deles, para controlar a produção e a entrega. | Must | A lista pode ser filtrada por status. A mudança de status aparece para o cliente. | 1 e 2 |
| HU24 | Como dono da loja, quero que a loja já comece com os cupcakes cadastrados, para abrir com a vitrine pronta. | Should | A carga inicial cria 12 cupcakes com foto e 6 categorias. Rodar a carga duas vezes não duplica dados. | 1 |

### Épico 7: Publicação e operação

| ID | História | Prioridade | Critérios de aceite | Sprint |
| --- | --- | --- | --- | --- |
| HU25 | Como dono da loja, quero a aplicação publicada na internet, para que os clientes possam acessá-la. | Must | A API roda em um serviço de hospedagem, com banco de dados gerenciado. | 3 |
| HU26 | Como desenvolvedor, quero publicar uma versão nova de forma automática, para reduzir erros manuais. | Should | Criar uma versão no GitHub dispara testes, geração da imagem, atualização do banco e publicação, nessa ordem. Se os testes falham, nada é publicado. | 3 |
| HU27 | Como visitante, quero ser avisado quando a loja estiver iniciando, para não achar que o site quebrou. | Could | Se a API demora a responder, a loja mostra uma tela de espera e segue sozinha quando a API acorda. | 3 |

### Histórias não implementadas

| ID | História | Prioridade | Motivo |
| --- | --- | --- | --- |
| HU28 | Como cliente, quero pagar com cartão ou Pix de verdade. | Won't | Exige contrato com um serviço de pagamento. Nesta versão o pagamento é simulado. |
| HU29 | Como cliente, quero recuperar a senha por e-mail. | Won't | Exige serviço de envio de e-mail. |
| HU30 | Como administrador, quero controlar o estoque. | Won't | A loja produz sob encomenda, com data agendada. |
| HU31 | Como cliente, quero ver a taxa de entrega e a área atendida. | Won't | Depende de regras de frete ainda não definidas pela loja. |

## 6. Backlog priorizado e sprints

| Sprint | Período | Meta | Histórias | Entrega |
| --- | --- | --- | --- | --- |
| 0 | PIT I | Entender o negócio e organizar os requisitos | Levantamento inicial | Histórias de usuário, regras de negócio e backlog priorizado |
| 1 | 04/11/2026 | API e banco de dados | HU01 a HU04, HU06, HU07, HU09 a HU11, HU13, HU14, HU16 a HU18, HU20 a HU24 | API completa, com testes automatizados e carga inicial |
| 2 | 05/11/2026 | Loja web | As mesmas histórias da sprint 1, agora com tela, mais HU15 e HU19 | Loja e área administrativa funcionando com a API |
| 3 | 07/11/2026 | Publicação | HU25 a HU27 | Imagem de produção, pipeline de entrega e versões v1.0.0 e v1.0.1 |
| 4 | 09/11/2026 | Melhorias vindas da revisão | HU05, HU08, HU12 e HU15 | Senha forte, observações por cupcake, validação de estado e filtros mais claros |

A ordem seguiu a prioridade: primeiro as histórias Must, que formam o fluxo de venda completo, e depois as Should e Could. As histórias da sprint 4 não existiam no PIT I: surgiram ao usar o sistema pronto, o que é esperado em um processo iterativo.

## 7. Regras de negócio

| ID | Regra | Histórias |
| --- | --- | --- |
| RN01 | O visitante pode ver o catálogo e montar o carrinho sem login. O login só é exigido ao finalizar a compra. | HU10 |
| RN02 | Só cupcakes ativos aparecem no catálogo e podem ser comprados. | HU01, HU11 |
| RN03 | O servidor ignora preços enviados pelo navegador e recalcula tudo a partir do banco. | HU11, HU16 |
| RN04 | O preço é copiado para o item do pedido. Mudanças futuras de preço não alteram pedidos antigos. | HU16 |
| RN05 | O pedido é para retirada ou para entrega. O endereço é obrigatório na entrega e proibido na retirada. | HU13 |
| RN06 | A data do pedido vai do dia seguinte até 30 dias à frente, exceto domingos, no fuso de São Paulo. | HU14 |
| RN07 | Cada cupcake aceita de 1 a 99 unidades por pedido. | HU11 |
| RN08 | A remoção de um cupcake é lógica: ele sai da vitrine, mas continua no banco, porque pedidos antigos apontam para ele. | HU20 |
| RN09 | Uma categoria ligada a um cupcake ativo não pode ser apagada. | HU22 |
| RN10 | O administrador é criado na carga inicial. Nenhuma rota pública cria administrador. | HU06, HU09 |
| RN11 | Um cliente só acessa os próprios pedidos. | HU17 |
| RN12 | A senha do cadastro precisa de 8 caracteres ou mais, com maiúscula, minúscula, número e caractere especial. | HU08 |
| RN13 | A imagem do cupcake é JPEG, PNG ou WebP, com até 1 MB. | HU21 |
| RN14 | O status do pedido segue as etapas: confirmado, em preparo, pronto, concluído ou cancelado. | HU18, HU23 |

Todas as regras são validadas na API. O front-end repete algumas delas só para dar um retorno mais rápido ao usuário.

## 8. Arquitetura e tecnologias

```text
Navegador ──> Loja web (Next.js) ──> API REST (Fastify) ──> PostgreSQL
```

| Camada | Tecnologias | Papel |
| --- | --- | --- |
| Front-end (`frontend/`) | Next.js, React, TypeScript, Tailwind CSS e shadcn/ui | Catálogo, carrinho, checkout, pedidos e área administrativa |
| API (`backend/`) | Node.js 22, Fastify 5, TypeScript e Zod | Regras de negócio, autenticação e validação |
| Banco de dados | PostgreSQL 17 com Prisma 6 | Usuários, categorias, produtos, imagens e pedidos |
| Testes | Vitest | 96 testes na API e 27 no front-end |
| Ambiente local | Docker Compose | API e banco sobem com um comando |
| Publicação | GitHub Actions, GitHub Container Registry, Render e Neon | Pipeline de testes, imagem, migrations e publicação |

**Decisões que merecem registro**

- **Carrinho no navegador:** o carrinho fica salvo no dispositivo do visitante, e o servidor só valida e calcula. Isso permite comprar sem login até o pagamento e dispensa uma tabela de carrinho.
- **Imagens no banco:** as fotos ficam no PostgreSQL, em uma tabela separada. Em uma loja real, um serviço de armazenamento de arquivos seria mais indicado. Aqui foi uma troca consciente, porque a hospedagem gratuita apaga os arquivos em disco a cada publicação.
- **Autenticação por token (JWT):** funciona com o front-end e a API em domínios diferentes.
- **Servidor como autoridade:** preço, data, permissão e disponibilidade são sempre conferidos na API.

As instruções para rodar o projeto, a lista de rotas e o passo a passo da publicação estão no [README](../README.md).

## 9. Tempo

**PIT I: requisitos (11 horas e 30 minutos)**

| Atividade | Tempo |
| --- | --- |
| Análise do cenário e entendimento do negócio | 3 h |
| Identificação dos usuários e levantamento das necessidades | 1 h |
| Criação das histórias de usuário | 2 h |
| Documentação das regras de negócio e requisitos | 3 h |
| Organização e priorização do backlog | 1 h 30 |
| Revisão final da documentação | 1 h |

**PIT II: desenvolvimento e publicação (4 sprints, de 04/11 a 09/11/2026)**

| Sprint | Data | Atividade |
| --- | --- | --- |
| 1 | 04/11/2026 | Planejamento técnico e desenvolvimento da API |
| 2 | 05/11/2026 | Planejamento técnico e desenvolvimento da loja web |
| 3 | 07/11/2026 | Imagem de produção, pipeline e publicação |
| 4 | 09/11/2026 | Melhorias e revisão da documentação |

## 10. Procedimento e materiais

1. **Análise do cenário** da loja de cupcakes, para entender o negócio e as necessidades dos usuários (PIT I).
2. **Identificação dos atores:** visitante, cliente e administrador.
3. **Escrita das histórias de usuário** e das regras de negócio, e organização no backlog priorizado.
4. **Planejamento técnico da API:** modelo de dados, rotas, formato de erro e casos de teste.
5. **Desenvolvimento da API em fases:** base do projeto, modelo de dados, autenticação, categorias, produtos, imagens, carrinho e pedidos, e gestão pelo administrador. Cada fase só foi encerrada com os testes passando.
6. **Carga inicial:** cadastro dos 12 cupcakes com foto e das 6 categorias.
7. **Planejamento e desenvolvimento da loja web:** identidade visual, catálogo, conta, carrinho, checkout, pedidos e área administrativa.
8. **Teste manual do fluxo completo** com duas contas, uma de cliente e uma de administrador.
9. **Publicação:** imagem de produção enxuta, pipeline automatizado e versões v1.0.0 e v1.0.1.
10. **Melhorias** identificadas ao usar o sistema, registradas como novas histórias e entregues na sprint 4.
11. **Revisão da documentação**, ligando cada história à sua entrega.

**Materiais e ferramentas:** editor de texto e Trello (levantamento no PIT I), Visual Studio Code, Git e GitHub, Docker, Node.js, PostgreSQL, GitHub Actions, Render e Neon.

## 11. Resultado e discussão

O backlog do PIT I virou um sistema completo e em funcionamento:

- **27 histórias de usuário entregues**, cobrindo os quatro pontos da situação-problema: visualização de produtos, realização de pedidos, pagamento e acompanhamento das entregas.
- **API** com 21 rotas, autenticação, controle de acesso e validação de todas as entradas.
- **Loja web** com catálogo, carrinho, checkout, histórico de pedidos e área administrativa.
- **123 testes automatizados** (96 na API e 27 no front-end), todos passando.
- **Publicação automatizada:** uma nova versão passa por testes, geração de imagem, atualização do banco e publicação sem passos manuais.

**Discussão**

- **Priorizar deu resultado.** Como o fluxo de venda (catálogo, carrinho, pedido e conta) foi feito primeiro, o sistema já era utilizável ao fim da sprint 2. Publicação e melhorias vieram depois, sem travar o essencial.
- **Critérios de aceite viraram testes.** As histórias do PIT I descreviam a funcionalidade, mas não como verificar se ela estava pronta. Ao acrescentar critérios de aceite, cada um pôde virar um teste automatizado, o que reduziu falhas ao longo do desenvolvimento.
- **O backlog continuou vivo.** Quatro histórias (senha forte, observações por cupcake, validação de estado e filtros mais claros) só apareceram depois de usar o sistema pronto. Um levantamento feito de uma vez só não teria previsto isso.
- **Regras no servidor.** Calcular preço e validar data na API evitou que o valor de um pedido pudesse ser manipulado pelo navegador.

**Limitações**

- O **pagamento é simulado:** a loja não pede dados de cartão nem se comunica com um serviço de pagamento. A história HU28 registra o pagamento real como evolução futura.
- O **acompanhamento da entrega** é feito pelo status do pedido, atualizado pelo administrador. Não há rastreamento em tempo real.
- A hospedagem gratuita coloca a API para dormir quando não há acesso, e a primeira visita leva cerca de um minuto. A tela de espera (HU27) trata esse caso.
- Não há recuperação de senha, controle de estoque nem cálculo de frete (HU29 a HU31).

## 12. O que mudou em relação ao PIT I

| Ponto | PIT I | PIT II |
| --- | --- | --- |
| Objetivo | Levantar e organizar os requisitos | Entregar o sistema funcionando e publicado |
| Histórias de usuário | Citadas de forma geral | 31 histórias numeradas, com ator, prioridade e critérios de aceite |
| Backlog | Lista priorizada de funcionalidades | Épicos, prioridade MoSCoW e divisão em sprints com a entrega de cada uma |
| Regras de negócio | Mencionadas | 14 regras numeradas, ligadas às histórias |
| Atores | Cliente e administrador | Visitante, cliente e administrador |
| Arquitetura | Não definida | Camadas, tecnologias e decisões registradas |
| Testes | Não previstos | 123 testes automatizados e definição de pronto |
| Publicação | Não prevista | Pipeline automatizado e versões marcadas |
| Resultado | Requisitos estruturados | Sistema completo, com limitações e próximos passos declarados |
