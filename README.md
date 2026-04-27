# Desafio Enchentes — Sistema de Gestão de Abrigos e Doações

Projeto final da formação **Vai na Web — Backend com Node.js**.

> **Status:** em desenvolvimento (iniciado em 2026-04-21).

## 1. Apresentação da Ideia

Esse é o meu projeto. A ideia surgiu a partir do desafio sobre enchentes no Brasil. Pensando nesse cenário, decidi focar no problema do **desequilíbrio entre o que os abrigos precisam e o que é efetivamente doado**.

As enchentes recentes (RS em 2024, Petrópolis em 2022, litoral de SP em 2023) mostraram um padrão comum: alguns abrigos recebem excesso de roupas enquanto outros ficam sem fraldas, leite em pó ou água. A informação sobre necessidades reais existe, mas está espalhada em grupos de WhatsApp, posts isolados de Instagram e planilhas improvisadas.

A proposta é transformar informação demográfica do abrigo em **necessidade calculada automaticamente** — e expor essa necessidade de forma estruturada para doadores (pessoas físicas, farmácias, supermercados, ONGs).

## 2. Problema Escolhido

O projeto combina dois dos cenários propostos no briefing:

- **Caso 1 — Falta de Informação sobre Abrigos**
- **Caso 2 — Organização de Doações**

A união dos dois cria o diferencial: **o sistema sabe o que cada abrigo precisa com base em quem está lá**, e não depende do coordenador listar manualmente cada item.

## 3. Solução Proposta

### Funcionamento em 4 passos

1. **Coordenador** do abrigo cadastra a composição demográfica agregada (ex: 12 crianças 0-3 anos, 8 adultas mulheres, 3 idosos) e casos especiais sem identificação (ex: 1 diabético insulino-dependente).
2. **Sistema** calcula automaticamente as necessidades com base em regras de consumo por categoria (ex: criança 0-3 usa 3 fraldas/dia), estoque atual e prazo de projeção.
3. **Doador** (pessoa física, farmácia, supermercado, ONG) vê a lista de necessidades reais — o quê e quanto — e faz ofertas.
4. **Sistema** faz o match entre ofertas e necessidades, acompanha o status até a entrega confirmada.

### Exemplo concreto

```
Abrigo A tem 12 crianças 0-3 anos
Regra: criança 0-3 usa 3 fraldas P/dia
Estoque atual: 50 fraldas P
Prazo: 7 dias

→ Necessidade calculada: 202 fraldas P até [hoje + 7 dias]
```

O abrigo não precisa listar "preciso de fraldas" manualmente. O sistema deduz a partir do perfil + estoque.

### Por que isso resolve o problema

O genérico diz "crie um cadastro de doação". Isso vira planilha. A versão real estrutura a informação **no formato em que ela deve ser consumida** — quantidade certa, recurso certo, prazo real — e deixa o matching transparente.

## 4. Estrutura do Sistema

### Front-end

- **React + Vite**
- Consome a API via fetch/axios
- Telas principais:
  - Login / Cadastro
  - **Coordenador:** dashboard do abrigo (demografia, estoque, necessidades, matches recebidos)
  - **Doador:** lista de necessidades, formulário de oferta, meus matches
  - **Admin:** catálogo de recursos, regras de consumo, auditoria
  - **Pública** (sem login): lista de abrigos com vagas disponíveis

### Back-end

- **Node.js + Express**
- Autenticação com **JWT + bcrypt**
- Validação com **Joi**
- Organização por recurso: rotas, controllers, services, repositories
- Middlewares de auth e autorização por role
- Documentação via **Postman**

### Banco de Dados

- **PostgreSQL**
- 1 tabela `usuario` unificada (roles: coordenador, doador, admin)
- Perfis específicos (`doador_perfil`) para dados extras
- ENUMs para categorias e status (valores estáveis)
- Tabelas-ponte N:N para estoque, regras, matches, recursos frequentes
- Log polimórfico (`historico_log`) para auditoria

Ver [DESIGN.md](DESIGN.md) para o modelo completo.

### Deploy

- **Render** — backend Node.js + PostgreSQL gerenciado
- **Vercel** — frontend (opcional; pode usar Render também)

---

## Documentação técnica

- [DESIGN.md](DESIGN.md) — decisões técnicas, modelo de dados completo, máquinas de estado, conceitos
- [docs/db_concept.png](docs/db_concept.png) — diagrama ER final
- [docs/sys.png](docs/sys.png) — visão de sistema por role

## Próximos passos (features futuras)

Deliberadamente fora do escopo do MVP, mas previstas na arquitetura:

- Voluntários com skills (enfermeiro, cozinheiro, motorista) vinculados a abrigos
- Cadastro individual de pessoas abrigadas com consentimento LGPD
- Geolocalização e match por proximidade
- Notificações push/email quando há novo match
- Dashboard de agregação regional para admin
- Sistema de chamados de voluntário ("preciso de 2 enfermeiros sábado 6h")

## Autor

**Maurício Jampani** — [github.com/jampani1](https://github.com/jampani1) · [linkedin.com/in/mauriciojampani](https://linkedin.com/in/mauriciojampani)
