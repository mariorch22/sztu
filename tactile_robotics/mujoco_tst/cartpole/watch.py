import gymnasium as gym
from stable_baselines3 import PPO

import cartpole_env  # noqa: F401

env = gym.make("MyCartPole-v0", render_mode="human")
model = PPO.load("cartpole_ppo")

obs, _ = env.reset()
while True:
    action, _ = model.predict(obs, deterministic=True)
    obs, reward, terminated, truncated, _ = env.step(action)
    if terminated or truncated:
        obs, _ = env.reset()
