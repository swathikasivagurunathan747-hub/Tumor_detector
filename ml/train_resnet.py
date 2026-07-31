"""Train a reproducible ResNet18 transfer-learning baseline for Q-Flux.
Uses train/test folders created by prepare_dataset.py. A validation split is
created ONLY from training data; the test set stays untouched until final evaluation.
"""
import copy, json, random
from pathlib import Path
import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, models, transforms
from sklearn.metrics import classification_report, confusion_matrix

ROOT = Path(__file__).parent
DATA = ROOT / "data"
MODELS = ROOT / "models"
MODELS.mkdir(exist_ok=True)
SEED = 42
random.seed(SEED); np.random.seed(SEED); torch.manual_seed(SEED)
if torch.cuda.is_available(): torch.cuda.manual_seed_all(SEED)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
BATCH = 32
EPOCHS = 18
PATIENCE = 5

train_tf = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.RandomRotation(10),
    transforms.RandomHorizontalFlip(),
    transforms.RandomAffine(degrees=0, translate=(0.04,0.04), scale=(0.95,1.05)),
    transforms.ColorJitter(brightness=0.08, contrast=0.08),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225]),
])
eval_tf = transforms.Compose([
    transforms.Resize((224,224)), transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225]),
])

def main():
    if not (DATA / "train").exists():
        raise SystemExit("Dataset missing. Run: python ml/prepare_dataset.py")
    base = datasets.ImageFolder(DATA / "train")
    n = len(base); idx = np.arange(n); rng=np.random.default_rng(SEED); rng.shuffle(idx)
    cut = int(n * 0.85); tr_idx, va_idx = idx[:cut], idx[cut:]
    tr_full = datasets.ImageFolder(DATA / "train", transform=train_tf)
    va_full = datasets.ImageFolder(DATA / "train", transform=eval_tf)
    test_ds = datasets.ImageFolder(DATA / "test", transform=eval_tf)
    assert tr_full.class_to_idx == test_ds.class_to_idx
    tr_ds, va_ds = Subset(tr_full, tr_idx), Subset(va_full, va_idx)
    workers = 0  # Windows-friendly default
    loaders = {
        "train": DataLoader(tr_ds,batch_size=BATCH,shuffle=True,num_workers=workers),
        "val": DataLoader(va_ds,batch_size=BATCH,shuffle=False,num_workers=workers),
        "test": DataLoader(test_ds,batch_size=BATCH,shuffle=False,num_workers=workers),
    }
    counts=np.bincount([base.targets[i] for i in tr_idx], minlength=len(base.classes))
    weights=torch.tensor(len(tr_idx)/(len(base.classes)*counts),dtype=torch.float32,device=DEVICE)

    model=models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
    model.fc=nn.Sequential(nn.Dropout(0.35), nn.Linear(model.fc.in_features,len(base.classes)))
    model.to(DEVICE)
    loss_fn=nn.CrossEntropyLoss(weight=weights, label_smoothing=0.05)
    opt=torch.optim.AdamW(model.parameters(),lr=2e-4,weight_decay=1e-4)
    sched=torch.optim.lr_scheduler.ReduceLROnPlateau(opt,mode="max",factor=.4,patience=2)
    best_acc=0.; best=None; stale=0
    history=[]
    for epoch in range(1,EPOCHS+1):
        row={"epoch":epoch}
        for phase in ("train","val"):
            model.train(phase=="train"); good=total=0; running=0.
            for x,y in loaders[phase]:
                x,y=x.to(DEVICE),y.to(DEVICE); opt.zero_grad(set_to_none=True)
                with torch.set_grad_enabled(phase=="train"):
                    logits=model(x); loss=loss_fn(logits,y)
                    if phase=="train": loss.backward(); opt.step()
                running += loss.item()*x.size(0); good += (logits.argmax(1)==y).sum().item(); total += x.size(0)
            row[f"{phase}_loss"]=running/total; row[f"{phase}_acc"]=good/total
        sched.step(row["val_acc"]); history.append(row); print(row)
        if row["val_acc"] > best_acc:
            best_acc=row["val_acc"]; best=copy.deepcopy(model.state_dict()); stale=0
        else:
            stale += 1
            if stale >= PATIENCE: break
    model.load_state_dict(best)
    ys=[]; ps=[]
    model.eval()
    with torch.no_grad():
        for x,y in loaders["test"]:
            p=model(x.to(DEVICE)).argmax(1).cpu(); ys.extend(y.tolist()); ps.extend(p.tolist())
    report=classification_report(ys,ps,target_names=base.classes,output_dict=True,zero_division=0)
    cm=confusion_matrix(ys,ps).tolist()
    metrics={"best_validation_accuracy":best_acc,"test":report,"confusion_matrix":cm,"class_to_idx":base.class_to_idx,"history":history}
    (MODELS/"metrics.json").write_text(json.dumps(metrics,indent=2))
    (MODELS/"class_names.json").write_text(json.dumps(base.classes,indent=2))
    model=model.cpu().eval(); example=torch.randn(1,3,224,224)
    traced=torch.jit.trace(model,example); traced.save(str(MODELS/"brain_tumor_resnet18.pt"))
    torch.save(model.state_dict(), MODELS/"brain_tumor_resnet18_state.pth")
    print(f"Saved model. Test accuracy: {report['accuracy']:.4f}")

if __name__ == "__main__": main()
