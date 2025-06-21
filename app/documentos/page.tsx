"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, FileText, Trash2, Calendar, FileIcon } from "lucide-react"
import { NovoDocumento } from "@/components/documentos/novo-documento"
import { VisualizadorDocumento } from "@/components/documentos/visualizador-documento"
import { FiltroDocumentos, DocumentoFiltros } from "@/components/documentos/filtro-documentos"
import { useDocuments, DocumentType } from "@/hooks/useDocuments"
import { useLicitacoes, Licitacao } from "@/hooks/useLicitacoes"
import { format, addDays, isAfter, isBefore } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"

// Interface atualizada para usar os tipos da API
interface Documento {
  id: string;
  nome: string;
  tipo: string;
  formato: string;
  categoria: string;
  categoriaId?: string;
  licitacao?: string;
  licitacaoId?: string;
  licitacao_id?: string;
  dataUpload?: string;
  uploadPor?: string;
  resumo?: string;
  url?: string;
  arquivo_path?: string;
  tamanho?: string | number;
  dataValidade?: string;
  descricao?: string; // Adicionando descricao para filtro de busca
}

// Dados de exemplo para backup caso a API falhe
const documentosData: Documento[] = [
  {
    id: "1",
    nome: "Edital_Pregao_123.pdf",
    tipo: "Edital",
    formato: "pdf",
    categoria: "Jurídicos",
    categoriaId: "juridicos",
    licitacao: "Pregão Eletrônico 123/2023",
    licitacaoId: "pregao_123",
    dataUpload: "10/01/2023",
    tamanho: "2.5 MB",
    uploadPor: "Ana Silva",
    resumo: "Edital completo do Pregão Eletrônico 123/2023 para aquisição de software de gestão municipal.",
    descricao: "Edital completo do Pregão Eletrônico 123/2023 para aquisição de software de gestão municipal.",
  },
  {
    id: "2",
    nome: "Proposta_Comercial.docx",
    tipo: "Proposta",
    formato: "docx",
    categoria: "Projetos",
    categoriaId: "projetos",
    licitacao: "Concorrência 45/2023",
    licitacaoId: "concorrencia_45",
    dataUpload: "15/01/2023",
    tamanho: "1.8 MB",
    uploadPor: "Carlos Oliveira",
    resumo: "Proposta comercial detalhada para a Concorrência 45/2023, incluindo valores, prazos e condições.",
    descricao: "Proposta comercial detalhada para a Concorrência 45/2023, incluindo valores, prazos e condições.",
  },
  {
    id: "3",
    nome: "Certidao_Negativa.pdf",
    tipo: "Certidão",
    formato: "pdf",
    categoria: "Contábeis",
    categoriaId: "contabeis",
    licitacao: "Tomada de Preços 78/2023",
    licitacaoId: "tomada_78",
    dataUpload: "20/01/2023",
    tamanho: "0.5 MB",
    uploadPor: "Maria Souza",
    resumo: "Certidão negativa de débitos municipais válida até 20/07/2023.",
    descricao: "Certidão negativa de débitos municipais válida até 20/07/2023.",
  },
  {
    id: "4",
    nome: "Contrato_Assinado.pdf",
    tipo: "Contrato",
    formato: "pdf",
    categoria: "Jurídicos",
    categoriaId: "juridicos",
    licitacao: "Pregão Presencial 56/2023",
    licitacaoId: "pregao_56",
    dataUpload: "25/01/2023",
    tamanho: "3.2 MB",
    uploadPor: "Pedro Santos",
    resumo: "Contrato assinado referente ao Pregão Presencial 56/2023 com vigência de 12 meses.",
    descricao: "Contrato assinado referente ao Pregão Presencial 56/2023 com vigência de 12 meses.",
  },
  {
    id: "5",
    nome: "Planilha_Orcamentaria.xlsx",
    tipo: "Planilha",
    formato: "xlsx",
    categoria: "Contábeis",
    categoriaId: "contabeis",
    licitacao: "Concorrência 92/2023",
    licitacaoId: "concorrencia_92",
    dataUpload: "30/01/2023",
    tamanho: "1.1 MB",
    uploadPor: "Ana Silva",
    resumo: "Planilha orçamentária detalhada com todos os itens e valores para a Concorrência 92/2023.",
    descricao: "Planilha orçamentária detalhada com todos os itens e valores para a Concorrência 92/2023.",
  },
  {
    id: "6",
    nome: "Estatuto_Social.pdf",
    tipo: "Documento Legal",
    formato: "pdf",
    categoria: "Jurídicos",
    categoriaId: "juridicos",
    licitacao: "Pregão Eletrônico 123/2023",
    licitacaoId: "pregao_123",
    dataUpload: "05/02/2023",
    tamanho: "1.7 MB",
    uploadPor: "Carlos Oliveira",
    resumo: "Estatuto social da empresa atualizado conforme última assembleia.",
    descricao: "Estatuto social da empresa atualizado conforme última assembleia.",
  },
  {
    id: "7",
    nome: "Apresentacao_Projeto.pptx",
    tipo: "Apresentação",
    formato: "pptx",
    categoria: "Projetos",
    categoriaId: "projetos",
    licitacao: "Tomada de Preços 78/2023",
    licitacaoId: "tomada_78",
    dataUpload: "10/02/2023",
    tamanho: "4.3 MB",
    uploadPor: "Maria Souza",
    resumo: "Apresentação detalhada do projeto técnico para a Tomada de Preços 78/2023.",
    descricao: "Apresentação detalhada do projeto técnico para a Tomada de Preços 78/2023.",
  },
  {
    id: "8",
    nome: "Relatorio_Tecnico.pdf",
    tipo: "Relatório",
    formato: "pdf",
    categoria: "Técnicos",
    categoriaId: "tecnicos",
    licitacao: "Concorrência 45/2023",
    licitacaoId: "concorrencia_45",
    dataUpload: "15/02/2023",
    tamanho: "2.8 MB",
    uploadPor: "Pedro Santos",
    resumo: "Relatório técnico detalhado sobre a solução proposta para a Concorrência 45/2023.",
    descricao: "Relatório técnico detalhado sobre a solução proposta para a Concorrência 45/2023.",
  },
]

// Função para obter a classe CSS para o badge de categoria
function getCategoryBadgeClass(categoriaId: string): string {
  if (!categoriaId) return "";
  
  switch (categoriaId) {
    case "projetos":
      return "bg-blue-100 text-blue-800"
    case "contabeis":
      return "bg-green-100 text-green-800"
    case "societarios":
      return "bg-purple-100 text-purple-800"
    case "juridicos":
      return "bg-amber-100 text-amber-800"
    case "atestado_capacidade":
      return "bg-indigo-100 text-indigo-800"
    case "tecnicos":
      return "bg-emerald-100 text-emerald-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function DocumentosPage() {
  const [filteredDocumentos, setFilteredDocumentos] = useState<Documento[]>([])
  const [selectedDocumento, setSelectedDocumento] = useState<Documento | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const { toast } = useToast()
  
  // Hooks para carregar documentos da API
  const {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument
  } = useDocuments()

  // Hook para carregar licitações
  const { 
    licitacoes,
    loading: loadingLicitacoes,
    fetchLicitacoes
  } = useLicitacoes()

  // Efeito para carregar documentos ao montar o componente
  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])
  
  // Efeito para carregar licitações ao montar o componente
  useEffect(() => {
    fetchLicitacoes()
  }, [fetchLicitacoes])

  // Efeito para atualizar documentos filtrados quando a lista de documentos mudar
  useEffect(() => {
    if (documents && documents.length > 0) {
      const formattedDocs = documents.map(formatarDocumentoParaUI)
      setFilteredDocumentos(formattedDocs)
    } else {
      // Fallback para dados de exemplo
      setFilteredDocumentos(documentosData)
    }
  }, [documents])

  // Função para formatar documento da API para o formato da UI
  const formatarDocumentoParaUI = (doc: DocumentType): Documento => {
    // Formatar data ISO para data legível
    let dataFormatada = ""
    if (doc.data_criacao) {
      try {
        dataFormatada = format(new Date(doc.data_criacao), "dd/MM/yyyy", { locale: ptBR })
      } catch (e) {
        console.error("Erro ao formatar data:", e)
        dataFormatada = doc.data_criacao.toString()
      }
    }

    // Formatar tamanho do arquivo
    const tamanhoFormatado = doc.tamanho ? formatFileSize(doc.tamanho) : ""

    // Obter categoria_id a partir da categoria
    const categoriaId = doc.categoria ? doc.categoria.toLowerCase().replace(/\s+/g, '_') : ""

    return {
      id: doc.id,
      nome: doc.nome || "",
      tipo: doc.tipo || "",
      formato: doc.formato || "",
      categoria: doc.categoria || "",
      categoriaId: categoriaId,
      licitacao: doc.licitacao_id ? `Licitação ${doc.licitacao_id}` : "",
      licitacaoId: doc.licitacao_id || "",
      licitacao_id: doc.licitacao_id,
      dataUpload: dataFormatada,
      uploadPor: doc.criado_por || "",
      resumo: doc.descricao || "",
      arquivo_path: doc.arquivo_path,
      tamanho: tamanhoFormatado,
      dataValidade: doc.data_validade ? format(new Date(doc.data_validade), "dd/MM/yyyy", { locale: ptBR }) : undefined,
      descricao: doc.descricao || "",
    }
  }

  // Função para formatar tamanho do arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Função para filtrar documentos
  const filtrarDocumentos = (filtros: DocumentoFiltros) => {
    let docsAtivos = [...documents.map(formatarDocumentoParaUI)]
    
    if (filtros.termo) {
      const termo = filtros.termo.toLowerCase();
      docsAtivos = docsAtivos.filter(doc => 
        doc.nome.toLowerCase().includes(termo) || 
        (doc.resumo && doc.resumo.toLowerCase().includes(termo)) ||
        (doc.descricao && doc.descricao.toLowerCase().includes(termo))
      );
    }
    
    if (filtros.tipo && filtros.tipo !== 'todos') {
      docsAtivos = docsAtivos.filter(doc => doc.tipo === filtros.tipo);
    }
    
    if (filtros.categoria && filtros.categoria !== 'todos') {
      docsAtivos = docsAtivos.filter(doc => doc.categoriaId === filtros.categoria);
    }
    
    if (filtros.licitacao && filtros.licitacao !== 'todos') {
      docsAtivos = docsAtivos.filter(doc => doc.licitacaoId === filtros.licitacao);
    }
    
    if (filtros.formato && filtros.formato.trim() !== "" && filtros.formato !== 'todos') {
      docsAtivos = docsAtivos.filter(doc => {
        const formato = doc.formato?.toLowerCase() || '';
        return formato === filtros.formato?.toLowerCase();
      });
    }
    
    setFilteredDocumentos(docsAtivos);
  }

  // Função para abrir o visualizador de documento
  const handleViewDocument = (documento: Documento) => {
    // Sempre usar o visualizador em modal
    setSelectedDocumento(documento);
    setIsViewerOpen(true);
  }

  // Função para tratar o novo documento adicionado
  const handleDocumentoAdded = async (novoDocumento: any, arquivo?: File) => {
    try {
      const docData = {
        nome: novoDocumento.nome,
        tipo: novoDocumento.tipo,
        categorias: novoDocumento.categorias, // Ajustado para usar o array de categorias
        descricao: novoDocumento.descricao,
        licitacaoId: novoDocumento.licitacaoId,
        numeroDocumento: novoDocumento.numeroDocumento,
        dataValidade: novoDocumento.dataValidade,
        urlDocumento: novoDocumento.urlDocumento,
        arquivo: arquivo
      }

      console.log("Enviando documento com categorias:", docData.categorias);
      
      // Enviar documento para a API
      const resultado = await uploadDocument(docData)
      
      if (resultado) {
        toast({
          title: "Documento adicionado",
          description: "O documento foi adicionado com sucesso!"
        })
        
        // Recarregar a lista de documentos
        fetchDocuments()
      }
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar documento",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  // Função para lidar com a exclusão do documento
  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (window.confirm("Tem certeza que deseja excluir este documento?")) {
      try {
        const resultado = await deleteDocument(id)
        
        if (resultado) {
          toast({
            title: "Documento excluído",
            description: "O documento foi excluído com sucesso!"
          })
          
          // Recarregar a lista de documentos
          fetchDocuments()
        }
      } catch (error: any) {
        toast({
          title: "Erro ao excluir documento",
          description: error.message,
          variant: "destructive"
        })
      }
    }
  }

  // Função para fazer download do arquivo
  const handleDownload = (documento: Documento, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Nova URL de download para a API
    const newDownloadUrl = `/api/documentos/doc/${documento.id}/download`;
    
    if (documento.id) { // Garante que o ID do documento existe
      window.open(newDownloadUrl, '_blank');
    } else {
      toast({
        title: "Erro ao baixar documento",
        description: "ID do documento não encontrado ou inválido.",
        variant: "destructive"
      })
    }
  }

  // Calcular estatísticas para os cards no topo
  const totalDocumentos = filteredDocumentos.length;
  
  // Calcular documentos que vencem em 30 dias
  const calcularDocumentosVencendo = () => {
    const hoje = new Date();
    const em30Dias = addDays(hoje, 30);
    
    return filteredDocumentos.filter(doc => {
      if (!doc.dataValidade) return false;
      
      try {
        const dataValidade = doc.dataValidade.split('/').reverse().join('-');
        const dataValidadeObj = new Date(dataValidade);
        
        // Documentos que vencem nos próximos 30 dias (depois de hoje e antes de 30 dias a partir de hoje)
        return isAfter(dataValidadeObj, hoje) && isBefore(dataValidadeObj, em30Dias);
      } catch (e) {
        return false;
      }
    }).length;
  };
  
  const documentosVencendo = calcularDocumentosVencendo();

  // Extrair listas de valores únicos para os filtros de forma mais simples
  const tiposUnicos = filteredDocumentos
    .map(doc => doc.tipo)
    .filter((value, index, self) => value && self.indexOf(value) === index);
  
  // Formatar corretamente as licitações e categorias conforme esperado pelos componentes
  const licitacoesUnicas = filteredDocumentos
    .filter(doc => doc.licitacaoId && doc.licitacao)
    .map(doc => ({ id: doc.licitacaoId || '', nome: doc.licitacao || 'Sem nome' }))
    .filter((value, index, self) => 
      index === self.findIndex(t => t.id === value.id)
    );
  
  const categoriasUnicas = filteredDocumentos
    .filter(doc => doc.categoria)
    .map(doc => ({ 
      id: doc.categoriaId || (doc.categoria ? doc.categoria.toLowerCase().replace(/\s+/g, '_') : ''), 
      nome: doc.categoria 
    }))
    .filter((value, index, self) => 
      index === self.findIndex(t => t.id === value.id)
    );

  return (
    <div className="container mx-auto py-6 px-4 bg-gray-50">
      <h1 className="text-2xl font-semibold mb-5">Documentos</h1>
      
      {/* Cards de estatísticas */}
      <div className="flex flex-wrap gap-4 mb-5">
        <div className="bg-white rounded-md border border-gray-200 p-4 shadow-sm min-w-[125px]">
          <h2 className="text-3xl font-bold">{totalDocumentos}</h2>
          <p className="text-sm text-gray-500">Documentos</p>
        </div>
        
        <div className="bg-white rounded-md border border-gray-200 p-4 shadow-sm min-w-[125px]">
          <h2 className="text-3xl font-bold">{documentosVencendo}</h2>
          <p className="text-sm text-gray-500">Vencem em 30dias</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Lista de Documentos</h2>
            <div className="flex items-center gap-2">
              <div className="inline">
                <FiltroDocumentos 
                  onFilterChange={filtrarDocumentos}
                  tiposDocumentos={tiposUnicos}
                  categorias={categoriasUnicas}
                  licitacoes={licitacoesUnicas}
                />
              </div>
              
              <div className="inline">
                <NovoDocumento onDocumentoAdded={handleDocumentoAdded} />
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Gerenciamento de todos os documentos cadastrados.</p>

          {/* Lista de documentos */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-primary rounded-full" 
                     aria-label="loading"></div>
                <p className="mt-2">Carregando documentos...</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 text-sm">
                    <th className="text-left p-3 font-medium text-gray-600">Nome</th>
                    <th className="text-left p-3 font-medium text-gray-600">Tipo</th>
                    <th className="text-left p-3 font-medium text-gray-600">Categoria</th>
                    <th className="text-left p-3 font-medium text-gray-600">Licitação</th>
                    <th className="text-left p-3 font-medium text-gray-600">Data de Upload</th>
                    <th className="text-left p-3 font-medium text-gray-600">Tamanho</th>
                    <th className="text-left p-3 font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocumentos.length > 0 ? (
                    filteredDocumentos.map((documento) => (
                      <tr
                        key={documento.id}
                        className="border-b hover:bg-gray-50 text-sm"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2 text-blue-500">
                            <FileIcon className="h-4 w-4 text-blue-500" />
                            <a 
                              href="#" 
                              className="text-blue-500 hover:underline"
                              onClick={(e) => {
                                e.preventDefault()
                                handleViewDocument(documento)
                              }}
                            >
                              {documento.nome}
                            </a>
                          </div>
                        </td>
                        <td className="p-3">{documento.tipo}</td>
                        <td className="p-3">
                          <Badge className={`text-xs py-1 px-2 font-normal rounded-full ${getCategoryBadgeClass(documento.categoriaId || '')}`}>
                            {documento.categoria}
                          </Badge>
                        </td>
                        <td className="p-3">{documento.licitacao}</td>
                        <td className="p-3">{documento.dataUpload}</td>
                        <td className="p-3">{documento.tamanho}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleViewDocument(documento)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7" 
                              onClick={(e) => handleDownload(documento, e)}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-red-500 hover:text-red-700" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDocument(documento.id, e);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">
                        Nenhum documento encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Visualizador de documento */}
      <VisualizadorDocumento documento={selectedDocumento} open={isViewerOpen} onOpenChange={setIsViewerOpen} />
    </div>
  )
}
