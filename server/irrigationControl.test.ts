import { describe, it, expect } from "vitest";
import {
  createControlAdapter,
  executeControl,
  emergencyKillSwitch,
  controlValidationRules,
  ControlRequest,
} from "./irrigationControl";
import { IrrigationEquipment } from "../drizzle/schema";

describe("Irrigation Control", () => {
  const mockEquipment: IrrigationEquipment = {
    id: 1,
    farmId: 1,
    name: "Center Pivot A",
    equipmentType: "center_pivot",
    controlProtocol: "modbus_tcp",
    ipAddress: "192.168.1.100",
    port: 502,
    modbusSlaveId: 1,
    mqttTopic: null,
    coverageAreaAcres: 40,
    maxFlowRateGpm: 500,
    status: "operational",
    lastStatusUpdate: new Date(),
    description: "Main center pivot",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("createControlAdapter", () => {
    it("should create Modbus TCP adapter", () => {
      const adapter = createControlAdapter(mockEquipment);
      expect(adapter).toBeDefined();
    });

    it("should create MQTT adapter", () => {
      const mqttEquipment = { ...mockEquipment, controlProtocol: "mqtt" as const };
      const adapter = createControlAdapter(mqttEquipment);
      expect(adapter).toBeDefined();
    });

    it("should create GPIO relay adapter", () => {
      const gpioEquipment = { ...mockEquipment, controlProtocol: "gpio_relay" as const };
      const adapter = createControlAdapter(gpioEquipment);
      expect(adapter).toBeDefined();
    });

    it("should create HTTP adapter", () => {
      const httpEquipment = { ...mockEquipment, controlProtocol: "http" as const };
      const adapter = createControlAdapter(httpEquipment);
      expect(adapter).toBeDefined();
    });

    it("should create manual adapter", () => {
      const manualEquipment = { ...mockEquipment, controlProtocol: "manual" as const };
      const adapter = createControlAdapter(manualEquipment);
      expect(adapter).toBeDefined();
    });

    it("should throw error for unsupported protocol", () => {
      const invalidEquipment = { ...mockEquipment, controlProtocol: "invalid" as any };
      expect(() => createControlAdapter(invalidEquipment)).toThrow();
    });
  });

  describe("Validation Rules", () => {
    it("should have equipment operational rule", () => {
      const rule = controlValidationRules.find((r) => r.name === "equipment_operational");
      expect(rule).toBeDefined();
    });

    it("should validate equipment operational status", () => {
      const rule = controlValidationRules.find((r) => r.name === "equipment_operational");
      const request: ControlRequest = {
        equipment: mockEquipment,
        command: "START",
        executionMode: "DRY_RUN",
      };

      const result = rule!.validate(request);
      expect(result.valid).toBe(true);
    });

    it("should reject non-operational equipment", () => {
      const rule = controlValidationRules.find((r) => r.name === "equipment_operational");
      const nonOpEquipment = { ...mockEquipment, status: "maintenance" as const };
      const request: ControlRequest = {
        equipment: nonOpEquipment,
        command: "START",
        executionMode: "DRY_RUN",
      };

      const result = rule!.validate(request);
      expect(result.valid).toBe(false);
    });

    it("should validate duration rule", () => {
      const rule = controlValidationRules.find((r) => r.name === "valid_duration");
      expect(rule).toBeDefined();

      const validRequest: ControlRequest = {
        equipment: mockEquipment,
        command: "SET_DURATION",
        durationMinutes: 120,
        executionMode: "DRY_RUN",
      };

      const validResult = rule!.validate(validRequest);
      expect(validResult.valid).toBe(true);

      const invalidRequest: ControlRequest = {
        equipment: mockEquipment,
        command: "SET_DURATION",
        durationMinutes: 600,
        executionMode: "DRY_RUN",
      };

      const invalidResult = rule!.validate(invalidRequest);
      expect(invalidResult.valid).toBe(false);
    });

    it("should validate flow rate rule", () => {
      const rule = controlValidationRules.find((r) => r.name === "valid_flow_rate");
      expect(rule).toBeDefined();

      const validRequest: ControlRequest = {
        equipment: mockEquipment,
        command: "ADJUST_SPEED",
        targetValue: 75,
        executionMode: "DRY_RUN",
      };

      const validResult = rule!.validate(validRequest);
      expect(validResult.valid).toBe(true);

      const invalidRequest: ControlRequest = {
        equipment: mockEquipment,
        command: "ADJUST_SPEED",
        targetValue: 150,
        executionMode: "DRY_RUN",
      };

      const invalidResult = rule!.validate(invalidRequest);
      expect(invalidResult.valid).toBe(false);
    });
  });

  describe("executeControl", () => {
    it("should execute control in dry-run mode", async () => {
      const request: ControlRequest = {
        equipment: mockEquipment,
        command: "START",
        durationMinutes: 60,
        executionMode: "DRY_RUN",
      };

      const response = await executeControl(request);

      expect(response.success).toBe(true);
      expect(response.commandId).toBeDefined();
      expect(response.executedAt).toBeDefined();
    });

    it("should execute control in simulation mode", async () => {
      const request: ControlRequest = {
        equipment: mockEquipment,
        command: "ADJUST_SPEED",
        targetValue: 80,
        executionMode: "SIMULATION",
      };

      const response = await executeControl(request);

      expect(response.success).toBe(true);
      expect(response.protocol).toBe("modbus_tcp");
    });

    it("should reject control with invalid duration", async () => {
      const request: ControlRequest = {
        equipment: mockEquipment,
        command: "SET_DURATION",
        durationMinutes: 600,
        executionMode: "ACTUAL",
      };

      await expect(executeControl(request)).rejects.toThrow();
    });

    it("should reject control on non-operational equipment", async () => {
      const nonOpEquipment = { ...mockEquipment, status: "maintenance" as const };
      const request: ControlRequest = {
        equipment: nonOpEquipment,
        command: "START",
        executionMode: "ACTUAL",
      };

      await expect(executeControl(request)).rejects.toThrow();
    });
  });

  describe("emergencyKillSwitch", () => {
    it("should execute emergency stop", async () => {
      const response = await emergencyKillSwitch(mockEquipment);

      expect(response.success).toBe(true);
      expect(response.message).toContain("EMERGENCY STOP");
    });

    it("should work with all equipment types", async () => {
      const protocols = ["modbus_tcp", "mqtt", "gpio_relay", "http", "manual"] as const;

      for (const protocol of protocols) {
        const equipment = { ...mockEquipment, controlProtocol: protocol };
        const response = await emergencyKillSwitch(equipment);
        expect(response.success).toBe(true);
      }
    });
  });

  describe("Control Command Types", () => {
    it("should support START command", async () => {
      const request: ControlRequest = {
        equipment: mockEquipment,
        command: "START",
        executionMode: "DRY_RUN",
      };

      const response = await executeControl(request);
      expect(response.success).toBe(true);
    });

    it("should support STOP command", async () => {
      const request: ControlRequest = {
        equipment: mockEquipment,
        command: "STOP",
        executionMode: "DRY_RUN",
      };

      const response = await executeControl(request);
      expect(response.success).toBe(true);
    });

    it("should support ADJUST_SPEED command", async () => {
      const request: ControlRequest = {
        equipment: mockEquipment,
        command: "ADJUST_SPEED",
        targetValue: 75,
        executionMode: "DRY_RUN",
      };

      const response = await executeControl(request);
      expect(response.success).toBe(true);
    });

    it("should support SET_DURATION command", async () => {
      const request: ControlRequest = {
        equipment: mockEquipment,
        command: "SET_DURATION",
        durationMinutes: 120,
        executionMode: "DRY_RUN",
      };

      const response = await executeControl(request);
      expect(response.success).toBe(true);
    });
  });
});
