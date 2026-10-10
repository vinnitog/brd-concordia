"""Build approved oversampled PNG delivery assets, preserving the source matrix.

Resize changes pixels; this is not lossless. --check never writes files.
Optional tooling: Pillow 12.3.0, also used by package-logo.py.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path

import PIL
from PIL import Image

ASSETS = Path(__file__).resolve().parents[1] / "public" / "assets"
SOURCE_SHA = "cb2fe59c2be992fb9a8613632b7e16ce503798eb3e79829d9fdc763549ae12f7"
DERIVATIVES = (
    (440, "e4a543951f97d5cb18b9b35fa1ff69383422aae638a56a8b9059119100f56efc"),
    (880, "07d53b693c9ee91f62104c3d365cd0516889b6e5b784f9b7eb2eb6345906f556"),
)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if PIL.__version__ != "12.3.0":
        raise ValueError("Expected Pillow 12.3.0; do not silently regenerate")
    source = (ASSETS / "brd-logo-on-dark.png").read_bytes()
    if hashlib.sha256(source).hexdigest() != SOURCE_SHA:
        raise ValueError("Preserved institutional matrix changed")
    report = []
    with Image.open(io.BytesIO(source)) as original:
        for width, expected_sha in DERIVATIVES:
            height = round(original.height * width / original.width)
            resized = original.convert("RGBA").resize((width, height), Image.Resampling.LANCZOS)
            encoded = io.BytesIO()
            resized.save(encoded, format="PNG", optimize=True)
            content = encoded.getvalue()
            if hashlib.sha256(content).hexdigest() != expected_sha:
                raise ValueError("Unexpected encoder artifact; review a new content URL explicitly")
            target = ASSETS / f"brd-logo-{width}.{expected_sha[:12]}.png"
            with Image.open(io.BytesIO(content)) as decoded:
                if decoded.mode != "RGBA" or decoded.size != (width, height) or decoded.tobytes() != resized.tobytes():
                    raise ValueError("Decoded delivery asset changed")
            if args.check:
                if target.read_bytes() != content:
                    raise ValueError("Committed derivative differs from deterministic resize")
            else:
                target.write_bytes(content)
            report.append({"asset": target.name, "bytes": len(content), "width": width,
                           "height": height, "rgbaSurfaceBytes": width * height * 4,
                           "sha256": expected_sha})
    print(json.dumps({"sourceSha256": SOURCE_SHA, "sourceBytes": len(source),
                      "sourceRgbaSurfaceBytes": 10869 * 2946 * 4, "derivatives": report}))


if __name__ == "__main__":
    main()
