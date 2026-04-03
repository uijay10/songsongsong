"""Fetch and normalize HTML pages to plain text for extraction."""

from __future__ import annotations

import re

import httpx
from bs4 import BeautifulSoup

DEFAULT_UA = "Mozilla/5.0 (compatible; Web3Extract/1.0; +https://web3release.com)"


def fetch_page_text(url: str, *, max_chars: int = 15_000, timeout_s: float = 25.0) -> str:
    headers = {"User-Agent": DEFAULT_UA, "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8"}
    with httpx.Client(timeout=timeout_s, follow_redirects=True) as client:
        resp = client.get(url, headers=headers)
        resp.raise_for_status()
    html = resp.text
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "head", "noscript"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text[:max_chars]
