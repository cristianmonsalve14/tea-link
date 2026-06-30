"""Genera Captura-14.png y Captura-15.png desde salida de npm test."""
from __future__ import annotations

import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
FONT_PATH = Path("C:/Windows/Fonts/consola.ttf")
FONT_SIZE = 18
LINE_HEIGHT = 26
PADDING = 32
BG = (30, 30, 30)
FG = (212, 212, 212)
GREEN = (78, 201, 176)
CYAN = (86, 156, 214)
YELLOW = (220, 220, 170)
MAX_WIDTH = 1100


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if FONT_PATH.exists():
        return ImageFont.truetype(str(FONT_PATH), size)
    return ImageFont.load_default()


def line_color(line: str) -> tuple[int, int, int]:
    if re.search(r"\d+ passed", line, re.I):
        return GREEN
    if line.strip().startswith("RUN") or "vitest" in line.lower():
        return CYAN
    if line.strip().startswith(">"):
        return YELLOW
    return FG


def render_capture(
    title: str,
    subtitle: str,
    source_txt: Path,
    output_png: Path,
) -> None:
    body = source_txt.read_text(encoding="utf-8").replace("\r\n", "\n").strip()
    lines = [title, subtitle, ""] + body.split("\n")

    font = load_font(FONT_SIZE)
    title_font = load_font(FONT_SIZE + 4)

    draw_probe = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    widths = []
    for i, line in enumerate(lines):
        f = title_font if i == 0 else font
        box = draw_probe.textbbox((0, 0), line or " ", font=f)
        widths.append(box[2] - box[0])

    width = min(MAX_WIDTH, max(widths) + PADDING * 2)
    height = PADDING * 2 + LINE_HEIGHT * len(lines) + 12

    img = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(img)

    y = PADDING
    for i, line in enumerate(lines):
        f = title_font if i == 0 else font
        color = GREEN if i == 0 else line_color(line)
        draw.text((PADDING, y), line, font=f, fill=color)
        y += LINE_HEIGHT + (4 if i == 0 else 0)

    img.save(output_png, format="PNG")
    print(f"OK: {output_png}")


def main() -> None:
    render_capture(
        "TEA Link — Pruebas automatizadas (Backend)",
        "Comando: cd Producto/backend && npm test",
        ROOT / "Captura-14-backend-test-output.txt",
        ROOT / "Captura-14.png",
    )
    render_capture(
        "TEA Link — Pruebas automatizadas (Frontend)",
        "Comando: cd Producto/frontend && npm test",
        ROOT / "Captura-15-frontend-test-output.txt",
        ROOT / "Captura-15.png",
    )


if __name__ == "__main__":
    main()
