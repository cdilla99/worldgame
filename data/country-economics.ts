import dataset from "./country-economics-2026.min.json";

export type EconomicQuality = "D" | "M" | "P";
export type BigMacQuality = "O" | "R" | "A" | "M" | "N";

export type CountryEconomicTuple = readonly [
  annualNetSalaryUsd: number,
  bigMacUsd: number | null,
  mcdMealUsd: number,
  coke330Usd: number,
  economicQuality: string,
  bigMacQuality: BigMacQuality,
];

export interface CountryEconomics {
  annualNetSalaryUsd: number;
  bigMacUsd: number | null;
  mcdMealUsd: number;
  coke330Usd: number;
  salaryQuality: EconomicQuality;
  mcdMealQuality: EconomicQuality;
  cokeQuality: EconomicQuality;
  bigMacQuality: BigMacQuality;
  hasMcDonalds: boolean;
  bigMacIsEstimate: boolean;
}

const rows = dataset.data as unknown as Record<string, CountryEconomicTuple>;

export function getCountryEconomics(iso2: string): CountryEconomics | null {
  const row = rows[iso2.toUpperCase()];
  if (!row) return null;

  return {
    annualNetSalaryUsd: row[0],
    bigMacUsd: row[1],
    mcdMealUsd: row[2],
    coke330Usd: row[3],
    salaryQuality: row[4][0] as EconomicQuality,
    mcdMealQuality: row[4][1] as EconomicQuality,
    cokeQuality: row[4][2] as EconomicQuality,
    bigMacQuality: row[5],
    hasMcDonalds: row[5] !== "N",
    bigMacIsEstimate: row[5] === "M",
  };
}

export function hasCountryEconomics(iso2: string): boolean {
  return Object.prototype.hasOwnProperty.call(rows, iso2.toUpperCase());
}

export const countryEconomics2026 = rows;
