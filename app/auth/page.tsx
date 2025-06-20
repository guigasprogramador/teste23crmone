"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-4">
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">CRM Licitações</CardTitle>
            <CardDescription className="text-center">
              Escolha uma opção para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Link href="/auth/login">
                <Button className="w-full">Entrar</Button>
              </Link>
            </div>
            <div className="grid gap-2">
              <Link href="/auth/register">
                <Button variant="outline" className="w-full">Criar uma conta</Button>
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <p className="text-xs text-center text-gray-500 mt-4">
              © {new Date().getFullYear()} CRM Licitações - OneFlow. Todos os direitos reservados.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}