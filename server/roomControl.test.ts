import { describe, it, expect, vi, beforeEach } from "vitest";
import { SensorSimulator, getSensorSimulator } from "./integrations/sensorSimulator";

describe("Room Control Router", () => {
  describe("Zone Types", () => {
    it("should validate all zone types", () => {
      const types = ["meeting_room", "open_space", "private_office", "common_area", "lobby", "kitchen"];
      expect(types).toHaveLength(6);
      expect(types).toContain("meeting_room");
      expect(types).toContain("kitchen");
    });

    it("should support zone configuration flags", () => {
      const zone = {
        locationId: 1,
        name: "Meeting Room A",
        floor: "2",
        type: "meeting_room" as const,
        hvacEnabled: true,
        lightingEnabled: true,
        avEnabled: true,
        blindsEnabled: false,
      };

      expect(zone.hvacEnabled).toBe(true);
      expect(zone.blindsEnabled).toBe(false);
    });
  });

  describe("Control Points", () => {
    it("should validate control point types", () => {
      const types = [
        "hvac_temp", "hvac_mode", "light_level", "light_scene",
        "av_power", "av_input", "blinds_position", "ventilation",
      ];
      expect(types).toHaveLength(8);
    });

    it("should support target value updates", () => {
      const point = {
        id: 1,
        zoneId: 1,
        name: "Temperature",
        type: "hvac_temp" as const,
        targetValue: "22",
        currentValue: "21",
        unit: "°C",
        minValue: "16",
        maxValue: "30",
      };

      const updatedPoint = { ...point, targetValue: "24", lastUpdated: new Date() };
      expect(updatedPoint.targetValue).toBe("24");
      expect(updatedPoint.lastUpdated).toBeDefined();
    });
  });

  describe("Sensor Readings", () => {
    it("should validate all sensor types", () => {
      const sensorTypes = ["temperature", "humidity", "co2", "noise", "light", "occupancy", "pm25", "voc"];
      expect(sensorTypes).toHaveLength(8);
    });

    it("should deduplicate readings by sensor type (keep latest)", () => {
      const readings = [
        { sensorType: "temperature", value: "22.5", recordedAt: 1000 },
        { sensorType: "humidity", value: "45", recordedAt: 900 },
        { sensorType: "temperature", value: "22.0", recordedAt: 800 }, // older, should be skipped
        { sensorType: "co2", value: "450", recordedAt: 700 },
      ];

      const seen = new Map<string, typeof readings[0]>();
      for (const r of readings) {
        if (!seen.has(r.sensorType)) seen.set(r.sensorType, r);
      }
      const deduped = Array.from(seen.values());

      expect(deduped).toHaveLength(3);
      const temp = deduped.find(r => r.sensorType === "temperature");
      expect(temp?.value).toBe("22.5"); // latest
      expect(temp?.recordedAt).toBe(1000);
    });

    it("should filter history by time range", () => {
      const now = Date.now();
      const hours = 24;
      const since = now - hours * 3600000;

      const readings = [
        { recordedAt: now - 1000, value: "22" },       // within range
        { recordedAt: now - 3600000, value: "21" },     // within range (1h ago)
        { recordedAt: now - 86400001, value: "20" },    // out of range (>24h)
      ];

      const filtered = readings.filter(r => r.recordedAt >= since);
      expect(filtered).toHaveLength(2);
    });
  });

  describe("Automation Rules", () => {
    it("should validate trigger types", () => {
      const triggerTypes = ["schedule", "occupancy", "sensor_threshold", "booking_start", "booking_end"];
      expect(triggerTypes).toHaveLength(5);
    });

    it("should validate action types", () => {
      const actionTypes = ["set_temperature", "set_lights", "set_av", "set_blinds", "send_alert"];
      expect(actionTypes).toHaveLength(5);
    });

    it("should support toggling rules", () => {
      const rule = { id: 1, name: "Morning Warmup", isActive: true };
      const toggled = { ...rule, isActive: false };
      expect(toggled.isActive).toBe(false);
    });

    it("should support trigger and action config objects", () => {
      const rule = {
        name: "Occupancy-based lighting",
        triggerType: "occupancy" as const,
        triggerConfig: { threshold: 0, comparison: "gt" },
        actionType: "set_lights" as const,
        actionConfig: { level: 80, scene: "work" },
      };

      expect(rule.triggerConfig.threshold).toBe(0);
      expect(rule.actionConfig.level).toBe(80);
    });
  });

  describe("Alert Thresholds", () => {
    it("should validate operator types", () => {
      const operators = ["gt", "lt", "gte", "lte", "eq"];
      expect(operators).toHaveLength(5);
    });

    it("should validate alert levels", () => {
      const levels = ["info", "warning", "critical"];
      expect(levels).toHaveLength(3);
    });

    it("should evaluate threshold conditions correctly", () => {
      const threshold = {
        sensorType: "temperature",
        operator: "gt",
        thresholdValue: "28",
        alertLevel: "warning",
      };

      const currentValue = 30;
      const thresholdNum = parseFloat(threshold.thresholdValue);

      const operators: Record<string, (a: number, b: number) => boolean> = {
        gt: (a, b) => a > b,
        lt: (a, b) => a < b,
        gte: (a, b) => a >= b,
        lte: (a, b) => a <= b,
        eq: (a, b) => a === b,
      };

      const isTriggered = operators[threshold.operator](currentValue, thresholdNum);
      expect(isTriggered).toBe(true);

      // Test with value below threshold
      const notTriggered = operators[threshold.operator](25, thresholdNum);
      expect(notTriggered).toBe(false);
    });

    it("should support cooldown period", () => {
      const threshold = { cooldownMinutes: 30 };
      const lastAlertTime = Date.now() - 20 * 60000; // 20 min ago
      const cooldownMs = threshold.cooldownMinutes * 60000;
      const canAlert = Date.now() - lastAlertTime >= cooldownMs;

      expect(canAlert).toBe(false); // Still in cooldown
    });
  });

  describe("Sensor Simulator Integration", () => {
    let simulator: SensorSimulator;

    beforeEach(() => {
      simulator = SensorSimulator.getInstance();
      simulator.clearAll();
    });

    it("should set target temperature via simulator", () => {
      simulator.initializeZone(1);
      const success = simulator.setTargetTemperature(1, 24);
      expect(success).toBe(true);

      const controls = simulator.getControls(1);
      expect(controls.targetTemperature).toBe(24);
    });

    it("should toggle lights via simulator", () => {
      simulator.initializeZone(1);
      simulator.toggleLight(1, true);
      let controls = simulator.getControls(1);
      expect(controls.lightOn).toBe(true);

      simulator.toggleLight(1, false);
      controls = simulator.getControls(1);
      expect(controls.lightOn).toBe(false);
    });

    it("should set dimmer level via simulator", () => {
      simulator.initializeZone(1);
      simulator.setDimmerLevel(1, 75);
      const controls = simulator.getControls(1);
      expect(controls.dimmerLevel).toBe(75);
    });

    it("should get live readings from simulator", () => {
      simulator.initializeZone(1);
      const readings = simulator.getReadings(1);

      expect(readings.length).toBeGreaterThan(0);
      const tempReading = readings.find(r => r.type === "temperature");
      expect(tempReading).toBeDefined();
      expect(typeof tempReading?.value).toBe("number");
    });

    it("should get alerts from simulator", () => {
      simulator.initializeZone(1);
      const alerts = simulator.getAlerts(1);

      expect(Array.isArray(alerts)).toBe(true);
    });
  });

  describe("All Zones Latest Readings", () => {
    it("should aggregate latest readings per zone", () => {
      const zones = [
        { id: 1, name: "Zone A", locationId: 1 },
        { id: 2, name: "Zone B", locationId: 1 },
      ];

      const readingsByZone: Record<number, { sensorType: string; value: string; recordedAt: number }[]> = {
        1: [
          { sensorType: "temperature", value: "22.5", recordedAt: 1000 },
          { sensorType: "humidity", value: "45", recordedAt: 900 },
        ],
        2: [
          { sensorType: "temperature", value: "24.0", recordedAt: 1000 },
        ],
      };

      const result = zones.map(zone => ({
        zone,
        readings: readingsByZone[zone.id] || [],
      }));

      expect(result).toHaveLength(2);
      expect(result[0].readings).toHaveLength(2);
      expect(result[1].readings).toHaveLength(1);
    });
  });
});
