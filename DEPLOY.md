# Nasazení na chatbot-message-reader.jan-kuchar.cz

Aplikace je čistě statická (Vite + React), takže běží na GitHub Pages.
Build a nasazení dělá GitHub Actions (`.github/workflows/deploy.yml`) při každém pushi do `main`.
Vlastní doména je v souboru `public/CNAME`, který se při buildu zkopíruje do `dist/`.

## 1. DNS ve WEDOS

WEDOS administrace → **Domény** → `jan-kuchar.cz` → **DNS záznamy**:

| Název                    | TTL  | Typ   | Data                    |
|--------------------------|------|-------|-------------------------|
| `chatbot-message-reader` | 1800 | CNAME | `jenikkuchar.github.io.` |

- Pokud pro `chatbot-message-reader` už existuje záznam **A / AAAA** (např. ho vytvořil webhosting
  při zakládání subdomény), smaž ho – CNAME nesmí koexistovat s jiným záznamem stejného jména.
- Pokud máš wildcard `*` mířící na webhosting, nevadí – konkrétní CNAME má přednost.
- Pokud jsi subdoménu založil i ve správě **webhostingu** WEDOS, smaž ji tam, jinak si WEDOS
  může DNS záznam přepsat zpět.
- Změny uložíš tlačítkem **Aktualizovat zónu** (WEDOS je jinak neaplikuje). Propagace trvá
  obvykle do 30 minut.

Ověření: `dig +short chatbot-message-reader.jan-kuchar.cz` → má vrátit `jenikkuchar.github.io.`
a IP adresy 185.199.108–111.153.

### (Doporučeno) Ověření domény v GitHubu

Chrání před tím, aby si subdoménu převzal cizí GitHub účet.

1. GitHub → avatar → **Settings → Pages → Add a domain** → `jan-kuchar.cz`.
2. GitHub ukáže TXT záznam, ve WEDOS ho přidej, např.:

   | Název                                  | Typ | Data             |
   |----------------------------------------|-----|------------------|
   | `_github-pages-challenge-jenikkuchar`  | TXT | *(kód z GitHubu)* |

3. Aktualizuj zónu a v GitHubu klikni **Verify**.

## 2. GitHub Pages

1. Repo → **Settings → Pages** → *Build and deployment* → **Source: GitHub Actions**.
2. Mergni změny do `main` (nebo spusť workflow ručně v záložce **Actions → Deploy to GitHub Pages → Run workflow**).
3. Po doběhnutí: **Settings → Pages → Custom domain** by mělo ukazovat
   `chatbot-message-reader.jan-kuchar.cz` (pokud ne, zadej ručně a ulož).
4. Jakmile DNS check projde, zaškrtni **Enforce HTTPS** (certifikát Let's Encrypt vydá GitHub,
   může to trvat až ~1 hodinu).

## Poznámky

- `vite.config.ts` používá výchozí `base: '/'`, což je pro vlastní doménu správně.
  (Na adrese `jenikkuchar.github.io/chatbot-message-reader/` by aplikace nefungovala – to je v pořádku,
  GitHub tam stejně přesměruje na vlastní doménu.)
- Aplikace nevolá Gemini API ani žádný backend, takže není potřeba nastavovat žádné secrets.
- Repo musí být veřejné, nebo musíš mít GitHub Pro (Pages pro privátní repa).
