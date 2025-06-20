import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase com credenciais de serviço (service role)
// Esta é uma chave com permissões administrativas que ignora as políticas RLS
// IMPORTANTE: Este cliente só deve ser usado em APIs do servidor, nunca no cliente!
const supabaseUrl = 'https://supabase.guigasautomacao.uk';

// Substitua por sua chave service_role (encontrada nas configurações do projeto)
// AVISO: Esta chave tem permissões administrativas completas, mantenha-a segura!
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogInNlcnZpY2Vfcm9sZSIsCiAgImlzcyI6ICJzdXBhYmFzZSIsCiAgImlhdCI6IDE3MTUwNTA4MDAsCiAgImV4cCI6IDE4NzI4MTcyMDAKfQ.xEmXJxvMnHH2xYIKvLBv-0IlYRBkixkQg9gK4g9jIq8';

// Cria e exporta um cliente Supabase com privilégios administrativos
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Cria um cliente específico para o schema crmonefactory
export const crmonefactoryAdmin = supabaseAdmin.schema('crmonefactory');

// Use este cliente apenas em endpoints do servidor onde você precisar ignorar as políticas RLS
// Exemplo: import { supabaseAdmin } from '@/lib/supabase/admin-client';
