"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Download, ExternalLink } from "lucide-react"

interface PDFViewerProps {
  url: string
  fileName: string
}

export function PDFViewer({ url, fileName }: PDFViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    // Verificar se a URL existe
    const checkUrl = async () => {
      try {
        const response = await fetch(url, { method: 'HEAD' })
        if (!response.ok) {
          setError(`Erro ao carregar o documento: ${response.status}`)
        }
      } catch (err) {
        setError('Erro ao acessar o documento')
        console.error('Erro ao verificar URL:', err)
      } finally {
        setLoading(false)
      }
    }
    
    checkUrl()
  }, [url])
  
  const handleIframeLoad = () => {
    setLoading(false)
    console.log("Documento carregado com sucesso:", url)
  }
  
  const handleIframeError = () => {
    setError('Não foi possível carregar o documento')
    setLoading(false)
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="relative flex-1 border rounded-md overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Carregando documento...</p>
            </div>
          </div>
        )}
        
        {error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Erro ao visualizar documento</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.open(url, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir no navegador
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open(url, "_blank")}>
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full">
            {/* Usando embedding direto com object, que geralmente funciona melhor para PDFs */}
            <object
              data={url}
              type="application/pdf"
              width="100%"
              height="100%"
              className="w-full h-full rounded-md"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            >
              <iframe 
                src={url}
                width="100%"
                height="100%"
                title={fileName}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms"
              >
                <p>
                  Seu navegador não pode exibir PDFs diretamente.{" "}
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    Clique aqui para baixar o arquivo.
                  </a>
                </p>
              </iframe>
            </object>
          </div>
        )}
      </div>
      
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={() => window.open(url, "_blank")}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Abrir em nova aba
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.open(url, "_blank")}>
          <Download className="h-4 w-4 mr-2" />
          Baixar
        </Button>
      </div>
    </div>
  )
}
