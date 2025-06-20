"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle } from "lucide-react"
import { Cliente } from "@/types/comercial"

interface NovoClienteProps {
  onClienteAdded: (cliente: Partial<Cliente>) => void
}

export function NovoCliente({ onClienteAdded }: NovoClienteProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    contatoNome: "",
    contatoTelefone: "",
    contatoEmail: "",
    endereco: "",
    segmento: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onClienteAdded(formData)
    setOpen(false)
    setFormData({
      nome: "",
      cnpj: "",
      contatoNome: "",
      contatoTelefone: "",
      contatoEmail: "",
      endereco: "",
      segmento: "",
    })
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1"
        onClick={() => setOpen(true)}
      >
        <PlusCircle className="h-4 w-4" />
        Novo Cliente
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo cliente. Clique em salvar quando terminar.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contatoNome">Nome do Contato</Label>
                  <Input
                    id="contatoNome"
                    name="contatoNome"
                    value={formData.contatoNome}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contatoTelefone">Telefone do Contato</Label>
                  <Input
                    id="contatoTelefone"
                    name="contatoTelefone"
                    value={formData.contatoTelefone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contatoEmail">Email do Contato</Label>
                <Input
                  id="contatoEmail"
                  name="contatoEmail"
                  type="email"
                  value={formData.contatoEmail}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="segmento">Segmento</Label>
                <Input
                  id="segmento"
                  name="segmento"
                  value={formData.segmento}
                  onChange={handleChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Cliente</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
