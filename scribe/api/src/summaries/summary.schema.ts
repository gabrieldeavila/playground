import { z } from 'zod';

export const SummarySchema = z.object({
  overview: z
    .string()
    .describe('Visão geral do conteúdo em 2 a 4 frases, em um parágrafo.'),
  keyPoints: z
    .array(z.string())
    .describe('De 3 a 7 pontos principais, uma frase curta cada.'),
  nextSteps: z
    .array(z.string())
    .describe(
      'Tarefas, decisões ou combinados citados explicitamente. Vazio se não houver.',
    ),
});

export type Summary = z.infer<typeof SummarySchema>;
