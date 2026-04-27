-- Schema do Desafio Enchentes
-- PostgreSQL 13+ (precisa de gen_random_uuid)
-- Roda com: psql -U postgres -d desafio_enchentes -f db/schema.sql

-- Força encoding UTF-8 (psql no Windows assume WIN1252 por padrão e quebra com acentos)
SET client_encoding = 'UTF8';

-- ============================================================
-- DROPS (re-rodar limpa tudo)
-- ============================================================

DROP TABLE IF EXISTS preview_view CASCADE;
DROP TABLE IF EXISTS historico_log CASCADE;
DROP TABLE IF EXISTS match_doacao CASCADE;
DROP TABLE IF EXISTS oferta CASCADE;
DROP TABLE IF EXISTS necessidade CASCADE;
DROP TABLE IF EXISTS estoque CASCADE;
DROP TABLE IF EXISTS regra_consumo CASCADE;
DROP TABLE IF EXISTS doador_recurso_frequente CASCADE;
DROP TABLE IF EXISTS caso_especial CASCADE;
DROP TABLE IF EXISTS pessoa_abrigada CASCADE;
DROP TABLE IF EXISTS abrigo CASCADE;
DROP TABLE IF EXISTS doador_perfil CASCADE;
DROP TABLE IF EXISTS tipo_recurso CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;

DROP TYPE IF EXISTS role_usuario;
DROP TYPE IF EXISTS categoria_vitima;
DROP TYPE IF EXISTS categoria_recurso;
DROP TYPE IF EXISTS condicao_especial;
DROP TYPE IF EXISTS status_oferta;
DROP TYPE IF EXISTS status_necessidade;
DROP TYPE IF EXISTS status_match;

-- ============================================================
-- ENUMs
-- ============================================================

CREATE TYPE role_usuario AS ENUM ('coordenador', 'doador', 'admin');

CREATE TYPE categoria_vitima AS ENUM (
  'idoso_h', 'idoso_m',
  'adulto_h', 'adulto_m',
  'crianca_0_3', 'crianca_4_12',
  'adolescente'
);

CREATE TYPE categoria_recurso AS ENUM (
  'hidratacao', 'higiene', 'fraldas',
  'alimento_nao_perec', 'primeira_infancia',
  'saude', 'vestuario', 'dormir',
  'limpeza', 'emergencia', 'pets'
);

CREATE TYPE condicao_especial AS ENUM (
  'diabetes', 'cardiaco', 'gestante',
  'bebe_lactente', 'cadeirante', 'acamado',
  'autista', 'alergia_grave'
);

CREATE TYPE status_oferta AS ENUM (
  'ofertada', 'em_match', 'confirmada', 'entregue', 'cancelada'
);

CREATE TYPE status_necessidade AS ENUM (
  'calculada', 'aberta', 'parcialmente_atendida', 'atendida', 'expirada'
);

CREATE TYPE status_match AS ENUM (
  'proposto', 'aceito', 'em_entrega', 'recebido', 'cancelado'
);

-- ============================================================
-- TABELAS
-- ============================================================

CREATE TABLE usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  role role_usuario NOT NULL,
  cpf_ou_cnpj VARCHAR(20),
  telefone VARCHAR(20),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE doador_perfil (
  usuario_id UUID PRIMARY KEY REFERENCES usuario(id) ON DELETE CASCADE,
  fornecedor VARCHAR(255),
  razao_social VARCHAR(255),
  horario_funcionamento VARCHAR(100)
);

CREATE TABLE tipo_recurso (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  categoria categoria_recurso NOT NULL,
  unidade_medida VARCHAR(20) NOT NULL,
  tamanho_padrao VARCHAR(50)
);

CREATE TABLE doador_recurso_frequente (
  doador_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  tipo_recurso_id INT NOT NULL REFERENCES tipo_recurso(id) ON DELETE CASCADE,
  PRIMARY KEY (doador_id, tipo_recurso_id)
);

CREATE TABLE abrigo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  coordenador_id UUID NOT NULL REFERENCES usuario(id),
  localizacao VARCHAR(500) NOT NULL,
  capacidade INT NOT NULL CHECK (capacidade > 0),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pessoa_abrigada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abrigo_id UUID NOT NULL REFERENCES abrigo(id) ON DELETE CASCADE,
  categoria categoria_vitima NOT NULL,
  qtd INT NOT NULL CHECK (qtd >= 0),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (abrigo_id, categoria)
);

CREATE TABLE caso_especial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abrigo_id UUID NOT NULL REFERENCES abrigo(id) ON DELETE CASCADE,
  condicao condicao_especial NOT NULL,
  observacao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE regra_consumo (
  categoria_vitima categoria_vitima NOT NULL,
  tipo_recurso_id INT NOT NULL REFERENCES tipo_recurso(id) ON DELETE CASCADE,
  qtd_pessoa_dia NUMERIC(10,3) NOT NULL CHECK (qtd_pessoa_dia >= 0),
  PRIMARY KEY (categoria_vitima, tipo_recurso_id)
);

CREATE TABLE estoque (
  abrigo_id UUID NOT NULL REFERENCES abrigo(id) ON DELETE CASCADE,
  tipo_recurso_id INT NOT NULL REFERENCES tipo_recurso(id) ON DELETE CASCADE,
  quantidade_atual INT NOT NULL DEFAULT 0 CHECK (quantidade_atual >= 0),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (abrigo_id, tipo_recurso_id)
);

CREATE TABLE necessidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abrigo_id UUID NOT NULL REFERENCES abrigo(id) ON DELETE CASCADE,
  tipo_recurso_id INT NOT NULL REFERENCES tipo_recurso(id),
  qtd_necessaria INT NOT NULL CHECK (qtd_necessaria > 0),
  prazo DATE NOT NULL,
  status status_necessidade NOT NULL DEFAULT 'calculada',
  calculada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE oferta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doador_id UUID NOT NULL REFERENCES usuario(id),
  tipo_recurso_id INT NOT NULL REFERENCES tipo_recurso(id),
  qtd_ofertada INT NOT NULL CHECK (qtd_ofertada > 0),
  status status_oferta NOT NULL DEFAULT 'ofertada',
  data_entrega DATE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- match eh palavra reservada > trocado para match_doacao
CREATE TABLE match_doacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  necessidade_id UUID NOT NULL REFERENCES necessidade(id) ON DELETE CASCADE,
  oferta_id UUID NOT NULL REFERENCES oferta(id) ON DELETE CASCADE,
  qtd_casada INT NOT NULL CHECK (qtd_casada > 0),
  status status_match NOT NULL DEFAULT 'proposto',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmado_em TIMESTAMPTZ
);

CREATE TABLE historico_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_tipo VARCHAR(50) NOT NULL,
  entidade_id UUID NOT NULL,
  acao VARCHAR(50) NOT NULL,
  usuario_id UUID REFERENCES usuario(id),
  payload JSONB,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tracking publico de visitas a previews (modo demo, sem login)
-- Contador agregado por role; sem dado pessoal.
CREATE TABLE preview_view (
  role VARCHAR(20) PRIMARY KEY,
  count INT NOT NULL DEFAULT 0,
  ultimo_acesso TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SEED tipo_recurso
-- ============================================================

INSERT INTO tipo_recurso (nome, categoria, unidade_medida, tamanho_padrao) VALUES
('Água mineral 500ml', 'hidratacao', 'L', '500ml'),
('Água mineral 1.5L', 'hidratacao', 'L', '1.5L'),
('Água mineral 5L', 'hidratacao', 'L', '5L'),
('Sabonete', 'higiene', 'unid', NULL),
('Escova de dente', 'higiene', 'unid', NULL),
('Pasta de dente', 'higiene', 'unid', NULL),
('Papel higiênico', 'higiene', 'rolo', NULL),
('Absorvente diurno', 'higiene', 'unid', NULL),
('Absorvente noturno', 'higiene', 'unid', NULL),
('Álcool em gel', 'higiene', 'L', NULL),
('Fralda P', 'fraldas', 'unid', NULL),
('Fralda M', 'fraldas', 'unid', NULL),
('Fralda G', 'fraldas', 'unid', NULL),
('Fralda XG', 'fraldas', 'unid', NULL),
('Fralda geriátrica', 'fraldas', 'unid', NULL),
('Lenço umedecido', 'fraldas', 'unid', NULL),
('Arroz 1kg', 'alimento_nao_perec', 'kg', '1kg'),
('Feijão 1kg', 'alimento_nao_perec', 'kg', '1kg'),
('Óleo 900ml', 'alimento_nao_perec', 'L', '900ml'),
('Açúcar 1kg', 'alimento_nao_perec', 'kg', '1kg'),
('Macarrão 500g', 'alimento_nao_perec', 'kg', '500g'),
('Leite em pó 400g', 'alimento_nao_perec', 'kg', '400g'),
('Sardinha em lata', 'alimento_nao_perec', 'unid', NULL),
('Biscoito água e sal', 'alimento_nao_perec', 'unid', NULL),
('Fórmula infantil', 'primeira_infancia', 'kg', NULL),
('Mucilon', 'primeira_infancia', 'kg', NULL),
('Soro fisiológico', 'saude', 'L', NULL),
('Álcool 70%', 'saude', 'L', NULL),
('Gaze', 'saude', 'unid', NULL),
('Dipirona', 'saude', 'unid', NULL),
('Paracetamol', 'saude', 'unid', NULL),
('Roupa adulta', 'vestuario', 'unid', NULL),
('Roupa infantil', 'vestuario', 'unid', NULL),
('Cobertor', 'vestuario', 'unid', NULL),
('Manta térmica', 'vestuario', 'unid', NULL),
('Colchão', 'dormir', 'unid', NULL),
('Colchonete', 'dormir', 'unid', NULL),
('Detergente', 'limpeza', 'unid', NULL),
('Água sanitária', 'limpeza', 'L', NULL),
('Saco de lixo', 'limpeza', 'unid', NULL),
('Lanterna', 'emergencia', 'unid', NULL),
('Pilha AA', 'emergencia', 'unid', NULL),
('Power bank', 'emergencia', 'unid', NULL),
('Ração cão adulto', 'pets', 'kg', NULL),
('Ração gato', 'pets', 'kg', NULL);

-- ============================================================
-- SEED regra_consumo (mínimo pro cálculo de necessidade rodar)
-- ============================================================

-- Água 500ml: 3/dia para adultos/adolescentes/crianças 4-12, 1/dia para crianças 0-3
INSERT INTO regra_consumo (categoria_vitima, tipo_recurso_id, qtd_pessoa_dia)
SELECT cat, (SELECT id FROM tipo_recurso WHERE nome = 'Água mineral 500ml'), 3
FROM unnest(ARRAY['idoso_h','idoso_m','adulto_h','adulto_m','crianca_4_12','adolescente']::categoria_vitima[]) AS cat;

INSERT INTO regra_consumo (categoria_vitima, tipo_recurso_id, qtd_pessoa_dia)
VALUES ('crianca_0_3', (SELECT id FROM tipo_recurso WHERE nome = 'Água mineral 500ml'), 1);

-- Fralda P: 3/dia pra crianca 0-3
INSERT INTO regra_consumo (categoria_vitima, tipo_recurso_id, qtd_pessoa_dia)
VALUES ('crianca_0_3', (SELECT id FROM tipo_recurso WHERE nome = 'Fralda P'), 3);

-- Fralda geriátrica: 4/dia pra idosos
INSERT INTO regra_consumo (categoria_vitima, tipo_recurso_id, qtd_pessoa_dia)
SELECT cat, (SELECT id FROM tipo_recurso WHERE nome = 'Fralda geriátrica'), 4
FROM unnest(ARRAY['idoso_h','idoso_m']::categoria_vitima[]) AS cat;

-- Absorvente diurno: 0.5/dia pra mulheres adultas e adolescentes
INSERT INTO regra_consumo (categoria_vitima, tipo_recurso_id, qtd_pessoa_dia)
SELECT cat, (SELECT id FROM tipo_recurso WHERE nome = 'Absorvente diurno'), 0.5
FROM unnest(ARRAY['adulto_m','adolescente']::categoria_vitima[]) AS cat;

-- Sabonete: 0.07/dia (1 a cada ~14 dias) — todos
INSERT INTO regra_consumo (categoria_vitima, tipo_recurso_id, qtd_pessoa_dia)
SELECT cat, (SELECT id FROM tipo_recurso WHERE nome = 'Sabonete'), 0.07
FROM unnest(ARRAY['idoso_h','idoso_m','adulto_h','adulto_m','crianca_0_3','crianca_4_12','adolescente']::categoria_vitima[]) AS cat;

-- Escova de dente: 0.011/dia (1 a cada ~90 dias) — todos exceto bebês
INSERT INTO regra_consumo (categoria_vitima, tipo_recurso_id, qtd_pessoa_dia)
SELECT cat, (SELECT id FROM tipo_recurso WHERE nome = 'Escova de dente'), 0.011
FROM unnest(ARRAY['idoso_h','idoso_m','adulto_h','adulto_m','crianca_4_12','adolescente']::categoria_vitima[]) AS cat;

-- Cobertor: 0.05/dia (1 a cada ~20 dias, considerando rotação) — todos
INSERT INTO regra_consumo (categoria_vitima, tipo_recurso_id, qtd_pessoa_dia)
SELECT cat, (SELECT id FROM tipo_recurso WHERE nome = 'Cobertor'), 0.05
FROM unnest(ARRAY['idoso_h','idoso_m','adulto_h','adulto_m','crianca_0_3','crianca_4_12','adolescente']::categoria_vitima[]) AS cat;

-- Verificação rápida
SELECT 'Tabelas criadas com sucesso. Total de tipo_recurso: ' || COUNT(*) AS resultado FROM tipo_recurso;
