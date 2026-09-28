import type { MarketUniverseAsset } from '../domain/market-universe.repository';

const TICKER_PATTERN = /^[A-Z][A-Z0-9.-]{0,14}$/;

export function parseIsharesHoldings(csv: string): MarketUniverseAsset[] {
  const rows = parseCsv(csv.replace(/^\uFEFF/, ''));
  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => cell.trim().toLowerCase() === 'ticker'),
  );
  if (headerIndex < 0) throw new Error('Cabeçalho de tickers não encontrado.');

  const headers = rows[headerIndex].map((header) =>
    header.trim().toLowerCase(),
  );
  const tickerIndex = headers.indexOf('ticker');
  const nameIndex = headers.indexOf('name');
  const assetClassIndex = headers.indexOf('asset class');
  if (tickerIndex < 0 || nameIndex < 0 || assetClassIndex < 0) {
    throw new Error('Colunas necessárias ausentes na lista de ativos.');
  }

  const assets = rows
    .slice(headerIndex + 1)
    .filter((row) => row[assetClassIndex]?.trim().toLowerCase() === 'equity')
    .map((row) => ({
      label: row[nameIndex]?.trim() ?? '',
      value: row[tickerIndex]?.trim().toUpperCase() ?? '',
    }))
    .filter(
      (asset) =>
        asset.label.length > 0 &&
        asset.value.length > 0 &&
        asset.value !== '--' &&
        TICKER_PATTERN.test(asset.value),
    );

  return [...new Map(assets.map((asset) => [asset.value, asset])).values()];
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (character === '"') {
      if (quoted && csv[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && csv[index + 1] === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value.trim().length > 0)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.trim().length > 0)) rows.push(row);
  }
  return rows;
}
