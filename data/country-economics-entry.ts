import {
  getCountryEconomics,
  hasCountryEconomics,
} from "./country-economics";
import type { BigMacQuality } from "./country-economics";

const DATA_UNAVAILABLE = "Data unavailable";
const NO_MCDONALDS = "No McDonald's";
const economicsApi = Object.freeze({ getCountryEconomics, hasCountryEconomics });

function formatUsd(value: number | null, fractionDigits: number): string {
  if (value === null || !Number.isFinite(value)) return DATA_UNAVAILABLE;
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function formatBigMac(value: number | null, quality: BigMacQuality): string {
  if (quality === "N") return NO_MCDONALDS;
  if (value === null || !Number.isFinite(value)) return DATA_UNAVAILABLE;
  if (quality === "M") return "~" + formatUsd(value, 2);
  return formatUsd(value, 2);
}

function setValue(id: string, value: string): void {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function renderEconomicComparison(event: Event): void {
  const detail = (event as CustomEvent).detail;
  const callout = document.getElementById("explorer-economics-callout");
  const isTerritory = detail?.kind === "territory";
  callout?.classList.toggle("hidden", isTerritory);
  if (!callout || isTerritory) return;

  const root = window as any;
  const country = root.countryCards?.find((card: { id: number }) => card.id === Number(detail?.countryId));
  const iso2 = root.AssetFallbacks?.getCountryCode?.(country);
  const economics = iso2 ? getCountryEconomics(iso2) : null;

  const bigMacQuality = economics?.bigMacQuality ?? "N";

  setValue("explorer-economics-salary", formatUsd(economics?.annualNetSalaryUsd ?? null, 0));
  setValue("explorer-economics-big-mac", formatBigMac(economics?.bigMacUsd ?? null, bigMacQuality));
  setValue("explorer-economics-coke", formatUsd(economics?.coke330Usd ?? null, 2));
}

(window as any).CountryEconomics = economicsApi;
window.addEventListener("geowars:explorer-country", renderEconomicComparison);
