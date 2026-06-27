# FlyBox Driver — distribucija APK-a

Aplikacija se NE distribuira preko Google Play Store-a, već kao **APK fajl** koji vozači instaliraju ručno. APK se automatski build-uje (GitHub Actions) i hostuje na našem serveru.

## Link za preuzimanje (uvek isti)

**https://fleetvibe.digitalvibe.rs/app/flybox-driver.apk**

Ovaj link uvek vraća **najnoviju** verziju. (Trenutno gађa DEV backend `apifleetvibe.digitalvibe.rs`.)

---

## Za Buca — kako podeliti / objaviti novu verziju

### Objava nove verzije
1. Push na granu `flybox/main` (bilo koja izmena koda) **ili** ručno: GitHub → repo `flybox-driver-app` → **Actions** → "FlyBox Driver — Build & Distribute APK" → **Run workflow**.
2. Kad workflow postane zelen (~10–20 min), gornji link automatski servira novi build. Ne treba ništa ručno.

### Deljenje linka vozačima
Pošalji vozačima link preko **WhatsApp / Viber / SMS**, sa kratkim uputstvom (šablon ispod). Opciono mogu da napravim i **QR kod** linka (slika) da ga vozači samo skeniraju kamerom.

**Šablon poruke vozaču:**
> Pozdrav! Instaliraj FlyBox Driver aplikaciju sa ovog linka:
> https://fleetvibe.digitalvibe.rs/app/flybox-driver.apk
> Otvori link u **Chrome** pregledaču na telefonu, preuzmi fajl i instaliraj ga (telefon će tražiti dozvolu — odobri je). Detaljno uputstvo je u nastavku. Posle instalacije se prijaviš svojim brojem telefona.

---

## Za vozača — instalacija (Android, prvi put)

1. Otvori link u **Chrome**-u na telefonu:
   **https://fleetvibe.digitalvibe.rs/app/flybox-driver.apk**
2. Počeće preuzimanje fajla `flybox-driver.apk`. Kad se završi, tapni na notifikaciju o preuzimanju (ili otvori **Files / Moji fajlovi → Downloads** i tapni fajl).
3. Telefon će pitati: **"Allow Chrome to install unknown apps?"** (Dozvoli instalaciju iz nepoznatih izvora) → uključi prekidač i vrati se nazad.
   - _(Na nekim telefonima ovo se pojavi pod Podešavanja → Aplikacije → Chrome → "Instaliraj nepoznate aplikacije".)_
4. Tapni **Install / Instaliraj**, pa **Open / Otvori**.
5. U aplikaciji se prijavi: unesi **broj telefona** → dobićeš kod (SMS ili email) → unesi kod.

Gotovo — aplikacija je spremna.

## Ažuriranje na novu verziju

Kad stigne nova verzija, vozač samo **ponovo otvori isti link**, preuzme i instalira preko stare verzije:
- Instalira se **preko** postojeće aplikacije (ne treba deinstalacija).
- **Prijava (login) ostaje** — ne mora ponovo da se loguje.

> Napomena: ovo radi jer su sve verzije potpisane istim ključem. Ako bi se ikada promenio ključ za potpisivanje, update preko postojeće instalacije ne bi uspeo (telefon bi tražio deinstalaciju prve). Zato se keystore (`~/flybox-test.keystore`) **mora čuvati i bekapovati**.

## Čest problem

- **"App not installed" / "Aplikacija nije instalirana":** najčešće nema dovoljno memorije na telefonu (oslobodi ~300 MB) ili je ostala stara verzija sa drugačijim potpisom (deinstaliraj staru pa probaj ponovo).
- **Link se otvara kao tekst umesto da se preuzima:** koristi Chrome (ne in-app browser iz WhatsApp-a); ili "Download link" / "Sačuvaj link".
