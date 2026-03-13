import prisma from "@/lib/prisma";

export async function checkAdmin(userId: string): Promise<boolean> {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (adminEmails.length === 0) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  return !!user && adminEmails.includes(user.email);
}
