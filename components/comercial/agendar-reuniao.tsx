"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarIcon, CheckIcon } from "lucide-react"
import { Oportunidade } from "@/types/comercial"
import { format, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "@/components/ui/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

interface AgendarReuniaoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  oportunidade: Oportunidade
  onReuniaoAgendada?: (reuniao: any) => void
}

export function AgendarReuniao({ 
  open, 
  onOpenChange, 
  oportunidade,
  onReuniaoAgendada
}: AgendarReuniaoProps) {
  // Estado para armazenar a data selecionada
  const [data, setData] = useState<Date | undefined>(addDays(new Date(), 1))
  
  // Estado para armazenar a hora selecionada
  const [hora, setHora] = useState<string>("09:00")
  
  // Estado para armazenar a duração selecionada
  const [duracao, setDuracao] = useState<string>("30")
  
  // Estado para armazenar o local da reunião
  const [local, setLocal] = useState<string>("online")
  
  // Estado para armazenar o link da reunião (se online)
  const [link, setLink] = useState<string>("")
  
  // Estado para armazenar o endereço da reunião (se presencial)
  const [endereco, setEndereco] = useState<string>("")
  
  // Estado para armazenar a pauta da reunião
  const [pauta, setPauta] = useState<string>("")
  
  // Estado para armazenar os participantes da reunião
  const [participantes, setParticipantes] = useState<string>(oportunidade.responsavel)
  
  // Estado para armazenar o e-mail do cliente
  const [emailCliente, setEmailCliente] = useState(oportunidade.clienteEmail || (oportunidade.cliente && oportunidade.cliente.email) || "");
  const [erroEmailCliente, setErroEmailCliente] = useState<string>("");
  
  // Estado para armazenar os responsáveis
  const [responsaveisOpcoes, setResponsaveisOpcoes] = useState<any[]>([]);
  const [responsaveisSelecionados, setResponsaveisSelecionados] = useState<any[]>([]);
  const [erroResponsaveis, setErroResponsaveis] = useState<string>("");

  // Buscar responsáveis para autocomplete
  useEffect(() => {
    const buscarResponsaveis = async () => {
      const resp = await fetch("/api/comercial/responsaveis");
      const data = await resp.json();
      setResponsaveisOpcoes(data);
    };
    buscarResponsaveis();
  }, []);

  // Validação de e-mail simples
  const validarEmail = (email: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  // Função para lidar com o agendamento da reunião
  const handleAgendar = async () => {
    // Validação dos campos
    let erro = false;
    setErroEmailCliente("");
    setErroResponsaveis("");
    if (!data) {
      toast({
        title: "Erro",
        description: "Selecione uma data para a reunião",
        variant: "destructive",
      })
      return
    }
    if (!emailCliente || !validarEmail(emailCliente)) {
      setErroEmailCliente("E-mail do cliente inválido");
      erro = true;
    }
    const emailsResponsaveis = responsaveisSelecionados.map(r => r.email);
    if (emailsResponsaveis.length === 0 || emailsResponsaveis.some(email => !validarEmail(email))) {
      setErroResponsaveis("Selecione pelo menos um responsável com e-mail válido");
      erro = true;
    }
    if (erro) return;
    // Construir objeto de reunião
    const reuniao = {
      oportunidadeId: oportunidade.id,
      titulo: `Reunião - ${oportunidade.titulo}`,
      data: format(data, "yyyy-MM-dd"),
      hora,
      duracao: parseInt(duracao),
      local,
      link: local === "online" ? link : null,
      endereco: local === "presencial" ? endereco : null,
      pauta,
      participantes: participantes.split(",").map(p => p.trim()),
      cliente: oportunidade.cliente,
      clienteId: oportunidade.clienteId,
      status: "agendada",
      createdAt: new Date().toISOString(),
      emailResponsavel: emailsResponsaveis,
      emailCliente: emailCliente,
      responsaveisIds: responsaveisSelecionados.map(r => r.id)
    }
    try {
      const response = await fetch("/api/comercial/reunioes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reuniao)
      });
      if (!response.ok) {
        throw new Error("Erro ao agendar reunião");
      }
      const reuniaoCriada = await response.json();
      if (onReuniaoAgendada) {
        onReuniaoAgendada(reuniaoCriada)
      }
      toast({
        title: "Reunião agendada",
        description: `Reunião agendada para ${format(data, "PPP", { locale: ptBR })} às ${hora}`,
      })
      onOpenChange(false)
      setData(addDays(new Date(), 1))
      setHora("09:00")
      setDuracao("30")
      setLocal("online")
      setLink("")
      setEndereco("")
      setPauta("")
      setParticipantes(oportunidade.responsavel)
      setEmailCliente("")
      setResponsaveisSelecionados([])
    } catch (error) {
      toast({
        title: "Erro ao agendar reunião",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Agendar Reunião</DialogTitle>
          <DialogDescription>
            {`Agende uma reunião para a oportunidade "${oportunidade.titulo}" com ${oportunidade.cliente}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data ? format(data, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={data}
                    onSelect={setData}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <div>
                <Label htmlFor="hora">Horário</Label>
                <Input 
                  type="time"
                  id="hora"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                />
              </div>
              
              <div className="mt-4">
                <Label htmlFor="duracao">Duração (minutos)</Label>
                <Select value={duracao} onValueChange={setDuracao}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a duração" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1 hora e 30 minutos</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="mt-4">
                <Label htmlFor="local">Local</Label>
                <Select value={local} onValueChange={setLocal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o local" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="hibrido">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {local === "online" || local === "hibrido" ? (
                <div className="mt-4">
                  <Label htmlFor="link">Link da reunião</Label>
                  <Input 
                    id="link"
                    placeholder="https://meet.google.com/..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                </div>
              ) : null}
              
              {local === "presencial" || local === "hibrido" ? (
                <div className="mt-4">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input 
                    id="endereco"
                    placeholder="Rua, número, complemento..."
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                  />
                </div>
              ) : null}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="participantes">Participantes</Label>
            <Input 
              id="participantes"
              placeholder="Nomes separados por vírgula"
              value={participantes}
              onChange={(e) => setParticipantes(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pauta">Pauta da reunião</Label>
            <Textarea 
              id="pauta"
              placeholder="Detalhe os tópicos a serem discutidos..."
              value={pauta}
              onChange={(e) => setPauta(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="emailCliente">E-mail do Cliente</Label>
            <Input
              id="emailCliente"
              type="email"
              value={emailCliente}
              onChange={(e) => setEmailCliente(e.target.value)}
              placeholder="cliente@exemplo.com"
              className={erroEmailCliente ? "border-red-500" : ""}
            />
            {erroEmailCliente && <span className="text-xs text-red-500">{erroEmailCliente}</span>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="responsaveis">Responsáveis</Label>
            <div>
              <select
                multiple
                value={responsaveisSelecionados.map(r => r.id)}
                onChange={e => {
                  const selecionados = Array.from(e.target.selectedOptions).map(opt => responsaveisOpcoes.find(r => r.id === opt.value));
                  setResponsaveisSelecionados(selecionados.filter(Boolean));
                }}
                className="w-full h-24 border rounded"
              >
                {responsaveisOpcoes.map(r => (
                  <option key={r.id} value={r.id}>{r.nome} ({r.email})</option>
                ))}
              </select>
            </div>
            {erroResponsaveis && <span className="text-xs text-red-500">{erroResponsaveis}</span>}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAgendar}>
            <CheckIcon className="mr-2 h-4 w-4" />
            Agendar Reunião
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
