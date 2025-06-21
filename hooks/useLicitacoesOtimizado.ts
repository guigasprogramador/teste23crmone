import { useState, useCallback, useRef } from 'react';
import { format } from 'date-fns';

// Definir tipos (Atualizado para refletir a estrutura do backend MySQL)

export interface DocumentoDetalhado {
  id: string;
  nome: string;
  url?: string;
  arquivo_path?: string;
  tipo?: string;
  formato?: string;
  tamanho?: number;
  status?: string;
  criado_por?: string; // User ID
  data_criacao?: string; // ISO String
  data_atualizacao?: string; // ISO String
  tags?: string[];
  // Campos legados ou outros que possam vir da tabela documentos
  categoria?: string; // categoriaLegado
  numeroDocumento?: string;
  dataValidade?: string; // Formatado DD/MM/YYYY
  licitacaoId?: string;
}

export interface ResponsavelDetalhado {
  id: string; // Corresponde ao users.id
  nome?: string;
  papel?: string;
}

export interface OrgaoDetalhado {
  id: string;
  nome: string;
  // Outros campos relevantes da tabela orgaos podem ser adicionados aqui
  // Ex: cnpj, cidade, estado
}

export interface Licitacao {
  id: string;
  titulo: string;
  status?: string;
  modalidade?: string;
  numeroProcesso?: string;
  dataAbertura?: string; // Formatado DD/MM/YYYY pela API
  dataPublicacao?: string; // Formatado DD/MM/YYYY pela API
  dataJulgamento?: string; // Formatado DD/MM/YYYY pela API
  dataLimiteProposta?: string; // Formatado DD/MM/YYYY pela API
  valorEstimado?: string; // Formatado como "R$ X.XXX,XX" pela API
  _valorEstimadoNumerico?: number; // Valor numérico puro
  valorProposta?: number; // Numérico
  objeto?: string;
  edital?: string;
  numeroEdital?: string;
  responsavelId?: string;
  responsavel?: string; // Nome do responsável principal (responsavel_principal_nome da API)
  prazo?: string;
  urlLicitacao?: string;
  urlEdital?: string;
  descricao?: string;
  formaPagamento?: string;
  obsFinanceiras?: string;
  tipo?: string;
  tipoFaturamento?: string;
  margemLucro?: number;
  contatoNome?: string;
  contatoEmail?: string;
  contatoTelefone?: string;
  posicaoKanban?: number;
  dataCriacao?: string; // ISO String
  dataAtualizacao?: string; // ISO String
  orgaoId?: string;
  orgao?: OrgaoDetalhado | string; // Pode ser objeto ou apenas nome na listagem
  responsaveis?: ResponsavelDetalhado[];
  documentos?: DocumentoDetalhado[];
}

interface LicitacaoFiltros {
  termo?: string;
  status?: string;
  orgao?: string;
  responsavel?: string;
  modalidade?: string;
  dataInicio?: Date | string;
  dataFim?: Date | string;
  valorMinimo?: number;
  valorMaximo?: number;
}

interface Estatisticas {
  total: number;
  ativas: number;
  vencidas: number;
  valorTotal: number;
  pregoesProximos: number;
  taxaSucesso: number;
}

// Cache para armazenar resultados de requisiu00e7u00f5es anteriores
interface CacheItem {
  data: any;
  timestamp: number;
  queryKey: string;
}

// Cache global para ser compartilhado entre todas as instu00e2ncias do hook
const requestCache: Record<string, CacheItem> = {};

// Tempo de expirau00e7u00e3o do cache em milissegundos (5 minutos)
const CACHE_EXPIRATION = 5 * 60 * 1000;

export function useLicitacoesOtimizado() {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
  const [filteredLicitacoes, setFilteredLicitacoes] = useState<Licitacao[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    total: 0,
    ativas: 0,
    vencidas: 0,
    valorTotal: 0,
    pregoesProximos: 0,
    taxaSucesso: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Referu00eancia para o timeout de debounce
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Funu00e7u00e3o para gerar uma chave de cache baseada nos filtros
  const generateCacheKey = (filtros?: LicitacaoFiltros): string => {
    if (!filtros) return 'all';
    
    const parts = [];
    if (filtros.termo) parts.push(`termo=${filtros.termo}`);
    if (filtros.status) parts.push(`status=${filtros.status}`);
    if (filtros.orgao) parts.push(`orgao=${filtros.orgao}`);
    if (filtros.responsavel) parts.push(`responsavel=${filtros.responsavel}`);
    if (filtros.modalidade) parts.push(`modalidade=${filtros.modalidade}`);
    if (filtros.dataInicio) parts.push(`dataInicio=${typeof filtros.dataInicio === 'string' ? filtros.dataInicio : format(filtros.dataInicio, 'yyyy-MM-dd')}`);
    if (filtros.dataFim) parts.push(`dataFim=${typeof filtros.dataFim === 'string' ? filtros.dataFim : format(filtros.dataFim, 'yyyy-MM-dd')}`);
    if (filtros.valorMinimo) parts.push(`valorMin=${filtros.valorMinimo}`);
    if (filtros.valorMaximo) parts.push(`valorMax=${filtros.valorMaximo}`);
    
    return parts.length ? parts.join('&') : 'all';
  };

  // Funu00e7u00e3o para verificar se o cache u00e9 vu00e1lido
  const isCacheValid = (cacheItem: CacheItem): boolean => {
    return Date.now() - cacheItem.timestamp < CACHE_EXPIRATION;
  };

  // Funu00e7u00e3o para carregar licitacoes com debounce e cache
  const carregarLicitacoes = useCallback(async (filtros?: LicitacaoFiltros) => {
    // Cancelar qualquer debounce anterior
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Aplicar debounce para evitar mu00faltiplas requisiu00e7u00f5es em sequu00eancia
    return new Promise<Licitacao[]>((resolve) => {
      debounceTimeout.current = setTimeout(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          // Gerar chave de cache
          const cacheKey = generateCacheKey(filtros);
          
          // Verificar se temos um cache vu00e1lido
          if (requestCache[cacheKey] && isCacheValid(requestCache[cacheKey])) {
            console.log("Usando dados em cache para:", cacheKey);
            setLicitacoes(requestCache[cacheKey].data);
            setFilteredLicitacoes(requestCache[cacheKey].data);
            setIsLoading(false);
            return resolve(requestCache[cacheKey].data);
          }
          
          // Montar paru00e2metros de consulta com base nos filtros
          const params = new URLSearchParams();
          
          if (filtros) {
            if (filtros.termo) params.append('termo', filtros.termo);
            if (filtros.status) params.append('status', filtros.status);
            if (filtros.orgao) params.append('orgao', filtros.orgao);
            if (filtros.responsavel) params.append('responsavel', filtros.responsavel);
            if (filtros.modalidade) params.append('modalidade', filtros.modalidade);
            if (filtros.dataInicio) params.append('dataInicio', typeof filtros.dataInicio === 'string' ? filtros.dataInicio : format(filtros.dataInicio, 'yyyy-MM-dd'));
            if (filtros.dataFim) params.append('dataFim', typeof filtros.dataFim === 'string' ? filtros.dataFim : format(filtros.dataFim, 'yyyy-MM-dd'));
            if (filtros.valorMinimo) params.append('valorMin', filtros.valorMinimo.toString());
            if (filtros.valorMaximo) params.append('valorMax', filtros.valorMaximo.toString());
          }
          
          // Obter token de autenticau00e7u00e3o - REMOVED
          // const accessToken = localStorage.getItem('accessToken');
          
          console.log('Buscando licitau00e7u00f5es com paru00e2metros:', params.toString());
          const response = await fetch(`/api/licitacoes?${params.toString()}`, {
            method: 'GET',
            credentials: 'include', // ADDED
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              // 'Authorization': `Bearer ${accessToken}` // REMOVED
            }
          });
          
          if (!response.ok) {
            const errorData = await response.text();
            console.error('Resposta nu00e3o-OK da API:', response.status, errorData);
            throw new Error(`Resposta nu00e3o-OK da API: ${response.status} "${errorData}"`);
          }
          
          const data = await response.json();
          console.log('Dados recebidos da API:', data);
          
          // Verificar se os dados recebidos su00e3o um array
          if (!Array.isArray(data)) {
            console.error('Dados recebidos nu00e3o su00e3o um array:', data);
            setLicitacoes([]);
            setFilteredLicitacoes([]);
            resolve([]);
          } else {
            // Armazenar no cache
            requestCache[cacheKey] = {
              data,
              timestamp: Date.now(),
              queryKey: cacheKey
            };
            
            setLicitacoes(data);
            setFilteredLicitacoes(data);
            resolve(data);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
          setError(errorMessage);
          console.error('Erro ao buscar licitau00e7u00f5es:', err);
          resolve([]);
        } finally {
          setIsLoading(false);
        }
      }, 300); // 300ms de debounce
    });
  }, []);

  // Funu00e7u00e3o para carregar estatu00edsticas
  const carregarEstatisticas = useCallback(async () => {
    try {
      // Verificar se temos um cache vu00e1lido para estatu00edsticas
      const cacheKey = 'estatisticas';
      if (requestCache[cacheKey] && isCacheValid(requestCache[cacheKey])) {
        console.log("Usando estatu00edsticas em cache");
        setEstatisticas(requestCache[cacheKey].data);
        return requestCache[cacheKey].data;
      }
      
      // Obter token de autenticau00e7u00e3o - REMOVED
      // const accessToken = localStorage.getItem('accessToken');
      
      const statsResponse = await fetch('/api/licitacoes?estatisticas=true', {
        method: 'GET',
        credentials: 'include', // ADDED
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          // 'Authorization': `Bearer ${accessToken}` // REMOVED
        }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        
        // Armazenar no cache
        requestCache[cacheKey] = {
          data: statsData,
          timestamp: Date.now(),
          queryKey: cacheKey
        };
        
        setEstatisticas(statsData);
        return statsData;
      } else {
        console.error('Erro ao buscar estatu00edsticas:', statsResponse.status);
        return null;
      }
    } catch (statsError) {
      console.error('Erro ao processar estatu00edsticas:', statsError);
      return null;
    }
  }, []);

  // Funu00e7u00e3o para carregar dados iniciais em paralelo
  const carregarDadosIniciais = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Carregar licitau00e7u00f5es e estatu00edsticas em paralelo
      await Promise.all([
        carregarLicitacoes(),
        carregarEstatisticas()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [carregarLicitacoes, carregarEstatisticas]);

  // Funu00e7u00e3o para adicionar uma nova licitau00e7u00e3o
  const adicionarLicitacao = useCallback(async (novaLicitacao: Partial<Licitacao>) => {
    try {
      setIsLoading(true);
      
      // Obter token de autenticau00e7u00e3o - REMOVED
      // const accessToken = localStorage.getItem('accessToken');
      
      const response = await fetch('/api/licitacoes', {
        method: 'POST',
        credentials: 'include', // ADDED
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${accessToken}` // REMOVED
        },
        body: JSON.stringify(novaLicitacao)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ao adicionar licitau00e7u00e3o: ${response.status} "${errorData}"`);
      }
      
      const licitacaoAdicionada = await response.json();
      
      // Invalidar o cache
      Object.keys(requestCache).forEach(key => {
        delete requestCache[key];
      });
      
      // Recarregar os dados
      await carregarDadosIniciais();
      
      return licitacaoAdicionada;
    } catch (error) {
      console.error('Erro ao adicionar licitau00e7u00e3o:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [carregarDadosIniciais]);

  // Funu00e7u00e3o para atualizar uma licitau00e7u00e3o
  const atualizarLicitacao = useCallback(async (id: string, dadosAtualizados: Partial<Licitacao>) => {
    try {
      setIsLoading(true);
      
      // Obter token de autenticau00e7u00e3o - REMOVED
      // const accessToken = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/licitacoes/${id}`, {
        method: 'PUT',
        credentials: 'include', // ADDED
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${accessToken}` // REMOVED
        },
        body: JSON.stringify(dadosAtualizados)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ao atualizar licitau00e7u00e3o: ${response.status} "${errorData}"`);
      }
      
      const licitacaoAtualizada = await response.json();
      
      // Invalidar o cache
      Object.keys(requestCache).forEach(key => {
        delete requestCache[key];
      });
      
      // Recarregar os dados
      await carregarDadosIniciais();
      
      return licitacaoAtualizada;
    } catch (error) {
      console.error('Erro ao atualizar licitau00e7u00e3o:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [carregarDadosIniciais]);

  // Funu00e7u00e3o para excluir uma licitau00e7u00e3o
  const excluirLicitacao = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      
      // Obter token de autenticau00e7u00e3o - REMOVED
      // const accessToken = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/licitacoes/${id}`, {
        method: 'DELETE',
        credentials: 'include', // ADDED
        headers: {
          // 'Authorization': `Bearer ${accessToken}` // REMOVED
        }
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ao excluir licitau00e7u00e3o: ${response.status} "${errorData}"`);
      }
      
      // Invalidar o cache
      Object.keys(requestCache).forEach(key => {
        delete requestCache[key];
      });
      
      // Recarregar os dados
      await carregarDadosIniciais();
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir licitau00e7u00e3o:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [carregarDadosIniciais]);

  return {
    licitacoes,
    filteredLicitacoes,
    setFilteredLicitacoes,
    estatisticas,
    isLoading,
    error,
    carregarLicitacoes,
    carregarEstatisticas,
    carregarDadosIniciais,
    adicionarLicitacao,
    atualizarLicitacao,
    excluirLicitacao
  };
}
