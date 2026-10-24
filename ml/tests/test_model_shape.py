"""Smoke test: verify TCN output shape is (B, num_classes)."""
import torch
import pytest
from ml.src.features.landmarks import FEAT_DIM
from ml.src.models.tcn import TCN


def test_tcn_output_shape():
    model = TCN(feat_dim=FEAT_DIM, num_classes=100)
    x = torch.zeros(2, 32, FEAT_DIM)  # batch=2, T=32
    logits = model(x)
    assert logits.shape == (2, 100), f"Unexpected shape: {logits.shape}"
