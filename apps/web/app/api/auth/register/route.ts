// apps/web/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { signToken } from "@/lib/auth/jwt";
import { generateMailboxCode } from "@/lib/mailbox/generateCode";

const RegisterSchema = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(8),
  phone:    z.string().optional(),
  country:  z.string().optional(),
  address:  z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = RegisterSchema.parse(body);

    const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (exists) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const [passwordHash, mailboxCode] = await Promise.all([
      bcrypt.hash(data.password, 12),
      generateMailboxCode(),
    ]);

    const user = await prisma.user.create({
      data: {
        name:         data.name,
        email:        data.email.toLowerCase(),
        passwordHash,
        phone:        data.phone,
        country:      data.country,
        address:      data.address,
        role:         "CUSTOMER",
        mailboxCode,
      },
    });

    const token = await signToken({
      sub:         user.id,
      email:       user.email,
      role:        user.role,
      name:        user.name,
      mailboxCode: user.mailboxCode ?? undefined,
    });

    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 7,
      path:     "/",
    });

    return NextResponse.json(
      {
        user: {
          id:          user.id,
          name:        user.name,
          email:       user.email,
          role:        user.role,
          mailboxCode: user.mailboxCode,
        },
        message: `Welcome! Your mailbox code is ${mailboxCode}. Use this when placing orders online.`,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
