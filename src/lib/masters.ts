// Contas master da plataforma: únicas que permanecem após o reset de dados e
// que não podem ser excluídas, inativadas ou rebaixadas pela interface.
// Mantenha esta lista em sincronia com prisma/seed.ts e scripts/*.js.
export const MASTER_EMAILS = [
  "rmktcia@gmail.com", // Rafael
  "denis10081976@gmail.com", // Denis
  "nilton@companhiadochurrasco.com", // Nilton
  "szporerm@gmail.com", // Marcos
  "aksaks@uol.com.br", // André
] as const;

export function isMasterEmail(email: string | null | undefined) {
  return !!email && MASTER_EMAILS.includes(email.toLowerCase() as (typeof MASTER_EMAILS)[number]);
}
