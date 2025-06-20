'use client';

import { useState, useEffect } from 'react';
import { supabase, crmonefactory } from '@/lib/supabase/client';

export default function SupabaseCheckPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>({});

  useEffect(() => {
    async function checkSupabase() {
      setLoading(true);
      setError(null);
      
      try {
        // Resultado para mostrar
        const testResults: any = {};
        
        // 1. Verificar conexão
        testResults.connectionTest = { status: 'Testando...' };
        
        const { data: version, error: versionError } = await supabase
          .from('_supabase_version')
          .select('*')
          .limit(1);
          
        if (versionError) {
          testResults.connectionTest = { 
            status: 'Falha', 
            error: versionError.message 
          };
        } else {
          testResults.connectionTest = { 
            status: 'Conectado', 
            data: version 
          };
        }
        
        // 2. Testar acesso direto ao schema
        testResults.schemaCheck = { status: 'Testando...' };
        
        try {
          const { data: schemaData, error: schemaError } = await crmonefactory
            .from('users')
            .select('count(*)')
            .limit(1);
            
          if (schemaError) {
            testResults.schemaCheck = { 
              status: 'Falha', 
              error: schemaError.message 
            };
          } else {
            testResults.schemaCheck = { 
              status: 'Sucesso', 
              data: schemaData 
            };
          }
        } catch (err: any) {
          testResults.schemaCheck = { 
            status: 'Erro', 
            error: err.message 
          };
        }
        
        // 3. Verificar estrutura da tabela users
        testResults.tableStructure = { status: 'Testando...' };
        
        try {
          const { data, error } = await supabase.rpc('get_table_columns', {
            table_name: 'users',
            schema_name: 'crmonefactory'
          });
          
          if (error) {
            // Função RPC não existe, tentar usando outro método
            const { data: columnsData, error: columnsError } = await supabase
              .from('information_schema.columns')
              .select('column_name, data_type')
              .eq('table_schema', 'crmonefactory')
              .eq('table_name', 'users');
              
            if (columnsError) {
              testResults.tableStructure = { 
                status: 'Falha', 
                error: columnsError.message 
              };
            } else {
              testResults.tableStructure = { 
                status: 'Sucesso', 
                data: columnsData 
              };
            }
          } else {
            testResults.tableStructure = { 
              status: 'Sucesso', 
              data 
            };
          }
        } catch (err: any) {
          testResults.tableStructure = { 
            status: 'Erro', 
            error: err.message 
          };
        }
        
        // 4. Testar inserção
        testResults.insertionTest = { status: 'Pulando...' };
        // Este teste pode ser comentado para não inserir dados desnecessários
        /*
        try {
          const testUser = {
            name: `Test User ${new Date().toISOString()}`,
            email: `test${Date.now()}@example.com`,
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { data, error } = await crmonefactory
            .from('users')
            .insert(testUser)
            .select();
            
          if (error) {
            testResults.insertionTest = { 
              status: 'Falha', 
              error 
            };
          } else {
            testResults.insertionTest = { 
              status: 'Sucesso', 
              data 
            };
          }
        } catch (err: any) {
          testResults.insertionTest = { 
            status: 'Erro', 
            error: err.message 
          };
        }
        */
        
        // Atualizar resultados
        setResults(testResults);
      } catch (error: any) {
        setError(error.message || 'Erro desconhecido ao testar Supabase');
      } finally {
        setLoading(false);
      }
    }
    
    checkSupabase();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Verificação de Configuração do Supabase</h1>
      
      {loading && <p className="text-gray-600">Testando conexão com Supabase...</p>}
      
      {error && (
        <div className="bg-red-100 p-4 rounded-md mb-4">
          <p className="text-red-700">Erro: {error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <div className="space-y-6">
          {Object.entries(results).map(([testName, result]: [string, any]) => (
            <div 
              key={testName} 
              className={`p-4 rounded-md ${
                result.status === 'Sucesso' ? 'bg-green-100' : 
                result.status === 'Falha' ? 'bg-red-100' : 'bg-gray-100'
              }`}
            >
              <h2 className="font-bold mb-2 capitalize">{testName.replace(/([A-Z])/g, ' $1')}</h2>
              <p className="mb-2">
                Status: 
                <span className={
                  result.status === 'Sucesso' ? 'text-green-600 font-bold' : 
                  result.status === 'Falha' ? 'text-red-600 font-bold' : ''
                }>
                  {' '}{result.status}
                </span>
              </p>
              
              {result.error && (
                <div className="bg-red-50 p-2 rounded-md mb-2">
                  <p className="text-red-700 text-sm">Erro: {result.error}</p>
                </div>
              )}
              
              {result.data && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-blue-600">Mostrar dados</summary>
                  <pre className="bg-gray-50 p-2 rounded-md mt-1 text-xs overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
          
          <h2 className="text-xl font-bold mt-8 mb-4">Próximos Passos</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Se <b>connectionTest</b> falhou: Verifique as credenciais do Supabase no arquivo cliente</li>
            <li>Se <b>schemaCheck</b> falhou: O schema 'crmonefactory' pode não existir ou estar inacessível</li>
            <li>Se <b>tableStructure</b> falhou: A tabela 'users' pode não existir no schema correto</li>
            <li>
              Você pode executar este SQL para criar a estrutura necessária:
              <pre className="bg-gray-50 p-3 rounded-md text-xs mt-2 overflow-auto">
{`-- Criar schema se não existir
CREATE SCHEMA IF NOT EXISTS crmonefactory;

-- Criar tabela users
CREATE TABLE IF NOT EXISTS crmonefactory.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  avatar_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabelas relacionadas
CREATE TABLE IF NOT EXISTS crmonefactory.refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES crmonefactory.users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar permissões
GRANT USAGE ON SCHEMA crmonefactory TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA crmonefactory TO anon, authenticated;
`}</pre>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
