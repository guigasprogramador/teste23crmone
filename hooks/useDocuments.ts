import { useState, useCallback } from 'react';

// Interfaces para documentos (Atualizadas para MySQL API)
export interface DocumentType {
  id: string;
  nome: string;
  tipo: string;
  tags?: string[]; // Changed from categorias
  descricao?: string;
  licitacaoId?: string; // Corresponds to licitacao_id
  licitacaoTitulo?: string; // Joined from licitacoes table
  numeroDocumento?: string; // Corresponds to numero_documento
  dataValidade?: string; // Format DD/MM/YYYY from API
  urlDocumento?: string | null; // Placeholder
  arquivoPath?: string | null; // Placeholder
  formato?: string;
  tamanho?: number;
  status: string;
  criadoPor?: string; // User ID
  criadoPorNome?: string; // User Name
  dataCriacao: string; // ISO String
  dataAtualizacao: string; // ISO String
  categoriaLegado?: string; // Legacy 'categoria' field if still needed
  // publicUrl is removed as it was Supabase specific and now urlDocumento is a placeholder
}

export interface DocumentFilter {
  licitacaoId?: string;
  tipo?: string;
  tagNome?: string; // Changed from categoria
  status?: string;
}

export interface DocumentFormData {
  nome: string;
  tipo: string;
  tags?: string[]; // Changed from categorias
  descricao?: string;
  licitacaoId?: string;
  numeroDocumento?: string;
  dataValidade?: string; // Expected as YYYY-MM-DD or string parsable by new Date()
  // urlDocumento is handled by backend (placeholder)
  arquivo?: File; // For upload
  // Adicionar outros campos que o POST/PATCH da API de metadados aceita
  status?: string;
  criadoPor?: string; // User ID, should be set by auth context typically
  categoriaLegado?: string;
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
        if (filters.tagNome) params.append('tagNome', filters.tagNome); // Changed from categoria to tagNome
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
      
      // API /api/documentos/doc (POST) agora espera 'tags' como array de strings
      // e outros campos relevantes como 'criadoPor' (userId)
      const payload = {
        nome: documentData.nome,
        tipo: documentData.tipo,
        licitacaoId: documentData.licitacaoId,
        descricao: documentData.descricao,
        numeroDocumento: documentData.numeroDocumento,
        dataValidade: documentData.dataValidade, // API espera YYYY-MM-DD ou null
        tags: documentData.tags || [],
        criadoPor: getAuthToken() ? JSON.parse(atob(getAuthToken()!.split('.')[1])).userId : null, // Exemplo, idealmente de um contexto de usuário
        status: documentData.status || 'ativo',
        categoriaLegado: documentData.categoriaLegado
      };
      
      const response = await fetch('/api/documentos/doc', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Erro ao criar documento: ${response.statusText}` }));
        throw new Error(errorData.error || `Erro ao criar documento: ${response.status}`);
      }

      const data = await response.json();
      
      // Adicionar o novo documento à lista local
      if (data.documento) { // API agora retorna { success, message, documento }
        setDocuments(prevDocs => [data.documento, ...prevDocs]);
        return data.documento;
      }
      return null; // Ou lançar erro se data.documento não existir
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
      
      // Enviar tags como string separada por vírgulas para FormData
      if (documentData.tags && documentData.tags.length > 0) {
        formData.append('tags', documentData.tags.join(','));
      }
      
      if (documentData.descricao) formData.append('descricao', documentData.descricao);
      if (documentData.licitacaoId) formData.append('licitacaoId', documentData.licitacaoId);
      if (documentData.numeroDocumento) formData.append('numeroDocumento', documentData.numeroDocumento);
      if (documentData.dataValidade) formData.append('dataValidade', documentData.dataValidade); // API espera YYYY-MM-DD
      // urlDocumento é placeholder, não precisa enviar

      // Adicionar criadoPor (uploadPor na API de upload)
      const decodedToken = getAuthToken() ? JSON.parse(atob(getAuthToken()!.split('.')[1])) : null;
      if (decodedToken && decodedToken.userId) {
        formData.append('uploadPor', decodedToken.userId);
      } else {
        console.warn("ID do usuário não encontrado para 'uploadPor'");
        // Considerar lançar erro ou não enviar se for obrigatório
      }
      if (documentData.status) formData.append('status', documentData.status);
      if (documentData.categoriaLegado) formData.append('categoria', documentData.categoriaLegado);


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
        // Se não tiver arquivo, apenas atualizar os metadados
        // A API PATCH em /api/documentos/doc ou /api/documentos/doc/[id]
        // agora espera 'tags' como array.
        console.warn("Atualização de arquivo em updateDocument não é suportada diretamente. Faça upload separado e atualize metadados se necessário.");
        
        const metadataToUpdate: Partial<DocumentType> = { ...updateData };
        delete metadataToUpdate.arquivo; // Remover o campo arquivo se existir
        if (updateData.tags) { // Assegurar que tags é um array
            metadataToUpdate.tags = Array.isArray(updateData.tags) ? updateData.tags : [];
        }


        // Decidir qual endpoint PATCH usar. Se o PATCH em /api/documentos/doc aceita ID no corpo:
        // const apiUrl = '/api/documentos/doc';
        // Ou se o PATCH em /api/documentos/doc/[id] é o preferido para atualizações:
        const apiUrl = `/api/documentos/doc/${id}`;

        const response = await fetch(apiUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          // Se usar PATCH em /api/documentos/doc, o ID deve estar no corpo.
          // Se usar PATCH em /api/documentos/doc/[id], o ID já está na URL.
          body: JSON.stringify(apiUrl === '/api/documentos/doc' ? { id, ...metadataToUpdate } : metadataToUpdate)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({error: `Erro ao atualizar metadados: ${response.statusText}`}));
          throw new Error(errorData.error || `Erro ao atualizar metadados: ${response.status}`);
        }

        const data = await response.json();
        
        // Atualizar o documento na lista local
        if (data.documento){
          setDocuments(prevDocs =>
            prevDocs.map(doc => doc.id === id ? data.documento : doc)
          );
          return data.documento;
        }
        return null; // Ou lançar erro se data.documento não existir
      } catch (metadataError: any) {
        console.error('Erro ao atualizar apenas os metadados do documento:', metadataError);
        throw metadataError; // Re-throw para ser pego pelo catch externo
      }
    } catch (err: any) {
      console.error('Erro ao atualizar documento:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchDocumentById, uploadDocument, deleteDocument]);

  // Excluir um documento
  const deleteDocument = useCallback(async (id: string, fisicamente: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Não autenticado');
      }

      // A API DELETE em /api/documentos/doc/[id] agora lida com o parâmetro 'fisicamente'
      const url = `/api/documentos/doc/${id}?fisicamente=${fisicamente}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Content-Type não é usualmente necessário para DELETE se não houver corpo
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({error: `Erro ao excluir documento: ${response.statusText}`}));
        throw new Error(errorData.error || `Erro ao excluir documento: ${response.status}`);
      }

      // Remover ou atualizar o documento na lista local
      if (fisicamente) {
        setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== id));
      } else {
        setDocuments(prevDocs => 
          prevDocs.map(doc => (doc.id === id ? { ...doc, status: 'excluido' } : doc))
        );
      }
      
      const data = await response.json(); // API retorna { success: true, message: '...' }
      return data.success; // Retornar boolean para delete
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
