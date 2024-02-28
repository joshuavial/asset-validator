import time
import requests
import random
import sys

ENERGY_BUFFER_DURATION = 20  # Duration in seconds to accumulate energy readings

def post_energy_data(sensor_id, start_time, energy_consumed_J):
    end_time = time.time()
    post_data = {
        'from': int(start_time * 1e6),
        'to': int(end_time * 1e6),
        'energy': energy_consumed_J,
        'sensor': sensor_id,
    }
    print(post_data)
    response = requests.post('http://omf.local:4000/observation', json=post_data)
    if response.status_code == 200:
        print(f"Energy data posted successfully: {post_data}")
    else:
        print(f"Failed to post energy data: {response.status_code}")

def simulate_transducer(sensor_number):
    sensor_id = f'sensor_{sensor_number}'
    energy_buffer = random.uniform(20, 50) * 1  # Energy in joules (W * s)
    start_time = time.time()

    post_energy_data(sensor_id, start_time, energy_buffer)

    while True:
        # Simulate energy generation between 20-50 watts
        power = random.uniform(20, 50)
        energy_buffer += power * 1  # Energy in joules (W * s)

        time.sleep(1)
        if time.time() - start_time >= ENERGY_BUFFER_DURATION:
            post_energy_data(sensor_id, start_time, energy_buffer)
            # Reset the energy buffer and start time
            energy_buffer = 0.0
            start_time = time.time()

if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in ['1', '2']:
        print("Usage: fake.py <sensor_number>")
        print("sensor_number should be 1 or 2.")
        sys.exit(1)
    simulate_transducer(sys.argv[1])
