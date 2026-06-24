// apps/web/lib/mailbox/generateCode.ts
import prisma from "@/lib/db/prisma";

/**
 * Generates the next unique mailbox code atomically.
 * Format: KLD-001, KLD-002 … KLD-999, KLD-1000
 */
export async function generateMailboxCode(): Promise<string> {
  const seq = await prisma.$transaction(async (tx) => {
    const row = await tx.mailboxCodeSequence.findFirst();
    if (!row) {
      return tx.mailboxCodeSequence.create({
        data: { prefix: process.env.MAILBOX_CODE_PREFIX ?? "KLD", counter: 1 },
      });
    }
    return tx.mailboxCodeSequence.update({
      where: { id: row.id },
      data: { counter: { increment: 1 } },
    });
  });

  const padded = String(seq.counter).padStart(3, "0");
  return `${seq.prefix}-${padded}`;
}
