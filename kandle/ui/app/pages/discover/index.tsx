import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { FiArrowLeft, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";

import { Button } from "@/ui/components/primitives/button";
import { MarketDataInterval } from "@/types/enum/market-data-interval.enum";
import type { TickerSuggestion } from "@/types/interface/ticker-suggestion.interface";
import { readTicketWorkspaceStorage } from "@/app/components/TicketWorkspace/features/ticketWorkspaceStorage";
import {
  readWatchlistAssets,
  writeWatchlistAssets,
} from "../watchlist/watchlistStorage";
import { DEFAULT_OPPORTUNITY_CRITERIA } from "../opportunities/opportunities";
import { useStockDiscovery } from "./useStockDiscovery";
import {
  clearSavedDiscovery,
  readDiscoverFilters,
  writeDiscoverFilters,
  type DiscoveryMarket,
} from "./discoverStorage";

const EMA_PERIODS = [9, 20, 50, 100, 200] as const;
const formatPrice = (value: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(date);
};

export default function DiscoverStocksPage() {
  const [market, setMarket] = useState<DiscoveryMarket>("russell-2000");
  const [limit, setLimit] = useState(25);
  const [dropLookback, setDropLookback] = useState("26");
  const [minimumDrawdown, setMinimumDrawdown] = useState("10");
  const [interval, setInterval] = useState<
    typeof MarketDataInterval.Daily | typeof MarketDataInterval.Weekly
  >(MarketDataInterval.Weekly);
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [watchlist, setWatchlist] = useState<TickerSuggestion[]>([]);
  const [selectedEmaPeriods] = useState<number[]>(
    () => readTicketWorkspaceStorage()?.selectedEmaPeriods ?? [50],
  );
  const [isWatchlistReady, setIsWatchlistReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [filtersReady, setFiltersReady] = useState(false);
  const { state, scan, clear } = useStockDiscovery();

  useEffect(() => {
    const saved = readDiscoverFilters();
    if (saved) {
      setMarket(saved.market);
      setLimit(saved.limit);
      setDropLookback(saved.dropLookback);
      setMinimumDrawdown(saved.minimumDrawdown);
      setInterval(saved.interval);
      setCompanyName(saved.companyName);
      setSector(saved.sector);
      setBusinessType(saved.businessType);
      setMinimumPrice(saved.minimumPrice);
      setMaximumPrice(saved.maximumPrice);
    }
    setFiltersReady(true);
  }, []);

  useEffect(() => {
    if (!filtersReady) return;
    writeDiscoverFilters({
      market,
      limit,
      dropLookback,
      minimumDrawdown,
      interval,
      companyName,
      sector,
      businessType,
      minimumPrice,
      maximumPrice,
    });
  }, [
    filtersReady,
    market,
    limit,
    dropLookback,
    minimumDrawdown,
    interval,
    companyName,
    sector,
    businessType,
    minimumPrice,
    maximumPrice,
  ]);

  const matchingResults = useMemo(() => {
    const minimum = minimumPrice === "" ? null : Number(minimumPrice);
    const maximum = maximumPrice === "" ? null : Number(maximumPrice);
    const normalizedBusinessType = businessType.trim().toLocaleLowerCase("pt-BR");
    return state.results
      .filter((entry) => {
        const opportunity = entry.opportunity;
        if (
          entry.status !== "success" ||
          !opportunity ||
          opportunity.drawdownPercent <
            (state.minimumDrawdownPercent ?? DEFAULT_OPPORTUNITY_CRITERIA.minimumDrawdownPercent) ||
          !opportunity.hasCurrentSelectedEmaPattern
        )
          return false;
        const price = opportunity.close;
        return (
          (minimum === null || price >= minimum) &&
          (maximum === null || price <= maximum) &&
          (!sector || entry.sector === sector) &&
          (!normalizedBusinessType ||
            entry.industry?.toLocaleLowerCase("pt-BR").includes(normalizedBusinessType))
        );
      })
      .slice(0, state.limit ?? Number.POSITIVE_INFINITY);
  }, [
    businessType,
    maximumPrice,
    minimumPrice,
    sector,
    selectedEmaPeriods,
    state.minimumDrawdownPercent,
    state.results,
  ]);

  const clearResults = () => {
    clearSavedDiscovery();
    clear();
  };

  const addToWatchlist = (asset: TickerSuggestion) => {
    const existing = isWatchlistReady ? watchlist : readWatchlistAssets();
    const alreadyAdded = existing.some(
      ({ value }) => value.toUpperCase() === asset.value.toUpperCase(),
    );
    if (alreadyAdded) return;
    const next = [...existing, asset];
    setWatchlist(next);
    setIsWatchlistReady(true);
    setStorageError(!writeWatchlistAssets(next));
  };

  const isAdded = (ticker: string) =>
    (isWatchlistReady ? watchlist : readWatchlistAssets()).some(
      (asset) => asset.value.toUpperCase() === ticker.toUpperCase(),
    );
  const scanning =
    state.status === "loading-universe" || state.status === "scanning";
  const validPriceRange =
    (minimumPrice === "" ||
      (Number.isFinite(Number(minimumPrice)) && Number(minimumPrice) >= 0)) &&
    (maximumPrice === "" ||
      (Number.isFinite(Number(maximumPrice)) && Number(maximumPrice) >= 0)) &&
    (minimumPrice === "" ||
      maximumPrice === "" ||
      Number(minimumPrice) <= Number(maximumPrice));
  const parsedDropLookback = Number(dropLookback);
  const validDropLookback =
    Number.isInteger(parsedDropLookback) &&
    parsedDropLookback >= 1 &&
    parsedDropLookback <= 250;
  const parsedMinimumDrawdown = Number(minimumDrawdown);
  const validMinimumDrawdown =
    Number.isInteger(parsedMinimumDrawdown) &&
    parsedMinimumDrawdown >= 1 &&
    parsedMinimumDrawdown <= 99;

  return (
    <main className="min-h-[100dvh] bg-bg px-4 py-6 text-text sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Kandle · descoberta
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Buscar ações
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
              Exiba ações cujo fechamento mais recente esteja pelo menos o
              percentual de queda definido abaixo da maior máxima no período
              analisado e cujas EMAs selecionadas estejam alinhadas e
              ascendentes. Esses critérios são apenas filtros de pesquisa, não
              sinais de compra.
            </p>
          </div>
          <nav
            aria-label="Navegação da busca"
            className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium"
          >
            <Link
              className="inline-flex items-center gap-2 text-primary hover:underline"
              to="/"
            >
              <FiArrowLeft aria-hidden="true" /> Voltar ao gráfico
            </Link>
            <Link className="text-primary hover:underline" to="/watchlist">
              Minha watchlist
            </Link>
            <Link className="text-primary hover:underline" to="/opportunities">
              Oportunidades
            </Link>
          </nav>
        </header>

        <section
          aria-labelledby="search-filters-heading"
          className="mb-8 rounded-(--radius-lg) border border-border bg-bg-elevated p-4 sm:p-5"
        >
          <h2 id="search-filters-heading" className="mb-4 font-semibold">
            Filtros da busca
          </h2>
          <form
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!validPriceRange || !validDropLookback || !validMinimumDrawdown || scanning) return;
              void scan({
                market,
                limit,
                companyName,
                interval,
                recentHighLookback: parsedDropLookback,
                minimumDrawdownPercent: parsedMinimumDrawdown,
                selectedEmaPeriods,
                sector,
                businessType,
                minimumPrice,
                maximumPrice,
              });
            }}
          >
            <p className="text-sm text-text-muted sm:col-span-2 lg:col-span-3">
              O padrão exige ao menos duas EMAs selecionadas no gráfico principal: as rápidas acima das lentas e todas ascendentes. Selecionadas: {selectedEmaPeriods.length > 0 ? selectedEmaPeriods.map((period) => `EMA ${period}`).join(", ") : "nenhuma"}.{" "}
              <Link className="text-primary hover:underline" to="/">
                Ajustar no gráfico
              </Link>
            </p>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Mercado / universo</span>
              <select
                className="min-h-10 rounded-(--radius-md) border border-border bg-bg px-3 text-text"
                disabled={scanning}
                onChange={(event) =>
                  setMarket(event.target.value as DiscoveryMarket)
                }
                value={market}
              >
                <option value="russell-2000">
                  Russell 2000 · referência iShares IWM
                </option>
                <option value="sp-500">S&amp;P 500 · referência iShares IVV</option>
              </select>
              <span className="text-xs text-text-muted">
                Escolha o universo que será analisado; a busca e os resultados ficam separados por mercado.
              </span>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Período dos candles</span>
              <select
                className="min-h-10 rounded-(--radius-md) border border-border bg-bg px-3 text-text"
                disabled={scanning}
                onChange={(event) =>
                  setInterval(
                    event.target.value as
                      | typeof MarketDataInterval.Daily
                      | typeof MarketDataInterval.Weekly,
                  )
                }
                value={interval}
              >
                <option value={MarketDataInterval.Weekly}>Semanal</option>
                <option value={MarketDataInterval.Daily}>Diário</option>
              </select>
              <span className="text-xs text-text-muted">
                Diário para movimentos recentes; semanal para uma visão de longo prazo.
              </span>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Quantidade desde a última queda (candles)</span>
              <input
                className="min-h-10 rounded-(--radius-md) border border-border bg-bg px-3 text-text"
                disabled={scanning}
                max="250"
                min="1"
                onChange={(event) => setDropLookback(event.target.value)}
                type="number"
                value={dropLookback}
              />
              <span className="text-xs text-text-muted">
                Define quantos candles diários ou semanais entram no período: compara o fechamento mais recente com a maior máxima dessa janela. Padrão: 26 (máximo: 250).
              </span>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Queda mínima desde a máxima (%)</span>
              <input
                className="min-h-10 rounded-(--radius-md) border border-border bg-bg px-3 text-text"
                disabled={scanning}
                max="99"
                min="1"
                onChange={(event) => setMinimumDrawdown(event.target.value)}
                step="1"
                type="number"
                value={minimumDrawdown}
              />
              <span className="text-xs text-text-muted">
                Mostra somente ações que caíram pelo menos esse percentual. Ex.: 20% ou 30%.
              </span>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Resultados a encontrar</span>
              <select
                className="min-h-10 rounded-(--radius-md) border border-border bg-bg px-3 text-text"
                disabled={scanning}
                onChange={(event) => setLimit(Number(event.target.value))}
                value={limit}
              >
                {[10, 25, 50].map((value) => (
                  <option key={value} value={value}>
                    {value} ações
                  </option>
                ))}
              </select>
              <span className="text-xs text-text-muted">
                Meta de resultados; a busca continua no {market === "sp-500" ? "S&P 500" : "Russell 2000"} até encontrar essa quantidade ou esgotar as ações disponíveis. Consulta em lotes de até 3.
              </span>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Nome da empresa contém</span>
              <input
                className="min-h-10 rounded-(--radius-md) border border-border bg-bg px-3 text-text"
                disabled={scanning}
                maxLength={60}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Opcional"
                value={companyName}
              />
              <span className="text-xs text-text-muted">
                Complementado pelo perfil de empresa do Yahoo Finance; alguns ativos podem não ter esses dados.
              </span>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Setor</span>
              <select
                className="min-h-10 rounded-(--radius-md) border border-border bg-bg px-3 text-text"
                disabled={scanning}
                onChange={(event) => setSector(event.target.value)}
                value={sector}
              >
                <option value="">Todos os setores</option>
                {[
                  "Communication Services",
                  "Consumer Cyclical",
                  "Consumer Defensive",
                  "Energy",
                  "Financial Services",
                  "Healthcare",
                  "Industrials",
                  "Basic Materials",
                  "Real Estate",
                  "Technology",
                  "Utilities",
                ].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <span className="text-xs text-text-muted">
                A busca continua até encontrar resultados deste setor ou esgotar o universo.
              </span>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Tipo de negócio (ramo)</span>
              <input
                className="min-h-10 rounded-(--radius-md) border border-border bg-bg px-3 text-text"
                disabled={scanning}
                maxLength={60}
                onChange={(event) => setBusinessType(event.target.value)}
                placeholder="Ex.: software, bancos"
                value={businessType}
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="grid content-start gap-1 text-sm">
                <span className="font-medium">Preço mínimo</span>
                <input
                  aria-label="Preço mínimo"
                  className="min-h-10 w-full rounded-(--radius-md) border border-border bg-bg px-3 text-text"
                  disabled={scanning}
                  min="0"
                  onChange={(event) => setMinimumPrice(event.target.value)}
                  placeholder="Sem mínimo"
                  type="number"
                  value={minimumPrice}
                />
              </label>
              <label className="grid content-start gap-1 text-sm">
                <span className="font-medium">Preço máximo</span>
                <input
                  aria-label="Preço máximo"
                  className="min-h-10 w-full rounded-(--radius-md) border border-border bg-bg px-3 text-text"
                  disabled={scanning}
                  min="0"
                  onChange={(event) => setMaximumPrice(event.target.value)}
                  placeholder="Sem máximo"
                  type="number"
                  value={maximumPrice}
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-3">
              <Button
                disabled={scanning || !validPriceRange || !validDropLookback || !validMinimumDrawdown}
                leftIcon={<FiSearch />}
                type="submit"
              >
                {scanning ? "Buscando..." : "Buscar ações"}
              </Button>
              <Button
                disabled={state.status === "idle"}
                leftIcon={<FiTrash2 />}
                onClick={clearResults}
                type="button"
                variant="secondary"
              >
                Limpar resultados
              </Button>
              {!validPriceRange && (
                <p className="mt-2 text-sm text-danger" role="alert">
                  Informe uma faixa de preço válida.
                </p>
              )}
              {!validDropLookback && (
                <p className="mt-2 text-sm text-danger" role="alert">
                  Informe um número inteiro de candles entre 1 e 250.
                </p>
              )}
              {!validMinimumDrawdown && (
                <p className="mt-2 text-sm text-danger" role="alert">
                  Informe uma queda mínima inteira entre 1% e 99%.
                </p>
              )}
            </div>
          </form>
        </section>

        {state.status === "loading-universe" && (
          <p className="py-6 text-center text-sm text-text-muted" role="status">
            Carregando a lista do mercado...
          </p>
        )}
        {state.status === "scanning" && (
          <div
            className="mb-5 rounded-(--radius-md) border border-border bg-bg-elevated p-4"
            role="status"
          >
            <p className="font-medium">
              Analisadas {state.completed} de até {state.total} candidatas · {matchingResults.length} de {state.limit} resultados encontrados
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${state.limit ? Math.min(100, (matchingResults.length / state.limit) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-text-muted">
              Usamos candles {state.interval === MarketDataInterval.Daily ? "diários" : "semanais"} confirmados, analisamos a queda nos últimos {state.recentHighLookback} candles e exigimos uma queda mínima de {state.minimumDrawdownPercent}%. A consulta pode levar alguns minutos.
            </p>
          </div>
        )}
        {state.status === "error" && (
          <p
            className="mb-5 rounded-(--radius-md) border border-danger/30 bg-bg-elevated p-4 text-sm text-danger"
            role="alert"
          >
            {state.message}
          </p>
        )}

        {(state.status === "complete" || state.status === "scanning") && (
          <section aria-labelledby="discovery-results-heading">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2
                  id="discovery-results-heading"
                  className="text-lg font-semibold"
                >
                  Ações que atendem aos critérios{" "}
                  <span className="text-sm font-normal text-text-muted">
                    ({matchingResults.length})
                  </span>
                </h2>
                {state.source && (
                  <p className="mt-1 text-xs text-text-muted">
                    Fonte: {state.source}. Lista atualizada em{" "}
                    {formatDate(state.updatedAt)}. Análise com candles{" "}
                    {state.interval === MarketDataInterval.Daily
                      ? "diários"
                      : "semanais"}.
                  </p>
                )}
              </div>
              {state.total > 0 && (
                <p className="text-sm text-text-muted">
                  {state.completed} / {state.total} analisadas
                </p>
              )}
            </div>
            {state.status === "complete" &&
              state.total > 0 &&
              matchingResults.length < (state.limit ?? 0) && (
                <p className="mb-4 text-sm text-text-muted" role="status">
                  Busca concluída: encontramos {matchingResults.length} de{" "}
                  {state.limit} resultados solicitados após analisar as candidatas disponíveis.
                </p>
              )}
            {matchingResults.length === 0 ? (
              <div className="rounded-(--radius-lg) border border-dashed border-border-strong px-6 py-12 text-center">
                <p className="font-medium">
                  {state.status === "scanning"
                    ? "Ainda não encontramos ações que atendam aos critérios"
                    : "Nenhuma ação encontrada com esses critérios"}
                </p>
                <p className="mt-2 text-sm text-text-muted">
                  É necessário haver uma queda mínima de {state.minimumDrawdownPercent ?? DEFAULT_OPPORTUNITY_CRITERIA.minimumDrawdownPercent}% em relação à maior máxima do período e o padrão ascendente das EMAs selecionadas. Tente ajustar os filtros.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border rounded-(--radius-lg) border border-border bg-bg-elevated">
                {matchingResults.map(({ asset, opportunity, sector, industry }) => (
                  <li
                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                    key={asset.value}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {asset.value}
                        <span className="ml-2 text-sm font-normal text-text-muted">
                          {asset.label}
                        </span>
                      </p>
                      {(sector || industry) && (
                        <p className="mt-1 text-xs text-text-muted">
                          {[sector, industry].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-text-muted">
                        Queda de {opportunity?.drawdownPercent
                          .toFixed(1)
                          .replace(".", ",")}% desde a maior máxima do período · padrão ascendente: EMAs {selectedEmaPeriods.join(", ")} · último fechamento {formatPrice(opportunity?.close ?? 0)}
                      </p>
                    </div>
                    <Button
                      disabled={isAdded(asset.value)}
                      leftIcon={<FiPlus />}
                      onClick={() => addToWatchlist(asset)}
                      size="sm"
                      variant="secondary"
                    >
                      {isAdded(asset.value)
                        ? "Na watchlist"
                        : "Adicionar à watchlist"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {state.status === "complete" &&
              state.results.some((result) => result.status === "error") && (
                <p className="mt-3 text-sm text-warning">
                  Algumas ações não puderam ser analisadas; as demais foram
                  processadas normalmente.
                </p>
              )}
            {storageError && (
              <p className="mt-3 text-sm text-danger" role="alert">
                Não foi possível salvar a alteração na watchlist local.
              </p>
            )}
          </section>
        )}

        {state.status === "idle" && (
          <p className="rounded-(--radius-lg) border border-dashed border-border-strong px-6 py-12 text-center text-sm text-text-muted">
            Escolha os filtros e inicie uma busca. Nenhum candle será consultado
            até você solicitar.
          </p>
        )}
      </div>
    </main>
  );
}
