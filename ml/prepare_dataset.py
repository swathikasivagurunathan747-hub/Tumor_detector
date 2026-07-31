"""Download the 7,023-image four-class brain MRI dataset from Hugging Face.
Source: Simezu/brain-tumour-MRI-scan (Figshare + SARTAJ + Br35H compilation).
Run: python ml/prepare_dataset.py
"""
from pathlib import Path
from datasets import load_dataset

OUT = Path(__file__).parent / "data"
LABELS = {0: "notumor", 1: "glioma", 2: "meningioma", 3: "pituitary"}

def main():
    ds = load_dataset("Simezu/brain-tumour-MRI-scan")
    for split, rows in ds.items():
        for i, row in enumerate(rows):
            label_id = int(row["label"])
            label = LABELS.get(label_id, str(label_id))
            folder = OUT / split / label
            folder.mkdir(parents=True, exist_ok=True)
            row["image"].convert("RGB").save(folder / f"{split}_{i:05d}.jpg", quality=95)
    print(f"Dataset prepared at {OUT.resolve()}")

if __name__ == "__main__":
    main()
