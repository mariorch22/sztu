from dataloader import load_data
from replay import replay_hand
from visualizer import plot_tactile


def main():
    recording_dir = "data/Group4_teleop_20261023T032608_c3592236"
    data = load_data(recording_dir, "left_tactile")
    hand = load_data(recording_dir, "left_hand_state")

    timestamps = data["timestamp_ns"]
    tactile = data["taxel_raw"]

    print("Samples:", len(timestamps))
    print("Tactile shape:", tactile.shape)
    print("Close the plot window to start the hand replay.")
    plot_tactile(timestamps, tactile)
    replay_hand(hand["timestamp_ns"], hand["actual_logical_rad"])


if __name__ == "__main__":
    main()
