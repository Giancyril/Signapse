"""
tcn.py
Lightweight Temporal Convolutional Network (TCN) for isolated sign recognition.

Architecture (Phase 2 target):
  Input  : (B, T, FEAT_DIM)
  TCN    : 3 residual blocks, dilation = 1, 2, 4
  Pool   : Global average over time
  Output : (B, num_classes) logits
"""
from __future__ import annotations

import torch
import torch.nn as nn


class ResidualBlock(nn.Module):
    def __init__(self, in_ch: int, out_ch: int, dilation: int = 1):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv1d(in_ch, out_ch, kernel_size=3, dilation=dilation,
                      padding=dilation),
            nn.BatchNorm1d(out_ch),
            nn.ReLU(),
            nn.Conv1d(out_ch, out_ch, kernel_size=3, dilation=dilation,
                      padding=dilation),
            nn.BatchNorm1d(out_ch),
        )
        self.downsample = (
            nn.Conv1d(in_ch, out_ch, kernel_size=1) if in_ch != out_ch else nn.Identity()
        )
        self.relu = nn.ReLU()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.relu(self.net(x) + self.downsample(x))


class TCN(nn.Module):
    def __init__(self, feat_dim: int = 392, num_classes: int = 100,
                 hidden: int = 256):
        super().__init__()
        self.encoder = nn.Sequential(
            ResidualBlock(feat_dim, hidden, dilation=1),
            ResidualBlock(hidden, hidden, dilation=2),
            ResidualBlock(hidden, hidden, dilation=4),
        )
        self.classifier = nn.Linear(hidden, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (B, T, F) -> (B, F, T) for Conv1d
        x = x.permute(0, 2, 1)
        x = self.encoder(x)          # (B, hidden, T)
        x = x.mean(dim=-1)           # (B, hidden) global avg pool
        return self.classifier(x)    # (B, num_classes)
