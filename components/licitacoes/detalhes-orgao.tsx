"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Phone, Mail, User, PlusCircle, Edit, Save, Trash2, ChevronRight, Landmark, AlertTriangle, Maximize2, Minimize2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { v4 as uuidv4 } from 'uuid'

interface StatusColors {
  ativo: string;
  inativo: string;
  pendente: string;
  analise_interna: string;
  aguardando_pregao: string;
  vencida: string;
  nao_vencida: string;
  envio_documentos: string;
  assinaturas: string;
  concluida: string;
}

interface StatusLabels {
  ativo: string;
  inativo: string;
  pendente: string;
  analise_interna: string;
  aguardando_pregao: string;
  vencida: string;
  nao_vencida: string;
  envio_documentos: string;
  assinaturas: string;
  concluida: string;
}

interface Orgao {
  id: string;
  nome: string;
  status: string;
  tipo?: string;
  tipoLabel?: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  site?: string;
  segmento?: string;
  origem_lead?: string;
  responsavel_interno?: string;
  descricao?: string;
  observacoes?: string;
  faturamento?: string;
  contatos?: ContatoType[];
}

interface Licitacao {
  id: string;
  nome: string;
  valor: string;
  status: string;
  prazo: string;
  responsavel: string;
  dataJulgamento: string;
  contatos?: ContatoType[];
}

interface ContatoType {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  telefone: string;
  orgao_id?: string;
  licitacao_id?: string;
  data_criacao: string;
  data_atualizacao: string;
}

interface DetalhesOrgaoProps {
  orgao: Orgao | null;
  licitacao?: Licitacao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrgaoUpdate?: (orgao: Orgao) => void;
  onOrgaoDelete?: (orgao: Orgao) => void;
  onLicitacaoUpdate?: (licitacao: Licitacao) => void;
  onLicitacaoDelete?: (licitacao: Licitacao) => void;
}

interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

type ToastVariant = "default" | "destructive";

interface ToastProps {
  title: string;
  description: string;
  variant?: ToastVariant;
}

interface ContatoFormData {
  nome: string;
  cargo: string;
  email: string;
  telefone: string;
}

const statusColors: StatusColors = {
  ativo: "bg-green-100 text-green-800",
  inativo: "bg-red-100 text-red-800",
  pendente: "bg-yellow-100 text-yellow-800",
  analise_interna: "bg-yellow-100 text-yellow-800",
  aguardando_pregao: "bg-blue-100 text-blue-800",
  vencida: "bg-red-100 text-red-800",
  nao_vencida: "bg-green-100 text-green-800",
  envio_documentos: "bg-purple-100 text-purple-800",
  assinaturas: "bg-indigo-100 text-indigo-800",
  concluida: "bg-gray-100 text-gray-800"
};

const statusLabels: StatusLabels = {
  ativo: "Ativo",
  inativo: "Inativo",
  pendente: "Pendente",
  analise_interna: "Em Análise Interna",
  aguardando_pregao: "Aguardando Pregão",
  vencida: "Vencida",
  nao_vencida: "Não Vencida",
  envio_documentos: "Envio de Documentos",
  assinaturas: "Assinaturas",
  concluida: "Concluída"
};

const getStatusColor = (status: keyof StatusColors) => {
  return statusColors[status] || "bg-gray-100 text-gray-800";
};

const getStatusLabel = (status: keyof StatusLabels) => {
  return statusLabels[status] || "Status Desconhecido";
};

export function DetalhesOrgao({
  orgao,
  licitacao,
  open,
  onOpenChange,
  onOrgaoUpdate,
  onOrgaoDelete,
  onLicitacaoUpdate,
  onLicitacaoDelete
}: DetalhesOrgaoProps) {
  const [activeTab, setActiveTab] = useState("resumo")
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Orgao>>({})
  const [contatos, setContatos] = useState<ContatoType[]>([])
  const [novoContato, setNovoContato] = useState<Omit<ContatoType, 'id'>>({
    orgao_id: '',
    licitacao_id: '',
    nome: '',
    email: '',
    telefone: '',
    cargo: ''
  })
  const [mostrarFormContato, setMostrarFormContato] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editandoContato, setEditandoContato] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [orgaoState, setOrgaoState] = useState<Orgao | null>(orgao)
  const [contatoEditando, setContatoEditando] = useState<ContatoType | null>(null)
  const [showAddContatoDialog, setShowAddContatoDialog] = useState(false)
  const [licitacoesDoOrgao, setLicitacoesDoOrgao] = useState<any[]>([])
  const [orgaoResumo, setOrgaoResumo] = useState<any>(null);
  const [nomeResponsavelInterno, setNomeResponsavelInterno] = useState<string>("");

  const { toast } = useToast()

  // Reset active tab when opening the sheet
  useEffect(() => {
    if (open) {
      setActiveTab("resumo")
      setIsEditing(false)
    }
  }, [open])

  // Atualizar o estado novoContato quando orgao ou licitacao mudarem
  useEffect(() => {
    if (orgaoState?.id || licitacao?.id) {
      setNovoContato(prev => ({
        ...prev,
        orgao_id: orgaoState?.id || '',
        licitacao_id: licitacao?.id || ''
      }))
    }
  }, [orgaoState?.id, licitacao?.id])

  // Buscar os dados do órgão diretamente da tabela 'orgao' e popular os campos do formulário/resumo
  const carregarOrgaoBanco = async (orgaoId?: string) => {
    try {
      const idParaConsulta = orgaoId || orgao?.id;
      if (!idParaConsulta) return;

      const response = await fetch(`/api/licitacoes/orgaos/${idParaConsulta}`);

      if (!response.ok) {
        // Handle HTTP errors like 404 or 500
        const errorData = await response.json().catch(() => ({ message: response.statusText })); // Try to parse error, fallback to statusText
        console.error('Erro ao buscar órgão:', errorData);
        toast({
          title: "Erro ao carregar órgão",
          description: `Não foi possível carregar os dados do órgão: ${errorData.message || response.statusText}`,
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();

      if (data) {
        setFormData(data);
        setOrgaoState(data);
      } else {
        // Handle cases where response is OK but data is null/undefined (should ideally not happen with a single record API)
        console.error('Dados do órgão não encontrados na resposta:', data);
        toast({
          title: "Dados não encontrados",
          description: "A API retornou uma resposta vazia para o órgão solicitado.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      console.error('Erro ao buscar órgão (catch):', e);
      toast({
        title: "Erro de Rede ou Processamento",
        description: `Ocorreu um erro ao tentar buscar os dados do órgão: ${e.message}`,
        variant: "destructive",
      });
    }
  };

  // Chamar carregarOrgaoBanco sempre que orgao?.id mudar e quando abrir o painel
  useEffect(() => {
    if (orgao?.id && open) {
      carregarOrgaoBanco(orgao.id);
    }
  }, [orgao?.id, open]);

  useEffect(() => {
    // Adicionar log para debugar
    console.log("DetalhesOrgao recebeu licitacao:", licitacao)
    console.log("DetalhesOrgao recebeu orgao:", orgao)
  }, [licitacao, orgao])

  useEffect(() => {
    if (orgao?.id && open) {
      // Primeiro verificar se o órgão existe no banco de dados
      verificarECarregarOrgao()
    }
  }, [orgao?.id, open])
  
  // Efeito adicional para garantir que os contatos sejam carregados quando orgaoState mudar
  useEffect(() => {
    if (orgaoState?.id && open) {
      carregarContatos(orgaoState.id)
      carregarLicitacoesDoOrgao(orgaoState.id)
      carregarResumoOrgao(orgaoState.id);
    }
  }, [orgaoState?.id, open])
  
  // Buscar nome do responsável interno sempre que formData.responsavel_interno mudar
  useEffect(() => {
    const buscarResponsavel = async () => {
      if (formData.responsavel_interno) {
        try {
          const response = await fetch(`/api/users/${formData.responsavel_interno}`);
          if (!response.ok) {
            // Handle HTTP errors or cases where user is not found
            console.error(`Erro ao buscar usuário: ${response.status} ${response.statusText}`);
            setNomeResponsavelInterno("");
            // Optionally, display a toast message to the user
            // toast({
            //   title: "Erro ao buscar responsável",
            //   description: `Não foi possível carregar os dados do responsável: ${response.statusText}`,
            //   variant: "destructive",
            // });
            return;
          }
          const data = await response.json();
          // Assuming the API returns { user: { nome: "UserName" } } or similar
          // Adjust data.user.nome if the structure is different e.g. data.nome or data.user.name
          if (data && data.user && data.user.nome) {
            setNomeResponsavelInterno(data.user.nome);
          } else if (data && data.nome) { // Fallback if structure is just { nome: "UserName" }
            setNomeResponsavelInterno(data.nome);
          }
          else {
            console.warn("Nome do responsável não encontrado na resposta da API:", data);
            setNomeResponsavelInterno("");
          }
        } catch (e: any) {
          console.error('Erro ao buscar responsável (catch):', e);
          setNomeResponsavelInterno("");
          // Optionally, display a toast message to the user
          // toast({
          //   title: "Erro de Rede ou Processamento",
          //   description: `Ocorreu um erro ao tentar buscar os dados do responsável: ${e.message}`,
          //   variant: "destructive",
          // });
        }
      } else {
        setNomeResponsavelInterno("");
      }
    };
    buscarResponsavel();
  }, [formData.responsavel_interno, toast]);

  // Função para verificar se o órgão existe e carregar dados reais
  const verificarECarregarOrgao = async () => {
    try {
      console.log('Verificando se o órgão existe no banco de dados:', orgao?.id, orgao?.nome);
      const orgaoNomeParaBusca = orgao?.nome || '';
      const orgaoIdParaBusca = orgao?.id || '';

      // 1. Tentar buscar pelo nome
      if (orgaoNomeParaBusca) {
        const responseNome = await fetch(`/api/licitacoes/orgaos?nome=${encodeURIComponent(orgaoNomeParaBusca)}`);
        if (responseNome.ok) {
          const orgaosEncontrados = await responseNome.json();
          if (orgaosEncontrados && orgaosEncontrados.length > 0) {
            const orgaoEncontrado = orgaosEncontrados[0];
            console.log('Órgão encontrado pelo nome:', orgaoEncontrado);
            setOrgaoState(orgaoEncontrado);
            carregarContatos(orgaoEncontrado.id);
            carregarLicitacoesDoOrgao(orgaoEncontrado.id);
            return;
          }
        } else {
          // Log error but continue, as we might find it by ID or need to create it
          console.warn(`Falha ao buscar órgão pelo nome "${orgaoNomeParaBusca}": ${responseNome.status}`);
        }
      }

      // 2. Se não encontrou pelo nome ou nome não disponível, tentar pelo ID
      if (orgaoIdParaBusca) {
        const responseId = await fetch(`/api/licitacoes/orgaos/${orgaoIdParaBusca}`);
        if (responseId.ok) {
          const orgaoEncontrado = await responseId.json();
          if (orgaoEncontrado) { // API might return 200 with null if not found by ID, or 404
            console.log('Órgão encontrado pelo ID:', orgaoEncontrado);
            setOrgaoState(orgaoEncontrado);
            carregarContatos(orgaoEncontrado.id);
            carregarLicitacoesDoOrgao(orgaoEncontrado.id);
            return;
          }
        } else if (responseId.status !== 404) {
          // Log error but continue, as we might need to create it
          console.warn(`Falha ao buscar órgão pelo ID "${orgaoIdParaBusca}": ${responseId.status}`);
        }
      }
      
      // 3. Se chegou aqui, o órgão não foi encontrado, tentar criar
      console.log('Órgão não encontrado, tentando criar:', { id: orgaoIdParaBusca, nome: orgaoNomeParaBusca });
      
      const orgaoParaCriar = {
        // id: orgaoIdParaBusca, // O backend deve gerar o ID
        nome: orgaoNomeParaBusca,
        status: orgao?.status || 'ativo',
        // Incluir outros campos que o 'orgao' inicial possa ter e que sejam relevantes para criação
        cnpj: orgao?.cnpj,
        endereco: orgao?.endereco,
        cidade: orgao?.cidade,
        estado: orgao?.estado,
        // etc.
      };

      if (!orgaoParaCriar.nome) {
        console.error('Nome do órgão é obrigatório para criação.');
        toast({
          title: "Erro",
          description: "Nome do órgão é obrigatório para tentar criar um novo.",
          variant: "destructive"
        });
        return;
      }

      const responseCriacao = await fetch('/api/licitacoes/orgaos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgaoParaCriar),
      });

      if (responseCriacao.ok) {
        const orgaoCriado = await responseCriacao.json();
        console.log('Órgão criado com sucesso:', orgaoCriado);
        setOrgaoState(orgaoCriado);
        // Carregar contatos e licitações com o ID do órgão recém-criado
        carregarContatos(orgaoCriado.id);
        carregarLicitacoesDoOrgao(orgaoCriado.id);
      } else {
        const errorData = await responseCriacao.json().catch(() => ({ message: responseCriacao.statusText }));
        console.error('Erro ao criar órgão:', errorData);
        toast({
          title: "Erro ao criar órgão",
          description: `Não foi possível criar o órgão: ${errorData.message || responseCriacao.statusText}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Erro geral ao verificar/criar órgão:', error);
      toast({
        title: "Erro Inesperado",
        description: `Ocorreu um erro inesperado: ${error.message}`,
        variant: "destructive",
      });
    }
  }

  // Função para carregar contatos via API
  const carregarContatos = async (orgaoId?: string) => {
    const idParaConsulta = orgaoId || orgaoState?.id || orgao?.id;
    if (!idParaConsulta) {
      console.log('ID do órgão não encontrado para carregar contatos.');
      setContatos([]); // Clear contacts if no ID
      return;
    }
    console.log('Carregando contatos para o órgão ID:', idParaConsulta);
    try {
      const response = await fetch(`/api/contatos?orgao_id=${idParaConsulta}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error('Erro ao carregar contatos:', errorData);
        throw new Error(`API error: ${errorData.message || response.statusText}`);
      }
      const data = await response.json();
      console.log('Contatos carregados:', data);
      setContatos((Array.isArray(data) ? data : []).map(normalizeContato));
    } catch (error: any) {
      console.error('Falha ao buscar contatos:', error);
      setContatos([]); // Clear contacts on error
      toast({
        title: "Erro ao carregar contatos",
        description: error.message || "Não foi possível carregar os contatos.",
        variant: "destructive",
      });
    }
  };

  // Adicionar função para carregar licitações relacionadas ao órgão
  const carregarLicitacoesDoOrgao = async (orgaoId?: string) => {
    const idParaConsulta = orgaoId || orgaoState?.id || orgao?.id;
    if (!idParaConsulta) {
      console.log('ID do órgão não encontrado para carregar licitações.');
      setLicitacoesDoOrgao([]); // Clear licitacoes if no ID
      return;
    }
    console.log('Carregando licitações para o órgão ID:', idParaConsulta);
    try {
      const response = await fetch(`/api/licitacoes?orgaoId=${idParaConsulta}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error('Erro ao carregar licitações:', errorData);
        throw new Error(`API error: ${errorData.message || response.statusText}`);
      }
      const data = await response.json();
      console.log('Licitações carregadas:', data);
      setLicitacoesDoOrgao(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Falha ao buscar licitações:', error);
      setLicitacoesDoOrgao([]); // Clear licitacoes on error
      toast({
        title: "Erro ao carregar licitações",
        description: error.message || "Não foi possível carregar as licitações deste órgão.",
        variant: "destructive",
      });
    }
  };

  // Função para carregar o resumo do órgão (utilizando formData populado por carregarOrgaoBanco)
  const carregarResumoOrgao = (orgaoId?: string) => {
    const idParaConsulta = orgaoId || orgaoState?.id || orgao?.id;
    if (!idParaConsulta) {
      setOrgaoResumo(null);
      return;
    }

    // formData é populado por carregarOrgaoBanco com os dados de /api/licitacoes/orgaos/[id]
    // Assumimos que este formData contém todos os campos necessários que antes viriam da tabela 'orgao' (singular)
    if (formData && formData.id === idParaConsulta && Object.keys(formData).length > 0) {
      console.log('Utilizando formData para resumo do órgão:', formData);
      setOrgaoResumo(formData);
    } else {
      // Se formData não estiver pronto ou não corresponder, pode ser um estado transitório
      // ou carregarOrgaoBanco pode não ter sido chamado/concluído para este ID ainda.
      // carregarOrgaoBanco é chamado em um useEffect quando orgao.id muda.
      // Se for estritamente necessário buscar dados adicionais que SÓ existem em uma tabela 'orgao' (singular)
      // e não no 'orgaos' (plural), então uma API /api/licitacoes/orgaos/[id]/resumo seria necessária.
      // Por agora, se formData não estiver adequado, limpamos o resumo ou o mantemos.
      console.warn(`formData (ID: ${formData?.id}) não está pronto ou não corresponde ao idParaConsulta (${idParaConsulta}) para carregar o resumo do órgão. Verifique se carregarOrgaoBanco populou os dados corretamente.`);
      // Se desejar forçar o carregamento ou limpar:
      // setOrgaoResumo(null);
      // Ou, se carregarOrgaoBanco DEVE ser chamado:
      // console.log('Chamando carregarOrgaoBanco de dentro de carregarResumoOrgao para garantir que formData seja preenchido.');
      // carregarOrgaoBanco(idParaConsulta); // Isso tornaria carregarResumoOrgao async e exigiria cuidado com loops.
      // Por ora, apenas confiamos que o useEffect principal que chama carregarOrgaoBanco fará seu trabalho.
      // Se os dados em formData não são suficientes, uma nova API é necessária.
      // Por enquanto, se o formData não for o esperado, não alteramos o orgaoResumo ou o limpamos.
      // Para este exercício, vamos assumir que o formData é suficiente.
      // Se o `formData.id` não corresponder, é mais seguro limpar o resumo.
      if (formData?.id !== idParaConsulta) {
        setOrgaoResumo(null);
      }
    }
  };

  // Função para adicionar novo contato
  const handleAddContato = async (formData: ContatoFormData) => {
    try {
      if (!orgaoState?.id) {
        throw new Error('ID do órgão não encontrado')
      }

      console.log('Adicionando contato para o órgão:', orgaoState.id)
      
      // Criar um ID único para o contato
      const novoContatoId = uuidv4()
      
      // Dados do contato para inserção
      const novoContato = {
        id: novoContatoId,
        orgao_id: orgaoState.id,
        nome: formData.nome,
        cargo: formData.cargo || '',
        email: formData.email || '',
        telefone: formData.telefone || '',
        // Incluir nome do órgão para que a API possa criar o órgão se necessário
        orgaoNome: orgaoState.nome || 'Órgão sem nome'
      }
      
      // Adicionar à UI imediatamente para feedback
      const contatoUI = {
        ...novoContato,
        data_criacao: new Date().toISOString(),
        data_atualizacao: new Date().toISOString()
      }
      
      setContatos(prev => [...prev, normalizeContato(contatoUI)])
      setShowAddContatoDialog(false)
      
      // Feedback positivo
      toast({
        title: "Contato adicionado",
        description: "O contato foi adicionado à interface"
      })
      
      // Tentar salvar via API (mais confiável)
      try {
        console.log('Enviando dados para API incluindo nome do órgão:', novoContato)
        const response = await fetch('/api/contatos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          },
          body: JSON.stringify(novoContato),
        })
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Erro desconhecido ao obter detalhes do erro da API.');
          console.error('Resposta de erro da API ao adicionar contato:', errorText);
          // Reverter a adição otimista da UI se a API falhar
          setContatos(prev => prev.filter(c => c.id !== novoContatoId));
          setShowAddContatoDialog(true); // Opcional: reabrir o formulário
          throw new Error('Erro na API ao adicionar contato: ' + errorText);
        }
        
        const data = await response.json();
        console.log('Contato salvo via API:', data);
        
        // Atualizar UI com dados do servidor (especialmente se a API transforma/retorna mais dados)
        setContatos(prev => prev.map(c => c.id === novoContatoId ? normalizeContato(data) : c));

        toast({
          title: "Contato salvo",
          description: "O contato foi armazenado permanentemente."
        });
        
        // Recarregar contatos para garantir sincronia, especialmente se houver triggers ou outras lógicas no backend.
        // Opcional: A API pode já retornar o estado final, tornando isso redundante se a UI for atualizada confiavelmente acima.
        setTimeout(() => {
          if (orgaoState?.id) { // Adicionado check para orgaoState.id
            console.log('Recarregando contatos após espera para o órgão:', orgaoState.id);
            carregarContatos(orgaoState.id);
          }
        }, 1000);
        
      } catch (apiError: any) { // Explicitamente tipo 'any' ou 'Error'
        console.error('Falha ao salvar contato via API:', apiError.message);
        // A remoção do contato da UI (reversão) já foi feita no bloco if (!response.ok)
        // Aqui apenas exibimos o toast para o erro da API.
        toast({
          title: "Erro ao salvar contato",
          description: `Não foi possível salvar o contato permanentemente via API: ${apiError.message}`,
          variant: "destructive",
        });
        // Não prosseguir para o fallback do Supabase.
      }
    } catch (error: any) { // Catch para erros gerais (ex: ID do órgão não encontrado)
      console.error('Erro ao adicionar contato:', error.message);
      toast({
        title: "Erro ao adicionar contato",
        description: error.message || "Ocorreu um erro desconhecido.",
        variant: "destructive",
      });
    }
  }

  // Função para excluir um contato
  const excluirContato = async (contato: ContatoType) => {
    const originalContatos = [...contatos]; // Cópia para possível reversão
    // Otimisticamente remove da UI
    setContatos(prev => prev.filter(c => c.id !== contato.id));

    try {
      const response = await fetch(`/api/contatos/${contato.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erro desconhecido ao obter detalhes do erro da API.');
        console.error('Erro na API ao excluir contato:', errorText);
        setContatos(originalContatos); // Reverter remoção da UI
        throw new Error('Erro na API: ' + errorText);
      }
      
      console.log('Contato excluído via API');
      toast({
        title: "Contato excluído",
        description: "O contato foi excluído com sucesso.",
      });
      
      // Opcional: Recarregar contatos se houver necessidade de sincronizar dados que podem ter mudado no backend
      // carregarContatos(orgaoState?.id);
      // Se a remoção otimista for suficiente e não houver efeitos colaterais, não é necessário recarregar.
      
    } catch (error: any) {
      console.error('Falha ao excluir contato via API:', error.message);
      // A reversão da UI já foi feita no bloco if (!response.ok) ou deveria ser feita aqui se o fetch falhar.
      // Se o setContatos(originalContatos) não foi chamado (ex: fetch falhou antes do response.ok), faça aqui.
      // No entanto, a estrutura atual já cobre isso no if(!response.ok).
      // Se o fetch em si falhar (ex: rede), a UI ainda precisa ser revertida.
      // Para simplificar, a reversão está no if(!response.ok). Se o fetch falhar, o catch geral abaixo trata.
      // Se a remoção otimista ocorreu, mas o fetch falhou (sem ser !response.ok), precisamos reverter.
      // Para garantir, podemos verificar se 'originalContatos' ainda é diferente de 'contatos'
      // No entanto, para este refactor, vamos focar na remoção do fallback.
      // A lógica otimista de UI pode ser refinada separadamente.

      toast({
        title: "Erro ao excluir contato",
        description: `Não foi possível excluir o contato: ${error.message}`,
        variant: "destructive",
      });
      // Se a exclusão otimista aconteceu, e o erro foi no fetch em si (não !response.ok),
      // a UI pode estar inconsistente. Considerar recarregar ou reverter explicitamente.
      // Por ora, a reversão está no if (!response.ok).
      // Se a intenção é sempre recarregar em caso de erro para garantir consistência:
      if (orgaoState?.id) carregarContatos(orgaoState.id);
    }
  }

  // Função para editar um contato existente
  const editarContato = async (contatoEditado: ContatoType) => { // Renomeado para clareza
    const originalContatos = [...contatos];
    // Otimisticamente atualiza a UI
    setContatos(prev => prev.map(c => c.id === contatoEditado.id ? normalizeContato(contatoEditado) : c));
    setEditandoContato(null); // Fechar o formulário de edição

    try {
      const payload = {
        ...contatoEditado,
        data_atualizacao: new Date().toISOString()
      };

      console.log('Tentando atualizar contato via API:', payload);
      const response = await fetch(`/api/contatos/${contatoEditado.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erro desconhecido ao obter detalhes do erro da API.');
        console.error('Erro na API ao atualizar contato:', errorText);
        setContatos(originalContatos); // Reverter atualização da UI
        setEditandoContato(contatoEditado.id); // Reabrir formulário de edição
        throw new Error('Erro na API: ' + errorText);
      }
      
      const data = await response.json();
      console.log('Contato atualizado via API:', data);
      
      // Atualizar UI com dados do servidor (especialmente se a API transforma/retorna mais dados)
      setContatos(prev => prev.map(c => c.id === data.id ? normalizeContato(data) : c));
      
      toast({
        title: "Contato atualizado",
        description: "O contato foi atualizado com sucesso.",
      });

      // Opcional: Recarregar todos os contatos para consistência completa
      // if(orgaoState?.id) carregarContatos(orgaoState.id);

    } catch (error: any) {
      console.error('Falha ao atualizar contato via API:', error.message);
      // A reversão da UI já está no bloco if(!response.ok).
      // Se o fetch em si falhou, a UI pode estar inconsistente.
      toast({
        title: "Erro ao atualizar contato",
        description: `Não foi possível atualizar o contato: ${error.message}`,
        variant: "destructive",
      });
      // Para garantir consistência em caso de erro de fetch, podemos recarregar.
      if (orgaoState?.id) carregarContatos(orgaoState.id);
    }
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleContatoChange = (id: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      contatos: prev.contatos?.map((contato) => 
        contato.id === id ? { ...contato, [field]: value } : contato
      ),
    }))
  }

  const handleSalvarOrgao = async () => {
    try {
      if (!orgao || !orgao.id) {
        console.error('ID do órgão ausente!');
        toast({
          title: 'Erro',
          description: 'ID do órgão ausente! Não é possível atualizar.',
          variant: 'destructive',
        });
        return;
      }
      // Montar objeto com os campos válidos para a API (camelCase)
      const dadosAtualizados: Partial<Orgao> = {};
      // Esses campos devem corresponder às chaves em 'formData' (que são camelCase)
      // e aos campos que a API PUT /api/licitacoes/orgaos/[id] espera.
      const camelCaseCamposValidos: (keyof Orgao)[] = [
        'nome', 'tipo', 'cnpj', 'endereco', 'cidade', 'estado', 'segmento', 'origemLead',
        'responsavelInterno', 'descricao', 'observacoes', 'faturamento',
        // Adicione aqui outros campos da interface Orgao que são editáveis e aceitos pela API
        // 'resumoDetalhado', 'palavrasChave', 'ultimaLicitacaoData', 'codigoExterno',
        'ativo' // 'ativo' é um boolean, a API /api/licitacoes/orgaos/[id] o trata corretamente
      ];

      camelCaseCamposValidos.forEach((campo) => {
        if (formData[campo] !== undefined) {
          // Type assertion to satisfy TypeScript, as campo is a keyof Orgao
          (dadosAtualizados as any)[campo] = formData[campo];
        }
      });

      if (Object.keys(dadosAtualizados).length === 0) {
        toast({
          title: 'Nenhuma alteração',
          description: 'Nenhum dado foi modificado para salvar.',
          variant: 'default',
        });
        setIsEditing(false); // Pode sair do modo de edição se não houver nada a salvar
        return;
      }

      console.log('Payload do update para API (camelCase):', dadosAtualizados, 'ID:', orgao.id);

      const response = await fetch(`/api/licitacoes/orgaos/${orgao.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosAtualizados),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Erro HTTP ${response.status}` }));
        console.error('Erro ao atualizar órgão via API:', errorData);
        throw new Error(errorData.error || errorData.message || 'Falha ao atualizar órgão');
      }

      const responseData: Orgao = await response.json();

      setOrgaoState(responseData);
      if (onOrgaoUpdate) {
        onOrgaoUpdate(responseData);
      }
      // Atualiza formData também para refletir os dados do servidor, especialmente se a API retornar mais campos ou valores transformados
      setFormData(responseData);


      toast({
        title: 'Sucesso',
        description: 'Órgão atualizado com sucesso!',
        variant: 'default',
      });
      // Não limpar formData aqui se quiser manter os dados visíveis,
      // mas setOrgaoState e onOrgaoUpdate já devem ter atualizado a fonte de dados principal.
      // setFormData({}); // Limpar apenas se for sair do modo de edição e quiser um form limpo na próxima vez.
      setIsEditing(false);

    } catch (error: any) {
      console.error('Erro detalhado ao atualizar órgão:', error);
      toast({
        title: 'Erro ao Salvar',
        description: error.message || 'Ocorreu um problema ao tentar salvar as alterações do órgão.',
        variant: 'destructive',
      });
    }
  }

  const handleExcluirOrgao = async () => {
    try {
      if (!orgao || !orgao.id) {
        toast({
          title: "Erro",
          description: "ID do órgão não encontrado.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/licitacoes/orgaos/${orgao.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Try to parse error from API, fallback to status text
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error('Erro ao excluir órgão via API:', errorData);
        throw new Error(errorData.error || errorData.message || `Falha ao excluir órgão: ${response.status}`);
      }

      // If API returns 204 No Content, response.json() will fail. Check for that.
      // For this implementation, the API for DELETE returns a JSON message on 200.
      // const responseData = response.status === 204 ? {} : await response.json();
      // console.log('Resposta da API ao excluir órgão:', responseData);


      if (onOrgaoDelete) {
        onOrgaoDelete(orgao); // Pass the original orgao object
      }

      toast({
        title: "Sucesso",
        description: "Órgão excluído com sucesso!",
        variant: "default",
      });

      onOpenChange(false); // Close the sheet/dialog

    } catch (error: any) {
      console.error('Erro ao excluir órgão:', error);
      toast({
        title: "Erro ao Excluir",
        description: error.message || "Ocorreu um problema ao tentar excluir o órgão.",
        variant: "destructive",
      });
    }
  }

  const normalizeContato = (c: any) => ({
    id: c.id,
    nome: c.nome || "",
    cargo: c.cargo || "",
    email: c.email || "",
    telefone: c.telefone || "",
    orgao_id: c.orgao_id || "",
    licitacao_id: c.licitacao_id || "",
    data_criacao: c.data_criacao || "",
    data_atualizacao: c.data_atualizacao || "",
    ...c
  });

  if (!orgao) {
    return (
      <Sheet key="empty-orgao-sheet" open={false} onOpenChange={() => {}}>
        <SheetContent className="w-full md:max-w-xl lg:max-w-2xl overflow-y-auto">
          <div></div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este órgão? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluirOrgao}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet key={`orgao-sheet-${orgao?.id || "empty"}`} open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          className={`overflow-y-auto transition-all duration-300 ${
            isExpanded ? "w-[95vw] max-w-[95vw]" : "w-full md:max-w-3xl lg:max-w-4xl"
          }`}
        >
          <SheetHeader className="mb-6">
            <div className="flex justify-between items-center">
              <SheetTitle className="text-xl flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" />
                {isEditing ? (
                  <Input 
                    value={formData.nome || ""} 
                    onChange={(e) => handleFieldChange("nome", e.target.value)}
                    className="h-7 text-xl font-semibold"
                  />
                ) : (
                  formData.nome || "Órgão"
                )}
              </SheetTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8 rounded-full"
                  title={isExpanded ? "Recolher painel" : "Expandir painel"}
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                ) : (
                  <Button onClick={handleSalvarOrgao} variant="outline" size="sm" className="gap-2">
                    <Save className="w-4 h-4" />
                    Salvar
                  </Button>
                )}
              </div>
            </div>
          </SheetHeader>

          <Tabs defaultValue="resumo" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="contatos">Contatos</TabsTrigger>
              <TabsTrigger value="licitacoes">Licitações</TabsTrigger>
            </TabsList>

            <TabsContent value="resumo">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label>CNPJ</Label>
                        {isEditing ? (
                          <Input value={formData.cnpj || ""} onChange={(e) => handleFieldChange("cnpj", e.target.value)} />
                        ) : (
                          <p className="text-sm mt-1">{formData.cnpj}</p>
                        )}
                      </div>

                      <div>
                        <Label>Endereço</Label>
                        {isEditing ? (
                          <Input
                            value={formData.endereco || ""}
                            onChange={(e) => handleFieldChange("endereco", e.target.value)}
                          />
                        ) : (
                          <p className="text-sm mt-1">{formData.endereco}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Cidade</Label>
                          {isEditing ? (
                            <Input
                              value={formData.cidade || ""}
                              onChange={(e) => handleFieldChange("cidade", e.target.value)}
                            />
                          ) : (
                            <p className="text-sm mt-1">{formData.cidade}</p>
                          )}
                        </div>
                        <div>
                          <Label>Estado</Label>
                          {isEditing ? (
                            <Input
                              value={formData.estado || ""}
                              onChange={(e) => handleFieldChange("estado", e.target.value)}
                            />
                          ) : (
                            <p className="text-sm mt-1">{formData.estado}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>Segmento</Label>
                        {isEditing ? (
                          <Input
                            value={formData.segmento || ""}
                            onChange={(e) => handleFieldChange("segmento", e.target.value)}
                          />
                        ) : (
                          <p className="text-sm mt-1">{formData.segmento}</p>
                        )}
                      </div>

                      <div>
                        <Label>Origem da Lead</Label>
                        {isEditing ? (
                          <Input
                            value={formData.origem_lead || ""}
                            onChange={(e) => handleFieldChange("origem_lead", e.target.value)}
                          />
                        ) : (
                          <p className="text-sm mt-1">{formData.origem_lead}</p>
                        )}
                      </div>

                      <div>
                        <Label>Responsável Interno</Label>
                        {isEditing ? (
                          <Input
                            value={formData.responsavel_interno || ""}
                            onChange={(e) => handleFieldChange("responsavel_interno", e.target.value)}
                          />
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{nomeResponsavelInterno || formData.responsavel_interno}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {orgaoResumo && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Resumo do Órgão</h3>
                    <div className="bg-gray-50 rounded p-4 text-sm">
                      {Object.entries(orgaoResumo).map(([key, value]) => (
                        key !== 'orgao_id' && (
                          <div key={key} className="mb-1">
                            <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {String(value)}
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Descrição</Label>
                  {isEditing ? (
                    <Textarea
                      className="mt-2"
                      value={formData.descricao || ""}
                      onChange={(e) => handleFieldChange("descricao", e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.descricao}</p>
                  )}
                </div>

                <div>
                  <Label>Observações</Label>
                  {isEditing ? (
                    <Textarea
                      className="mt-2"
                      value={formData.observacoes || ""}
                      onChange={(e) => handleFieldChange("observacoes", e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.observacoes}</p>
                  )}
                </div>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-base font-medium mb-2">Informações para Faturamento</h3>
                    {isEditing ? (
                      <Textarea
                        value={formData.faturamento || ""}
                        onChange={(e) => handleFieldChange("faturamento", e.target.value)}
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm">{formData.faturamento}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="contatos">
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Contatos</h3>
                  {!mostrarFormContato && (
                    <Button size="sm" onClick={() => setMostrarFormContato(true)} className="gap-2">
                      <PlusCircle className="w-4 h-4" />
                      Adicionar Contato
                    </Button>
                  )}
                </div>

                {mostrarFormContato && (
                  <Card className="mb-6">
                    <CardContent className="p-4">
                      <h3 className="text-base font-medium mb-4">Novo Contato</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor="nome-contato">Nome</Label>
                          <Input
                            id="nome-contato"
                            value={novoContato.nome || ""}
                            onChange={(e) => setNovoContato({ ...novoContato, nome: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cargo-contato">Cargo</Label>
                          <Input
                            id="cargo-contato"
                            value={novoContato.cargo || ""}
                            onChange={(e) => setNovoContato({ ...novoContato, cargo: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email-contato">Email</Label>
                          <Input
                            id="email-contato"
                            type="email"
                            value={novoContato.email || ""}
                            onChange={(e) => setNovoContato({ ...novoContato, email: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="telefone-contato">Telefone</Label>
                          <Input
                            id="telefone-contato"
                            value={novoContato.telefone || ""}
                            onChange={(e) => setNovoContato({ ...novoContato, telefone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setMostrarFormContato(false)}>
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={() => handleAddContato(novoContato)} disabled={!novoContato.nome || !novoContato.email}>
                          Adicionar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    contatos.filter(c => c && c.id).map((contato) => (
                      <Card key={contato.id}>
                        <CardContent className="p-4">
                          {editandoContato === contato.id ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                      <Label>Nome</Label>
                                      <Input 
                                        value={contato.nome || ""} 
                                    onChange={(e) => handleContatoChange(contato.id, 'nome', e.target.value)}
                                      />
                                    </div>
                                <div className="space-y-2">
                                      <Label>Cargo</Label>
                                      <Input 
                                        value={contato.cargo || ""} 
                                    onChange={(e) => handleContatoChange(contato.id, 'cargo', e.target.value)}
                                      />
                                    </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                      <Label>Email</Label>
                                      <Input 
                                        value={contato.email || ""} 
                                    onChange={(e) => handleContatoChange(contato.id, 'email', e.target.value)}
                                      />
                                    </div>
                                <div className="space-y-2">
                                      <Label>Telefone</Label>
                                      <Input 
                                        value={contato.telefone || ""} 
                                    onChange={(e) => handleContatoChange(contato.id, 'telefone', e.target.value)}
                                      />
                                    </div>
                                  </div>
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditandoContato(null)}
                                >
                                      Cancelar
                                    </Button>
                                <Button
                                  size="sm"
                                  onClick={() => editarContato(contato)}
                                >
                                      Salvar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="font-medium">{contato.nome}</div>
                                {contato.cargo && <div className="text-sm text-gray-500">{contato.cargo}</div>}
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  {contato.email && (
                                    <div className="flex items-center">
                                      <Mail className="w-4 h-4 mr-1" />
                                      <a href={`mailto:${contato.email}`} className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">
                                        {contato.email}
                                      </a>
                                    </div>
                                  )}
                                  {contato.telefone && (
                                    <div className="flex items-center">
                                      <Phone className="w-4 h-4 mr-1" />
                                      <a href={`tel:${contato.telefone.replace(/[^\d+]/g, '')}`} className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">
                                        {contato.telefone}
                                      </a>
                                    </div>
                              )}
                            </div>
                              </div>
                              <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                  size="sm"
                                  onClick={() => setEditandoContato(contato.id)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                  size="sm"
                                  onClick={() => excluirContato(contato)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                            </div>
                          </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="licitacoes">
              <div className="space-y-6">
                <h3 className="text-lg font-medium mb-4">Licitações Relacionadas</h3>

                <div className="space-y-4">
                  {licitacoesDoOrgao.length === 0 ? (
                    <p className="text-gray-500">Nenhuma licitação relacionada encontrada.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="px-4 py-2 text-left font-medium text-gray-500">Título</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">Data de Abertura</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">Valor Estimado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {licitacoesDoOrgao.map((licitacao) => (
                            <tr key={licitacao.id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="px-4 py-2">{licitacao.titulo}</td>
                              <td className="px-4 py-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  licitacao.status === 'Em andamento' ? 'bg-blue-100 text-blue-800' :
                                  licitacao.status === 'Encerrado' ? 'bg-red-100 text-red-800' :
                                  licitacao.status === 'Publicado' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {licitacao.status}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                {licitacao.data_abertura ? new Date(licitacao.data_abertura).toLocaleDateString('pt-BR') : '-'}
                              </td>
                              <td className="px-4 py-2">
                                {licitacao.valor_estimado ? `R$ ${licitacao.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  )
}
