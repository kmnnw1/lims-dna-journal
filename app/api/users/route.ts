import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") {
    throw new Error("Недостаточно прав администратора");
  }
}

export async function GET() {
  try {
    await checkAdmin();
    const users = await prisma.user.findMany({ select: { id: true, username: true, role: true } });
    return NextResponse.json(users);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    await checkAdmin();
    const { username, password, role } = await req.json();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: { username, password: hashedPassword, role }
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    await checkAdmin();
    const body = await req.json();
    const id = body?.id as string | undefined;
    const role = body?.role as string | undefined;
    const password = body?.password as string | undefined;
    if (!id) {
      return NextResponse.json({ error: "Не указан id пользователя" }, { status: 400 });
    }
    const allowed = new Set(["EDITOR", "ADMIN", "READER"]);
    const data: { role?: string; password?: string } = {};
    if (role !== undefined) {
      if (!allowed.has(role)) {
        return NextResponse.json({ error: "Недопустимая роль" }, { status: 400 });
      }
      data.role = role;
    }
    if (password != null && String(password).length > 0) {
      data.password = await bcrypt.hash(String(password), 10);
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Нечего обновить" }, { status: 400 });
    }
    await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Ошибка";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    await checkAdmin();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    await prisma.user.delete({ where: { id: String(id) } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}