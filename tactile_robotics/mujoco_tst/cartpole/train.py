import gymnasium as gym
from stable_baselines3 import PPO

import cartpole_env  # noqa: F401  (registriert "MyCartPole-v0")

env = gym.make("MyCartPole-v0")
model = PPO("MlpPolicy", env, verbose=1)
model.learn(total_timesteps=100_000)
model.save("cartpole_ppo")
