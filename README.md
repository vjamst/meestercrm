# MeesterCRM

Een moderne, Supabase-gedreven cockpit voor zzp'ers om klanten, uren, afspraken, facturen en taken te beheren. De applicatie is volledig client-side opgebouwd zodat hij direct op GitHub Pages gedeployed kan worden.

## Hoogtepunten

- **Dashboard** met omzet, uren, openstaande facturen, kritieke taken en interactieve grafieken.
- **Klantenbeheer** inclusief contactgegevens, adressen en standaard uurtarieven.
- **Urenregistratie** met live timer tot op de seconde, handmatige boekingen en CSV-export.
- **Weekplanning** met agenda-import (ICS) en export zodat je afspraken eenvoudig synchroniseert.
- **Facturatie** met line-items, urenimport, PDF-generatie via jsPDF en e-mailverzending via een Supabase Edge Function.
- **Takenlijst** met prioriteiten, deadlines en statusupdates.

## Snel starten

1. Clone dit project en open het in je editor.
2. Open `index.html` in je browser (lokaal of via een eenvoudige server zoals `npx serve`).
3. Vul je Supabase gegevens in via de knop **“Supabase instellen”**. De URL en public anon key worden veilig in `localStorage` opgeslagen.
4. Alle data wordt rechtstreeks in Supabase opgeslagen — er is geen aparte backend nodig.

> 💡 Omdat de site volledig statisch is, kun je hem probleemloos hosten via GitHub Pages. Plaats simpelweg de inhoud van deze repository in de `gh-pages` branch of configureer Pages om vanuit de `main` branch te deployen.

## Supabase configuratie

### Tabellen en policies

Gebruik het SQL-script in [`supabase/schema.sql`](supabase/schema.sql) om alle benodigde tabellen, relaties en policies aan te maken. Je kunt het script rechtstreeks in de Supabase SQL editor uitvoeren.

De belangrijkste tabellen zijn:

- `clients`
- `time_entries`
- `planning_entries`
- `tasks`
- `invoices`
- `invoice_items`
- `email_logs` (voor auditing van verzonden facturen)

Het script bevat ook Row Level Security policies waarmee je data per gebruiker kunt afschermen op basis van `auth.uid()`. Als je (nog) geen authenticatie gebruikt kun je de policies naar wens aanpassen.

### Storage bucket

Maak in Supabase een storage bucket met de naam `invoices` en sta `public` uploads toe. De applicatie uploadt factuur-pdf's naar dit bucket en slaat het pad op in de `invoices` tabel.

### Edge Function voor e-mail

De facturatie-module kan een factuur rechtstreeks via e-mail versturen. Hiervoor is een Supabase Edge Function inbegrepen in [`supabase/functions/send-invoice/index.ts`](supabase/functions/send-invoice/index.ts). Deploy de functie met de Supabase CLI of rechtstreeks vanuit het dashboard.

Benodigde environment variabelen voor de functie:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` (of pas de code aan voor een andere e-mailprovider)
- `DEFAULT_FROM_EMAIL` (bijv. `Facturatie <facturen@jouwdomein.nl>`)

De functie haalt de factuurgegevens en het bijbehorende storage-pad op, maakt een signed URL voor de PDF en verstuurt het e-mailbericht via [Resend](https://resend.com/).

## Deployen naar GitHub Pages

1. Commit en push je wijzigingen naar GitHub.
2. Schakel GitHub Pages in voor de repository (bijv. vanuit de `main` branch).
3. De site is nu online beschikbaar. Bij de eerste keer openen moet je opnieuw de Supabase URL en key invullen omdat deze in `localStorage` worden opgeslagen.

## Ontwikkeltips

- De UI is opgebouwd met vanilla HTML/CSS/JS en is daardoor snel aanpasbaar. Pas gerust `styles/style.css` aan voor je eigen branding.
- In `scripts/utils.js` vind je herbruikbare helperfuncties voor formatting, CSV/ICS-export en toast-notificaties.
- `scripts/app.js` bevat de volledige applicatielogica en is modulair opgebouwd per functionaliteit (dashboard, planning, facturatie, etc.).

Veel succes met het verder uitbouwen van MeesterCRM! 💼
