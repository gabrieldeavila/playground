import { summaryToBlocks } from './summary-blocks';

describe('summaryToBlocks', () => {
  it('lays out heading, overview and both lists', () => {
    expect(
      summaryToBlocks('Resumo: Reunião', {
        overview: 'Falamos do projeto.',
        keyPoints: ['Prazo em maio'],
        nextSteps: ['Enviar proposta'],
      }),
    ).toEqual([
      { text: 'Resumo: Reunião', style: 'HEADING_2' },
      { text: 'Falamos do projeto.', style: 'NORMAL_TEXT' },
      { text: 'Pontos principais', style: 'HEADING_3' },
      { text: 'Prazo em maio', style: 'NORMAL_TEXT', bullet: true },
      { text: 'Próximos passos', style: 'HEADING_3' },
      { text: 'Enviar proposta', style: 'NORMAL_TEXT', bullet: true },
    ]);
  });

  it('flattens line breaks and drops empty items and sections', () => {
    expect(
      summaryToBlocks('Resumo', {
        overview: 'Linha um.\n\nLinha dois.',
        keyPoints: ['  ', 'Um\nponto'],
        nextSteps: [],
      }),
    ).toEqual([
      { text: 'Resumo', style: 'HEADING_2' },
      { text: 'Linha um. Linha dois.', style: 'NORMAL_TEXT' },
      { text: 'Pontos principais', style: 'HEADING_3' },
      { text: 'Um ponto', style: 'NORMAL_TEXT', bullet: true },
    ]);
  });
});
