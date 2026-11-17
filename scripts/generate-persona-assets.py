#!/usr/bin/env python3
"""
Genera los assets Persona 5 de la ruta /education.

Recorta sprites originales (PNG con alfa) de assets-src/persona/ y los
exporta como WebP con alfa en public/assets/persona/.

Reglas:
  - Ningún sprite se amplía por encima del 1.25x de su tamaño nativo.
  - Si falta un sprite, se salta con un TODO (la web usa CSS/SVG de fallback).
  - Salida con transparencia alfa (WebP lossless/near-lossless).

Requisitos: python3 + Pillow  (pip install Pillow)
"""
from __future__ import annotations

from pathlib import Path

try:
    from PIL import Image
except ImportError:
    raise SystemExit("Falta Pillow: pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src" / "persona"
OUT = ROOT / "public" / "assets" / "persona"

MAX_SCALE = 1.25  # nunca ampliar un sprite más de 1.25x su tamaño nativo

# Cada entrada: (origen_rel, caja_recorte (l,t,r,b) o None, salida_rel, ancho_max, alto_max)
# La caja es sobre la imagen de origen. Si es None se usa la imagen entera.
# ancho_max/alto_max son el tamaño destino deseado (px). Si el origen es más
# pequeño y alcanzar el destino requiere > 1.25x, se mantiene el tamaño nativo.
SPRITES: list[tuple[str, tuple[int, int, int, int] | None, str, int, int]] = [
    # ── Arcanos: miniatura de placa (36×64) y sello de carta (96×168) ──
    ("arcana/0-le-mat-mini.png", None, "arcana/0-le-mat-mini.webp", 36, 64),
    ("arcana/0-le-mat-seal.png", None, "arcana/0-le-mat-seal.webp", 96, 168),
    ("arcana/i-le-bateleur-mini.png", None, "arcana/i-le-bateleur-mini.webp", 36, 64),
    ("arcana/i-le-bateleur-seal.png", None, "arcana/i-le-bateleur-seal.webp", 96, 168),
    ("arcana/iv-lempereur-mini.png", None, "arcana/iv-lempereur-mini.webp", 36, 64),
    ("arcana/iv-lempereur-seal.png", None, "arcana/iv-lempereur-seal.webp", 96, 168),
    ("arcana/xvii-letoile-mini.png", None, "arcana/xvii-letoile-mini.webp", 36, 64),
    ("arcana/xvii-letoile-seal.png", None, "arcana/xvii-letoile-seal.webp", 96, 168),
    ("arcana/xxi-lemonde-mini.png", None, "arcana/xxi-lemonde-mini.webp", 36, 64),
    ("arcana/xxi-lemonde-seal.png", None, "arcana/xxi-lemonde-seal.webp", 96, 168),
    ("arcana/vii-lajustice-mini.png", None, "arcana/vii-lajustice-mini.webp", 36, 64),
    ("arcana/vii-lajustice-seal.png", None, "arcana/vii-lajustice-seal.webp", 96, 168),
    ("arcana/ix-lhermite-mini.png", None, "arcana/ix-lhermite-mini.webp", 36, 64),
    ("arcana/ix-lhermite-seal.png", None, "arcana/ix-lhermite-seal.webp", 96, 168),
    # ── Loader del visor: sombrero de Joker, 10 frames de llamas ──
    ("loader/hat-00.png", None, "loader/hat-00.webp", 64, 64),
    ("loader/hat-01.png", None, "loader/hat-01.webp", 64, 64),
    ("loader/hat-02.png", None, "loader/hat-02.webp", 64, 64),
    ("loader/hat-03.png", None, "loader/hat-03.webp", 64, 64),
    ("loader/hat-04.png", None, "loader/hat-04.webp", 64, 64),
    ("loader/hat-05.png", None, "loader/hat-05.webp", 64, 64),
    ("loader/hat-06.png", None, "loader/hat-06.webp", 64, 64),
    ("loader/hat-07.png", None, "loader/hat-07.webp", 64, 64),
    ("loader/hat-08.png", None, "loader/hat-08.webp", 64, 64),
    ("loader/hat-09.png", None, "loader/hat-09.webp", 64, 64),
    # ── Fondo del visor: Loading Screen (rojo dominante) ──
    ("loading-screen.png", None, "loading-screen.webp", 1920, 1080),
    # ── Busto opcional "Take your time" ──
    ("joker-bust.png", None, "joker-bust.webp", 400, 400),
]

# Si tus sprites vienen en una hoja (sprite sheet), indica aquí la caja de
# recorte de cada uno en lugar de None, p. ej.:
# ("arcana/hoja-arcanos.png", (1024, 0, 1120, 168), "arcana/0-le-mat-seal.webp", 96, 168),


def save_webp(im: Image.Image, dest: Path, max_w: int, max_h: int, src_size: tuple[int, int]) -> str:
    nw, nh = im.size
    sw, sh = src_size
    # Factor de escala necesario para llegar al destino desde el ORIGEN
    # (recorte), no desde el tamaño ya recortado.
    scale_w = max_w / sw if sw else 1
    scale_h = max_h / sh if sh else 1
    scale = max(scale_w, scale_h)

    if scale > MAX_SCALE:
        # No ampliar más de 1.25x: se queda en tamaño nativo (o lo más cerca
        # posible dentro del destino) y se avisa.
        scale = 1.0
        note = f"TODO: destino {max_w}x{max_h} excede 1.25x del nativo {sw}x{sh}; se usa CSS/SVG o sprite mayor"
    else:
        note = ""

    if scale != 1.0:
        im = im.resize((round(sw * scale), round(sh * scale)), Image.LANCZOS)

    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, format="WEBP", lossless=True, alpha=True, method=6)
    return note


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    print(f"Orígenes: {SRC}")
    print(f"Salida:   {OUT}\n")

    total_bytes = 0
    todos: list[str] = []

    for src_rel, box, out_rel, max_w, max_h in SPRITES:
        src = SRC / src_rel
        dest = OUT / out_rel
        if not src.exists():
            print(f"[SKIP] falta origen: {src_rel}  →  {out_rel}  (TODO: añadir sprite y definir caja de recorte)")
            todos.append(out_rel)
            continue
        try:
            with Image.open(src) as im:
                im = im.convert("RGBA")
                if box is not None:
                    im = im.crop(box)
                note = save_webp(im, dest, max_w, max_h, im.size)
                size = dest.stat().st_size
                total_bytes += size
                tag = "OK "
                if note:
                    tag = "TODO"
                    todos.append(out_rel)
                print(f"[{tag}] {src_rel} [{im.size[0]}x{im.size[1]}] → {out_rel} ({size/1024:.1f} kB)" + (f" — {note}" if note else ""))
        except Exception as exc:  # noqa: BLE001
            print(f"[ERROR] {src_rel}: {exc}")
            todos.append(out_rel)

    print(f"\nPeso total generado: {total_bytes/1024:.1f} kB (límite ruta: 1500 kB)")
    if todos:
        print(f"\nTODOS ({len(todos)}): sprites pendientes o sin recorte definido:")
        for t in todos:
            print(f"  - {t}")
        print("\nMientras tanto la página usa placeholders en CSS/SVG (marcados TODO en el código).")
    return 0 if not todos else 0  # no falla el build por assets pendientes


if __name__ == "__main__":
    raise SystemExit(main())
