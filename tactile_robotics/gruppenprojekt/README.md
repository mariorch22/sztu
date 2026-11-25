# Group project

Run from this directory:

```bash
uv run main.py
```

The program shows the left-hand tactile plots. Close the plot window to replay
the recorded left-hand finger positions in MuJoCo. Playback ends after the
recording or when you close the viewer.

The hand stays in place while its fingers move. This is a kinematic replay of
measured joint angles; tactile signals are shown separately as raw values.
