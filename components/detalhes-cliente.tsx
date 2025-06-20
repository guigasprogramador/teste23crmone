"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Building, MapPin, Hash, Phone, Mail, User, Users, Pencil, Save, Trash2, Plus, X, Calendar, DollarSign, Maximize2, Minimize2, Eye } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { useOportunidades } from "@/hooks/comercial/use-oportunidades"
import { Oportunidade, Cliente, ClienteDetalhado, Contato } from "@/types/comercial"

interface DetalhesClienteProps {
  cliente: Cliente | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onClienteUpdate?: (cliente: Cliente) => void
  onClienteDelete?: (cliente: Cliente) => void
  onOportunidadeClick?: (oportunidade: Oportunidade) => void
}

// Mock data for tipos de cliente
const tiposCliente = ["Órgão Público", "Empresa Privada", "Autarquia", "Fundação", "Outro"]

// Mock data for estados brasileiros
const estados = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", 
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
]

// Função para obter o label do status da oportunidade
const getStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    novo_lead: "Novo Lead",
    agendamento_reuniao: "Agendamento de Reunião",
    levantamento_oportunidades: "Levantamento de Oportunidades",
    proposta_enviada: "Proposta Enviada",
    negociacao: "Negociação",
    fechado_ganho: "Fechado (Ganho)",
    fechado_perdido: "Fechado (Perdido)",
  }

  return statusLabels[status] || status
}

// Status colors
const statusColors: Record<string, string> = {
  novo_lead: "bg-blue-100 text-blue-800 border-blue-300",
  agendamento_reuniao: "bg-indigo-100 text-indigo-800 border-indigo-300",
  levantamento_oportunidades: "bg-purple-100 text-purple-800 border-purple-300",
  proposta_enviada: "bg-amber-100 text-amber-800 border-amber-300",
  negociacao: "bg-orange-100 text-orange-800 border-orange-300",
  fechado_ganho: "bg-green-100 text-green-800 border-green-300",
  fechado_perdido: "bg-red-100 text-red-800 border-red-300",
}

export function DetalhesCliente({ cliente, open, onOpenChange, onClienteUpdate, onClienteDelete, onOportunidadeClick }: DetalhesClienteProps) {
  const [activeTab, setActiveTab] = useState("resumo")
  const [isEditing, setIsEditing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [editedCliente, setEditedCliente] = useState<ClienteDetalhado | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [clienteDetalhes, setClienteDetalhes] = useState<ClienteDetalhado | null>(null)
  const [novoContato, setNovoContato] = useState<Partial<Contato>>({})
  const [adicionandoContato, setAdicionandoContato] = useState(false)
  const { oportunidades, isLoading } = useOportunidades()

  // Carregar detalhes do cliente quando for aberto
  useEffect(() => {
    if (open && cliente) {
      // Criar uma versão detalhada do cliente
      const detalhes: ClienteDetalhado = {
        id: cliente.id || "",
        nome: cliente.nome,
        cnpj: cliente.cnpj || "",
        endereco: cliente.endereco || "",
        segmento: cliente.segmento || "",
        contatoNome: cliente.contatoNome || "",
        contatoEmail: cliente.contatoEmail || "",
        contatoTelefone: cliente.contatoTelefone || "",
        dataCadastro: cliente.dataCadastro || new Date().toISOString(),
        ativo: cliente.ativo !== undefined ? cliente.ativo : true,
        // Campos adicionais do ClienteDetalhado - tratados com segurança
        tipo: (cliente as any).tipo || "Empresa Privada",
        cidade: (cliente as any).cidade || "",
        estado: (cliente as any).estado || "",
        contatos: (cliente as any).contatos || [
          // Se não tiver contatos, criar um com os dados do contato principal
          ...(cliente.contatoNome ? [{
            id: "contato-principal",
            nome: cliente.contatoNome,
            email: cliente.contatoEmail || "",
            telefone: cliente.contatoTelefone || "",
            cargo: ""
          }] : [])
        ],
        responsavelInterno: (cliente as any).responsavelInterno || "",
        descricao: (cliente as any).descricao || "",
        observacoes: (cliente as any).observacoes || "",
        faturamento: (cliente as any).faturamento || "",
        oportunidades: oportunidades.filter(op => 
          op.cliente === cliente.nome || op.clienteId === cliente.id
        )
      };
      
      setClienteDetalhes(detalhes);
      setEditedCliente(detalhes);
    }
  }, [open, cliente, oportunidades]);

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  // Formatar data completa com horário
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }

  // Editar cliente
  const handleEditClick = () => {
    setIsEditing(true)
  }

  // Salvar alterações
  const handleSaveClick = () => {
    if (!editedCliente) return

    // Simulação de update
    setClienteDetalhes(editedCliente)
    setIsEditing(false)

    // Notificar componente pai
    if (onClienteUpdate && editedCliente) {
      onClienteUpdate(editedCliente)
    }

    toast({
      title: "Cliente atualizado",
      description: "Os dados do cliente foram atualizados com sucesso.",
    })
  }

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditedCliente(clienteDetalhes)
    setIsEditing(false)
  }

  // Confirmação para excluir cliente
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  // Confirmar exclusão
  const handleConfirmDelete = () => {
    if (clienteDetalhes && onClienteDelete) {
      onClienteDelete(clienteDetalhes)
    }
    setShowDeleteConfirm(false)
    onOpenChange(false)
    
    // Toast é exibido pelo componente pai que implementa a exclusão
  }

  // Adicionar contato
  const handleAddContato = () => {
    if (!editedCliente || !novoContato.nome || !novoContato.email) return

    const id = `contato-${Date.now()}`
    const contato: Contato = {
      id,
      nome: novoContato.nome,
      cargo: novoContato.cargo || "",
      email: novoContato.email,
      telefone: novoContato.telefone || "",
    }

    const contatos = [...(editedCliente.contatos || []), contato]
    setEditedCliente({ ...editedCliente, contatos })
    
    // Limpar formulário
    setNovoContato({})
    setAdicionandoContato(false)
  }

  // Remover contato
  const handleRemoveContato = (id: string) => {
    if (!editedCliente) return
    
    const contatos = editedCliente.contatos?.filter(c => c.id !== id) || []
    setEditedCliente({ ...editedCliente, contatos })
  }

  // Toggle para expandir/retrair o painel
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange} modal={true}>
        <SheetContent 
          side="right" 
          className={`p-0 ${isExpanded ? 'w-full md:max-w-4xl' : 'w-full md:max-w-2xl'}`}
        >
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-muted-foreground" />
                <span>{clienteDetalhes?.nome || "Detalhes do Cliente"}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={toggleExpanded}>
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </SheetTitle>
          </SheetHeader>

          {clienteDetalhes ? (
            <div className="overflow-y-auto max-h-[calc(100vh-8rem)]">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 mx-6 mt-4 sticky top-0 z-10 bg-white">
                  <TabsTrigger value="resumo">Resumo</TabsTrigger>
                  <TabsTrigger value="informacoes">Informações</TabsTrigger>
                  <TabsTrigger value="contatos">Contatos</TabsTrigger>
                  <TabsTrigger value="oportunidades">Oportunidades</TabsTrigger>
                </TabsList>
  
                {/* Aba de Resumo */}
                <TabsContent value="resumo" className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-base font-semibold mb-3">Dados Gerais</h3>
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="flex items-start">
                              <Building className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                              <div>
                                <Input
                                  className="text-sm font-medium"
                                  value={editedCliente?.nome || ''}
                                  onChange={e => setEditedCliente(editedCliente && { ...editedCliente, nome: e.target.value })}
                                  placeholder="Nome do Cliente"
                                />
                                <Select
                                  value={editedCliente?.tipo || ''}
                                  onValueChange={value => setEditedCliente(editedCliente && { ...editedCliente, tipo: value })}
                                >
                                  <SelectTrigger className="text-xs">
                                    <SelectValue placeholder="Tipo de Cliente" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {tiposCliente.map(tipo => (
                                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <Hash className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                              <Input
                                className="text-sm"
                                value={editedCliente?.cnpj || ''}
                                onChange={e => setEditedCliente(editedCliente && { ...editedCliente, cnpj: e.target.value })}
                                placeholder="CNPJ"
                              />
                            </div>
                            <div className="flex items-start">
                              <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                              <div>
                                <Input
                                  className="text-sm"
                                  value={editedCliente?.endereco || ''}
                                  onChange={e => setEditedCliente(editedCliente && { ...editedCliente, endereco: e.target.value })}
                                  placeholder="Endereço"
                                />
                                <div className="flex gap-2 mt-1">
                                  <Input
                                    className="text-xs"
                                    value={editedCliente?.cidade || ''}
                                    onChange={e => setEditedCliente(editedCliente && { ...editedCliente, cidade: e.target.value })}
                                    placeholder="Cidade"
                                  />
                                  <Select
                                    value={editedCliente?.estado || ''}
                                    onValueChange={value => setEditedCliente(editedCliente && { ...editedCliente, estado: value })}
                                  >
                                    <SelectTrigger className="text-xs w-20">
                                      <SelectValue placeholder="Estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {estados.map(uf => (
                                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <DollarSign className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                              <Input
                                className="text-sm"
                                value={editedCliente?.segmento || ''}
                                onChange={e => setEditedCliente(editedCliente && { ...editedCliente, segmento: e.target.value })}
                                placeholder="Segmento"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-start">
                              <Building className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{clienteDetalhes.nome}</p>
                                <p className="text-xs text-muted-foreground">{clienteDetalhes.tipo}</p>
                              </div>
                            </div>
                            {clienteDetalhes.cnpj && (
                              <div className="flex items-start">
                                <Hash className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                                <div>
                                  <p className="text-sm">{clienteDetalhes.cnpj}</p>
                                  <p className="text-xs text-muted-foreground">CNPJ</p>
                                </div>
                              </div>
                            )}
                            {clienteDetalhes.endereco && (
                              <div className="flex items-start">
                                <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                                <div>
                                  <p className="text-sm">{clienteDetalhes.endereco}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {[clienteDetalhes.cidade, clienteDetalhes.estado].filter(Boolean).join(' - ')}
                                  </p>
                                </div>
                              </div>
                            )}
                            {clienteDetalhes.segmento && (
                              <div className="flex items-start">
                                <DollarSign className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                                <div>
                                  <p className="text-sm">{clienteDetalhes.segmento}</p>
                                  <p className="text-xs text-muted-foreground">Segmento</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-base font-semibold mb-3">Contatos Principais</h3>
                        {clienteDetalhes.contatos && clienteDetalhes.contatos.length > 0 ? (
                          <div className="space-y-3">
                            {clienteDetalhes.contatos.slice(0, 2).map((contato) => (
                              <div key={contato.id} className="flex items-start">
                                <User className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">{contato.nome}</p>
                                  <p className="text-xs text-muted-foreground">{contato.cargo}</p>
                                  <div className="flex items-center mt-1 space-x-2">
                                    {contato.email && (
                                      <div className="flex items-center text-xs">
                                        <Mail className="h-3 w-3 mr-1" />
                                        <span>{contato.email}</span>
                                      </div>
                                    )}
                                    {contato.telefone && (
                                      <div className="flex items-center text-xs">
                                        <Phone className="h-3 w-3 mr-1" />
                                        <span>{contato.telefone}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {clienteDetalhes.contatos.length > 2 && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs mt-1"
                                onClick={() => setActiveTab("contatos")}
                              >
                                Ver todos os contatos
                              </Button>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Nenhum contato cadastrado</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                      <CardContent className="p-4">
                        <h3 className="text-base font-semibold mb-3">Oportunidades Recentes</h3>
                        {clienteDetalhes.oportunidades && clienteDetalhes.oportunidades.length > 0 ? (
                          <div className="space-y-3">
                            {clienteDetalhes.oportunidades.slice(0, 3).map((oportunidade) => (
                              <div 
                                key={oportunidade.id} 
                                className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                                onClick={() => onOportunidadeClick && onOportunidadeClick(oportunidade)}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-medium">{oportunidade.titulo}</p>
                                    <p className="text-xs text-muted-foreground">{oportunidade.responsavel}</p>
                                    <div className="flex items-center mt-1">
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${statusColors[oportunidade.status] || 'bg-gray-100'}`}
                                      >
                                        {getStatusLabel(oportunidade.status)}
                                      </Badge>
                                      <span className="text-xs ml-2">{oportunidade.valor}</span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-right">
                                    <div>Prazo: {oportunidade.prazo}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {clienteDetalhes.oportunidades.length > 3 && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs mt-1"
                                onClick={() => setActiveTab("oportunidades")}
                              >
                                Ver todas as oportunidades
                              </Button>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Nenhuma oportunidade cadastrada</p>
                        )}
                      </CardContent>
                    </Card>

                    {clienteDetalhes.descricao && (
                      <Card className="md:col-span-2">
                        <CardContent className="p-4">
                          <h3 className="text-base font-semibold mb-2">Descrição</h3>
                          <p className="text-sm whitespace-pre-line">{clienteDetalhes.descricao}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-6 flex justify-end space-x-2">
                      <Button variant="success" onClick={handleSaveClick}>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                      <Button variant="outline" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-6 flex justify-end space-x-2">
                      <Button variant="outline" onClick={handleEditClick}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar Cliente
                      </Button>
                      <Button variant="destructive" onClick={handleDeleteClick}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Cliente
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* Aba de Informações */}
                <TabsContent value="informacoes" className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-base font-semibold mb-3">Dados Gerais</h3>
                        <div className="space-y-2">
                          <div className="flex items-start">
                            <Building className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{clienteDetalhes.nome}</p>
                              <p className="text-xs text-muted-foreground">{clienteDetalhes.tipo}</p>
                            </div>
                          </div>
                          
                          {clienteDetalhes.cnpj && (
                            <div className="flex items-start">
                              <Hash className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                              <div>
                                <p className="text-sm">{clienteDetalhes.cnpj}</p>
                                <p className="text-xs text-muted-foreground">CNPJ</p>
                              </div>
                            </div>
                          )}
                          
                          {clienteDetalhes.endereco && (
                            <div className="flex items-start">
                              <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                              <div>
                                <p className="text-sm">{clienteDetalhes.endereco}</p>
                                <p className="text-xs text-muted-foreground">
                                  {[clienteDetalhes.cidade, clienteDetalhes.estado].filter(Boolean).join(' - ')}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {clienteDetalhes.segmento && (
                            <div className="flex items-start">
                              <DollarSign className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                              <div>
                                <p className="text-sm">{clienteDetalhes.segmento}</p>
                                <p className="text-xs text-muted-foreground">Segmento</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-base font-semibold mb-3">Responsável Interno</h3>
                        <p className="text-sm">{clienteDetalhes.responsavelInterno}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-base font-semibold mb-3">Observações</h3>
                        <p className="text-sm whitespace-pre-line">{clienteDetalhes.observacoes}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-base font-semibold mb-3">Faturamento</h3>
                        <p className="text-sm">{clienteDetalhes.faturamento}</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Aba de Contatos */}
                <TabsContent value="contatos" className="px-6 py-4">
                  <div className="space-y-3">
                    {clienteDetalhes.contatos && clienteDetalhes.contatos.length > 0 ? (
                      <div className="space-y-3">
                        {clienteDetalhes.contatos.map((contato) => (
                          <Card key={contato.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-base font-medium">{contato.nome}</h4>
                                  <p className="text-xs text-muted-foreground">{contato.cargo}</p>
                                </div>
                                <div className="flex items-center text-xs space-x-2">
                                  {contato.email && (
                                    <div className="flex items-center">
                                      <Mail className="h-3 w-3 mr-1" />
                                      <span>{contato.email}</span>
                                    </div>
                                  )}
                                  {contato.telefone && (
                                    <div className="flex items-center">
                                      <Phone className="h-3 w-3 mr-1" />
                                      <span>{contato.telefone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum contato cadastrado</p>
                    )}
                  </div>
                </TabsContent>

                {/* Aba de Oportunidades */}
                <TabsContent value="oportunidades" className="px-6 py-4">
                  {clienteDetalhes.oportunidades && clienteDetalhes.oportunidades.length > 0 ? (
                    <div className="space-y-3">
                      {clienteDetalhes.oportunidades.map((oportunidade) => (
                        <Card 
                          key={oportunidade.id} 
                          className="hover:border-primary cursor-pointer transition-colors"
                          onClick={() => onOportunidadeClick && onOportunidadeClick(oportunidade)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-base font-medium">{oportunidade.titulo}</h4>
                                <p className="text-xs text-muted-foreground">{oportunidade.responsavel}</p>
                                <div className="flex items-center mt-1">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${statusColors[oportunidade.status] || 'bg-gray-100'}`}
                                  >
                                    {getStatusLabel(oportunidade.status)}
                                  </Badge>
                                  <span className="text-xs ml-2">{oportunidade.valor}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <div className="text-xs text-right">Prazo: {oportunidade.prazo}</div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-2 text-blue-600 p-0 h-auto flex items-center hover:text-blue-800 hover:bg-transparent"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Evitar que o clique propague para o Card
                                    onOportunidadeClick && onOportunidadeClick(oportunidade);
                                  }}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  Visualizar
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma oportunidade cadastrada</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
              <p className="text-muted-foreground">Carregando detalhes do cliente...</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente
              <span className="font-semibold"> {clienteDetalhes?.nome}</span> e todos os
              seus dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
