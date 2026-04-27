# Reabrigo

Plataforma que conecta abrigos a doadores em situações de enchente, calculando automaticamente as necessidades reais de cada abrigo a partir de quem está lá e do que já tem em estoque.

**Projeto final** — formação Backend com Node.js, escola Vai na Web (2026).

- 🌐 Frontend em produção: <https://desafio-enchentes-frontend.onrender.com>
- 🔌 API em produção: <https://desafio-enchentes.onrender.com>

---

## 1. Apresentação da Ideia

A ideia surgiu a partir do desafio sobre enchentes no Brasil. Acompanhei por meio de redes sociais e reportagens, o que aconteceu no Rio Grande do Sul em 2024, em Petrópolis em 2022 e no litoral norte de São Paulo em 2023. O que sempre me passava pela cabeça era: como os coordenadores/pessoas responsáveis pelos abrigos conseguiam gerenciar estoque de suprimentos para tantas pessoas? E a única resposta que eu consguia imaginar era: planilhas compartilhadas e provavelmente não padronizadas, que poderiam gerar informações conflitantes com a realidade.

Dai surgiu a ideia de criar um sistema que pudesse, essencialmente, gerenciar as pessoas abrigadas e seu consumo de suprimentos, visando prevenir a escassez e indicar quais suprimentos estavam mais próximos de acabar. Durantea construção, fui visualizando telas e ideias, sendo que algumas delas ainda serão implementações futuras.

Sobre o sistema já em funcionamento:

1. **É reativo, não preditivo.** A demanda vai mudando enquanto o coordenador atualiza a planilha à mão.
2. **Depende de cada coordenador saber traduzir perfil em quantidade.** Quem está acostumado com o trabalho consegue, mas em situação de crise é trabalho cognitivo a mais que ele não tem como fazer.

Pensando nesse cenário, decidi focar no problema de **desequilíbrio entre o que os abrigos precisam e o que é efetivamente doado**, mas com um diferencial: em vez de pedir pro coordenador listar item a item, o **sistema deduz o que falta** a partir de quem está abrigado e do que já tem em estoque.

---

## 2. Problema Escolhido

Escolhi unir os **Casos 1 (Falta de Informação sobre Abrigos)** e **2 (Organização de Doações)** do briefing. Um sozinho não me convencia:

- O Caso 1 isolado vira uma "lista de abrigos" — útil pra vítima saber pra onde ir, mas raso como projeto técnico (qualquer planilha resolve).
- O Caso 2 isolado tem um problema claro: cadastrar uma doação é fácil, mas **pra onde essa doação vai?** Sem destino, vira um repositório que não resolve a logística.

Unir os dois cria a **regra de negócio interessante** que dá vida ao sistema: o abrigo informa apenas a sua composição demográfica e o estoque atual, e o sistema calcula tudo o que vai faltar nos próximos dias. O doador vê essa demanda real, faz uma oferta, e o sistema casa as duas pontas.

A camada de "lista de abrigos com vagas" do Caso 1 ficou como um **endpoint público adicional** — uma vítima pode entrar no site sem cadastro, ver onde tem vaga e ir pro mais próximo.

---

## 3. Solução Proposta

A plataforma se chama **Reabrigo** — referência ao ato de reabrigar quem perdeu tudo. Funciona em quatro etapas:

### 3.1 O coordenador cadastra o abrigo

Em vez de listar "preciso de 200 fraldas", ele informa o **que existe**:
- Composição demográfica agregada (12 crianças 0-3 anos, 8 mulheres adultas, 3 idosos…), sem nomes nem documentos
- Casos especiais sem identificação (1 diabético insulino-dependente, 1 gestante 33ª semana…)
- Estoque atual de cada recurso (50 fraldas P, 100 águas, 0 sabonetes…)

### 3.2 O sistema calcula o que vai faltar

A partir do perfil + estoque + **regras de consumo por categoria** (criança 0-3 usa 3 fraldas/dia, adulto usa 3 águas/dia…), o sistema projeta o consumo dos próximos dias e marca o que está em déficit. Exemplo concreto:

```
Abrigo com 12 crianças 0-3
Regra: criança 0-3 usa 3 fraldas P/dia
Estoque atual: 50 fraldas P
Prazo: 7 dias

→ Projeção: 12 × 3 × 7 = 252 fraldas
→ Déficit:  252 - 50 = 202 fraldas

Necessidade gerada: 202 fraldas P até daqui a 7 dias.
```

Esse é o **núcleo técnico** do projeto — o que o sistema traz de novo. Está num service isolado (`backend/services/calculoNecessidade.js`) que pode ser disparado por HTTP (coordenador clica "recalcular") ou por cron job no futuro (recalcula automaticamente toda noite).

### 3.3 O doador vê demanda real e faz oferta

Doadores (pessoas físicas, farmácias, supermercados, ONGs) abrem a plataforma e veem **necessidades concretas** — quantidade exata, recurso específico, abrigo de destino, prazo. Cadastram uma oferta com o que têm a doar, e o sistema mostra quais necessidades batem com a oferta deles.

### 3.4 O sistema acompanha até a entrega

Doador propõe match → coordenador aceita → doador marca em entrega → coordenador confirma recebido. Toda transição de status é uma transação atômica que **atualiza o estoque do abrigo automaticamente** quando a doação é confirmada — não precisa o coordenador re-digitar nada.

### Por que isso resolve o problema

A versão "ingênua" do sistema seria um cadastro de doação. Funciona, mas vira uma planilha online — não direciona quem ajuda, não prioriza quem mais precisa. O Reabrigo **estrutura a informação no formato em que ela deve ser consumida** — quantidade certa, recurso certo, prazo real — e deixa o matching transparente.

### Considerações do contexto (briefing)

- **Pessoas afetadas têm internet limitada.** A página pública (`/`) carrega rápido, mostra abrigos com vagas e localização — não exige login.
- **Voluntários e ONGs também acessam.** Doadores são uma das três roles do sistema; voluntários estão previstos como evolução futura (módulo conceitual com tela de demonstração).
- **Equipes de apoio se deslocam.** Localização do abrigo é informada em texto livre (não geolocalização) por ser MVP — a evolução natural seria PostGIS pra busca por raio.

---

## 4. Estrutura do Sistema

O projeto é um monorepo dividido em duas pastas no mesmo repositório:

### 4.1 Front-end — `frontend/`

- **React 19** + **Vite** — framework SPA, build rápido, HMR
- **Tailwind CSS 4** + **shadcn/ui** — componentes acessíveis e consistentes
- **react-router-dom** pra roteamento
- **fetch** nativo encapsulado em `lib/api.js` — `Authorization: Bearer <token>` automático
- **Context API** (`AuthContext`, `CatalogoContext`) pra estado compartilhado (token, dados do usuário, catálogo de tipos de recurso)

**Páginas implementadas:**
- Pública (sem login): Landing, Cadastro, Login, Lista de abrigos com vagas
- **Modo demo** (sem cadastro): tela exemplificando cada papel — coordenador, doador, voluntário (este último conceitual)
- Coordenador: Dashboard (visão geral), Abrigo (gestão de pessoas, casos, estoque, necessidades), Cadastro/edição de abrigos
- Doador: Dashboard com tabs (necessidades abertas, minhas ofertas, abrigos com vagas, meus matches), Nova oferta
- Admin: Painel com estatísticas e tracking de visitas a previews (local + global)

### 4.2 Back-end — `backend/`

- **Node.js 18+** + **Express 4** — framework HTTP
- **JWT (jsonwebtoken)** — autenticação stateless, tokens com expiração de 8h
- **bcrypt** — hash de senha (rounds=10)
- **Joi** — validação declarativa de payload em todas as rotas POST/PUT
- **pg** — driver PostgreSQL com pool de conexões; suporta SSL automaticamente em produção (Render exige)
- **CORS** — restrito por env var `FRONTEND_URL` em produção; permissivo em dev

**Organização** (padrão MVC simplificado):
```
backend/
├── server.js                 # entrada, monta middlewares e rotas
├── db/
│   ├── index.js              # pool pg
│   ├── schema.sql            # DDL completo + seed de catálogo
│   └── seed.js               # script idempotente que cria admin + demos
├── middlewares/
│   └── auth.js               # authRequired, hasRole
├── routes/
│   ├── usuarios.js           # cadastro + /me
│   ├── auth.js               # login (JWT)
│   ├── abrigos.js            # CRUD + sub-rotas (pessoas, casos, estoque)
│   ├── tiposRecurso.js       # GET público + admin CRUD
│   ├── necessidades.js       # GET paginado + POST /calcular/:id
│   ├── ofertas.js            # POST + listagens (minhas, públicas)
│   ├── matches.js            # POST com transação + PUT /:id/status
│   └── publico.js            # GET /abrigos com vagas + tracking de previews
└── services/
    └── calculoNecessidade.js # núcleo técnico — transação ACID
```

Total: **16 endpoints**, agrupados por recurso (RESTful).

### 4.3 Banco de Dados — PostgreSQL 16

- **13 tabelas + 7 ENUMs** no schema
- **Catálogo seedado** com 45 tipos de recurso e ~30 regras de consumo, baseados em listas reais de Defesa Civil e Cruz Vermelha pós-RS 2024
- **UUIDs** em entidades expostas ao frontend (não revelam sequência); SERIAL em catálogo interno
- **TIMESTAMPTZ** em todos os timestamps (resiliente a fuso horário entre dev local e prod em UTC)
- **Constraints de UNIQUE** garantem 1 categoria de pessoa por abrigo e 1 estoque por (abrigo, recurso) — usadas em UPSERT (`ON CONFLICT DO UPDATE`)
- **FKs com `ON DELETE CASCADE`** pra limpeza automática quando um abrigo é excluído
- **Tabela `preview_view`** pra contagem global de visitas a cada modo demo (sem dado pessoal)

#### Privacidade (LGPD light)

Decisão consciente desde o início:
- **Pessoas abrigadas** são cadastradas só por **categoria agregada** (nunca por nome ou CPF). Isso evita exposição de pessoas em situação de vulnerabilidade.
- **Casos especiais** (diabetes, gestação etc.) são registrados sem identificação — só `(abrigo_id, condição, observação)`.
- **Doadores** veem apenas o quê e quanto cada abrigo precisa, nunca a composição demográfica nem casos especiais.
- **Coordenador** vê tudo do abrigo dele, nada dos outros.
- **Admin** existe apenas via seed direto no banco — **não é cadastrável via API** (decisão de segurança: a API só aceita `role: 'coordenador'` ou `role: 'doador'`).

## 5. Como acessar a versão em produção

Ambas hospedadas no Render (plano gratuito):

- Frontend: <https://desafio-enchentes-frontend.onrender.com>
- API: <https://desafio-enchentes.onrender.com>

### Credenciais de demo (já populadas)

| Papel | E-mail | Senha |
|---|---|---|
| Coordenador | `coord@demo.dev` | `demo123` |
| Doador | `doador@demo.dev` | `demo123` |

### ⚠️ Ressalva — Cold start

O plano gratuito do Render hiberna serviços após 15 minutos de inatividade. **A primeira requisição depois de inativo pode demorar ~30-60 segundos** pra acordar. Faça uma chamada de aquecimento antes de demonstrar — abrir a Landing já resolve.

---

## 6. Documentação da API

A API tem **16 endpoints REST** documentados em `DESIGN.md` (seção 11). A coleção Postman está em `docs/postman_collection.json`.

Os endpoints cobrem:

- Autenticação: `POST /usuarios`, `POST /auth/login`, `GET /usuarios/me`
- Abrigos: CRUD completo + sub-rotas para pessoas, casos especiais, estoque
- Catálogo: `GET /tipos-recurso` + admin CRUD
- Cálculo (núcleo): `POST /necessidades/calcular/:abrigoId`
- Listagem de necessidades: `GET /necessidades` paginado, com filtros por status e abrigo
- Doação: `POST /ofertas`, listagens
- Matching: `POST /matches` (transação atômica com lock), `PUT /matches/:id/status` (state machine com side-effects no estoque)
- Público: `GET /publico/abrigos` (lista com vagas calculadas), `GET/POST /publico/preview-views/:role`

---

## 7. Decisões técnicas que valem destacar

### 7.1 Cálculo isolado em `service` (não em `route`)

A regra de cálculo de necessidade está em `services/calculoNecessidade.js`, separada da rota HTTP. A rota `POST /necessidades/calcular/:abrigoId` é só um adaptador — recebe a request, valida, autoriza, chama o service e retorna a resposta. Isso permite, por exemplo, agendar um cron job no futuro que dispara o cálculo automaticamente sem precisar passar por HTTP.

### 7.2 Transação atômica no matching

Quando dois doadores clicam "doar" na mesma oferta ao mesmo tempo, há condição de corrida. O `POST /matches` resolve com:

```sql
BEGIN;
  SELECT * FROM oferta WHERE id = $1 FOR UPDATE;  -- trava a linha
  -- valida status, qtd, etc.
  INSERT INTO match_doacao (...);
  UPDATE oferta SET status = 'em_match' WHERE id = $1;
COMMIT;
```

O `FOR UPDATE` segura a linha até o COMMIT. A segunda transação concorrente espera, lê o estado já atualizado, e rejeita educadamente com 409 "oferta indisponível".

### 7.3 UPSERT em vez de "checar antes, inserir depois"

Pra atualizar demografia ou estoque, em vez de fazer `SELECT` seguido de `UPDATE` ou `INSERT` (com risco de race condition), uso `INSERT ... ON CONFLICT (chave) DO UPDATE`. Postgres garante atomicidade — uma query, sem janela pra outro processo entrar.

### 7.4 Modo demo sem login

Antes de cadastrar, o usuário pode entrar em três visões fictícias (`/preview/coordenador`, `/preview/doador`, `/preview/voluntario`) com dados de exemplo realistas. Reduz fricção pra avaliar a plataforma e serve como demonstração viva pro avaliador. Cada visita é contada (anônima) tanto localmente (localStorage) quanto globalmente (banco), pro admin ver engajamento.

---

## 8. Próximos passos (deliberadamente fora do MVP)

- **Voluntários com skills** (enfermeiro, motorista, cozinheiro) vinculados a abrigos
- **Cadastro individual de pessoas abrigadas** com consentimento LGPD explícito
- **Geolocalização** (PostGIS) — match por proximidade abrigo-doador
- **Notificações push/email** quando há novo match
- **Dashboard de agregação regional** pro admin acompanhar várias regiões

---

## 10. Mais importante — por que esse projeto

O briefing diz que tecnologia não começa pelo código, mas pelo entendimento do problema. Tentei isso desde o início: passei mais tempo em modelagem, decisões, máquinas de estado e privacidade do que escrevendo as primeiras rotas. O cálculo automático de necessidade não é um truque técnico — é a tradução direta de uma observação prática: quem está em crise não tem energia cognitiva pra listar item a item, mas consegue dizer quantas crianças, quantos idosos, quanto tem em estoque. Foi isso que tentei traduzir.

E é também por isso que o módulo de **voluntário** ficou de fora do MVP: mesmo gostando da ideia, vi que sem regras de skill + escala + chamado coordenado ele iria virar um CRUD genérico — e o meu objetivo desde o começo era ir além de um cadastro simples, explorando uma regra de negócio com profundidade. Preferi fazer um caso bem do que dois casos pela metade.

---

**Maurício Jampani de Souza**
[github.com/jampani1](https://github.com/jampani1) · [linkedin.com/in/mauriciojampani](https://linkedin.com/in/mauriciojampani)
