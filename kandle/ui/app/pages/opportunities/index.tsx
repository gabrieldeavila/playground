import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  FiArrowLeft,
  FiBarChart2,
  FiChevronDown,
  FiPlay,
  FiPlus,
  FiRefreshCw,
} from "react-icons/fi";

import { Button } from "@/ui/components/primitives/button";
import { MarketDataInterval } from "@/types/enum/market-data-interval.enum";
import { readTicketWorkspaceStorage } from "@/app/components/TicketWorkspace/features/ticketWorkspaceStorage";
import type { TickerSuggestion } from "@/types/interface/ticker-suggestion.interface";
import {
  readWatchlistAssets,
  writeWatchlistAssets,
} from "../watchlist/watchlistStorage";
import {
  DEFAULT_OPPORTUNITY_CRITERIA,
  type OpportunityCriteria,
  type OpportunityKind,
} from "./opportunities";
import {
  readOpportunitiesPreferences,
  writeOpportunitiesPreferences,
} from "./opportunitiesStorage";
import {
  getOpportunityStateKey,
  useHistoricalOpportunityValidation,
  useOpportunities,
} from "./useOpportunities";

const STATUS: Record<
  OpportunityKind,
  { label: string; detail: string; color: string }
> = {
  falling: {
    label: "Em queda",
    detail: "Queda de pelo menos 10% desde a máxima recente, mínimas inferiores e EMA 9 descendente no período selecionado.",
    color: "text-danger",
  },
  stabilizing: {
    label: "Estabilizando",
    detail: "Queda de pelo menos 10% desde a máxima recente, com as mínimas deixando de cair no período selecionado.",
    color: "text-warning",
  },
  "possible-reversal": {
    label: "Possível reversão",
    detail:
      "Após queda de pelo menos 10%, fechamento acima das máximas dos 4 períodos anteriores e EMA 9 ascendente.",
    color: "text-success",
  },
  "no-setup": {
    label: "Sem setup identificado",
    detail: "Os critérios objetivos de queda, estabilização ou possível reversão não foram satisfeitos.",
    color: "text-text-muted",
  },
};

const STATUS_ORDER: OpportunityKind[] = [
  "falling",
  "stabilizing",
  "possible-reversal",
  "no-setup",
];

const formatDate = (value: string | number) => {
  const date =
    typeof value === "number"
      ? new Date(value > 10_000_000_000 ? value : value * 1000)
      : /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00Z`)
        : new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(value);

const formatPercent = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value)
    ? `${value.toFixed(1).replace(".", ",")}%`
    : "—";

const getUtcToday = () => new Date().toISOString().slice(0, 10);
const getDefaultBacktestStart = () => {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - 1);
  return date.toISOString().slice(0, 10);
};

export default function OpportunitiesPage() {
  const [assets, setAssets] = useState<TickerSuggestion[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [selectedEmaPeriods, setSelectedEmaPeriods] = useState<number[]>([50]);
  const [interval, setInterval] = useState<
    typeof MarketDataInterval.Daily | typeof MarketDataInterval.Weekly
  >(MarketDataInterval.Weekly);
  const { states, retry } = useOpportunities(
    assets,
    isReady,
    interval,
    selectedEmaPeriods,
  );
  const [backtestTicker, setBacktestTicker] = useState("");
  const [backtestFrom, setBacktestFrom] = useState(getDefaultBacktestStart);
  const [backtestTo, setBacktestTo] = useState(getUtcToday);
  const [criteria, setCriteria] = useState<OpportunityCriteria>(
    DEFAULT_OPPORTUNITY_CRITERIA,
  );
  const { state: backtestState, validate: runBacktest } =
    useHistoricalOpportunityValidation(interval);
  const today = getUtcToday();
  const validBacktestRange =
    backtestFrom.length === 10 &&
    backtestTo.length === 10 &&
    backtestFrom <= backtestTo &&
    backtestTo <= today;
  const periodLabel =
    interval === MarketDataInterval.Daily ? "diários" : "semanais";

  useEffect(() => {
    const storedAssets = readWatchlistAssets();
    const workspacePreferences = readTicketWorkspaceStorage();
    const opportunityPreferences = readOpportunitiesPreferences();
    setSelectedEmaPeriods(workspacePreferences?.selectedEmaPeriods ?? [50]);
    setAssets(storedAssets);
    setInterval(opportunityPreferences.interval ?? MarketDataInterval.Weekly);
    setBacktestTicker(
      storedAssets.some(
        ({ value }) => value.toUpperCase() === opportunityPreferences.backtestTicker,
      )
        ? opportunityPreferences.backtestTicker ?? ""
        : storedAssets[0]?.value ?? "",
    );
    setBacktestFrom(opportunityPreferences.backtestFrom ?? getDefaultBacktestStart());
    setBacktestTo(opportunityPreferences.backtestTo ?? getUtcToday());
    setCriteria(opportunityPreferences.criteria ?? DEFAULT_OPPORTUNITY_CRITERIA);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    writeOpportunitiesPreferences({
      interval,
      backtestTicker,
      backtestFrom,
      backtestTo,
      criteria,
    });
  }, [isReady, interval, backtestTicker, backtestFrom, backtestTo, criteria]);

  const addToWatchlist = (asset: TickerSuggestion) => {
    const storedAssets = readWatchlistAssets();
    if (storedAssets.some(({ value }) => value === asset.value)) return;
    const nextAssets = [...storedAssets, asset];
    setAssets(nextAssets);
    setStorageError(!writeWatchlistAssets(nextAssets));
  };

  const counts = useMemo(() => {
    const result = Object.fromEntries(
      STATUS_ORDER.map((kind) => [kind, 0]),
    ) as Record<OpportunityKind, number>;
    assets.forEach(({ value }) => {
      const state = states[
        getOpportunityStateKey(value, interval, selectedEmaPeriods)
      ];
      if (state?.status === "success" && state.result) {
        result[state.result.kind] += 1;
      }
    });
    return result;
  }, [assets, interval, selectedEmaPeriods, states]);

  return (
    <main className="min-h-[100dvh] bg-bg px-4 py-6 text-text sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Kandle · análise técnica
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Oportunidades
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
              Acompanhe possíveis mudanças de comportamento nos ativos da sua
              watchlist. A análise usa apenas candles {periodLabel} confirmados.
            </p>
          </div>
          <nav
            aria-label="Navegação de oportunidades"
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
            <Link className="text-primary hover:underline" to="/discover">
              Buscar ações
            </Link>
          </nav>
        </header>

        <section
          aria-labelledby="analysis-period-heading"
          className="mb-6 rounded-(--radius-lg) border border-border bg-bg-elevated p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="analysis-period-heading" className="font-semibold">
                Escolher período de análise
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Períodos ainda em andamento são excluídos da análise.
              </p>
            </div>
            <div className="flex gap-2" role="group" aria-label="Período de análise">
              {[
                { value: MarketDataInterval.Daily as const, label: "Diário" },
                { value: MarketDataInterval.Weekly as const, label: "Semanal" },
              ].map((option) => (
                <Button
                  key={option.value}
                  aria-pressed={interval === option.value}
                  onClick={() => setInterval(option.value)}
                  size="sm"
                  variant={interval === option.value ? "outline" : "secondary"}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        <details
          aria-labelledby="historical-validation-heading"
          className="group mb-8 rounded-(--radius-lg) border border-border bg-bg-elevated p-4 sm:p-5"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold marker:hidden">
            <span id="historical-validation-heading" role="heading" aria-level={2}>
              Validar com histórico
            </span>
            <FiChevronDown
              aria-hidden="true"
              className="shrink-0 transition-transform group-open:rotate-180"
            />
          </summary>
          <p className="mb-4 max-w-3xl text-sm leading-6 text-text-muted">
            Reproduza a classificação em candles passados e ajuste os critérios. Em cada data, o algoritmo usa somente candles até aquele fechamento; nenhum dado posterior entra no cálculo.
          </p>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (validBacktestRange && backtestTicker) {
                void runBacktest(backtestTicker, backtestFrom, backtestTo, criteria);
              }
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Ativo da watchlist</span>
                <select
                  className="min-h-10 rounded-(--radius-md) border border-border bg-bg px-3 text-text"
                  value={backtestTicker}
                  onChange={(event) => setBacktestTicker(event.target.value)}
                  disabled={assets.length === 0}
                >
                  {assets.length === 0 ? (
                    <option value="">Adicione um ativo à watchlist</option>
                  ) : (
                    assets.map((asset) => (
                      <option key={asset.value} value={asset.value}>
                        {asset.value} · {asset.label}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Data inicial</span>
                <input
                  className="min-h-10 rounded-(--radius-md) border border-border bg-bg px-3 text-text"
                  type="date"
                  max={today}
                  value={backtestFrom}
                  onChange={(event) => setBacktestFrom(event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Data final</span>
                <input
                  className="min-h-10 rounded-(--radius-md) border border-border bg-bg px-3 text-text"
                  type="date"
                  min={backtestFrom}
                  max={today}
                  value={backtestTo}
                  onChange={(event) => setBacktestTo(event.target.value)}
                />
              </label>
              <div className="grid gap-1 text-sm">
                <span className="font-medium">Período dos candles</span>
                <p className="flex min-h-10 items-center rounded-(--radius-md) border border-border bg-bg px-3">
                  {interval === MarketDataInterval.Daily ? "Diário" : "Semanal"}
                </p>
              </div>
            </div>

            <fieldset className="grid gap-3 rounded-(--radius-md) border border-border p-3 sm:grid-cols-3">
              <legend className="px-1 text-sm font-medium">Ajustar critérios</legend>
              <label className="grid gap-1 text-sm">
                <span className="text-text-muted">Queda mínima (%)</span>
                <input
                  className="min-h-10 rounded-(--radius-md) border border-border bg-bg px-3 text-text"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={criteria.minimumDrawdownPercent}
                  onChange={(event) =>
                    setCriteria((current) => ({
                      ...current,
                      minimumDrawdownPercent: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-text-muted">Janela da máxima (candles)</span>
                <input
                  className="min-h-10 rounded-(--radius-md) border border-border bg-bg px-3 text-text"
                  type="number"
                  min="1"
                  max="500"
                  step="1"
                  value={criteria.recentHighLookback}
                  onChange={(event) =>
                    setCriteria((current) => ({
                      ...current,
                      recentHighLookback: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-text-muted">Inclinação EMA 9 (candles)</span>
                <input
                  className="min-h-10 rounded-(--radius-md) border border-border bg-bg px-3 text-text"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={criteria.emaSlopeLookback}
                  onChange={(event) =>
                    setCriteria((current) => ({
                      ...current,
                      emaSlopeLookback: Number(event.target.value),
                    }))
                  }
                />
              </label>
            </fieldset>

            {!validBacktestRange && (
              <p className="text-sm text-danger" role="alert">
                Informe um intervalo válido entre duas datas passadas.
              </p>
            )}
            <Button
              disabled={!validBacktestRange || !backtestTicker || backtestState.status === "loading"}
              leftIcon={<FiPlay />}
              type="submit"
              variant="outline"
            >
              {backtestState.status === "loading" ? "Validando..." : "Executar validação"}
            </Button>
          </form>

          {backtestState.status === "error" && (
            <p className="mt-4 text-sm text-danger" role="alert">
              {backtestState.message}
            </p>
          )}
          {backtestState.status === "success" && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-sm text-text-muted">
                {backtestState.result.evaluatedCandles} candles avaliados · {backtestState.result.events.length} entradas em estados identificadas para {backtestTicker}.
              </p>
              {backtestState.result.evaluatedCandles === 0 ? (
                <p className="mt-3 text-sm text-warning">
                  Não há candles suficientes nesse intervalo para avaliar o algoritmo. Escolha um período posterior ou candles semanais.
                </p>
              ) : (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {STATUS_ORDER.map((kind) => (
                      <div key={kind} className="rounded-(--radius-md) border border-border p-3">
                        <p className={`text-xs font-medium ${STATUS[kind].color}`}>{STATUS[kind].label}</p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">{backtestState.result.counts[kind]}</p>
                        <p className="text-xs text-text-muted">candles no estado</p>
                      </div>
                    ))}
                  </div>
                  <h3 className="mt-5 font-medium">Entradas em estados identificadas</h3>
                  {backtestState.result.events.length === 0 ? (
                    <p className="mt-2 text-sm text-text-muted">
                      Nenhuma entrada em queda, estabilização ou possível reversão foi encontrada com estes critérios.
                    </p>
                  ) : (
                    <div className="mt-2 overflow-x-auto rounded-(--radius-md) border border-border">
                      <table className="w-full min-w-[36rem] text-left text-sm">
                        <thead className="bg-bg/60 text-xs text-text-muted">
                          <tr>
                            <th className="px-3 py-2 font-medium">Data do sinal</th>
                            <th className="px-3 py-2 font-medium">Classificação</th>
                            <th className="px-3 py-2 font-medium">Queda desde máxima</th>
                            <th className="px-3 py-2 font-medium">Fechamento</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {backtestState.result.events.map((event, index) => (
                            <tr key={`${event.time}-${event.kind}-${index}`}>
                              <td className="px-3 py-2 tabular-nums">{formatDate(event.time)}</td>
                              <td className={`px-3 py-2 font-medium ${STATUS[event.kind].color}`}>{STATUS[event.kind].label}</td>
                              <td className="px-3 py-2 tabular-nums">−{formatPercent(event.drawdownPercent)}</td>
                              <td className="px-3 py-2 tabular-nums">{formatPrice(event.close)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </details>

        <section
          aria-label="Estados identificados"
          className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {STATUS_ORDER.map((kind) => (
            <article
              key={kind}
              className="rounded-(--radius-lg) border border-border bg-bg-elevated p-4"
            >
              <p className={`text-sm font-semibold ${STATUS[kind].color}`}>
                {STATUS[kind].label}
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {isReady ? counts[kind] : "—"}
              </p>
              <p className="mt-2 text-xs leading-5 text-text-muted">
                {STATUS[kind].detail}
              </p>
            </article>
          ))}
        </section>

        <section aria-label="Ativos analisados">
          <h2 className="mb-3 text-lg font-semibold">
            Ativos analisados{" "}
            <span className="text-sm font-normal text-text-muted">
              ({assets.length})
            </span>
          </h2>
          {!isReady ? (
            <p
              className="py-8 text-center text-sm text-text-muted"
              role="status"
            >
              Carregando watchlist...
            </p>
          ) : assets.length === 0 ? (
            <div className="rounded-(--radius-lg) border border-dashed border-border-strong px-6 py-14 text-center">
              <p className="font-medium">Sua watchlist está vazia</p>
              <p className="mt-2 text-sm text-text-muted">
                Adicione ativos à watchlist para começar a análise.
              </p>
              <Link
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                to="/watchlist"
              >
                Ir para minha watchlist
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-(--radius-lg) border border-border bg-bg-elevated">
              {assets.map((asset) => {
                const state = states[
                  getOpportunityStateKey(
                    asset.value,
                    interval,
                    selectedEmaPeriods,
                  )
                ];
                const kind =
                  state?.status === "success" ? state.result?.kind ?? null : null;
                const isInWatchlist = assets.some(
                  ({ value }) => value.toUpperCase() === asset.value.toUpperCase(),
                );
                const result = state?.status === "success" ? state.result : null;
                return (
                  <li
                    key={asset.value}
                    className="space-y-4 px-4 py-4 sm:px-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{asset.value}</p>
                          {kind ? (
                            <span
                              className={`rounded-full border border-border px-3 py-1 text-xs font-medium ${STATUS[kind].color}`}
                            >
                              {STATUS[kind].label}
                            </span>
                          ) : state?.status === "success" ? (
                            <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted">
                              Dados insuficientes
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-text-muted">{asset.label}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button asChild leftIcon={<FiBarChart2 />} size="sm" variant="outline">
                          <Link to={`/?ticker=${encodeURIComponent(asset.value)}`}>
                            Abrir gráfico
                          </Link>
                        </Button>
                        {!isInWatchlist && (
                          <Button
                            leftIcon={<FiPlus />}
                            onClick={() => addToWatchlist(asset)}
                            size="sm"
                            variant="secondary"
                          >
                            Adicionar à watchlist
                          </Button>
                        )}
                        {state?.status === "error" && (
                          <Button
                            aria-label={`Tentar novamente para ${asset.value}`}
                            onClick={() => retry(asset.value)}
                            size="sm"
                            variant="ghost"
                          >
                            <FiRefreshCw aria-hidden="true" /> Tentar novamente
                          </Button>
                        )}
                      </div>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 rounded-(--radius-md) border border-border bg-bg/40 p-3 text-sm sm:grid-cols-4">
                      <div>
                        <dt className="text-xs text-text-muted">Classificação</dt>
                        <dd className="mt-1 font-medium">
                          {state?.status === "loading" || !state
                            ? "Analisando..."
                            : state.status === "error"
                              ? "Falha na análise"
                              : kind
                                ? STATUS[kind].label
                                : "Dados insuficientes"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-text-muted">Queda desde a máxima</dt>
                        <dd className="mt-1 font-medium tabular-nums">
                          {result && Number.isFinite(result.drawdownPercent)
                            ? `−${formatPercent(result.drawdownPercent)}`
                            : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-text-muted">Entrou no estado atual</dt>
                        <dd className="mt-1 font-medium tabular-nums">
                          {result ? formatDate(result.enteredAt) : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-text-muted">Período analisado</dt>
                        <dd className="mt-1 font-medium">
                          {interval === MarketDataInterval.Daily ? "Diário" : "Semanal"}
                        </dd>
                      </div>
                    </dl>

                    {state?.status === "success" && result && (
                      <div className="rounded-(--radius-md) border border-border bg-bg/40 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                          Última entrada COMPRA pelo critério do gráfico
                        </p>
                        {result.latestChartBuySignal ? (
                          <p className="mt-1 text-sm">
                            <span className="font-semibold text-success">
                              {formatDate(result.latestChartBuySignal.time)}
                            </span>
                            <span className="text-text-muted">
                              {" "}· fechamento {formatPrice(result.latestChartBuySignal.close)}
                            </span>
                          </p>
                        ) : selectedEmaPeriods.length < 2 ? (
                          <p className="mt-1 text-sm text-text-muted">
                            Habilite pelo menos duas EMAs no gráfico para identificar entradas COMPRA.
                          </p>
                        ) : result.hasEnoughChartBuySignalHistory ? (
                          <p className="mt-1 text-sm text-text-muted">
                            Nenhuma entrada COMPRA encontrada nos candles carregados para esta seleção de EMAs.
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-text-muted">
                            Histórico insuficiente para avaliar a EMA mais longa selecionada.
                          </p>
                        )}
                        <p className="mt-1 text-xs leading-5 text-text-muted">
                          Critério do gráfico usando {selectedEmaPeriods.map((period) => `EMA ${period}`).join(", ") || "nenhuma EMA"}; o sinal histórico não significa que a entrada ainda esteja ativa.
                        </p>
                      </div>
                    )}

                    {state?.status === "success" && result && (
                      <>
                        <p className="text-xs text-text-muted">
                          Último candle confirmado: {formatDate(result.time)} · Fechamento: {formatPrice(result.close)}
                        </p>
                        <details className="text-sm">
                          <summary className="cursor-pointer font-medium text-primary hover:underline">
                            Ver critérios da classificação
                          </summary>
                          <ul className="mt-2 space-y-2 pl-1">
                            {result.criteria.map((criterion) => (
                              <li
                                key={criterion.label}
                                className="flex items-start gap-2 text-xs leading-5"
                              >
                                <span
                                  className={
                                    criterion.met
                                      ? "font-semibold text-success"
                                      : "font-semibold text-text-muted"
                                  }
                                >
                                  {criterion.met ? "Atendido" : "Não atendido"}
                                </span>
                                <span className="text-text-muted">
                                  <span className="font-medium text-text">
                                    {criterion.label}:
                                  </span>{" "}
                                  {criterion.detail}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      </>
                    )}
                    {state?.status === "error" && (
                      <p className="text-sm text-danger" role="alert">
                        Falha ao carregar os candles.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {storageError && (
          <p className="mt-3 text-sm text-danger" role="status">
            Não foi possível salvar o ativo na watchlist deste navegador.
          </p>
        )}

        <p className="mt-5 text-xs leading-5 text-text-muted">
          Classificação heurística com EMA 9 em candles {periodLabel} encerrados.
          “Possível reversão” é um sinal preliminar, não uma recomendação de
          investimento. Dados consultados apenas para os ativos salvos na
          watchlist e mantidos em cache por até 6 horas.
        </p>
      </div>
    </main>
  );
}
