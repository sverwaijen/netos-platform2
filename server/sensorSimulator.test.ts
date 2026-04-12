import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SensorSimulator, getSensorSimulator } from "./integrations/sensorSimulator";

describe("SensorSimulator", () => {
  let simulator: SensorSimulator;

  beforeEach(() => {
    simulator = SensorSimulator.getInstance();
    simulator.clearAll();
  });

  afterEach(() => {
    simulator.clearAll();
  });

  it("should initialize a zone with default sensor values", () => {
    simulator.initializeZone(1);
    const readings = simulator.getReadings(1);
    expect(readings.length).toBe(8);
    expect(readings.find(r => r.type === "temperature")).toBeDefined();
  });

  it("should initialize multiple zones independently", () => {
    simulator.initializeZone(1);
    simulator.initializeZone(2);
    simulator.initializeZone(3);
    expect(simulator.getActiveZones().length).toBe(3);
  });

  it("should keep temperature within valid range", () => {
    simulator.initializeZone(1);
    const readings = simulator.getReadings(1);
    const temp = readings.find(r => r.type === "temperature")?.value || 0;
    expect(temp).toBeGreaterThanOrEqual(16);
    expect(temp).toBeLessThanOrEqual(30);
  });

  it("should set target temperature", () => {
    const success = simulator.setTargetTemperature(1, 23);
    expect(success).toBe(true);
    const controls = simulator.getControls(1);
    expect(controls?.targetTemperature).toBe(23);
  });

  it("should clamp target temperature to valid range", () => {
    simulator.setTargetTemperature(1, 35);
    let controls = simulator.getControls(1);
    expect(controls?.targetTemperature).toBe(28);

    simulator.setTargetTemperature(1, 10);
    controls = simulator.getControls(1);
    expect(controls?.targetTemperature).toBe(16);
  });

  it("should toggle light on/off", () => {
    simulator.toggleLight(1, true);
    let controls = simulator.getControls(1);
    expect(controls?.lightOn).toBe(true);

    simulator.toggleLight(1, false);
    controls = simulator.getControls(1);
    expect(controls?.lightOn).toBe(false);
  });

  it("should set dimmer level (0-100)", () => {
    simulator.setDimmerLevel(1, 50);
    let controls = simulator.getControls(1);
    expect(controls?.dimmerLevel).toBe(50);
  });

  it("should detect high temperature critical alert", () => {
    simulator.clearAll();
    simulator.initializeZone(1, { temperature: 27 });
    const alerts = simulator.getAlerts(1);
    const criticalTemp = alerts.find(a => a.type === "temperature" && a.level === "critical");
    expect(criticalTemp).toBeDefined();
    expect(criticalTemp?.threshold).toBe(26);
  });
});
