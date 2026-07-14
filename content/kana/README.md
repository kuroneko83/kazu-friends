# Hiragana stroke data

`hiragana.json` contains stroke paths + median lines for the 46 basic hiragana,
extracted from the [AnimCJK project](https://github.com/parsimonhi/animCJK)
(`graphicsJaKana.txt`), for use with the `hanzi-writer` tracing library.

Regenerate with `node scripts/build-kana-data.mjs` — it folds AnimCJK's
auxiliary animation-pass segments into their parent strokes so every kana
matches the official school stroke count and order (validated in the script);
the numbered tracing in the game depends on this.

Data licensing (per AnimCJK): Arphic Public License (original font outlines)
and GNU LGPL v3+ (AnimCJK's modifications).
