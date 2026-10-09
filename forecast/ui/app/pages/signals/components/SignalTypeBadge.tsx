import { useTranslation } from "react-i18next";

import { Badge, type BadgeVariant } from "@/ui/components/primitives/badge";
import type { SignalType } from "../signalsApi";

const VARIANTS: Record<SignalType, BadgeVariant> = {
  trend_start: "success",
  pullback: "info",
  sideways: "default",
};

/** Trend start = first COMPRA after a base; pullback = repeat COMPRA while the
 * uptrend held; sideways = repeat COMPRA in chop. */
export const SignalTypeBadge = ({ type }: { type: SignalType }) => {
  const { t } = useTranslation("signals");
  return (
    <Badge size="sm" variant={VARIANTS[type]} className="whitespace-nowrap">
      {t(`type.${type}`)}
    </Badge>
  );
};
