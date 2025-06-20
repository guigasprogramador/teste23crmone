"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Download, Calendar, User, Tag, Building, FileType, ExternalLink } from "lucide-react"
import { PDFViewer } from "./pdf-viewer"

interface Documento {
  id: string
  nome: string
  tipo: string
  formato: string
  categoria: string
  categoriaId?: string
  licitacao?: string
  licitacaoId?: string
  licitacao_id?: string
  dataUpload?: string
  tamanho?: string | number
  uploadPor?: string
  resumo?: string
  url?: string
  arquivo_path?: string
}

interface VisualizadorDocumentoProps {
  documento: Documento | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VisualizadorDocumento({ documento, open, onOpenChange }: VisualizadorDocumentoProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Reset loading state when a new document is opened
    if (open) {
      setIsLoading(true)
    }
  }, [open, documento])

  if (!documento) return null

  // Determinar a URL de visualização com base no tipo de arquivo
  const getPreviewUrl = () => {
    // Se temos uma URL direta para o documento, usá-la
    if (documento.url) {
      return documento.url;
    }
    
    // Se temos o caminho do arquivo no Storage do Supabase, construir a URL
    if (documento.arquivo_path) {
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documentos/${documento.arquivo_path}`;
    }
    
    // Fallback para URLs de exemplo
    return null;
  }

  const previewUrl = getPreviewUrl();

  // Função para obter a classe CSS para o badge de categoria
  const getCategoryBadgeClass = (categoriaId?: string) => {
    if (!categoriaId) return "";
    
    switch (categoriaId) {
      case "projetos":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "contabeis":
        return "bg-green-100 text-green-800 border-green-300"
      case "societarios":
        return "bg-purple-100 text-purple-800 border-purple-300"
      case "juridicos":
        return "bg-amber-100 text-amber-800 border-amber-300"
      case "atestado_capacidade":
        return "bg-indigo-100 text-indigo-800 border-indigo-300"
      case "tecnicos":
        return "bg-emerald-100 text-emerald-800 border-emerald-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-[80vw] max-h-[95vh] p-5">
        <div className="overflow-auto h-full">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-500" />
              <span className="truncate">{documento.nome}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <Tabs defaultValue="preview">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Visualização</TabsTrigger>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-4">
                <div className="h-[75vh]">
                  {previewUrl ? (
                    <PDFViewer url={previewUrl} fileName={documento.nome} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full border rounded-md">
                      <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium mb-2">Visualização não disponível</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Não é possível visualizar este documento diretamente.
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.open(document.location.href, "_blank")}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Abrir no navegador
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Baixar documento
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="details" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm font-medium flex items-center">
                          <FileType className="h-4 w-4 mr-2 text-muted-foreground" />
                          Formato
                        </p>
                        <p>{documento.formato?.toUpperCase()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                          Tipo de Documento
                        </p>
                        <p>{documento.tipo}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium flex items-center">
                          <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                          Categoria
                        </p>
                        <Badge variant="outline" className={getCategoryBadgeClass(documento.categoriaId)}>
                          {documento.categoria}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium flex items-center">
                          <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                          Licitação
                        </p>
                        <p className="truncate">{documento.licitacao}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          Data de Upload
                        </p>
                        <p>{documento.dataUpload}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          Enviado por
                        </p>
                        <p>{documento.uploadPor}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Tamanho</p>
                        <p>{documento.tamanho}</p>
                      </div>
                    </div>

                    {documento.resumo && (
                      <div className="mt-4">
                        <p className="text-sm font-medium">Resumo</p>
                        <p className="text-sm mt-1">{documento.resumo}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
