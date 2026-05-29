import { prisma } from './prisma';
import { embedText } from './openai';

export function chunkText(content: string, size = 1200, overlap = 150) {
  const clean = content.replace(/\s+/g, ' ').trim();
  const chunks: string[] = [];
  for (let start = 0; start < clean.length; start += size - overlap) {
    chunks.push(clean.slice(start, start + size));
  }
  return chunks.filter(Boolean);
}

export async function createDocumentWithEmbeddings(userId: string, fileName: string, mimeType: string, content: string) {
  const chunks = chunkText(content);
  return prisma.knowledgeDocument.create({
    data: {
      userId,
      fileName,
      mimeType,
      content,
      chunks: {
        create: await Promise.all(
          chunks.map(async (chunk) => ({
            content: chunk,
            embedding: JSON.stringify(await embedText(chunk))
          }))
        )
      }
    },
    include: { chunks: true }
  });
}

export async function retrieveContext(userId: string, query: string, take = 5) {
  const queryVector = await embedText(query);
  const chunks = await prisma.knowledgeChunk.findMany({
    where: { document: { userId } },
    include: { document: true },
    orderBy: { createdAt: 'desc' },
    take: 200
  });

  return chunks
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryVector, JSON.parse(chunk.embedding) as number[])
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, take)
    .map(({ chunk, score }) => `Fonte: ${chunk.document.fileName} | score ${score.toFixed(3)}\n${chunk.content}`)
    .join('\n\n---\n\n');
}

function cosineSimilarity(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / ((Math.sqrt(normA) || 1) * (Math.sqrt(normB) || 1));
}
