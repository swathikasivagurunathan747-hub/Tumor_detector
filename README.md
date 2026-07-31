# Q-Flux — Brain MRI Tumor Classification

Local research prototype for four-class MRI classification: **Glioma, Meningioma, Pituitary tumor, No tumor**.

The Analyze page calls a local FastAPI backend that serves a trained PyTorch ResNet18 model.

## Architecture

`React/TanStack UI -> server function -> FastAPI -> ResNet18 -> class probabilities`

## Dataset

Training scripts target `Simezu/brain-tumour-MRI-scan` on Hugging Face: 7,023 MRI images from the Figshare/SARTAJ/Br35H compilation, with train/test splits and four classes.

## 1. Install frontend

```bash
npm install
```

## 2. Create Python environment

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r ml/requirements.txt
```

## 3. Download and prepare dataset

```bash
python ml/prepare_dataset.py
```

This creates `ml/data/train/...` and `ml/data/test/...`.

## 4. Train the model

```bash
python ml/train_resnet.py
```

Training uses ImageNet-pretrained ResNet18, augmentation, class-weighted cross entropy, validation-based early stopping, and an untouched test split. Outputs:

- `ml/models/brain_tumor_resnet18.pt` — TorchScript inference model
- `ml/models/brain_tumor_resnet18_state.pth` — weights
- `ml/models/class_names.json` — exact class order
- `ml/models/metrics.json` — validation/test metrics and confusion matrix

A GPU is recommended. CPU training will be slower.

## 5. Start ML backend

Terminal 1:

```bash
python -m uvicorn ml.api:app --host 127.0.0.1 --port 8000 --reload
```

Check `http://127.0.0.1:8000/health` and confirm `modelLoaded` is true.

## 6. Start frontend

Terminal 2:

```bash
npm run dev
```

Open `http://127.0.0.1:3000/analyze`.

## Important

This is a research/education prototype, not a diagnostic medical device. Do not present model confidence as clinical certainty. Keep the test set untouched during tuning and report precision, recall, F1, confusion matrix, and per-class performance in addition to accuracy.
