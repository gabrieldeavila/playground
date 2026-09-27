import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { FiArrowLeft, FiPlus, FiTrash2 } from "react-icons/fi";

import { Button } from "@/ui/components/primitives/button";
import { Input } from "@/ui/components/primitives/input";
import type { TickerSuggestion } from "@/types/interface/ticker-suggestion.interface";
import { useTickerSuggestions } from "@/app/components/TicketWorkspace/features/useTickerSuggestions";
import { MarketDataInterval } from "@/types/enum/market-data-interval.enum";
import { readWatchlistAssets, writeWatchlistAssets } from "./watchlistStorage";
import {
  getDaysSince,
  getSignalDate,
  type WatchlistInterval,
} from "./watchlist";
import { useWatchlistSignals } from "./useWatchlistSignals";

const formatSignalDate = (time: string | number) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(getSignalDate(time));

export default function WatchlistPage() {
  const [assets, setAssets] = useState<TickerSuggestion[]>([]);
  const [interval, setInterval] = useState<WatchlistInterval>(
    MarketDataInterval.Weekly,
  );
  const [tickerInput, setTickerInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { suggestions, isLoading } = useTickerSuggestions(tickerInput, isReady);
  const { signals, retry: retrySignal } = useWatchlistSignals(
    assets,
    isReady,
    interval,
  );

  useEffect(() => {
    setAssets(readWatchlistAssets());
    setIsReady(true);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const addAsset = (asset: TickerSuggestion) => {
    const ticker = asset.value.trim().toUpperCase();
    if (assets.some((current) => current.value.toUpperCase() === ticker)) {
      setError(`${ticker} já está na sua lista.`);
      return;
    }

    const nextAssets = [
      ...assets,
      { label: asset.label.trim(), value: ticker },
    ];
    setAssets(nextAssets);
    setStorageError(!writeWatchlistAssets(nextAssets));
    setTickerInput("");
    setError(null);
    setIsSuggestionsOpen(false);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (suggestions.length > 0) {
      addAsset(suggestions[0]);
    } else if (!isLoading && tickerInput.trim()) {
      setError("Selecione um ativo entre as sugestões da busca.");
    }
  };

  const removeAsset = (tickerToRemove: string) => {
    const nextAssets = assets.filter((asset) => asset.value !== tickerToRemove);
    setAssets(nextAssets);
    setStorageError(!writeWatchlistAssets(nextAssets));
  };

  const showSuggestions =
    isSuggestionsOpen &&
    tickerInput.trim().length > 0 &&
    (isLoading || suggestions.length > 0);

  return (
    <main className="min-h-[100dvh] bg-bg px-4 py-6 text-text sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Kandle · acompanhamento
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Minha watchlist
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
              Acompanhe a data do sinal de compra mais recente dos ativos que
              você escolher.
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            to="/"
          >
            <FiArrowLeft aria-hidden="true" />
            Voltar ao gráfico
          </Link>
        </header>

        <section
          aria-label="Adicionar ativo"
          className="mb-8 rounded-(--radius-lg) border border-border bg-bg-elevated p-4 sm:p-5"
        >
          <form onSubmit={submitSearch}>
            <label
              className="mb-2 block text-sm font-medium"
              htmlFor="watchlist-search"
            >
              Adicionar ativo
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div ref={searchRef} className="relative min-w-0 flex-1">
                <Input
                  aria-controls="watchlist-suggestions"
                  aria-expanded={showSuggestions}
                  aria-haspopup="listbox"
                  autoComplete="off"
                  className="w-full"
                  disabled={!isReady}
                  id="watchlist-search"
                  maxLength={40}
                  onChange={(event) => {
                    setTickerInput(event.target.value);
                    setError(null);
                    setIsSuggestionsOpen(true);
                  }}
                  onFocus={() => setIsSuggestionsOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setIsSuggestionsOpen(false);
                  }}
                  placeholder="Pesquise por ticker ou nome da empresa"
                  value={tickerInput}
                />
                {showSuggestions && (
                  <ul
                    id="watchlist-suggestions"
                    aria-label="Sugestões de ativos"
                    className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 max-h-64 overflow-auto rounded-(--radius-md) border border-border-strong bg-bg-elevated p-1.5 shadow-(--shadow-lg)"
                    role="listbox"
                  >
                    {isLoading ? (
                      <li
                        className="px-3 py-2 text-sm text-text-muted"
                        role="status"
                      >
                        Pesquisando ativos...
                      </li>
                    ) : (
                      suggestions.map((suggestion) => (
                        <li
                          key={suggestion.value}
                          role="option"
                          aria-selected={false}
                        >
                          <button
                            className="w-full rounded-(--radius-sm) px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            onClick={() => addAsset(suggestion)}
                            type="button"
                          >
                            <span className="font-semibold">
                              {suggestion.value}
                            </span>
                            <span className="ml-2 text-text-muted">
                              {suggestion.label}
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
              <Button
                disabled={!isReady || isLoading || suggestions.length === 0}
                leftIcon={<FiPlus />}
                type="submit"
              >
                Adicionar primeiro resultado
              </Button>
            </div>
            {error && (
              <p className="mt-2 text-xs text-danger" role="alert">
                {error}
              </p>
            )}
          </form>
        </section>

        <section aria-label="Ativos acompanhados">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">
              Ativos acompanhados{" "}
              <span className="text-sm font-normal text-text-muted">
                ({assets.length})
              </span>
            </h2>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-text-muted">Período do sinal</span>
              <select
                className="rounded-(--radius-md) border border-border bg-bg-elevated px-3 py-2 text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onChange={(event) =>
                  setInterval(event.target.value as WatchlistInterval)
                }
                value={interval}
              >
                <option value={MarketDataInterval.Daily}>Diário</option>
                <option value={MarketDataInterval.Weekly}>Semanal</option>
              </select>
            </label>
          </div>
          {!isReady ? (
            <p
              className="py-8 text-center text-sm text-text-muted"
              role="status"
            >
              Carregando lista...
            </p>
          ) : assets.length === 0 ? (
            <div className="rounded-(--radius-lg) border border-dashed border-border-strong px-6 py-14 text-center">
              <p className="font-medium">Sua watchlist está vazia</p>
              <p className="mt-2 text-sm text-text-muted">
                Pesquise e selecione um ativo para começar sua lista.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-(--radius-lg) border border-border bg-bg-elevated">
              {assets.map((asset) => (
                <li
                  className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5"
                  key={asset.value}
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{asset.value}</p>
                    <p className="mt-1 text-sm text-text-muted">{asset.label}</p>
                    {signals[asset.value]?.status === "loading" && (
                      <p className="mt-2 text-sm text-text-muted" role="status">
                        Calculando último sinal de compra...
                      </p>
                    )}
                    {signals[asset.value]?.status === "success" && (
                      <p className="mt-2 text-sm">
                        Último sinal de compra: {!signals[asset.value].result.hasEnoughHistory ? (
                          <span className="text-text-muted">
                            dados insuficientes para avaliar
                          </span>
                        ) : signals[asset.value].result.signalTime === null ? (
                          <span className="text-text-muted">
                            nenhum nos últimos 6 anos
                          </span>
                        ) : (
                          <span className="font-medium">
                            {formatSignalDate(signals[asset.value].result.signalTime)}
                            {" "}(há {getDaysSince(signals[asset.value].result.signalTime)} dias)
                          </span>
                        )}
                      </p>
                    )}
                    {signals[asset.value]?.status === "error" && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <p className="text-sm text-danger" role="alert">
                          {signals[asset.value].message}
                        </p>
                        <Button
                          onClick={() => retrySignal(asset.value)}
                          size="sm"
                          variant="ghost"
                        >
                          Tentar novamente
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    aria-label={`Remover ${asset.value} da watchlist`}
                    onClick={() => removeAsset(asset.value)}
                    size="sm"
                    variant="ghost"
                  >
                    <FiTrash2 aria-hidden="true" />
                    Remover
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {storageError && (
            <p className="mt-3 text-sm text-danger" role="status">
              A lista foi atualizada, mas não foi possível salvá-la neste
              navegador.
            </p>
          )}
          <p className="mt-4 text-xs leading-5 text-text-muted">
            A lista fica salva neste navegador. Os sinais usam candles {interval === MarketDataInterval.Daily ? "diários" : "semanais"} confirmados; o candle do período ainda em andamento é ignorado. As consultas são sequenciais, em lotes de até 3 ativos, e os resultados ficam em cache por até 6 horas para cada período.
          </p>
        </section>
      </div>
    </main>
  );
}
