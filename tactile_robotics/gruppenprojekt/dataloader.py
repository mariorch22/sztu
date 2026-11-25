"""Load recorded data streams without filtering or synchronizing samples."""

import json
from pathlib import Path

import numpy as np


def load_data(recording_dir, stream_name):
    """Load one stream and return its fields as NumPy arrays.

    Chunks are joined in manifest order along the sample axis.
    Original values, timestamps, and validity flags are preserved.
    """
    recording_dir = Path(recording_dir)
    manifest = json.loads((recording_dir / "manifest.json").read_text())
    stream = manifest["streams"][stream_name]

    arrays = {}

    for chunk in stream["chunks"]:
        with np.load(recording_dir / chunk["file"], allow_pickle=False) as data:
            for field in data.files:
                if field not in arrays:
                    arrays[field] = []

                arrays[field].append(data[field])

    for field in arrays:
        arrays[field] = np.concatenate(arrays[field], axis=0)

    return arrays
