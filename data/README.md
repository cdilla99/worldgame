# World Game data

## Country model

`countries.js` is the canonical gameplay model. Its `countryCards` array contains 197 complete country cards with facts, flags, clues, and stable IDs `1` through `197`. The bundled country geometry and generated continent chunks must cover those same 197 cards.

The lightweight `countryIndex` is derived from `countryCards` and also contains 197 records, IDs `1` through `197` (including `196` Cyprus and `197` Palestine). Each record is a minimal 4-field entry (`id`, `name`, `continent`, `difficulty`) for autocomplete. Adding a country requires a complete card, matching geometry, regenerated chunks, and updated integrity tests.

`src/data/chunks/*.js` is generated from `countries.js` by `node scripts/rebuild-chunks.mjs`. Do not hand-edit generated chunk data.

## Country Economics 2026 — v4 gross-salary correction

`country-economics-2026.min.json` is the sole runtime economics source. The v3 salary field was annualized net take-home pay and was incorrectly presented as a national average salary. Version 4 replaces it with average gross salary or earnings before tax.

Runtime tuple:

```text
[annualGrossSalaryUsd, bigMacUsd, mcdMealUsd, coke330Usd, economicQuality, bigMacQuality]
```

Salary provenance:

- current wage.is 2026 global gross-salary compilation;
- wage.is attributes country data to national statistics offices, ILO/OECD, and other official or reputable sources;
- USD equivalents use 2026 exchange rates;
- Canada was individually checked against the wage.is/Statistics Canada attribution;
- Germany was individually checked against the wage.is/Destatis 2025 earnings reference;
- Vatican City is `null` because no comparable national labour-market average is available.

Food-price fields are unchanged from v3. The local `salary-2026-gross-audit.csv` working file mirrors salary values for review but is intentionally ignored: it is not an independent source and must not become a second runtime dataset.
