# Casa Velado — шрифтове

Вътрешен документ (български). Описва как са получени файловете в `src/assets/fonts/`, за да може процесът да се повтори.

## Файлове

| Файл                      | Източник                                      | Размер                                       |
| ------------------------- | --------------------------------------------- | -------------------------------------------- |
| `casa-serif-roman.woff2`  | EB Garamond (variable, `wght` 400–600)        | 39 348 B                                     |
| `casa-serif-italic.woff2` | EB Garamond Italic (variable, `wght` 400–600) | 40 288 B                                     |
| `casa-sans-400.woff2`     | IBM Plex Sans, `wght` 400, `wdth` 100         | 17 056 B                                     |
| `casa-sans-500.woff2`     | IBM Plex Sans, `wght` 500, `wdth` 100         | 18 560 B                                     |
| **Общо**                  |                                               | **115 252 B** (115,3 kB; бюджет ≤ 120 000 B) |

Лицензия: SIL Open Font License 1.1 (текстовете са в `public/fonts/OFL.txt`).

## Източници

Изходните файлове са взети от `github.com/google/fonts` (клон `main`):

- `ofl/ebgaramond/EBGaramond[wght].ttf`, `EBGaramond-Italic[wght].ttf`
- `ofl/ibmplexsans/IBMPlexSans[wdth,wght].ttf`

## Подмножество

Направено еднократно с `subset-font` (HarfBuzz subsetter), инсталиран извън проекта. Не е зависимост.

- **Знаци:** Basic Latin (U+0020–007E), Latin-1 Supplement (U+00A0–00FF), Latin Extended-A (U+0100–017F), плюс U+2013 U+2014 U+2018 U+2019 U+201A U+201C U+201D U+201E U+2022 U+2026 U+20AC U+2190 U+2192 U+2212 U+2713 и дробите U+215B–215E (за `5⅝`).
- **Layout функции:** само `kern` и `liga`. И в двата шрифта цифрите са по подразбиране lining и табличните (ширина 480 за Garamond, 600 за Plex), затова `tnum`/`lnum` не са нужни.
- **Hinting:** премахнат (`noHinting`).
- **Оси:** Garamond е ограничен до `wght` 400–600; Plex е фиксиран на 400 и 500 със `wdth` 100.

### Измерени варианти (преди решението)

Размери на четирите файла, в байтове:

| Вариант                                                                                       | Общо, B     |
| --------------------------------------------------------------------------------------------- | ----------- |
| Всички layout функции, hinting запазен, Latin + Latin-1                                       | 272 016     |
| Всички layout функции, hinting запазен, Latin + Latin-1 + Ext-A                               | 297 784     |
| 17 избрани функции (с `lnum, onum, tnum, frac, case, sups, calt`), без hinting, Latin + Ext-A | 169 380     |
| `kern, liga, locl, ccmp, mark, mkmk`, без hinting, Latin + Ext-A, по-широк набор символи      | 121 744     |
| **`kern, liga`, без hinting, Latin + Latin-1 + Ext-A, минимален набор символи (избран)**      | **115 252** |
| Същото без Latin Extended-A                                                                   | 95 528      |

В метрична система (1 kB = 1000 B) 121 744 B вече е над 120 kB, затова е избран вариантът със 115 252 B.

## Резервни шрифтове

`Casa Serif Fallback` (Times New Roman) и `Casa Sans Fallback` (Arial) са с `size-adjust`, `ascent-override`, `descent-override` и `line-gap-override`, изчислени от средната ширина на буквите (английска честота) и метриките на шрифтовете: Garamond 0,3878 срещу Times New Roman 0,4091; Plex 0,4596 срещу Arial 0,4513.

## Бележка за лиценза

IBM Plex е с Reserved Font Name „Plex“. Файловете са подмножество (модификация) и вътрешното име на шрифта в тях не е сменено. В CSS те се наричат `Casa Sans` и `Casa Serif`. За публично пускане това да се провери.

## Предзареждане

Само два файла: `casa-serif-roman.woff2` и `casa-sans-400.woff2` (9.2). Курсивът и Plex 500 се зареждат при нужда.
