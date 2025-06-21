import { useState, useEffect, useCallback } from 'react';

// Interface para Documento (simplificada para o contexto da licitação)
export interface DocumentoSimplificado {
  id: string;
  nome: string;
  tipo?: string;
  url?: string; // ou url_documento
  arquivo?: string; // ou arquivo_path
  tags?: string[];
  // Outros campos relevantes do documento podem ser adicionados aqui
  dataCriacao?: string;
  dataAtualizacao?: string;
}

// Interface para Responsavel (simplificada)
export interface ResponsavelInfo {
  id: string; // user_id
  nome: string;
  papel?: string;
}

// Interface Licitacao atualizada para refletir a estrutura do backend MySQL
export interface Licitacao {
  id: string;
  titulo: string;
  status: string; // Ou um enum LicitacaoStatus se definido
  modalidade?: string;
  numeroProcesso?: string; // numero_processo
  dataAbertura?: string; // Formatado como DD/MM/YYYY
  dataLimiteProposta?: string; // Formatado como DD/MM/YYYY
  dataPublicacao?: string; // Formatado como DD/MM/YYYY
  dataJulgamento?: string; // Formatado como DD/MM/YYYY
  orgao?: string; // nome do órgão
  orgaoId?: string; // orgao_id
  valorEstimado?: string; // Formatado como "R$ X.XXX,XX"
  _valorEstimadoNumerico?: number; // Valor numérico para cálculos
  objeto?: string;
  edital?: string;
  numeroEdital?: string; // numero_edital
  responsavel?: string; // Nome do responsável principal
  responsavelId?: string; // responsavel_id (FK para users)
  responsaveis?: ResponsavelInfo[]; // Lista de múltiplos responsáveis
  prazo?: string;
  urlLicitacao?: string;
  urlEdital?: string;
  descricao?: string;
  formaPagamento?: string;
  obsFinanceiras?: string;
  tipo?: string; // 'produto' ou 'servico'
  tipoFaturamento?: string;
  margemLucro?: number;
  contatoNome?: string;
  contatoEmail?: string;
  contatoTelefone?: string;
  posicaoKanban?: number;
  dataCriacao?: string; // created_at ou data_criacao
  dataAtualizacao?: string; // updated_at ou data_atualizacao
  documentos?: DocumentoSimplificado[];
  // Adicionar quaisquer outros campos que a API retorna
}


export function useLicitacoes() {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache local para os dados
  const [cacheTimestamp, setCacheTimestamp] = useState<number | null>(null);
  
  // TODO: Remove static data and fallback for production
  // Dados estáticos para carregamento rápido
  const licitacoesEstaticas: Licitacao[] = [
    {
      id: "lic-001",
      modalidade: "Pregão Eletrônico",
      numeroProcesso: "001/2023", // Ajustado para numeroProcesso
      objeto: "Aquisição de equipamentos de informática",
      status: "ativo",
      titulo: "Licitação de TI Exemplo 1"
    },
    {
      id: "lic-002",
      modalidade: "Concorrência",
      numeroProcesso: "002/2023", // Ajustado para numeroProcesso
      objeto: "Reforma de prédio público",
      status: "ativo",
      titulo: "Licitação de Obras Exemplo 2"
    },
    // ... mais exemplos se necessário, seguindo a nova interface Licitacao
  ];

  // Buscar todas as licitações
  const fetchLicitacoes = useCallback(async () => {
    // Verificar se temos dados em cache recentes (menos de 5 minutos)
    const agora = Date.now();
    const cacheValido = cacheTimestamp && (agora - cacheTimestamp < 5 * 60 * 1000);
    
    if (cacheValido && licitacoes.length > 0) {
      console.log('Usando dados em cache...');
      return licitacoes;
    }
    
    // Mostrar dados estáticos imediatamente para melhorar a experiência do usuário
    if (!cacheValido && licitacoes.length === 0) {
      console.log('Usando dados estáticos iniciais...');
      setLicitacoes(licitacoesEstaticas);
    }
    
    setLoading(true);
    setError(null);

    try {
      console.log('Buscando licitações da API...');
      
      // Tentar buscar da API em paralelo
      try {
        // const token = getAuthToken(); // REMOVED
        const response = await fetch('/api/licitacoes', {
          method: 'GET',
          credentials: 'include', // ADDED
          headers: {
            // 'Authorization': token ? `Bearer ${token}` : '', // REMOVED
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          // Verificar formato da resposta da API
          console.log('Resposta da API:', data);
          
          // A linha const data = await response.json(); foi removida daqui por ser redundante

          // Verificar formato da resposta da API
          console.log('Resposta da API (fetchLicitacoes):', data);

          if (Array.isArray(data)) {
            setLicitacoes(data);
            setCacheTimestamp(Date.now()); // Atualiza o timestamp do cache
            return data;
          } else {
            // Se a API não retornar um array, pode ser um erro ou formato inesperado
            console.warn('API (fetchLicitacoes) retornou formato inesperado. Usando dados estáticos para desenvolvimento');
            if (licitacoes.length === 0) { // Só define estáticos se não houver nada
              setLicitacoes(licitacoesEstaticas);
              setCacheTimestamp(Date.now()); // Cache dos dados estáticos
            }
            return licitacoes.length > 0 ? licitacoes : licitacoesEstaticas; // Retorna o que tiver ou estáticos
          }
        } else {
          // Erro na resposta da API
          const errorData = await response.text();
          console.warn(`Erro na API (fetchLicitacoes) ${response.status}: ${errorData}. Usando dados estáticos para desenvolvimento`);
          if (licitacoes.length === 0) {
            setLicitacoes(licitacoesEstaticas);
            setCacheTimestamp(Date.now());
          }
          return licitacoes.length > 0 ? licitacoes : licitacoesEstaticas;
        }
      } catch (apiError: any) {
        console.error('Erro ao acessar API (fetchLicitacoes):', apiError.message);
        console.warn('Usando dados estáticos para desenvolvimento devido a falha na API.');
        if (licitacoes.length === 0) {
          setLicitacoes(licitacoesEstaticas);
          setCacheTimestamp(Date.now());
        }
        return licitacoes.length > 0 ? licitacoes : licitacoesEstaticas;
      }
    } catch (err: any) { // Este catch é mais genérico, para erros não esperados
      console.error('Erro geral ao buscar licitações:', err);
      setError(err.message);
      return licitacoes.length > 0 ? licitacoes : licitacoesEstaticas; // Retorna o que tiver
    } finally {
      setLoading(false);
    }
  }, [licitacoes, cacheTimestamp]);

  // Carregar dados iniciais na montagem do componente
  useEffect(() => {
    if (licitacoes.length === 0) {
      // Carregar dados estáticos imediatamente para UX rápida
      setLicitacoes(licitacoesEstaticas);
      // Então buscar dados da API
      fetchLicitacoes();
    }
  }, [fetchLicitacoes, licitacoes.length]);

  // Buscar uma licitação específica pelo ID
  const fetchLicitacaoById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      // const token = getAuthToken(); // REMOVED
      // if (!token) { // REMOVED
      //   throw new Error('Não autenticado');
      // }

      const response = await fetch(`/api/licitacoes/${id}`, {
        method: 'GET',
        credentials: 'include', // ADDED
        headers: {
          // 'Authorization': `Bearer ${token}`, // REMOVED
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ao buscar licitação: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      return data; // API agora retorna o objeto licitação diretamente
    } catch (err: any) {
      console.error('Erro ao buscar licitação por ID:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar nova licitação
  const createLicitacao = useCallback(async (licitacaoData: Partial<Licitacao>): Promise<Licitacao | null> => {
    setLoading(true);
    setError(null);
    try {
      // const token = getAuthToken(); // REMOVED
      const response = await fetch('/api/licitacoes', {
        method: 'POST',
        credentials: 'include', // ADDED
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': token ? `Bearer ${token}` : '', // REMOVED
        },
        body: JSON.stringify(licitacaoData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar licitação');
      }
      setLicitacoes((prev) => [data, ...prev]); // Adiciona no início da lista
      setCacheTimestamp(null); // Invalidar cache da lista
      return data;
    } catch (err: any) {
      console.error('Erro ao criar licitação:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar licitação existente
  const updateLicitacao = useCallback(async (id: string, licitacaoData: Partial<Licitacao>): Promise<Licitacao | null> => {
    setLoading(true);
    setError(null);
    try {
      // const token = getAuthToken(); // REMOVED
      const response = await fetch(`/api/licitacoes/${id}`, {
        method: 'PUT',
        credentials: 'include', // ADDED
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': token ? `Bearer ${token}` : '', // REMOVED
        },
        body: JSON.stringify(licitacaoData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar licitação');
      }
      setLicitacoes((prev) => prev.map(l => l.id === id ? data : l));
      setCacheTimestamp(null); // Invalidar cache da lista
      return data;
    } catch (err: any) {
      console.error('Erro ao atualizar licitação:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Excluir licitação
  const deleteLicitacao = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // const token = getAuthToken(); // REMOVED
      const response = await fetch(`/api/licitacoes/${id}`, {
        method: 'DELETE',
        credentials: 'include', // ADDED
        headers: {
          // 'Authorization': token ? `Bearer ${token}` : '', // REMOVED
        },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || `Erro ao excluir licitação: ${response.statusText}`);
      }
      setLicitacoes((prev) => prev.filter(l => l.id !== id));
      setCacheTimestamp(null); // Invalidar cache da lista
      return true;
    } catch (err: any) {
      console.error('Erro ao excluir licitação:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);


  return {
    licitacoes,
    loading,
    error,
    fetchLicitacoes,
    fetchLicitacaoById,
    createLicitacao,
    updateLicitacao,
    deleteLicitacao,
  };
}
