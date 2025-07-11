"use client";

"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Definir interface para o usuário
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

// Definir interface para o contexto de autenticação
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  hasPermission: (requiredRoles: string[] | string) => boolean;
}

// Criar contexto de autenticação
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado para acessar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

// Provider de autenticação
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. Tenta restaurar user info do localStorage (otimismo)
        const userJson = localStorage.getItem('user');
        if (userJson) {
          setUser(JSON.parse(userJson));
          // setIsAuthenticated(true); // Authentication will be confirmed by refreshToken or subsequent actions
        }

        // 2. Tenta via refreshToken/cookie para confirmar/estabelecer sessão
        const cookies = document.cookie.split(';');
        const refreshTokenCookie = cookies.find(cookie => cookie.trim().startsWith('refreshToken='));
        if (!refreshTokenCookie) {
          setLoading(false);
          return;
        }
        await refreshToken();
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Refresh token
  const refreshToken = async (): Promise<void> => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Detalhes do erro:", errorData);
        throw new Error(errorData.error || "Falha ao renovar token");
      }

      const data = await response.json();
      if (!data.user) {
        throw new Error("Resposta inválida do servidor");
      }

      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Erro ao renovar token:", error);
      setUser(null);
      setIsAuthenticated(false);
      router.push('/auth/login');
    }
  };

  // Registrar novo usuário
  const register = async (name: string, email: string, password: string): Promise<void> => {
    try {
      console.log("Iniciando registro com:", { name, email });
      
      // 1. Enviar requisição ao endpoint de registro
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role: "user" }),
      });
      
      console.log("Status da resposta registro:", response.status);
      
      const responseData = await response.json();
      console.log("Resposta do registro:", responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || "Erro no registro");
      }
      
      // 2. Se o registro for bem-sucedido, vamos fazer login
      await login(email, password);
      
      toast.success("Usuário registrado com sucesso!");
    } catch (error) {
      console.error("Erro durante o registro:", error);
      toast.error("Erro durante o registro: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  // Login
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        // Verificar especificamente o erro de usuário não encontrado
        if (data.error === "Usuário não encontrado") {
          throw new Error("Este usuário não existe. Verifique o email ou crie uma nova conta.");
        }
        throw new Error(data.error || "Erro no login");
      }

      setUser(data.user);
      setIsAuthenticated(true);
      // localStorage.setItem('accessToken', data.accessToken); // REMOVED
      localStorage.setItem('user', JSON.stringify(data.user)); // User info can still be stored
      
      toast.success("Login realizado com sucesso!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Erro durante o login:", error);
      toast.error("Erro durante o login: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      // Faz a chamada para o servidor para invalidar os tokens
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });

      // Limpa o estado local
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      
      // Remove os cookies de autenticação
      document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      
      // Redireciona para a página de login usando o router
      router.push("/auth/login");
      
      toast.success("Logout realizado com sucesso!");
    } catch (error) {
      console.error("Erro durante o logout:", error);
      // Força um redirecionamento mesmo em caso de erro
      router.push("/auth/login");
    }
  };

  // Função para verificar permissões
  const hasPermission = (requiredRoles: string[] | string): boolean => {
    if (!user || !user.role) {
      return false;
    }

    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }
    return user.role === requiredRoles;
  };

  // Criando o objeto de contexto com todos os valores e funções
  const authContextValue: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    register,
    login,
    logout,
    refreshToken,
    hasPermission
  };
  
  // Retornando o Provider com o value contendo o objeto de contexto
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
