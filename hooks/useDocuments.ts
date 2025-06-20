import { useState, useCallback } from 'react';

// Interfaces para documentos
export interface DocumentType {
  id: string;
  nome: string;
  tipo: string;
  categorias: string[]; // array de tags/categorias
  descricao?: string;
  licitacao_id?: string;
  numero_documento?: string;
  data_validade?: string;
  url_documento?: string;
  arquivo_path?: string;
  formato?: string;
  tamanho?: number;
  status: string;
  criado_por?: string;
  data_criacao: string;
  data_atualizacao: string;
  publicUrl?: string; // URL pública do arquivo
}

export interface DocumentFilter {
  licitacaoId?: string;
  tipo?: string;
  categoria?: string;
  status?: string;
}

export interface DocumentFormData {
  nome: string;
  tipo: string;
  categorias: string[]; // array de tags/categorias
  descricao?: string;
  licitacaoId?: string;
  numeroDocumento?: string;
  dataValidade?: string;
  urlDocumento?: string;
  arquivo?: File;
}

// Hook para gerenciar operações de documentos
export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para obter o token de autenticação
  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  // Buscar todos os documentos ou filtrar
  const fetchDocuments = useCallback(async (filters?: DocumentFilter) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Não autenticado');
      }

      // Construir URL com parâmetros de filtro
      let url = '/api/documentos/doc';
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.licitacaoId) params.append('licitacaoId', filters.licitacaoId);
        if (filters.tipo) params.append('tipo', filters.tipo);
        if (filters.categoria) params.append('categoria', filters.categoria);
        if (filters.status) params.append('status', filters.status);
      }

      // Adicionar parâmetros à URL se houver
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ao buscar documentos: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      setDocuments(data.documentos || []);
      return data.documentos || [];
    } catch (err: any) {
      console.error('Erro ao buscar documentos:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar um documento específico pelo ID
  const fetchDocumentById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Não autenticado');
      }

      const response = await fetch(`/api/documentos/doc/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ao buscar documento: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      return data.documento;
    } catch (err: any) {
      console.error('Erro ao buscar documento:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar um novo documento (apenas metadados, sem upload de arquivo)
  const createDocument = useCallback(async (documentData: Omit<DocumentFormData, 'arquivo'>) => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Não autenticado');
      }
      
      // Para compatibilidade com o backend atual
      const dataToSend = {
        ...documentData,
        categoria: documentData.categorias && documentData.categorias.length > 0 
                  ? documentData.categorias.join(',')
                  : 'geral'
      };
      
      const response = await fetch('/api/documentos/doc', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ao criar documento: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      
      // Adicionar o novo documento à lista local
      setDocuments(prevDocs => [...prevDocs, data.documento]);
      
      return data.documento;
    } catch (err: any) {
      console.error('Erro ao criar documento:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload de documento com arquivo
  const uploadDocument = useCallback(async (documentData: DocumentFormData) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Não autenticado');
      }

      // Se não tiver arquivo, usar a função createDocument
      if (!documentData.arquivo) {
        const { arquivo, ...metadataOnly } = documentData;
        return createDocument(metadataOnly);
      }

      // Preparar FormData para upload
      const formData = new FormData();
      formData.append('file', documentData.arquivo);
      formData.append('nome', documentData.nome);
      formData.append('tipo', documentData.tipo);
      
      // Para compatibilidade com o backend atual, envie todas as categorias como uma string separada por vírgulas
      if (documentData.categorias && documentData.categorias.length > 0) {
        // Enviar todas as categorias como uma string separada por vírgula
        formData.append('categoria', documentData.categorias.join(','));
        
        // Enviar também o array completo (para uso futuro quando o backend for atualizado)
        documentData.categorias.forEach(cat => formData.append('categorias[]', cat));
      } else {
        // Categoria padrão se não houver nenhuma selecionada
        formData.append('categoria', 'geral');
      }
      
      if (documentData.descricao) formData.append('descricao', documentData.descricao);
      if (documentData.licitacaoId) formData.append('licitacaoId', documentData.licitacaoId);
      if (documentData.numeroDocumento) formData.append('numeroDocumento', documentData.numeroDocumento);
      if (documentData.dataValidade) formData.append('dataValidade', documentData.dataValidade);
      if (documentData.urlDocumento) formData.append('urlDocumento', documentData.urlDocumento);

      const response = await fetch('/api/documentos/doc/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ao fazer upload do documento: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      
      // Adicionar o novo documento à lista local
      if (data.documento) {
        setDocuments(prevDocs => [...prevDocs, data.documento]);
      }
      
      return data;
    } catch (err: any) {
      console.error('Erro ao fazer upload do documento:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [createDocument]);

  // Atualizar um documento existente
  const updateDocument = useCallback(async (id: string, updateData: Partial<DocumentFormData>) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Não autenticado');
      }

      // Se houver arquivo, fazer upload e atualizar o documento
      if (updateData.arquivo) {
        // Buscar documento atual para obter outros dados
        const currentDoc = await fetchDocumentById(id);
        if (!currentDoc) {
          throw new Error('Documento não encontrado');
        }

        // Preparar dados completos para upload
        const uploadData: DocumentFormData = {
          nome: updateData.nome || currentDoc.nome,
          tipo: updateData.tipo || currentDoc.tipo,
          categorias: updateData.categorias || currentDoc.categorias || [],
          descricao: updateData.descricao || currentDoc.descricao,
          licitacaoId: updateData.licitacaoId || currentDoc.licitacao_id,
          numeroDocumento: updateData.numeroDocumento || currentDoc.numero_documento,
          dataValidade: updateData.dataValidade || currentDoc.data_validade,
          urlDocumento: updateData.urlDocumento || currentDoc.url_documento,
          arquivo: updateData.arquivo
        };

        // Fazer upload do novo arquivo
        const uploadResult = await uploadDocument(uploadData);
        if (!uploadResult) {
          throw new Error('Erro ao fazer upload do arquivo atualizado');
        }

        // Excluir o documento antigo (soft delete)
        await deleteDocument(id, false);
        
        return uploadResult.documento;
      }

      // Se não tiver arquivo, apenas atualizar os metadados
      try {
        // Buscar documento atual para obter dados existentes
        const currentDoc = await fetchDocumentById(id);
        if (!currentDoc) {
          throw new Error('Documento não encontrado');
        }
        
        const dataToSend = {
          id,
          ...updateData,
          // Para compatibilidade com o backend atual
          categoria: updateData.categorias && updateData.categorias.length > 0 
                    ? updateData.categorias.join(',')
                    : (currentDoc.categorias && currentDoc.categorias.length > 0 
                      ? currentDoc.categorias.join(',')
                      : 'geral')
        };
        
        const response = await fetch(`/api/documentos/doc/${id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataToSend)
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Erro ao atualizar documento: ${response.status} ${errorData}`);
        }

        const data = await response.json();
        
        // Atualizar o documento na lista local
        setDocuments(prevDocs => 
          prevDocs.map(doc => doc.id === id ? data.documento : doc)
        );
        
        return data.documento;
      } catch (err: any) {
        console.error('Erro ao atualizar documento:', err);
        setError(err.message);
        return null;
      }
    } catch (err: any) {
      console.error('Erro ao atualizar documento:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchDocumentById, uploadDocument]);

  // Excluir um documento
  const deleteDocument = useCallback(async (id: string, fisicamente: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Não autenticado');
      }

      const url = `/api/documentos/doc/${id}?fisicamente=${fisicamente}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ao excluir documento: ${response.status} ${errorData}`);
      }

      // Remover ou atualizar o documento na lista local
      if (fisicamente) {
        // Remover completamente
        setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== id));
      } else {
        // Marcar como excluído
        setDocuments(prevDocs => 
          prevDocs.map(doc => doc.id === id ? { ...doc, status: 'excluido' } : doc)
        );
      }
      
      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('Erro ao excluir documento:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    fetchDocumentById,
    createDocument,
    uploadDocument,
    updateDocument,
    deleteDocument
  };
}
