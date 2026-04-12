/**
 * Sensor Simulator
 * Generates realistic sensor values with natural drift
 * Supports temperature, humidity, CO2, light, and occupancy readings
 */

type SensorType = "temperature" | "humidity" | "co2" | "noise" | "light" | "occupancy" | "pm25" | "voc";

interface SensorValue {
  type: SensorType;
  value: number;
  unit: string;
  timestamp: number;
}

interface SensorState {
  temperature: number;
  humidity: number;
  co2: number;
  light: number;
  occupancy: number;
  noise: number;
  pm25: number;
  voc: number;
}

interface ControlState {
  targetTemperature: number;
  lightOn: boolean;
  dimmerLevel: number; // 0-100
}

interface ZoneSimulation {
  zoneId: number;
  state: SensorState;
  controls: ControlState;
  lastUpdate: number;
}

export class SensorSimulator {
  private static instance: SensorSimulator;
  private simulations: Map<number, ZoneSimulation> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL_MS = 5000; // 5 seconds

  private constructor() {}

  static getInstance(): SensorSimulator {
    if (!SensorSimulator.instance) {
      SensorSimulator.instance = new SensorSimulator();
    }
    return SensorSimulator.instance;
  }

  /**
   * Initialize simulation for a zone
   */
  initializeZone(zoneId: number, initialState?: Partial<SensorState>): void {
    if (this.simulations.has(zoneId)) return;

    const defaultState: SensorState = {
      temperature: 21.5,
      humidity: 45,
      co2: 600,
      light: 400,
      occupancy: 0,
      noise: 45,
      pm25: 15,
      voc: 200,
    };

    const state = { ...defaultState, ...initialState };

    this.simulations.set(zoneId, {
      zoneId,
      state,
      controls: {
        targetTemperature: 21,
        lightOn: true,
        dimmerLevel: 75,
      },
      lastUpdate: Date.now(),
    });

    this.ensureInterval();
  }

  /**
   * Get current sensor readings for a zone
   */
  getReadings(zoneId: number): SensorValue[] {
    const sim = this.simulations.get(zoneId);
    if (!sim) return [];

    const readings: SensorValue[] = [];
    const timestamp = Date.now();

    readings.push({ type: "temperature", value: parseFloat(sim.state.temperature.toFixed(1)), unit: "°C", timestamp });
    readings.push({ type: "humidity", value: Math.round(sim.state.humidity), unit: "%", timestamp });
    readings.push({ type: "co2", value: Math.round(sim.state.co2), unit: "ppm", timestamp });
    readings.push({ type: "light", value: Math.round(sim.state.light), unit: "lux", timestamp });
    readings.push({ type: "occupancy", value: Math.round(sim.state.occupancy), unit: "", timestamp });
    readings.push({ type: "noise", value: parseFloat(sim.state.noise.toFixed(1)), unit: "dB", timestamp });
    readings.push({ type: "pm25", value: parseFloat(sim.state.pm25.toFixed(1)), unit: "µg/m³", timestamp });
    readings.push({ type: "voc", value: Math.round(sim.state.voc), unit: "ppb", timestamp });

    return readings;
  }

  /**
   * Set target temperature for a zone's HVAC
   */
  setTargetTemperature(zoneId: number, targetTemp: number): boolean {
    const sim = this.simulations.get(zoneId);
    if (!sim) {
      this.initializeZone(zoneId);
      const newSim = this.simulations.get(zoneId);
      if (!newSim) return false;
      newSim.controls.targetTemperature = Math.max(16, Math.min(28, targetTemp));
      return true;
    }
    sim.controls.targetTemperature = Math.max(16, Math.min(28, targetTemp));
    return true;
  }

  /**
   * Toggle light on/off
   */
  toggleLight(zoneId: number, on: boolean): boolean {
    const sim = this.simulations.get(zoneId);
    if (!sim) {
      this.initializeZone(zoneId);
      const newSim = this.simulations.get(zoneId);
      if (!newSim) return false;
      newSim.controls.lightOn = on;
      return true;
    }
    sim.controls.lightOn = on;
    return true;
  }

  /**
   * Set light dimmer level (0-100)
   */
  setDimmerLevel(zoneId: number, level: number): boolean {
    const sim = this.simulations.get(zoneId);
    if (!sim) {
      this.initializeZone(zoneId);
      const newSim = this.simulations.get(zoneId);
      if (!newSim) return false;
      newSim.controls.dimmerLevel = Math.max(0, Math.min(100, level));
      return true;
    }
    sim.controls.dimmerLevel = Math.max(0, Math.min(100, level));
    return true;
  }

  /**
   * Get control state for a zone
   */
  getControls(zoneId: number): ControlState | null {
    const sim = this.simulations.get(zoneId);
    return sim?.controls ?? null;
  }

  /**
   * Get alerts for values exceeding thresholds
   */
  getAlerts(zoneId: number): Array<{ type: SensorType; value: number; threshold: number; level: "warning" | "critical" }> {
    const sim = this.simulations.get(zoneId);
    if (!sim) return [];

    const alerts: Array<{ type: SensorType; value: number; threshold: number; level: "warning" | "critical" }> = [];
    const { state } = sim;

    // Temperature thresholds
    if (state.temperature > 26) alerts.push({ type: "temperature", value: state.temperature, threshold: 26, level: "critical" });
    if (state.temperature > 24) alerts.push({ type: "temperature", value: state.temperature, threshold: 24, level: "warning" });
    if (state.temperature < 18) alerts.push({ type: "temperature", value: state.temperature, threshold: 18, level: "warning" });

    // CO2 thresholds
    if (state.co2 > 1000) alerts.push({ type: "co2", value: state.co2, threshold: 1000, level: "critical" });
    if (state.co2 > 800) alerts.push({ type: "co2", value: state.co2, threshold: 800, level: "warning" });

    // Humidity thresholds
    if (state.humidity > 60) alerts.push({ type: "humidity", value: state.humidity, threshold: 60, level: "warning" });
    if (state.humidity < 30) alerts.push({ type: "humidity", value: state.humidity, threshold: 30, level: "warning" });

    // Noise thresholds
    if (state.noise > 70) alerts.push({ type: "noise", value: state.noise, threshold: 70, level: "critical" });
    if (state.noise > 55) alerts.push({ type: "noise", value: state.noise, threshold: 55, level: "warning" });

    return alerts;
  }

  /**
   * Start the simulation update loop
   */
  start(): void {
    if (this.updateInterval) return;

    this.updateInterval = setInterval(() => {
      this.updateAllSimulations();
    }, this.UPDATE_INTERVAL_MS);
  }

  /**
   * Stop the simulation update loop
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Ensure interval is running (start it if needed)
   */
  private ensureInterval(): void {
    if (!this.updateInterval) {
      this.start();
    }
  }

  /**
   * Update all zone simulations with natural drift
   */
  private updateAllSimulations(): void {
    for (const [zoneId, sim] of this.simulations.entries()) {
      this.updateZoneSimulation(sim);
    }
  }

  /**
   * Update a single zone's simulation with realistic sensor changes
   */
  private updateZoneSimulation(sim: ZoneSimulation): void {
    const { state, controls } = sim;

    // Temperature drift towards target with HVAC influence
    if (controls.lightOn && controls.dimmerLevel > 0) {
      // Lights generate heat
      state.temperature += (Math.random() - 0.4) * 0.3;
    } else {
      // Natural drift or HVAC
      const diff = controls.targetTemperature - state.temperature;
      state.temperature += (diff * 0.05 + (Math.random() - 0.5) * 0.15);
    }
    state.temperature = Math.max(16, Math.min(30, state.temperature));

    // Humidity: slight random drift, affected by temperature
    state.humidity += (Math.random() - 0.5) * 2;
    state.humidity = Math.max(20, Math.min(80, state.humidity));

    // CO2: increases naturally, affected by occupancy
    const co2Change = 0.1 + (state.occupancy > 0 ? state.occupancy * 0.2 : 0) + (Math.random() - 0.5) * 5;
    state.co2 += co2Change;
    state.co2 = Math.max(300, Math.min(1500, state.co2));

    // Light: affected by dimmer and time of day
    if (controls.lightOn && controls.dimmerLevel > 0) {
      state.light = 100 + (controls.dimmerLevel * 7) + (Math.random() - 0.5) * 20;
    } else {
      state.light = Math.max(50, state.light - (Math.random() + 0.3) * 30);
    }
    state.light = Math.max(50, Math.min(900, state.light));

    // Occupancy: random fluctuation simulating people entering/leaving
    if (Math.random() < 0.1) {
      // 10% chance to change occupancy
      state.occupancy += Math.floor((Math.random() - 0.5) * 4);
    }
    state.occupancy = Math.max(0, Math.min(50, state.occupancy));

    // Noise: higher with more occupancy
    const noiseBase = 40 + (state.occupancy > 0 ? state.occupancy * 0.5 : 0);
    state.noise = noiseBase + (Math.random() - 0.5) * 5;
    state.noise = Math.max(30, Math.min(85, state.noise));

    // PM2.5: slight drift (outdoor air quality)
    state.pm25 += (Math.random() - 0.5) * 2;
    state.pm25 = Math.max(5, Math.min(300, state.pm25));

    // VOC: affected by occupancy and materials
    state.voc += (Math.random() - 0.5) * 10 + (state.occupancy > 0 ? 5 : 0);
    state.voc = Math.max(100, Math.min(2000, state.voc));

    sim.lastUpdate = Date.now();
  }

  /**
   * Reset simulation for a zone
   */
  resetZone(zoneId: number): void {
    this.simulations.delete(zoneId);
  }

  /**
   * Get all active simulations
   */
  getActiveZones(): number[] {
    return Array.from(this.simulations.keys());
  }

  /**
   * Clear all simulations
   */
  clearAll(): void {
    this.simulations.clear();
    this.stop();
  }
}

export function getSensorSimulator(): SensorSimulator {
  return SensorSimulator.getInstance();
}
