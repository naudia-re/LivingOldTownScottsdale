# Living Old Town Scottsdale

The website prototype for **Living Old Town Scottsdale (LOTS)** — a hyper-local real estate and lifestyle media platform focused on Old Town Scottsdale, AZ.

By Naudia Andrescavage and the Selling Sonoran Group at Compass.

## Pages

- `lots-website/index.html` — Home
- `lots-website/pages/old-town-life.html` — Field guide to Old Town (history, builders, directory, lists)
- `lots-website/pages/str-hub.html` — STR Investment Hub
- `lots-website/pages/condos.html` — Luxury condo communities
- `lots-website/pages/buy.html` — Buyer page + gated downloads
- `lots-website/pages/sell.html` — Seller page + home valuation
- `lots-website/pages/about.html` — Brand story + team
- `lots-website/pages/contact.html` — Multi-path contact
- `lots-website/pages/blog.html` — Editorial blog
- `lots-website/pages/history.html` — Long-form Old Town history article
- `lots-website/pages/neighborhoods.html`, `neighborhood-directory.html`, `str-listings.html` — Neighborhood / listing pages

## Run locally

```sh
cd lots-website
python3 -m http.server 8080
```

Then open <http://localhost:8080/>.

## Notes

- The hero video (`assets/hero-video.mov`) is excluded from this repo because of file-size limits. Host externally (e.g. Cloudflare Stream, Vimeo, S3) for production.
- IDX/MLS, Calendly, CRM, GA4, and Instagram feed are placeholders — to be wired up before launch.
- Brand fonts: Cormorant Garamond (display) + DM Sans (body).
- Brand palette: warm cream, clay taupe, chocolate, dusty blue, sandy brown, terracotta.
