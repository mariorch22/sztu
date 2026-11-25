"""Plot uncalibrated tactile signals over time."""

import matplotlib.pyplot as plt
import numpy as np


def plot_tactile(timestamps, tactile):
    """Show a raw signal overview and a heatmap of all taxels."""
    time_s = (timestamps - timestamps[0]) / 1_000_000_000

    # Keep the largest absolute component for each taxel.
    activity = np.abs(tactile).max(axis=2)

    fig, axes = plt.subplots(2, 1, sharex=True, figsize=(10, 6))

    axes[0].plot(time_s, activity.max(axis=1))
    axes[0].set_ylabel("Peak absolute raw value")
    axes[0].set_title("Tactile signals (uncalibrated)")

    heatmap = axes[1].pcolormesh(
        time_s,
        np.arange(tactile.shape[1]),
        activity.T,
        shading="auto",
    )
    axes[1].set_xlabel("Time (s)")
    axes[1].set_ylabel("Taxel index")
    fig.colorbar(heatmap, ax=axes[1], label="Absolute raw value")

    plt.tight_layout()
    plt.show()
