import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createDocumentWithEmbeddings } from '@/lib/rag';

export async function GET() {
  try {
    const user = await requireUser();
    const documents = await prisma.knowledgeDocument.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, fileName: true, mimeType: true, createdAt: true, _count: { select: { chunks: true } } }
    });
    return NextResponse.json({ documents });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao listar documentos.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw new Error('Envie um arquivo TXT, CSV, MD ou PDF.');

    const buffer = Buffer.from(await file.arrayBuffer());
    let content = '';
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      content = (await pdf(buffer)).text;
    } else {
      content = buffer.toString('utf-8');
    }

    if (content.trim().length < 20) throw new Error('Documento sem conteúdo suficiente para indexação.');
    const document = await createDocumentWithEmbeddings(user.id, file.name, file.type || 'text/plain', content);
    return NextResponse.json({ document: { id: document.id, fileName: document.fileName, chunks: document.chunks.length } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar documento.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
