import { Badge, type BadgeVariant } from "@/ui/components/primitives/badge";

export const percent = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

export const rate = (value: number | null) =>
  value == null ? "—" : `${value.toFixed(1)}%`;

export const Signed = ({ value }: { value: number }) => (
  <span
    className={value >= 0 ? "text-(--color-success)" : "text-(--color-danger)"}
  >
    {percent(value)}
  </span>
);

export const scoreVariant = (score: number): BadgeVariant =>
  score >= 70 ? "success" : score >= 50 ? "warning" : "default";

/** Score badge plus the real win rate its band had in the test period. */
export const Score = ({
  value,
  winRate,
}: {
  value: number;
  winRate?: number | null;
}) => (
  <span className="inline-flex items-center gap-2 whitespace-nowrap">
    <Badge size="sm" variant={scoreVariant(value)}>
      {value}
    </Badge>
    {winRate != null && (
      <span className="text-xs text-(--color-text-muted)">
        {Math.round(winRate)}%
      </span>
    )}
  </span>
);
