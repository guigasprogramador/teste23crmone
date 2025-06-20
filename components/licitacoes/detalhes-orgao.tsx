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
import { crmonefactory } from '@/lib/supabase'
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
      const { data, error } = await crmonefactory
        .from('orgaos')
        .select('*')
        .eq('id', idParaConsulta)
        .single();
      if (!error && data) {
        setFormData(data);
        setOrgaoState(data);
      }
    } catch (e) {
      // Pode adicionar um toast de erro se desejar
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
          const { data, error } = await crmonefactory
            .from('usuarios') // Troque para 'users' se necessário
            .select('nome')
            .eq('id', formData.responsavel_interno)
            .single();
          if (!error && data?.nome) {
            setNomeResponsavelInterno(data.nome);
          } else {
            setNomeResponsavelInterno("");
          }
        } catch {
          setNomeResponsavelInterno("");
        }
      } else {
        setNomeResponsavelInterno("");
      }
    };
    buscarResponsavel();
  }, [formData.responsavel_interno]);

  // Função para verificar se o órgão existe e carregar dados reais
  const verificarECarregarOrgao = async () => {
    try {
      console.log('Verificando se o órgão existe no banco de dados:', orgao?.id, orgao?.nome)
      
      // Primeiro tentar buscar pelo nome, que é mais confiável que o ID temporário
      const { data: orgaoPorNome, error: errorNome } = await crmonefactory
        .from('orgaos')
        .select('*')
        .ilike('nome', orgao?.nome || '')
        .limit(1)
      
      if (orgaoPorNome && orgaoPorNome.length > 0) {
        // Encontrou o órgão pelo nome, usar o ID real
        console.log('Órgão encontrado pelo nome:', orgaoPorNome[0])
        
        // Atualizar o estado com o órgão real do banco
        setOrgaoState(orgaoPorNome[0])
        
        // Carregar contatos e licitações com o ID real
        carregarContatos(orgaoPorNome[0].id)
        carregarLicitacoesDoOrgao(orgaoPorNome[0].id)
        return
      }
      
      // Se não encontrou pelo nome, tentar pelo ID (menos provável de funcionar com ID temporário)
      const { data: orgaoPorId, error: errorId } = await crmonefactory
        .from('orgaos')
        .select('*')
        .eq('id', orgao?.id || '')
        .single()
      
      if (orgaoPorId) {
        console.log('Órgão encontrado pelo ID:', orgaoPorId)
        setOrgaoState(orgaoPorId)
        carregarContatos(orgaoPorId.id)
        carregarLicitacoesDoOrgao(orgaoPorId.id)
        return
      }
      
      // Se chegou aqui, o órgão não existe no banco, tentar criar
      console.log('Órgão não encontrado, tentando criar:', orgao)
      
      // Criar o órgão no banco de dados
      const { data: novoOrgao, error: errorCriacao } = await crmonefactory
        .from('orgaos')
        .insert({
          id: orgao?.id,
          nome: orgao?.nome,
          status: orgao?.status || 'ativo'
        })
        .select()
      
      if (errorCriacao) {
        console.error('Erro ao criar órgão:', errorCriacao)
        toast({
          title: "Erro",
          description: "Não foi possível criar o órgão no banco de dados.",
          variant: "destructive"
        })
      } else {
        console.log('Órgão criado com sucesso:', novoOrgao)
        // Agora podemos carregar contatos (que estarão vazios inicialmente)
        carregarContatos(orgao?.id)
        carregarLicitacoesDoOrgao(orgao?.id)
      }
      
    } catch (error) {
      console.error('Erro ao verificar/criar órgão:', error)
    }
  }

  // Função para carregar contatos via API em vez de Supabase direto
  const carregarContatos = async (orgaoId?: string) => {
    try {
      // Usar o ID passado como parâmetro ou o ID do órgão do estado atualizado
      const idParaConsulta = orgaoId || orgaoState?.id || orgao?.id
      
      if (!idParaConsulta) {
        console.log('ID do órgão não encontrado')
        return
      }
      
      // Log para debug
      console.log('Carregando contatos com ID consistente:', idParaConsulta)

      console.log('Carregando contatos para o órgão:', idParaConsulta)

      const { data, error } = await crmonefactory
        .from('orgao_contatos')
        .select('*')
        .eq('orgao_id', idParaConsulta)
        .order('nome', { ascending: true })

      if (error) {
        console.error('Erro ao carregar contatos:', error)
        throw error
      }

      console.log('Contatos carregados:', data)
      setContatos((Array.isArray(data) ? data : []).map(normalizeContato))
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
      toast({
        title: "Atenção",
        description: "Não foi possível carregar os contatos. Use a funcionalidade de adicionar contato.",
        variant: "destructive"
      })
    }
  }

  // Adicionar função para carregar licitações relacionadas ao órgão
  const carregarLicitacoesDoOrgao = async (orgaoId?: string) => {
    try {
      // Usar o ID passado como parâmetro ou o ID do órgão do estado atualizado
      const idParaConsulta = orgaoId || orgaoState?.id || orgao?.id
      
      if (!idParaConsulta) {
        console.log('ID do órgão não encontrado')
        return
      }
      
      // Log para debug
      console.log('Carregando licitações com ID consistente:', idParaConsulta)

      console.log('Carregando licitações para o órgão:', idParaConsulta)

      const { data, error } = await crmonefactory
        .from('licitacoes')
        .select('*')
        .eq('orgao_id', idParaConsulta)
        .order('data_criacao', { ascending: false })

      if (error) {
        console.error('Erro ao carregar licitações:', error)
        throw error
      }

      console.log('Licitações carregadas:', data)
      setLicitacoesDoOrgao(data || [])
    } catch (error) {
      console.error('Erro ao carregar licitações:', error)
      toast({
        title: "Atenção",
        description: "Não foi possível carregar as licitações deste órgão",
        variant: "destructive"
      })
    }
  }

  // Função para carregar o resumo do órgão da tabela orgao
  const carregarResumoOrgao = async (orgaoId?: string) => {
    try {
      const idParaConsulta = orgaoId || orgaoState?.id || orgao?.id;
      if (!idParaConsulta) return;
      const { data, error } = await crmonefactory
        .from('orgao')
        .select('*')
        .eq('orgao_id', idParaConsulta)
        .single();
      if (!error && data) {
        setOrgaoResumo(data);
      } else {
        setOrgaoResumo(null);
      }
    } catch (e) {
      setOrgaoResumo(null);
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
          const errorText = await response.text()
          console.error('Resposta de erro da API:', errorText)
          throw new Error('Erro na API: ' + errorText)
        }
        
        const data = await response.json()
        console.log('Contato salvo via API:', data)
        
        // Atualizar toast com sucesso
        toast({
          title: "Contato salvo",
          description: "O contato foi armazenado permanentemente"
        })
        
        // Aumentar o tempo antes de recarregar os contatos
        setTimeout(() => {
          console.log('Recarregando contatos após espera para o órgão:', orgaoState.id)
          carregarContatos(orgaoState.id)
        }, 1000)
        
        return
      } catch (apiError) {
        console.error('Falha ao salvar via API:', apiError)
        // Continue para tentar diretamente no Supabase
      }
      
      // Tentar salvar diretamente no Supabase como fallback
      console.log('Tentando salvar diretamente no Supabase...')
      
      // Primeiro, verificar se o órgão existe
      const { data: orgaoExistente, error: checkError } = await crmonefactory
        .from('orgaos')
        .select('id')
        .eq('id', orgaoState.id)
        .single()
      
      // Se o órgão não existir, criá-lo primeiro
      if (checkError || !orgaoExistente) {
        console.log('Órgão não existe. Criando-o primeiro...')
        
        const { error: createError } = await crmonefactory
          .from('orgaos')
          .insert({
            id: orgaoState.id,
            nome: orgaoState.nome || 'Nome não definido'
          })
        
        if (createError) {
          console.error('Erro ao criar órgão no Supabase:', createError)
          throw new Error('Erro ao criar órgão: ' + createError.message)
        }
        
        console.log('Órgão criado com sucesso no Supabase')
      }
      
      // Agora inserir o contato
      const { error } = await crmonefactory
        .from('orgao_contatos')
        .insert({
          id: novoContatoId,
          orgao_id: orgaoState.id,
          nome: formData.nome,
          cargo: formData.cargo || null,
          email: formData.email || null,
          telefone: formData.telefone || null
        })
      
      if (error) {
        console.error('Erro ao salvar no Supabase:', error)
        throw new Error('Erro ao salvar contato: ' + error.message)
      } else {
        console.log('Contato salvo com sucesso no Supabase')
        
        // Atualizar toast com sucesso
        toast({
          title: "Contato salvo",
          description: "O contato foi armazenado permanentemente"
        })
        
        carregarContatos(orgaoState.id) // Recarregar para sincronizar com o mesmo ID usado na criação
      }
      
    } catch (error) {
      console.error('Erro ao adicionar contato:', error)
      
      let mensagem = "O contato foi adicionado à interface, mas não foi possível salvá-lo permanentemente"
      
      if (error instanceof Error) {
        mensagem += ": " + error.message
      }
      
      toast({
        title: "Aviso",
        description: mensagem,
        variant: "destructive"
      })
    }
  }

  // Função para excluir um contato
  const excluirContato = async (contato: ContatoType) => {
    try {
      // Tentar via API primeiro
      try {
        const response = await fetch(`/api/contatos/${contato.id}`, {
          method: 'DELETE',
        })
        
        if (!response.ok) {
          throw new Error('Erro na API: ' + await response.text())
        }
        
        console.log('Contato excluído via API')
        
        // Remover contato da lista local para UI
        setContatos(prev => prev.filter(c => c.id !== contato.id))
        
        // Feedback positivo
        toast({
          title: "Contato excluído",
          description: "O contato foi excluído com sucesso"
        })
        
        // Recarregar contatos para exibir os dados do servidor
        carregarContatos()
        return
      } catch (apiError) {
        console.error('Falha ao excluir via API:', apiError)
      }
      
      // Fallback para Supabase direto
      console.log('Tentando excluir diretamente no Supabase...')
      const { error } = await crmonefactory
        .from('orgao_contatos')
        .delete()
        .eq('id', contato.id)
      
      if (error) {
        console.error('Erro ao excluir no Supabase:', error)
        // Não vamos falhar aqui, já removemos o contato da UI
      } else {
        console.log('Contato excluído com sucesso no Supabase')
        carregarContatos(orgaoState.id) // Recarregar para sincronizar com o mesmo ID usado na criação
      }
      
    } catch (error) {
      console.error('Erro ao excluir contato:', error)
      toast({
        title: "Aviso",
        description: "O contato foi removido da interface, mas pode não ter sido excluído permanentemente",
        variant: "destructive"
      })
    }
  }

  // Função para editar um contato existente
  const editarContato = async (contato: ContatoType) => {
    try {
      const updatedContato = {
        ...contato,
        orgao_id: contato.orgao_id,
        data_atualizacao: new Date().toISOString()
      }

      console.log('Tentando atualizar contato:', updatedContato)

      // Tentar via API primeiro
      try {
        const response = await fetch(`/api/contatos/${contato.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedContato),
        })
        
        if (!response.ok) {
          throw new Error('Erro na API: ' + await response.text())
        }
        
        const data = await response.json()
        console.log('Contato atualizado via API:', data)
        
        // Atualizar contato na lista local para UI
        setContatos(prev => prev.map(c => c.id === contato.id ? normalizeContato(data) : c))
        
        // Feedback positivo
        toast({
          title: "Contato atualizado",
          description: "O contato foi atualizado com sucesso"
        })
        
        // Recarregar contatos para exibir os dados do servidor
        carregarContatos()
        return
      } catch (apiError) {
        console.error('Falha ao atualizar via API:', apiError)
      }
      
      // Fallback para Supabase direto
      console.log('Tentando atualizar diretamente no Supabase...')
      const { data, error } = await crmonefactory
        .from('orgao_contatos')
        .update(updatedContato)
        .eq('id', contato.id)
        .select()
      
      if (error) {
        console.error('Erro ao atualizar no Supabase:', error)
        // Não vamos falhar aqui, já atualizamos o contato na UI
      } else {
        console.log('Contato atualizado com sucesso no Supabase')
        carregarContatos(orgaoState.id) // Recarregar para sincronizar com o mesmo ID usado na criação
      }
      
    } catch (error) {
      console.error('Erro ao atualizar contato:', error)
      toast({
        title: "Aviso",
        description: "O contato foi atualizado na interface, mas pode não ter sido atualizado permanentemente",
        variant: "destructive"
      })
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
      // Montar objeto apenas com os campos válidos da tabela 'orgaos'
      const dadosAtualizados: any = {};
      const camposValidos = [
        'nome', 'tipo', 'cnpj', 'endereco', 'cidade', 'estado', 'segmento', 'origem_lead',
        'responsavel_interno', 'descricao', 'observacoes', 'faturamento', 'resumo_detalhado',
        'palavras_chave', 'ultima_licitacao_data', 'codigo_externo', 'ativo'
      ];
      camposValidos.forEach((campo) => {
        if (formData[campo] !== undefined) dadosAtualizados[campo] = formData[campo];
      });
      console.log('Payload do update:', dadosAtualizados, 'ID:', orgao.id);
      // Update no Supabase
      const { data, error } = await crmonefactory
        .from('orgaos')
        .update(dadosAtualizados)
        .eq('id', orgao.id)
        .select()
        .single();
      if (error) throw error
      if (data) {
        setOrgaoState(data);
        if (onOrgaoUpdate) onOrgaoUpdate(data);
      }
      toast({
        title: 'Sucesso',
        description: 'Órgão atualizado com sucesso',
        variant: 'default',
      });
      setFormData({});
      setIsEditing(false);
    } catch (error) {
      // Enhanced error logging
      console.error('Erro detalhado ao atualizar órgão:', error, typeof error, JSON.stringify(error));
      toast({
        title: 'Erro',
        description: `Erro ao atualizar órgão: ${
          error instanceof Error
            ? error.message
            : typeof error === 'object'
              ? JSON.stringify(error)
              : String(error)
        }`,
        variant: 'destructive',
      });
    }
  }

  const handleExcluirOrgao = async () => {
    try {
      if (!orgao) return;

      const { error } = await crmonefactory
        .from('orgaos')
        .delete()
        .eq('id', orgao.id)

      if (error) throw error

      if (onOrgaoDelete) {
        onOrgaoDelete(orgao)
      }

      toast({
        title: "Sucesso",
        description: "Órgão excluído com sucesso",
        variant: "default"
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao excluir órgão:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir órgão",
        variant: "destructive"
      })
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
