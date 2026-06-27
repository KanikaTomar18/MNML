#!/usr/bin/env python3
"""
MNML static site builder.
Splits the original single-page (JS-routed) index.html into separate,
real HTML files: index.html, new-in.html, objects.html, living.html,
archive.html, faq.html, shipping.html, returns.html, contact.html.

Run: python3 build.py
Output goes to ./site/
"""
import re
import copy
from pathlib import Path
from bs4 import BeautifulSoup

SRC = Path(__file__).parent / "source_index.html"
OUT = Path(__file__).parent / "site"
OUT.mkdir(exist_ok=True)

# page-id -> (output filename, <title> text)
PAGES = {
    "home":     ("index.html",    "MNML — Objects of Pure Intent"),
    "new-in":   ("new-in.html",   "New In — MNML"),
    "objects":  ("objects.html",  "Objects — MNML"),
    "living":   ("living.html",   "Living — MNML"),
    "archive":  ("archive.html",  "Archive — MNML"),
    "faq":      ("faq.html",      "FAQ — MNML"),
    "shipping": ("shipping.html", "Shipping & Delivery — MNML"),
    "returns":  ("returns.html",  "Returns & Refunds — MNML"),
    "contact":  ("contact.html",  "Contact — MNML"),
}
SLUG_TO_FILE = {slug: fname for slug, (fname, _) in PAGES.items()}

soup = BeautifulSoup(SRC.read_text(encoding="utf-8"), "html.parser")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def fix_internal_links(tag):
    """Convert showPage('x') routing into real navigation across an element."""
    for a in tag.find_all(["a", "button"]):
        onclick = a.get("onclick", "")
        m = re.search(r"showPage\('([\w-]+)'\)", onclick)
        if not m:
            continue
        target_slug = m.group(1)
        target_file = SLUG_TO_FILE.get(target_slug, "index.html")
        if a.name == "a":
            a["href"] = target_file
            del a["onclick"]
        else:  # button used for in-page nav (e.g. FAQ sidebar "Write to Us")
            a["onclick"] = f"location.href='{target_file}'"
    return tag


def stringify(tag):
    return str(tag)


# ---------------------------------------------------------------------------
# Shared head bits
# ---------------------------------------------------------------------------
head = soup.head
head_links = "\n    ".join(
    str(t) for t in head.find_all(["link", "meta"])
)
nav_active_style = head.find("style")
nav_active_style_str = str(nav_active_style) if nav_active_style else ""

# ---------------------------------------------------------------------------
# Navbar template
# ---------------------------------------------------------------------------
orig_nav = soup.find("nav")

def build_nav(current_slug):
    nav = BeautifulSoup(str(orig_nav), "html.parser").nav
    fix_internal_links(nav)
    brand = nav.find("a", class_="navbar-brand")
    if brand:
        brand["href"] = "index.html"
        if brand.get("onclick"):
            del brand["onclick"]
    for link in nav.find_all("a", class_="nav-link-item"):
        link_id = link.get("id", "")  # e.g. nav-new-in
        slug = link_id.replace("nav-", "", 1)
        classes = link.get("class", [])
        if slug == current_slug:
            if "active" not in classes:
                classes.append("active")
        else:
            classes = [c for c in classes if c != "active"]
        link["class"] = classes
    return str(nav)

# ---------------------------------------------------------------------------
# Footer template
# ---------------------------------------------------------------------------
orig_footer = soup.find("footer")

def build_footer():
    footer = BeautifulSoup(str(orig_footer), "html.parser").footer
    fix_internal_links(footer)
    return str(footer)

# ---------------------------------------------------------------------------
# Extract bootstrap script tag (CDN) - keep it, drop the old inline script
# ---------------------------------------------------------------------------
bootstrap_script = None
for s in soup.find_all("script"):
    if s.get("src") and "bootstrap" in s.get("src"):
        bootstrap_script = str(s)
        break

# ---------------------------------------------------------------------------
# Per-page content extraction + page-specific tweaks
# ---------------------------------------------------------------------------
page_divs = {}
for div in soup.find_all("div", class_="page"):
    page_id = div.get("id", "")  # e.g. page-new-in
    slug = page_id.replace("page-", "", 1)
    page_divs[slug] = div

# Inject data-year on archive's yearly blocks for real year-filtering
archive_div = page_divs.get("archive")
if archive_div:
    for block in archive_div.find_all("div", class_="mb-5"):
        # only tag blocks that actually contain archive product items,
        # not the filter-pill row itself (which also mentions "2025" etc.)
        if not block.find(class_="archive-item"):
            continue
        heading = block.find(["span", "h2", "h3", "h4"])
        text = (heading.get_text() if heading else "") or block.get_text()
        ym = re.search(r"(20\d{2})", text)
        if ym:
            block["data-year"] = ym.group(1)
        elif "Earlier" in text:
            block["data-year"] = "Earlier"

# Mark filter-pill groups so JS knows how to filter:
# archive uses year-based filtering, everything else uses category filtering.
for slug, div in page_divs.items():
    for group in div.find_all("div", class_="d-flex"):
        if group.find("button", class_="filter-pill"):
            if slug == "archive":
                group["data-filter-type"] = "year"
            else:
                group["data-filter-type"] = "category"

# ---------------------------------------------------------------------------
# Page template
# ---------------------------------------------------------------------------
PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    {head_links}
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="cart.css">
    {nav_active_style}
</head>
<body>

    <!-- PROMO STRIP -->
    <div class="promo-strip">Free shipping on orders over ₹2,500 · All India Delivery</div>

    {nav}

    {content}

    {footer}

    {bootstrap_script}
    <script src="cart.js"></script>
</body>
</html>
"""

for slug, (fname, title) in PAGES.items():
    div = page_divs.get(slug)
    if div is None:
        print(f"WARNING: no source content found for page '{slug}'")
        continue
    # ensure it's always visible now that each page is its own file
    classes = div.get("class", [])
    if "active" not in classes:
        classes.append("active")
    div["class"] = classes
    fix_internal_links(div)

    html = PAGE_TEMPLATE.format(
        title=title,
        head_links=head_links,
        nav_active_style=nav_active_style_str,
        nav=build_nav(slug),
        content=str(div),
        footer=build_footer(),
        bootstrap_script=bootstrap_script or "",
    )
    (OUT / fname).write_text(html, encoding="utf-8")
    print(f"wrote {fname}")

print("Done.")
