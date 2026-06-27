# MNML — Backend

A small Flask + SQLite backend for the MNML site. It serves your existing
static frontend (all the `.html`/`.css`/`.js` files, unchanged in spirit) and
adds a handful of JSON endpoints so search, the contact form, the newsletter
box, and checkout are no longer fake.

## What changed in the frontend

- **`cart.js`** — `filterProducts()` now does the same instant local filtering
  as before, *plus* a debounced call to `/api/search` that shows a dropdown
  of matches from every page (not just the one you're on). Also added:
  newsletter submit handler, contact form submit handler, and a real
  `checkoutDemo()` that logs the order to the backend and clears the cart.
- **`cart.css`** — styles for the new search results dropdown.
- **`contact.html`** — form fields got `id`s, and the submit button now calls
  `submitContactForm(this)` instead of just faking a "Sent" state.
- **All 9 pages** — the footer newsletter input/button got
  `class="newsletter-input"` / `class="newsletter-submit"` so `cart.js` can
  wire them up via event delegation (no other markup changes).

No visual changes — everything still looks and feels the same, it's just
real now.

## Why search wasn't working

Each page only ever filtered the `.product-card` elements sitting *on that
page*. Since `build.py` split the original single-page site into separate
files, there was no shared product data — search a candle while on
`living.html` and it'd never find products listed only on `objects.html`.
The backend's `/api/search` fixes this by holding the full catalog in one
SQLite table and searching across all of it.

## Project structure

```
app.py              Flask app — routes, DB setup, seed data
requirements.txt     Flask + gunicorn (intentionally minimal)
Procfile             tells Render how to start the app
.gitignore
*.html, *.css, *.js  your existing frontend, served as static files
build.py             unchanged — see note below
```

## Running locally

```bash
pip install -r requirements.txt
python3 app.py
```

Visit `http://localhost:5000`. The SQLite file `mnml.db` is created and
seeded automatically on first run — delete it any time to reset to a clean
catalog with no contact messages / signups / orders.

## API quick reference

| Method | Path                  | Purpose                                   |
|--------|-----------------------|--------------------------------------------|
| GET    | `/api/products`       | catalog, optional `?category=` `&q=`      |
| GET    | `/api/products/<id>`  | single product                             |
| GET    | `/api/search?q=...`   | sitewide search (name/description/category)|
| POST   | `/api/contact`        | store a contact form submission            |
| POST   | `/api/newsletter`     | store an email signup                      |
| POST   | `/api/orders`         | log a checkout (`{ "items": [...] }`)      |
| GET    | `/api/orders/<id>`    | look up an order                           |
| GET    | `/api/health`         | health check                               |

## Deploying on Render

1. Push this folder to a GitHub repo.
2. On Render: **New → Web Service**, connect the repo.
3. Runtime: Python 3. Build command: `pip install -r requirements.txt`.
   Start command: `gunicorn app:app` (already set in the `Procfile`, Render
   will pick it up automatically).
4. Deploy. That's it — one service serves both the site and the API, same
   origin, so there's no CORS config to worry about.

**Important caveat:** Render's free/standard web services have an *ephemeral*
disk — `mnml.db` gets wiped on every redeploy or restart. For a portfolio
demo that's usually fine (the catalog reseeds itself automatically), but any
contact messages, newsletter signups, or orders logged in between deploys
will be lost. If you want that data to persist, you'd need a Render
[persistent disk](https://render.com/docs/disks) (small paid add-on) or to
swap SQLite for Render's free Postgres later — not needed to ship this as-is,
just worth knowing.

## A note on `build.py`

`build.py` regenerates these pages from a `source_index.html` that wasn't
part of what I edited (it wasn't provided). The frontend changes above were
made directly to the shipped `.html`/`.js`/`.css` files. If you still run
`build.py` to regenerate pages from that source file, you'll overwrite these
edits — so either port the same small changes into `source_index.html`, or
(simplest) just treat the current `.html` files as the source of truth going
forward, since the site's already fully split into pages.
