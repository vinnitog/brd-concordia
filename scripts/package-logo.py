"""Package the preserved BRD matrix losslessly; no resize, recolor or redesign.

Optional developer tooling only: Pillow 12.3.0. Preserve PNG rendering and DPI.
--check re-encodes and verifies the committed artifact without writing.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path

import PIL
from PIL import Image

ASSETS = Path(__file__).resolve().parents[1] / "public" / "assets"
SOURCE_SHA256 = "cb2fe59c2be992fb9a8613632b7e16ce503798eb3e79829d9fdc763549ae12f7"
OUTPUT_SHA256 = "3da21e7384ec40bfe9ab1b5f44cc0d13337f2e89ecbd010f9f32c828449edb13"
OUTPUT = ASSETS / ("brd-logo-on-dark." + OUTPUT_SHA256[:12] + ".png")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if PIL.__version__ != "12.3.0":
        raise ValueError("Expected Pillow 12.3.0; do not silently regenerate")
    source = (ASSETS / "brd-logo-on-dark.png").read_bytes()
    if hashlib.sha256(source).hexdigest() != SOURCE_SHA256:
        raise ValueError("Preserved institutional matrix changed")
    with Image.open(io.BytesIO(source)) as original:
        dpi = original.info["dpi"]
        original = original.convert("RGBA")
        encoded = io.BytesIO()
        original.save(encoded, format="PNG", optimize=True, dpi=dpi)
        output = encoded.getvalue()
        if hashlib.sha256(output).hexdigest() != OUTPUT_SHA256:
            raise ValueError("Unexpected encoder artifact; review a new content URL explicitly")
        with Image.open(io.BytesIO(output)) as decoded:
            if decoded.size != original.size or decoded.info.get("dpi") != dpi or decoded.convert("RGBA").tobytes() != original.tobytes():
                raise ValueError("Decoded RGBA pixels or dimensions changed")
        if args.check:
            if OUTPUT.read_bytes() != output:
                raise ValueError("Committed artifact differs from deterministic package")
        else:
            OUTPUT.write_bytes(output)
        print(json.dumps({"sourceBytes": len(source), "outputBytes": len(output),
                          "width": original.width, "height": original.height,
                          "rgbaEqual": True, "sourceSha256": SOURCE_SHA256,
                          "outputSha256": OUTPUT_SHA256, "asset": OUTPUT.name}))


if __name__ == "__main__":
    main()
