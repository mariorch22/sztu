"""Replay recorded left-hand joint positions in MuJoCo."""

from pathlib import Path
import time

import mujoco
import mujoco.viewer


def replay_hand(timestamps, joint_angles):
    """Show measured finger positions at their recorded times."""
    model_path = Path(__file__).parent / "assets" / "paxini_left_hand.xml"
    model = mujoco.MjModel.from_xml_path(str(model_path))
    state = mujoco.MjData(model)

    # SDK logical order: index, middle, ring, thumb; four joints each.
    joint_names = [
        f"left_{finger}_joint{number}"
        for finger in ("index", "middle", "ring", "thumb")
        for number in range(1, 5)
    ]
    joint_indices = [model.joint(name).qposadr[0] for name in joint_names]

    # Rotate the palm upright for a clear view.
    model.body_quat[model.body("left_palm_link").id] = [2**-0.5, 0, -(2**-0.5), 0]
    state.qpos[joint_indices] = joint_angles[0]
    mujoco.mj_forward(model, state)

    with mujoco.viewer.launch_passive(model, state) as viewer:
        viewer.cam.lookat[:] = [0, 0, 0.12]
        viewer.cam.distance = 0.42
        viewer.cam.azimuth = 20
        viewer.cam.elevation = -7

        start = time.perf_counter()
        for timestamp, angles in zip(timestamps, joint_angles):
            elapsed = (int(timestamp) - int(timestamps[0])) / 1_000_000_000
            time.sleep(max(0, elapsed - (time.perf_counter() - start)))
            if not viewer.is_running():
                break

            with viewer.lock():
                state.qpos[joint_indices] = angles
                state.time = elapsed
                mujoco.mj_forward(model, state)
            viewer.sync()

    # Let the viewer finish closing before Python shuts down.
    while viewer.m is not None:
        time.sleep(0.01)
