# Casa Velado — модел на данните (Етап 4)

Вътрешен документ (български). Описва каноничното съдържание и как blueprint v1.0 се съотнася към него. Сайтът е на английски; всичко в таблиците по-долу от `src/` е на английски.

## Принцип

- **Един източник.** Записите живеят в `src/data/*.ts` (типизирани спрямо `src/lib/schemas.ts`) и в `src/content/journal/*.md`. Страниците четат само през `src/lib/catalogue.ts` и `src/lib/format.ts`. Нищо не се повтаря: линията носи силата и състава, продуктът носи размера, цената и бележките, лентата на продукта (ledger) се изчислява.
- **Три слоя проверка.** (1) Astro валидира всеки запис със Zod при зареждане на колекциите. (2) `astro check` проверява типовете. (3) `npm run validate:content` (вече част от `npm run build`) проверява правилата, които схемата не може да изрази, и сравнява данните директно с таблиците 4.2 и R3 в `docs/casa-velado-blueprint.md`.
- **Заместителите** (`[CITY]`, `[AREA]`, `[NUMBER]`, `[DATE]` …) са в `src/data/placeholders.ts` и се показват точно така. Не са попълвани.

## Колекции

| Колекция        | Източник                   | Записи                                                                                       | Схема                                 |
| --------------- | -------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------- |
| `lines`         | `src/data/lines.ts`        | 6: Jalapa, Galera, Pilón, La Vela (постоянни), Cosecha 2020 (издание), Muestrario (комплект) | `lineSchema`, обединение по `kind`    |
| `products`      | `src/data/products.ts`     | 16: 15 пури и Muestrario                                                                     | `productSchema`, обединение по `kind` |
| `regions`       | `src/data/regions.ts`      | 4: Estelí, Condega, Jalapa, Ometepe                                                          | `regionSchema`                        |
| `tobaccoStages` | `src/data/tobacco.ts`      | 5 глави за Tobacco и началото R4                                                             | `tobaccoStageSchema`                  |
| `glossary`      | `src/data/tobacco.ts`      | 11 термина (Приложение А, дословно)                                                          | `glossaryTermSchema`                  |
| `photos`        | `src/data/photos.ts`       | 14 кадъра на страници (6.9, без продуктовите и статиите)                                     | `photoSchema`                         |
| `house`         | `src/data/house.ts`        | 1 запис: 5 глави (1.8, дословно), „What we don’t do“, пръстените, подпис                     | `houseSchema`                         |
| `journal`       | `src/content/journal/*.md` | 6 статии                                                                                     | `articleSchema`                       |

Извън колекциите (само константи): `src/data/taxonomy.ts` (сила с думи, витоли, типове обвивка, филтри, подреждане, лимити, речник на вкусовите бележки, забранените думи), `src/data/placeholders.ts`, `src/data/site.ts` (идентичност, навигация, микротекстове от Приложение Б), `src/data/journal.ts` (редът на шестте статии).

## Съотнасяне blueprint → структура

| Blueprint                                                                                                                                                                                                      | Структура                                                                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.3 Line (`slug, name, tagline, description, strength, wrapper, binder, filler[], harvestYear, fermentationMonths, fermentationNote, leafAgeingMonths, cigarAgeingMonths, rollingMethod, order`)               | `lineSchema` (`id` е slug). Обвивка, свързващ лист и пълнеж са структурирани (`country`, `variety`, `regions[]` с бележка `ligero`) и се форматират с `formatLeaf` до точните низове от таблицата 4.2. `wrapperType` е стойността за филтъра. |
| 4.3 Product (`slug, line, vitola, lengthIn, lengthInLabel, lengthMm, ring, smokingMinutes, description, notes, pairing, options[], availability, restockNote?, maxPerOrder?, images, editionSize?, featured?`) | `productSchema`, вариант `cigar`. Силата е на линията. Цената е `priceCents` (цели евроцентове). `images` са заместители `[PHOTO: …]` с формат на кадъра.                                                                                     |
| 4.2 Muestrario                                                                                                                                                                                                 | `products` вариант `sampler`: `contents` е четири Robusto по един от всяка постоянна линия; една опция `box` с `quantity: 4` и €48.00. Линията му е `kind: 'sampler'`.                                                                        |
| 4.3 Article (`slug, title, category, date, readingMinutes, cover, excerpt, relatedProduct?, body`)                                                                                                             | `articleSchema` + Markdown. `date` е `[DATE]`; `readingMinutes`, `excerpt` са `null`, докато не бъдат написани (Етап 11).                                                                                                                     |
| 2.3 Tobacco: пет глави, малък блок с 2–3 факта, harvest ledger, glossary                                                                                                                                       | `tobaccoStages` (факт е `ledger`, `fixed` или `verify`), `getLedgerRange`, `glossary`. Harvest ledger се чете от `lines`.                                                                                                                     |
| 2.3 Our House: глави, карта, пръстени, What we don’t do                                                                                                                                                        | `house`. Картата са четирите региона (`places`), без координати.                                                                                                                                                                              |
| 6.9 кадри                                                                                                                                                                                                      | `photos` (кадри 1–13 и 19); продуктовите (14–17) са на продукта; корицата (18) е на статията.                                                                                                                                                 |
| 4.4 филтри, подреждане                                                                                                                                                                                         | `taxonomy.ts`: `STRENGTH_FILTERS`, `SMOKING_TIME_BANDS`, `VITOLAS`, `WRAPPER_TYPES`, `SORT_OPTIONS`.                                                                                                                                          |
| 4.6 ledger на продукта (13 реда)                                                                                                                                                                               | `getProductLedger(product)` — изчислява се от линията и продукта.                                                                                                                                                                             |
| Приложение Б, 4.6, 4.7, 5.4                                                                                                                                                                                    | `src/data/site.ts` → `microcopy`.                                                                                                                                                                                                             |
| Приложение В (стойности на собственика)                                                                                                                                                                        | `src/data/placeholders.ts` → `PH`, `ownerValues`.                                                                                                                                                                                             |

## Какво изчислява `catalogue.ts`

`getLines`, `getProducts` (в реда на линиите), `getProductsByLine`, `getSameLineProducts`, `getProduct`, `getProductLedger`, `getLedgerRange` (диапазон на ферментация и отлежаване), `getTobaccoStages`, `getGlossary`, `getHouse`, `getPhoto`, `getArticles` (най-новите първи, когато всички дати са истински; иначе редът от blueprint-а), `getRelatedArticles`.

## Правила, които `validate:content` налага

- 6 линии (4 постоянни, 1 издание, 1 комплект), 16 артикула, по 3 / 4 / 3 / 4 / 1 / 1 на линия; id на пура е `[line]-[vitola]`.
- Размер, ринг, мм, сила, време, цена на единична, пакет от 5 (точно 5 пъти единичната, без отстъпка), кутия (брой и цена) и състав на линиите съвпадат с таблиците 4.2; изреченията R3 съвпадат с `tagline`.
- `lengthIn` ↔ `lengthInLabel` ↔ `lengthMm` са съгласувани (190,5 mm се закръгля на 191).
- Бележките са от 19-те думи на речника, най-много 3 на третина. Единствено Galera Robusto е с одобрения си текст (`dark cocoa`, `a long peppery finish`).
- Описание на линия: 60–90 думи. Описание на пура: 2–3 изречения и поне един конкретен факт.
- Текст: без забранените думи, без американски правопис, без bag/basket, без кирилица, без удивителни знаци, без емоджи, типографски кавички и апострофи, без имейли, адреси и телефони, само известни заместители, само `<i>` и `<i lang="es">`, изречения с малки букви в заглавията.

## Етап 7: промени в четенето

- `getProducts` подрежда по линия и после по реда на каталога от `src/data/products.ts` (преди това излизаха по азбука).
- `getLineWrapper(line)` връща обвивката на линията като в ledger-а („Nicaragua Habano (Jalapa)“).
- `src/lib/collection.ts` (`filterGroups`, `itemOf`, `matches`, `countFor`, `compareBy`, `parseQuery`, `stringifyQuery`) чете същите записи; не повтаря факти.
