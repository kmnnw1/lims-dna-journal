import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Требуется вход в систему" }, { status: 401 });
    }

    const specimens = await prisma.specimen.findMany({
      include: { attempts: true },
      orderBy: { id: 'asc' }
    });
    const labs = await prisma.specimen.findMany({ select: { extrLab: true }, distinct: ['extrLab'] });
    const ops = await prisma.specimen.findMany({ select: { extrOperator: true }, distinct: ['extrOperator'] });
    const methods = await prisma.specimen.findMany({ select: { extrMethod: true }, distinct: ['extrMethod'] });

    return NextResponse.json({
      specimens,
      suggestions: {
        labs: labs.map(l => l.extrLab).filter(Boolean),
        operators: ops.map(o => o.extrOperator).filter(Boolean),
        methods: methods.map(m => m.extrMethod).filter(Boolean),
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === "READER") return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  const data = await request.json();
  const id = data?.id != null ? String(data.id).trim() : "";
  if (!id) {
    return NextResponse.json({ error: "ID пробы обязателен" }, { status: 400 });
  }
  const existing = await prisma.specimen.findUnique({ where: { id } });
  if (existing) {
    return NextResponse.json({ error: "Проба с таким ID уже есть в базе" }, { status: 409 });
  }
  try {
    const created = await prisma.specimen.create({ data });
    return NextResponse.json(created);
  } catch (e: unknown) {
    const code = typeof e === "object" && e !== null && "code" in e ? (e as { code?: string }).code : undefined;
    if (code === "P2002") {
      return NextResponse.json({ error: "Проба с таким ID уже есть в базе" }, { status: 409 });
    }
    throw e;
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === "READER") return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  const { ids, updateData, singleId, singleStatus, newAttempt } = await request.json();
  
  if (newAttempt) {
    await prisma.pcrAttempt.create({ data: newAttempt });
    return NextResponse.json({ success: true });
  }

  if (singleId && singleStatus !== undefined) {
    await prisma.specimen.update({ where: { id: singleId }, data: { itsStatus: singleStatus } });
    return NextResponse.json({ success: true });
  }

  await prisma.specimen.updateMany({ where: { id: { in: ids } }, data: updateData });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }
  const body = await request.json();
  if (body.ids && Array.isArray(body.ids)) {
    await prisma.specimen.deleteMany({ where: { id: { in: body.ids } } });
  }
  return NextResponse.json({ success: true });
}