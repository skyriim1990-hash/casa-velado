# Casa Velado — Tasting Room и Contact (Етап 12)

Вътрешен документ (български). Текстът на сайта е на английски (британски), както в blueprint-а (2.3, 3 R7, 9.2, Приложение Б и В). Маршрути: `/tasting-room` и `/contact`; няма стари български маршрути.

## Tasting Room (`src/pages/tasting-room.astro`)

Ред: етикет „The Tasting Room, [CITY]“, H1 „Tasting Room“, изречението „A table, coffee, and someone who knows the leaf.“ и бутон „Reserve a table“ (към `#reserve`) → снимка (`tasting-room`, кропове 16:9 / 4:3 / 4:5, на голям екран най-много 80svh) → въведение от 77 думи и трите точки (The humidor, Coffee and rum pairings, Someone who knows the leaf) като номерирани редове → „Where and when“ (BookLine: Address `[ADDRESS]`, Hours `[HOURS]`) и статичната „карта“ → формата за резервация.

- **Въведението** е мое, само от одобрени факти (хумидор, кафе и ром, човек, който познава листа; цифрите са в ledger-а, който е и на кутията). Градът е `[CITY]`.
- **Картата** е Photo заместител `[PHOTO: static map of the Tasting Room area]` (кадър 19, 3:2). Няма вградена карта, iframe, SDK, адрес или координати.
- **Формата** (`#reserve-form`): Date, Time, Guests (select 1–6), Name, Email, Phone (всички задължителни), Note (по избор). Потвърждение (дословно от blueprint 2.3): „Thank you. This is a demonstration project, so no reservation has been made.“

## Contact (`src/pages/contact.astro`)

H1 „Contact“, изречението „A general enquiry, trade or press.“, „Details“ (BookLine: Email `[EMAIL]`, Phone `[PHONE]`, Factory address in Estelí `[ADDRESS]`) и формата. Три намерения са истинска радио група (`<fieldset>` с `<legend>` „Topic“ и три нативни радио бутона; стрелките местят избора; „General enquiry“ е избрано). Полета: Name, Email, Message. Потвърждение: „Thank you. This is a demonstration project, so your message has not been sent.“ (текстът е мой, по образеца на потвърждението за поръчка; blueprint-ът не дава такъв).

## Поведение на формите (`src/scripts/forms.ts`, ≈ 0,9 KB gzip)

Една малка помощна логика за двете форми (атрибут `data-demo-form`); нищо не се изпраща, няма заявка, бекенд или външна услуга.

- Полета: нативни типове (`date`, `time`, `email`, `tel`, `select`, `textarea`) със `required`; формата е `novalidate`, за да е проверката ни, не само на браузъра.
- При изпращане: всяко грешно поле получава съобщение до себе си (`[data-field-error]`, свързано с `aria-describedby`), `aria-invalid`, рамка и текст (не само цвят); над формата е обобщение с `role="alert"` („Please correct the 6 fields marked below.“); фокусът отива на първото грешно поле. Грешката се маха при следващото въвеждане.
- Проверки: непразно; имейл (`name@host.tld`); дата, която е реална и не е минала (полето започва от днес); час; гости цяло число от 1 до 6; телефонът е само непразен (без формат за държава).
- При успех: бутонът казва „Sending…“ за 0,6 s, формата се скрива и на нейно място стои потвърждението (`role="status"`, фокусът е на него). Остава видимо; няма номер, дата или код на резервация.
- **Без JS:** съдържанието се чете, полетата се виждат, бутонът е `disabled` (както в писмото във футъра) и под формата стои „Please enable JavaScript to use this form.“. Не се показва фалшив успех.

## Промени в общи файлове

- `Field.astro` (одобрен компонент): добавени типове `date`, `time`, `textarea` и `rows`; textarea е със същата рамка, фокус и грешка. Поведението на досегашните типове не е променено (билдът и `/styleguide` минават).
- `site.ts`: `microcopy.tastingRoom`, `microcopy.contact`, нови етикети и съобщения в `forms`, `identity.demo.contact`.

## Отклонения и решения

1. Потвърждението на резервацията е дословно от blueprint-а („Thank you. This is a demonstration project, so no reservation has been made.“), не от задачата.
2. H1 е „Tasting Room“ (както в навигацията), не „Tasting Room, [CITY]“; градът е в етикета.
3. Не се проверява работно време (то е `[HOURS]`), затова часът не се ограничава.
4. Снимката „Tasting Room detail“ (кадър 11) не е използвана; задачата не я иска.
5. Радио бутоните са кръгли (знакът ○ на blueprint-а), с пълен кръг, по-тъмна линия и по-тежък текст за избраното.

## Остава за проверка

`[CITY]`, `[ADDRESS]`, `[HOURS]`, `[EMAIL]`, `[PHONE]` и двете снимки (`[PHOTO: …]`).
