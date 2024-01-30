import smbus
import time

# Constants for INA226
ADDRESS = 0x40
REG_CONFIG = 0x00
REG_BUS_VOLTAGE = 0x02
REG_SHUNT_VOLTAGE = 0x01
REG_POWER = 0x03
REG_CURRENT = 0x04
REG_CALIBRATION = 0x05

BASE = 0x4000
AVG = 0b010 << 9
VSCHCT = 0b100 << 6
VBUSCT = 0b100 << 3
MODE = 0b111 
REG_CONF_VALUE = (BASE | AVG | VSCHCT | VBUSCT | MODE)

EXPECTED_LOAD = 2 # in amps
R_SHUNT = 0.1
Current_LSB = EXPECTED_LOAD / (2**15)
CAL = 0.00512 / (Current_LSB * R_SHUNT)
#print(CAL)
REG_CAL_VALUE = int(CAL)

ENERGY_BUFFER_DURATION = 10  # Duration in seconds to accumulate energy readings

# Function to write to a register
def write_register(reg, data):
    try:
        data = (data >> 8) | ((data & 0xFF) << 8)
        bus.write_word_data(ADDRESS, reg, data)
    except OSError as e:
        print(f"Failed to write to I2C device at address {ADDRESS}: {e}")

# Create an instance of the SMBus
bus = smbus.SMBus(1)

# Function to read and swap bytes
def read_register(reg):
    try:
        data = bus.read_word_data(ADDRESS, reg)
        return (data & 0xFF) << 8 | (data >> 8)
    except OSError as e:
        print(f"Failed to read from I2C device at address {ADDRESS}: {e}")
        return None

# Function to get bus voltage
def get_bus_voltage():
    raw_voltage = read_register(REG_BUS_VOLTAGE)
    return raw_voltage * 0.00125 # INA226 has 1.25mV resolution

# Function to get shunt voltage
def get_shunt_voltage():
    raw_voltage = read_register(REG_SHUNT_VOLTAGE)
    if raw_voltage is not None:
        # Check if the value is negative (MSB is set)
        if raw_voltage & 0x8000:
            # Convert from two's complement
            raw_voltage = -((~raw_voltage - 1) & 0xFFFF) 
        return raw_voltage * 0.0025 # INA226 has 2.5uV resolution
    else:
        return None


# Function to get current
def get_current():
    raw_current = read_register(REG_CURRENT)
    return raw_current * Current_LSB 


 # Function to get power
#def get_power():
#    raw_power = read_register(REG_POWER)
#    return raw_power * 25 * 0.001 * Current_LSB

try:
    # Check if INA226 is accessible
    if read_register(REG_BUS_VOLTAGE) is None:
        raise SystemExit("INA226 sensor not found or I2C bus error.")

    write_register(REG_CONFIG, REG_CONF_VALUE)
    write_register(REG_CALIBRATION, REG_CAL_VALUE)
    print(hex(REG_CONF_VALUE))
    print(format(REG_CONF_VALUE, '#018b'))

    energy_buffer = 0.0  # Initialize energy buffer
    last_power_reading = 0.0  # Store the last power reading
    start_time = time.time()  # Start time for the energy buffer

    while True:
        bus_voltage = get_bus_voltage()
        shunt_voltage = get_shunt_voltage()
        current = get_current()
        bus_voltage = 2.5 or get_bus_voltage()
        shunt_voltage = 25 or get_shunt_voltage()
        current = 0.6 or get_current()
        #power = get_power()

        current_power_reading = bus_voltage * current if bus_voltage and current else 0
        if not last_power_reading == 0:
            # Calculate the average power over the last second
            average_power = (last_power_reading + current_power_reading) / 2
            # Update the power buffer with the average power
            power_buffer += average_power

        last_power_reading = current_power_reading

        # If any reading fails, skip the iteration
        if bus_voltage is None or shunt_voltage is None or current is None:
            print("Failed to read sensor data. Skipping...")
            time.sleep(1)
            continue

        print(f"{bus_voltage}V @ {current} A = {current_power_reading}")

        # Check if 10 seconds have passed
        if time.time() - start_time >= ENERGY_BUFFER_DURATION:
            # Convert energy buffer to joules (J)
            energy_consumed_J = energy_buffer * 3600
            print(f"Energy measured in the last {ENERGY_BUFFER_DURATION} seconds: {energy_consumed_J:.2f} J")
            # Reset the energy buffer and start time
            energy_buffer = 0.0
            start_time = time.time()

        time.sleep(1)

except KeyboardInterrupt:
    print("Script stopped by user.")
