// apps/web/lib/auth/jwt.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export interface JWTPayload {
  sub: string;       // userId
  email: string;
  role: string;
  name: string;
  mailboxCode?: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(role?: string): Promise<JWTPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (role && session.role !== role && session.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session;
}
