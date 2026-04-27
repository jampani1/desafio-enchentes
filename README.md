# Desafio Enchentes

Sistema de gestão de abrigos e doações com cálculo automático de necessidades a partir de demografia, estoque e regras de consumo. Projeto final da formação Backend Node.js (Vai na Web).

## Sobre

Plataforma que conecta abrigos a doadores estruturando a demanda de forma calculada, em vez de depender de listagem manual de itens. O coordenador cadastra a composição demográfica agregada do abrigo (sem identificação individual) e o estoque atual; o sistema deduz quantidade e prazo de cada recurso necessário com base em regras de consumo por categoria.

Doadores (pessoas físicas, farmácias, supermercados, ONGs) consultam essas necessidades, fazem ofertas e o sistema realiza o match. O fluxo cobre cadastro, autenticação por papel, cálculo de necessidades, ofertas, matching e confirmação de entrega com atualização automática de estoque.

## Stack

- **Backend:** Node.js, Express, PostgreSQL, JWT, bcrypt, Joi
- **Frontend:** React, Vite, Tailwind CSS, shadcn/ui
- **Deploy:** Render

## Endpoints principais

| Método | Rota | Acesso |
| --- | --- | --- |
| POST | `/usuarios` | Público (cadastro) |
| POST | `/auth/login` | Público |
| GET | `/usuarios/me` | Autenticado |
| GET | `/abrigos` | Público |
| POST | `/abrigos` | Coordenador |
| POST | `/abrigos/:id/pessoas` | Coord do abrigo |
| PUT | `/abrigos/:id/estoque` | Coord do abrigo |
| GET | `/tipos-recurso` | Público |
| POST | `/necessidades/calcular/:abrigoId` | Coord/Admin |
| POST | `/ofertas` | Doador |
| GET | `/ofertas` | Público |
| POST | `/matches` | Autenticado |
| PUT | `/matches/:id/status` | Autenticado |
| GET | `/publico/abrigos` | Público (com vagas) |

## Diagramas

- [`docs/db_concept.png`](docs/db_concept.png) — modelo de dados (ER)
- [`docs/sys.png`](docs/sys.png) — visão de sistema por role

## Autor

**Maurício Jampani** — [github.com/jampani1](https://github.com/jampani1)
