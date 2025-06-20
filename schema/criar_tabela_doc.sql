-- Script para criar a tabela de documentos no schema crmonefactory
-- Execute este script no SQL Editor do Supabase

-- Certifique-se de que o schema crmonefactory existe
CREATE SCHEMA IF NOT EXISTS crmonefactory;

-- Cria a tabela doc no schema crmonefactory
CREATE TABLE IF NOT EXISTS crmonefactory.doc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT,
  licitacao_id UUID REFERENCES crmonefactory.licitacoes(id) ON DELETE CASCADE,
  numero_documento TEXT,
  data_validade TIMESTAMP WITH TIME ZONE,
  url_documento TEXT,
  arquivo_path TEXT,
  formato TEXT,
  tamanho INTEGER,
  status TEXT DEFAULT 'ativo',
  criado_por UUID,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_doc_licitacao ON crmonefactory.doc(licitacao_id);
CREATE INDEX IF NOT EXISTS idx_doc_tipo ON crmonefactory.doc(tipo);
CREATE INDEX IF NOT EXISTS idx_doc_categoria ON crmonefactory.doc(categoria);
CREATE INDEX IF NOT EXISTS idx_doc_status ON crmonefactory.doc(status);

-- Configurar RLS (Row Level Security)
ALTER TABLE crmonefactory.doc ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso a todos os registros para usuários autenticados
CREATE POLICY "Usuários autenticados podem ver todos os documentos"
  ON crmonefactory.doc
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir documentos"
  ON crmonefactory.doc
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar documentos"
  ON crmonefactory.doc
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem excluir documentos"
  ON crmonefactory.doc
  FOR DELETE
  TO authenticated
  USING (true);

-- Dar permissões ao papel anon e authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE crmonefactory.doc TO anon, authenticated;
GRANT USAGE ON SCHEMA crmonefactory TO anon, authenticated;

-- Comentários para documentação da tabela
COMMENT ON TABLE crmonefactory.doc IS 'Armazena metadados de documentos para o sistema CRM';
COMMENT ON COLUMN crmonefactory.doc.id IS 'Identificador único do documento';
COMMENT ON COLUMN crmonefactory.doc.nome IS 'Nome do documento';
COMMENT ON COLUMN crmonefactory.doc.tipo IS 'Tipo do documento (ex: contrato, nota fiscal, etc)';
COMMENT ON COLUMN crmonefactory.doc.categoria IS 'Categoria do documento';
COMMENT ON COLUMN crmonefactory.doc.descricao IS 'Descrição detalhada do documento';
COMMENT ON COLUMN crmonefactory.doc.licitacao_id IS 'ID da licitação associada ao documento, se aplicável';
COMMENT ON COLUMN crmonefactory.doc.numero_documento IS 'Número do documento, se aplicável';
COMMENT ON COLUMN crmonefactory.doc.data_validade IS 'Data de validade do documento, se aplicável';
COMMENT ON COLUMN crmonefactory.doc.url_documento IS 'URL externa do documento, se aplicável';
COMMENT ON COLUMN crmonefactory.doc.arquivo_path IS 'Caminho para o arquivo no bucket de armazenamento';
COMMENT ON COLUMN crmonefactory.doc.formato IS 'Formato/extensão do arquivo';
COMMENT ON COLUMN crmonefactory.doc.tamanho IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN crmonefactory.doc.status IS 'Status do documento (ativo, arquivado, excluído, etc)';
COMMENT ON COLUMN crmonefactory.doc.criado_por IS 'ID do usuário que criou o documento';
COMMENT ON COLUMN crmonefactory.doc.data_criacao IS 'Data de criação do registro';
COMMENT ON COLUMN crmonefactory.doc.data_atualizacao IS 'Data da última atualização do registro';
