# Native flag assets

`np.svg` preserves Nepal's original pennant proportions, transparent cutout,
blue border, and moon/sun symbols. Retrieved November 10, 2026 from
https://flagcdn.com/np.svg. FlagCDN distributes flag artwork based on Wikimedia
Commons; source information: https://flagpedia.net/download/api.

The shared flag pipeline serves this local asset first and falls back to the
same native SVG on FlagCDN. Do not replace it with a rectangular icon variant.

All flag slots preserve the source image's intrinsic proportions with contain
sizing, square corners and transparent surroundings. Grid tracks must allow
the image to shrink within the slot, including square and tall flags. A fixed
slot is layout space, not a specification for the flag's shape.

For other countries, the registry tries the original-proportion PNG and SVG
formats from FlagCDN. Standardized 4:3 icon variants are excluded: a fallback
must not silently change a flag's geometry. If the sources cannot load, the
existing unavailable state retains the country name instead of inventing a flag.
