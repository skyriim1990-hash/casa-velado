# Casa Velado — Checkout и правни страници (Етап 13)

Вътрешен документ (български). Текстът на сайта е на английски (британски), както в blueprint-а (2.1, 2.3, 9.2, Приложение Б и В). Маршрути: `/checkout`, `/terms`, `/privacy`, `/cookies`, `/shipping`.

## Какво казва blueprint-ът и какво не

- **Checkout (2.3):** една страница в три видими блока — Contact → Delivery (до адрес или „collection from the Tasting Room“) → Payment (card / bank transfer, само визуално). Резюмето с линии на книгата е вдясно (горе на мобилен). Доставката е до `[SHIPPING REGIONS]`. „Place order“ показва „This is a demonstration project. Your order has not been placed.“. Изисква JavaScript (9.2).
- **Правни страници (2.1):** `/terms`, `/privacy`, `/cookies`, `/shipping`, „задължителни, на един общ шаблон“, във футъра. **Текст за тях blueprint-ът не дава.**

Всичко по-долу, което не е в тези два реда, е мое решение и е отбелязано като такова.

## Checkout (`src/pages/checkout.astro`, `src/scripts/checkout.ts`)

Ред: H1 „Checkout“ и изречението „This is a demonstration project: nothing is charged and no order is placed.“ → резюме („Your order“) → форма с три номерирани блока. От 1024px формата е вляво (колони 1–7), резюмето вдясно (9–12) и е залепено, докато прозорецът е поне 800px висок (като при продукта). Под 1024px резюмето е над формата (blueprint).

- **Резюме:** линиите на поръчката (име + „Box of 20 × 2“ + цена), после Subtotal · Shipping · Gift wrapping (само ако е отметнато) · Total като `BookLine`. „Edit cart“ отваря същото чекмедже; промяна в него (количество, Remove, подаръчна опаковка) се вижда веднага в резюмето. Цените идват от каталога на количката (`cart-catalogue.ts`), не от страницата.
- **Contact:** Name, Email, Phone (по избор). Name е тук, защото е нужно и при collection.
- **Delivery:** две нативни радио (Delivery to an address / Collection from the Tasting Room). Адрес: Address, Town or city, Postcode, Country (подсказка „We deliver to `[SHIPPING REGIONS]`.“) и реда „Delivered within `[TIMEFRAME]` to `[SHIPPING REGIONS]`. Adults only.“ (от `microcopy.delivery`). Collection: адресът и часовете на Tasting Room като `[ADDRESS]` и `[HOURS]`; полетата за адрес се скриват и не се проверяват.
- **Payment:** Card / Bank transfer, само като избор с един ред пояснение; няма поле за номер на карта, срок, CVC или IBAN. Реда „Payment is shown for illustration. No card or bank details are collected.“.
- **Place order:** както на `/contact` и `/tasting-room` (`forms.ts`): грешка до всяко поле, обобщение с `role="alert"` („Please correct the 6 fields marked below.“), фокус на първото грешно поле, „Sending…“ за 0,6 s, после потвърждението (`identity.demo.order`, дословно от blueprint-а) на мястото на формата, с фокус върху него и връзка „Browse the cigars“. Количката **не се изпразва** (поръчка не е направена). Не се прави никаква заявка (проверено в мрежовия лог).
- **Празна количка:** „Your cart is empty.“ и „Browse the cigars“; формата и резюмето не се показват.
- **Без JS:** заглавие, изречението и „Please enable JavaScript to use the checkout.“; формата и резюмето са `hidden`, така че нищо не се преструва, че работи. Съдържанието е скрито до решението на скрипта; `.page` пази минимална височина (80svh), за да не подскача футърът (CLS 0).

## Правни страници (`src/data/legal.ts`, `src/components/legal/LegalPage.astro`)

Един шаблон: H1, едно изречение, „Last updated `[DATE]`“, номерирани раздели (заглавие вляво, текст вдясно от 1024px; един стълб под това), линии на книгата само там, където има реални данни (какво пази браузърът; факти за доставката), и връзки към другите три страници. Четирите страници са тънки файлове (`terms.astro` и т.н.), които четат запис от `legal.ts`. Влизат в sitemap автоматично.

**Текстовете са мои и са написани само от това, което сайтът наистина прави:**

- Нищо не се продава, таксува или изпраща; формите не изпращат; няма анализ, реклама, външни шрифтове или вградена карта (проверено в кода).
- `/cookies` изброява реалните ключове: `cv-age-ok` (localStorage, 30 дни), `cv-cookies` (localStorage), `cv-cart` (localStorage), `cv-drawer-seen` (sessionStorage). Бисквитки не се слагат. Казва се и че банерът споменава „optional analytics“ (blueprint 5.4), а сайтът не зарежда такъв.
- Въпросът за възрастта е описан като известие, не като проверка (така е в обвивката).
- Какво само собственикът може да даде остава заместител: продавач/отговорно лице (`[ADDRESS]`, `[EMAIL]`), региони, срок и цена на доставката (`[SHIPPING REGIONS]`, `[TIMEFRAME]`, `[PRICE]`), дата на последна промяна (`[DATE]`). Не са измислени юридическо лице, закон, срокове за връщане, данъци или права по GDPR.

## Промени в общи файлове

- `forms.ts`: не проверява поле, което е `disabled` или е в `[hidden]` (адресът при collection). `/contact` и `/tasting-room` дават същите 3 и 6 грешки като преди.
- `site.ts`: разширен `microcopy.checkout` (досега само `sections` и `place`).
- `placeholders.ts`: допълнени `usedFor`; нови токени няма.
- `validate-content.mjs`: проверява и текстовете на `legal.ts` по същите правила (забранени думи, британски правопис, типографски кавички, непознати заместители, кирилица).
- Нов компонент `RadioOption.astro` (нативно радио като ред на книгата, с по желание пояснение само за избраното). `/contact` и продуктът запазват собствените си радио (одобрени); обединяването е за по-късен етап, ако се поиска.

## Решения, които blueprint-ът не дава

1. Payment е само избор + пояснение, без полета за карта (blueprint: „само визуално“; не се събират данни).
2. Shipping: при доставка `[PRICE]`, при collection „Not applicable“. Total е Subtotal, докато собственикът не даде цените на доставката и на подаръчната опаковка; докато е така, под сумите стои „The total does not include the items marked `[PRICE]`.“ (маха се, когато цените са дадени).
3. Name е в Contact, Phone е по избор, Country е свободен текст (регионите са `[SHIPPING REGIONS]`).
4. Връзките „Before you order, see Terms, Privacy and Shipping.“ под бутона (затваря цикъла с правните страници).
5. Радиото е кръгло, както на продукта и в Contact (знакът ○ на blueprint-а).
6. `/checkout` е индексируем и е в sitemap (първо го маркирах `noindex`, но това дава Lighthouse SEO 60 < 95; blueprint-ът не иска `noindex`).

## Остава за проверка

`[SHIPPING REGIONS]`, `[TIMEFRAME]`, `[PRICE]` (доставка и подаръчна опаковка), `[ADDRESS]`, `[EMAIL]`, `[HOURS]`, `[DATE]` на правните страници. Текстът на `/terms`, `/privacy`, `/cookies` и `/shipping` е описание на демонстрацията, не правен съвет: ако къщата стане истинска, трябва да се напише наново от юрист.
