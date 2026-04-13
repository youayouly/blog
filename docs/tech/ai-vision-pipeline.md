---
title: Vision ML Pipeline
pageClass: page-projects
comment: false
toc: false
sidebar: false
---

# Vision ML Pipeline

An end-to-end **computer vision** workflow: from labeled images to a trained model and a small serving or export path suitable for demos or embedded conversion.

## Pipeline stages

1. **Data**: collection, labeling (CVAT/Label Studio), and train/val splits  
2. **Training**: PyTorch or Ultralytics-style detectors/segmenters  
3. **Evaluation**: mAP, confusion matrix, failure buckets  
4. **Export**: ONNX → target runtime (see Edge AI Inference page)  

## Ideas to implement

- Baseline **ResNet/YOLO** on a public subset (COCO subset, custom photos)  
- Simple **FastAPI** or static demo for upload-and-infer  
- Document augmentation policy and class imbalance handling  

## Next steps

- Freeze dataset version and training config in repo  
- Add reproducible `requirements.txt` and one-command train script  
