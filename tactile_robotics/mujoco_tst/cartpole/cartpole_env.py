import os

import gymnasium as gym
import numpy as np
from gymnasium import spaces
from gymnasium.envs.mujoco import MujocoEnv

XML_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cartpole.xml")


class CartPoleEnv(MujocoEnv):
    # render_fps muss zu 1 / (timestep * frame_skip) passen: 1 / (0.01 * 2) = 50
    metadata = {"render_modes": ["human", "rgb_array", "depth_array", "rgbd_tuple"], "render_fps": 50}

    def __init__(self, **kwargs):
        # Beobachtung: Wagenposition, Stabwinkel und die beiden Geschwindigkeiten
        observation_space = spaces.Box(-np.inf, np.inf, shape=(4,), dtype=np.float64)
        # Der Aktionsraum wird automatisch aus ctrlrange im XML gelesen
        super().__init__(XML_PATH, frame_skip=2, observation_space=observation_space, **kwargs)

    def _get_obs(self):
        return np.concatenate([self.data.qpos, self.data.qvel])

    def step(self, action):
        self.do_simulation(action, self.frame_skip)  # action -> data.ctrl, dann 2 Physikschritte
        obs = self._get_obs()

        reward = 1.0                              # +1 pro Schritt, in dem der Stab noch steht
        terminated = bool(abs(obs[1]) > 0.2)      # Stab mehr als 0,2 rad gekippt

        if self.render_mode == "human":
            self.render()
        return obs, reward, terminated, False, {}  # truncated übernimmt TimeLimit

    def reset_model(self):
        # Kleiner Zufall im Start, damit nicht jede Episode identisch ist
        qpos = self.init_qpos + self.np_random.uniform(-0.01, 0.01, size=self.model.nq)
        qvel = self.init_qvel + self.np_random.uniform(-0.01, 0.01, size=self.model.nv)
        self.set_state(qpos, qvel)
        return self._get_obs()


gym.register(id="MyCartPole-v0", entry_point=CartPoleEnv, max_episode_steps=1000)
