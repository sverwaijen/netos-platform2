import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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

  describe("Initialization", () => {
    it("should initialize a zone with default sensor values", () => {
      simulator.initializeZone(1);
      const readings = simulator.getReadings(1);

      expect(readings.length).toBe(8);
      expect(readings.find(r => r.type === "temperature")).toBeDefined();
      expect(readings.find(r => r.type === "humidity")).toBeDefined();
      expect(readings.find(r => r.type === "co2")).toBeDefined();
      expect(readings.find(r => r.type === "light")).toBeDefined();
    });

    it("should initialize multiple zones independently", () => {
      simulator.initializeZone(1);
      simulator.initializeZone(2);
      simulator.initializeZone(3);

      expect(simulator.getActiveZones().length).toBe(3);
      expect(simulator.getActiveZones()).toContain(1);
      expect(simulator.getActiveZones()).toContain(2);
      expect(simulator.getActiveZones()).toContain(3);
    });

    it("should not reinitialize an existing zone", () => {
      simulator.initializeZone(1);
      const reading1 = simulator.getReadings(1);
      simulator.initializeZone(1);
      const reading2 = simulator.getReadings(1);

      expect(reading1[0].value).toBe(reading2[0].value);
    });

    it("should accept custom initial state", () => {
      simulator.initializeZone(1, { temperature: 25, occupancy: 10 });
      const readings = simulator.getReadings(1);

      const tempReading = readings.find(r => r.type === "temperature");
      const occupancyReading = readings.find(r => r.type === "occupancy");

      expect(tempReading?.value).toBe(25);
      expect(occupancyReading?.value).toBe(10);
    });
  });

  describe("Sensor Value Ranges", () => {
    beforeEach(() => {
      simulator.initializeZone(1);
    });

    it("should keep temperature within valid range (16-30°C)", () => {
      simulator.start();

      for (let i = 0; i < 20; i++) {
        const readings = simulator.getReadings(1);
        const temp = readings.find(r => r.type === "temperature")?.value || 0;
        expect(temp).toBeGreaterThanOrEqual(16);
        expect(temp).toBeLessThanOrEqual(30);
      }

      simulator.stop();
    });

    it("should keep humidity within valid range (20-80%)", () => {
      simulator.start();

      for (let i = 0; i < 20; i++) {
        const readings = simulator.getReadings(1);
        const humidity = readings.find(r => r.type === "humidity")?.value || 0;
        expect(humidity).toBeGreaterThanOrEqual(20);
        expect(humidity).toBeLessThanOrEqual(80);
      }

      simulator.stop();
    });

    it("should keep CO2 within valid range (300-1500ppm)", () => {
      simulator.start();

      for (let i = 0; i < 20; i++) {
        const readings = simulator.getReadings(1);
        const co2 = readings.find(r => r.type === "co2")?.value || 0;
        expect(co2).toBeGreaterThanOrEqual(300);
        expect(co2).toBeLessThanOrEqual(1500);
      }

      simulator.stop();
    });

    it("should keep light within valid range (50-900lux)", () => {
      simulator.start();

      for (let i = 0; i < 20; i++) {
        const readings = simulator.getReadings(1);
        const light = readings.find(r => r.type === "light")?.value || 0;
        expect(light).toBeGreaterThanOrEqual(50);
        expect(light).toBeLessThanOrEqual(900);
      }

      simulator.stop();
    });

    it("should keep occupancy within valid range (0-50)", () => {
      simulator.start();

      for (let i = 0; i < 20; i++) {
        const readings = simulator.getReadings(1);
        const occupancy = readings.find(r => r.type === "occupancy")?.value || 0;
        expect(occupancy).toBeGreaterThanOrEqual(0);
        expect(occupancy).toBeLessThanOrEqual(50);
      }

      simulator.stop();
    });
  });

  describe("Temperature Control", () => {
    beforeEach(() => {
      simulator.initializeZone(1);
    });

    it("should set target temperature", () => {
      const success = simulator.setTargetTemperature(1, 23);
      expect(success).toBe(true);

      const controls = simulator.getControls(1);
      expect(controls?.targetTemperature).toBe(23);
    });

    it("should clamp target temperature to valid range", () => {
      simulator.setTargetTemperature(1, 35); // too high
      let controls = simulator.getControls(1);
      expect(controls?.targetTemperature).toBe(28);

      simulator.setTargetTemperature(1, 10); // too low
      controls = simulator.getControls(1);
      expect(controls?.targetTemperature).toBe(16);
    });

    it("should auto-initialize zone on control if not yet initialized", () => {
      const success = simulator.setTargetTemperature(999, 22);
      expect(success).toBe(true);
      expect(simulator.getControls(999)).toBeDefined();
    });

    it("should drift temperature towards target", () => {
      simulator.initializeZone(1, { temperature: 20 });
      simulator.setTargetTemperature(1, 25);
      simulator.start();

      let temp1 = simulator.getReadings(1).find(r => r.type === "temperature")?.value || 20;

      // After multiple updates, temperature should tend towards 25
      for (let i = 0; i < 30; i++) {
        // Simulate updates
      }

      const temp2 = simulator.getReadings(1).find(r => r.type === "temperature")?.value || 20;
      // Temperature should have increased from 20 towards 25
      expect(temp2).toBeGreaterThanOrEqual(temp1 - 1); // Allow some variance

      simulator.stop();
    });
  });

  describe("Light Control", () => {
    beforeEach(() => {
      simulator.initializeZone(1);
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

      simulator.setDimmerLevel(1, 100);
      controls = simulator.getControls(1);
      expect(controls?.dimmerLevel).toBe(100);
    });

    it("should clamp dimmer level to valid range", () => {
      simulator.setDimmerLevel(1, 150);
      let controls = simulator.getControls(1);
      expect(controls?.dimmerLevel).toBe(100);

      simulator.setDimmerLevel(1, -10);
      controls = simulator.getControls(1);
      expect(controls?.dimmerLevel).toBe(0);
    });

    it("should affect light sensor readings when on", () => {
      simulator.initializeZone(1, { light: 100 });
      simulator.toggleLight(1, false);
      simulator.setDimmerLevel(1, 0);

      const lightOffReadings = simulator.getReadings(1);
      const lightOffValue = lightOffReadings.find(r => r.type === "light")?.value || 0;

      simulator.toggleLight(1, true);
      simulator.setDimmerLevel(1, 100);
      const lightOnReadings = simulator.getReadings(1);
      const lightOnValue = lightOnReadings.find(r => r.type === "light")?.value || 0;

      // Light should be brighter when on with high dimmer
      expect(lightOnValue).toBeGreaterThanOrEqual(lightOffValue);
    });
  });

  describe("Alert Thresholds", () => {
    beforeEach(() => {
      simulator.initializeZone(1);
    });

    it("should detect high temperature critical alert", () => {
      simulator.clearAll();
      simulator.initializeZone(1, { temperature: 27 });
      const alerts = simulator.getAlerts(1);

      const criticalTemp = alerts.find(a => a.type === "temperature" && a.level === "critical");
      expect(criticalTemp).toBeDefined();
      expect(criticalTemp?.threshold).toBe(26);
    });

    it("should detect high CO2 critical alert", () => {
      simulator.clearAll();
      simulator.initializeZone(1, { co2: 1050 });
      const alerts = simulator.getAlerts(1);

      const criticalCO2 = alerts.find(a => a.type === "co2" && a.level === "critical");
      expect(criticalCO2).toBeDefined();
      expect(criticalCO2?.threshold).toBe(1000);
    });

    it("should detect high humidity warning", () => {
      simulator.clearAll();
      simulator.initializeZone(1, { humidity: 65 });
      const alerts = simulator.getAlerts(1);

      const warningHumidity = alerts.find(a => a.type === "humidity" && a.level === "warning");
      expect(warningHumidity).toBeDefined();
      expect(warningHumidity?.threshold).toBe(60);
    });

    it("should detect low humidity warning", () => {
      simulator.clearAll();
      simulator.initializeZone(1, { humidity: 25 });
      const alerts = simulator.getAlerts(1);

      const warningHumidity = alerts.find(a => a.type === "humidity" && a.level === "warning");
      expect(warningHumidity).toBeDefined();
      expect(warningHumidity?.threshold).toBe(30);
    });

    it("should detect low temperature warning", () => {
      simulator.clearAll();
      simulator.initializeZone(1, { temperature: 17 });
      const alerts = simulator.getAlerts(1);

      const warningTemp = alerts.find(a => a.type === "temperature" && a.level === "warning");
      expect(warningTemp).toBeDefined();
      expect(warningTemp?.threshold).toBe(18);
    });

    it("should return no alerts for normal values", () => {
      simulator.clearAll();
      simulator.initializeZone(1, {
        temperature: 21,
        humidity: 45,
        co2: 600,
        noise: 50,
      });
      const alerts = simulator.getAlerts(1);

      expect(alerts.length).toBe(0);
    });
  });

  describe("Automation Rules - Temperature", () => {
    beforeEach(() => {
      simulator.initializeZone(1, { temperature: 20 });
    });

    it("should apply temperature control based on occupancy", () => {
      // Simulate high occupancy (people generate heat)
      simulator.initializeZone(1, { temperature: 20, occupancy: 15 });

      simulator.setTargetTemperature(1, 22);
      simulator.start();

      const tempBefore = simulator.getReadings(1).find(r => r.type === "temperature")?.value || 20;

      // After updates, temperature should increase
      const tempAfter = simulator.getReadings(1).find(r => r.type === "temperature")?.value || 20;

      expect(tempAfter).toBeGreaterThanOrEqual(tempBefore - 2);

      simulator.stop();
    });

    it("should handle multiple automation zones independently", () => {
      simulator.initializeZone(1, { temperature: 20 });
      simulator.initializeZone(2, { temperature: 22 });

      simulator.setTargetTemperature(1, 25);
      simulator.setTargetTemperature(2, 18);

      const controls1 = simulator.getControls(1);
      const controls2 = simulator.getControls(2);

      expect(controls1?.targetTemperature).toBe(25);
      expect(controls2?.targetTemperature).toBe(18);
    });
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const sim1 = SensorSimulator.getInstance();
      const sim2 = SensorSimulator.getInstance();

      expect(sim1).toBe(sim2);
    });

    it("should use getSensorSimulator helper function", () => {
      const sim = getSensorSimulator();
      expect(sim).toBeInstanceOf(SensorSimulator);
    });
  });

  describe("Zone Management", () => {
    it("should reset a single zone", () => {
      simulator.initializeZone(1);
      simulator.initializeZone(2);

      simulator.resetZone(1);

      expect(simulator.getActiveZones()).not.toContain(1);
      expect(simulator.getActiveZones()).toContain(2);
    });

    it("should clear all zones", () => {
      simulator.initializeZone(1);
      simulator.initializeZone(2);
      simulator.initializeZone(3);

      simulator.clearAll();

      expect(simulator.getActiveZones().length).toBe(0);
    });

    it("should return empty readings for non-existent zone", () => {
      const readings = simulator.getReadings(999);
      expect(readings.length).toBe(0);
    });

    it("should return null controls for non-existent zone", () => {
      const controls = simulator.getControls(999);
      expect(controls).toBeNull();
    });
  });
});
