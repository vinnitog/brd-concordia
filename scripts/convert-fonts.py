"""Reproducible, lossless local DM Sans packaging; no subsetting or font edits.

Requires fonttools==4.60.1 and brotli==1.2.0 in an isolated tooling environment.
Run with --check to validate committed outputs without modifying assets.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import tempfile

from fontTools.ttLib import TTFont
from fontTools.ttLib.woff2 import WOFF2FlavorData

ASSETS = Path(__file__).resolve().parents[1] / "public" / "assets"
FONTS = ("DMSans-Regular", "DMSans-Medium", "DMSans-Bold")


def verify(original_bytes, compressed):
    original = TTFont(io.BytesIO(original_bytes), recalcBBoxes=False, recalcTimestamp=False)
    decoded = TTFont(io.BytesIO(compressed), recalcBBoxes=False, recalcTimestamp=False)
    try:
        if set(original.reader.keys()) != set(decoded.reader.keys()):
            raise ValueError("Font tables changed")
        for tag in original.reader.keys():
            before, after = bytearray(original.reader[tag]), bytearray(decoded.reader[tag])
            if tag == "head":
                # Container checksum changes; bit 11 records lossless WOFF2 compression.
                before[8:12] = after[8:12] = b"\0" * 4
                before[16:18] = (int.from_bytes(before[16:18], "big") | 0x0800).to_bytes(2, "big")
            if before != after:
                raise ValueError("Font table changed: " + tag)
        if original.getGlyphOrder() != decoded.getGlyphOrder():
            raise ValueError("Glyph order changed")
        if original["hmtx"].metrics != decoded["hmtx"].metrics:
            raise ValueError("Glyph advances or bearings changed")
        for name in original.getGlyphOrder():
            first = original["glyf"][name].getCoordinates(original["glyf"])
            second = decoded["glyf"][name].getCoordinates(decoded["glyf"])
            if first != second:
                raise ValueError("Glyph outlines changed: " + name)
        return {"glyphs": len(original.getGlyphOrder()), "tables": len(original.reader.keys()),
                "metricsEqual": True, "outlinesEqual": True, "tablesEqualExceptContainerHead": True}
    finally:
        original.close(); decoded.close()


def convert(source):
    with TTFont(io.BytesIO(source), recalcBBoxes=False, recalcTimestamp=False) as font:
        font.flavor = "woff2"
        # Keep original glyf/loca/hmtx bytes; Brotli alone compresses the SFNT tables.
        font.flavorData = WOFF2FlavorData(transformedTables=set())
        output = io.BytesIO()
        font.save(output, reorderTables=False)
        return output.getvalue()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify committed WOFF2 assets without writing")
    args = parser.parse_args()
    prepared, report = [], []
    for name in FONTS:
        source = (ASSETS / (name + ".ttf")).read_bytes()
        compressed = convert(source)
        fidelity = verify(source, compressed)
        target = ASSETS / (name + ".woff2")
        if args.check:
            if target.read_bytes() != compressed:
                raise ValueError("Committed WOFF2 differs from reproducible output: " + name)
            verify(source, target.read_bytes())
        else:
            prepared.append((target, compressed))
        report.append({"font": name, "ttfBytes": len(source), "woff2Bytes": len(compressed),
                       "savedBytes": len(source) - len(compressed),
                       "sourceSha256": hashlib.sha256(source).hexdigest(),
                       "woff2Sha256": hashlib.sha256(compressed).hexdigest(), **fidelity})
    # Validate every font before writing any output; originals are never touched.
    for target, content in prepared:
        with tempfile.NamedTemporaryFile(dir=ASSETS, prefix=".font-", suffix=".tmp", delete=False) as temp:
            temporary = Path(temp.name)
            temp.write(content)
        try:
            temporary.replace(target)
        finally:
            temporary.unlink(missing_ok=True)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
