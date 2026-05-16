import { useSession } from "next-auth/react";

/**
 * Hook para verificar se o usuário autenticado possui uma permissão específica.
 * As permissões são lidas do JWT via next-auth session.user.permissions.
 *
 * @param key - chave de permissão (ex: "crm.contacts.read")
 * @returns true se o usuário possui a permissão, false caso contrário
 */
export function usePermission(key: string): boolean {
  const { data: session } = useSession();
  const permissions: string[] = (session?.user as any)?.permissions ?? [];
  return permissions.includes(key);
}
