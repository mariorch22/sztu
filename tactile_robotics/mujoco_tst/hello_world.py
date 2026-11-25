import gymnasium as gym
from stable_baselines3 import PPO

env = gym.make("InvertedPendulum-v5")
model = PPO("MlpPolicy", env, verbose=1)
model.learn(total_timesteps=100_000)
model.save("pendulum_ppo")