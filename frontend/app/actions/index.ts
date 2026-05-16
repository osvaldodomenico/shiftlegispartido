"use server"

import { redirect } from "next/navigation"

// Social login desativado — OAuth não utilizado sem NextAuth
export async function doSocialLogin(_formData: FormData) {
  // OAuth providers removidos junto com NextAuth
}

// Logout redireciona para login; limpeza do store Zustand deve ser feita no cliente
export async function doLogout() {
  redirect("/auth/login")
}
