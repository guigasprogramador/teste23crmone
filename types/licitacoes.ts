// Tipos para o módulo de licitações

export interface Documento {
  id: string;
  nome: string;
  url: string;
  arquivo?: string;
  dataCriacao: string;
  dataAtualizacao: string;
  tipo: string;
  tamanho?: number;
  licitacaoId: string;
  formato?: string;
  categoria?: string;
  categoriaId?: string;
  licitacao?: string;  // Nome da licitação
  uploadPor?: string;
  resumo?: string;
  dataValidade?: string; // Para controle de documentos que vencem
  status?: string;       // Por exemplo: ativo, expirado, pendente
}

export interface Responsavel {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cargo?: string;
  departamento?: string;
  ativo: boolean;
}

export interface Licitacao {
  id: string;
  titulo: string;
  orgao: string;
  orgaoId: string;
  status: string;
  dataAbertura: string;
  dataPublicacao?: string;
  valorEstimado: number;
  valorProposta?: number;
  modalidade: string;
  objeto: string;
  edital: string;
  numeroEdital?: string;
  responsavel: string;
  responsavelId: string;
  responsaveisIds?: string[];
  documentos?: Documento[];
  prazo?: string;
  urlLicitacao?: string;
  urlEdital?: string;
  descricao?: string;
  formaPagamento?: string;
  obsFinanceiras?: string;
  tipo?: "produto" | "servico";
  tipoFaturamento?: "direto" | "distribuidor";
  margemLucro?: number;
  contatoNome?: string;
  contatoEmail?: string;
  contatoTelefone?: string;
  dataJulgamento?: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface Orgao {
  id: string;
  nome: string;
  tipo?: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  segmento?: string;
  origemLead?: string;
  responsavelInterno?: string;
  descricao?: string;
  observacoes?: string;
  faturamento?: string;
  contatos?: Array<{
    id: string;
    nome: string;
    cargo?: string;
    email: string;
    telefone?: string;
  }>;
  dataCriacao: string;
  dataAtualizacao: string;
  ativo: boolean;
}

export interface LicitacaoFiltros {
  termo?: string;
  status?: string;
  orgao?: string;
  responsavel?: string;
  modalidade?: string;
  dataInicio?: string;
  dataFim?: string;
  valorMinimo?: number;
  valorMaximo?: number;
}

export type LicitacaoStatus = 
  | "analise_interna"
  | "analise_edital"
  | "aguardando_pregao"
  | "em_andamento"
  | "envio_documentos"
  | "assinaturas"
  | "vencida"
  | "nao_vencida"
  | "concluida"
  | "arquivada";

export const statusLabels: Record<LicitacaoStatus, string> = {
  analise_interna: "Análise Interna",
  analise_edital: "Análise de Edital",
  aguardando_pregao: "Aguardando Pregão",
  em_andamento: "Em Andamento",
  envio_documentos: "Envio de Documentos",
  assinaturas: "Assinaturas",
  vencida: "Vencida",
  nao_vencida: "Não Vencida",
  concluida: "Concluída",
  arquivada: "Arquivada"
};

// Tipo para estatísticas de licitações
export interface LicitacaoEstatisticas {
  total: number;
  ativas: number;
  vencidas: number;
  valorTotal: number;
  taxaSucesso: number;
  pregoesProximos: number;
  porModalidade: Record<string, number>;
  porStatus: Record<string, number>;
}
