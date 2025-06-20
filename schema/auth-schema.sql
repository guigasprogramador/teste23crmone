-- Auth tables for Supabase

-- Users table to store user information
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255),
  microsoft_id VARCHAR(255) UNIQUE,
  avatar_url VARCHAR(500),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Refresh tokens table to store user refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_revoked BOOLEAN DEFAULT false
);

-- Create index on user_id for faster token lookups
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- Create index on token for faster token validation
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- Roles table to define different user roles
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default roles
INSERT INTO roles (name, description) 
VALUES 
  ('admin', 'Administrador com acesso completo ao sistema'),
  ('contador', 'Contador com acesso a módulos financeiros e contábeis'),
  ('user', 'Usuário padrão com acesso limitado')
ON CONFLICT (name) DO NOTHING;

-- Permissions table to define system permissions
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default permissions
INSERT INTO permissions (name, description)
VALUES
  ('view_dashboard', 'Visualizar dashboard'),
  ('edit_proposals', 'Editar propostas'),
  ('view_proposals', 'Visualizar propostas'),
  ('edit_contracts', 'Editar contratos'),
  ('view_contracts', 'Visualizar contratos'),
  ('manage_users', 'Gerenciar usuários'),
  ('view_reports', 'Visualizar relatórios'),
  ('edit_system_settings', 'Editar configurações do sistema'),
  ('view_documents', 'Visualizar documentos'),
  ('upload_documents', 'Fazer upload de documentos')
ON CONFLICT (name) DO NOTHING;

-- Role permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

-- Set up default role permissions
-- Admin role gets all permissions
DO $$
DECLARE
  admin_role_id UUID;
  contador_role_id UUID;
  user_role_id UUID;
  perm_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  SELECT id INTO contador_role_id FROM roles WHERE name = 'contador';
  SELECT id INTO user_role_id FROM roles WHERE name = 'user';
  
  -- Give admin all permissions
  FOR perm_id IN SELECT id FROM permissions
  LOOP
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (admin_role_id, perm_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- Give contador specific permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT contador_role_id, id FROM permissions 
  WHERE name IN ('view_dashboard', 'view_proposals', 'view_contracts', 'view_reports', 'view_documents', 'upload_documents')
  ON CONFLICT DO NOTHING;
  
  -- Give regular user basic permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT user_role_id, id FROM permissions 
  WHERE name IN ('view_dashboard', 'view_proposals', 'view_documents')
  ON CONFLICT DO NOTHING;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup expired refresh tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM refresh_tokens 
  WHERE expires_at < now() OR is_revoked = true;
END;
$$ LANGUAGE plpgsql;

-- Create a job to run cleanup every day
-- Note: This requires pg_cron extension to be enabled
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('0 3 * * *', 'SELECT cleanup_expired_tokens()');
