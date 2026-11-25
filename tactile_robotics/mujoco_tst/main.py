import time
import mujoco
import mujoco.viewer

model = mujoco.MjModel.from_xml_path("pendel.xml")
data = mujoco.MjData(model)

with mujoco.viewer.launch_passive(model, data) as viewer:
    while viewer.is_running():
        step_start = time.time()
        mujoco.mj_step(model, data)
        viewer.sync()
        # ungefähr Echtzeit halten
        dt = model.opt.timestep - (time.time() - step_start)
        if dt > 0:
            time.sleep(dt)