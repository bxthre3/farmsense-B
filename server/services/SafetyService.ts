/**
 * FarmSense Unified Platform - Resolution-Aware Safety & Interlocks
 * 
 * Implements deterministic safety layers for multi-protocol control
 * and resolution-aware decision gating.
 */

import { DomainType, BaseRecommendation } from '../../shared/types.js';

export interface ResolutionMetadata {
  spatialResolution: number; // meters
  temporalResolution: number; // minutes
  confidenceScore: number; // 0.0 to 1.0
  sourceType: 'SENSOR' | 'SATELLITE' | 'MODEL' | 'MANUAL';
}

export interface SafetyInterlock {
  id: string;
  domain: DomainType;
  condition: string;
  isTripped: boolean;
  severity: 'BLOCK' | 'WARN';
  message: string;
}

export class SafetyService {
  /**
   * Assess if a recommendation is safe for actuation based on resolution
   */
  static assessResolutionSafety(
    domain: DomainType,
    resolution: ResolutionMetadata
  ): { isSafe: boolean; reason?: string } {
    // Deterministic safety gates based on domain requirements
    switch (domain) {
      case DomainType.IRRIGATION:
        // Irrigation requires high temporal resolution (< 60 mins) and high confidence
        if (resolution.temporalResolution > 60) {
          return { isSafe: false, reason: "Temporal resolution too low for real-time irrigation control (> 60 mins)." };
        }
        if (resolution.confidenceScore < 0.7) {
          return { isSafe: false, reason: "Data confidence score below safety threshold (0.7)." };
        }
        break;
      
      case DomainType.PLANTING:
        // Planting requires high spatial resolution for precision placement
        if (resolution.spatialResolution > 5) {
          return { isSafe: false, reason: "Spatial resolution too low for precision planting (> 5m)." };
        }
        break;
    }

    return { isSafe: true };
  }

  /**
   * Check for multi-protocol safety interlocks
   */
  static checkInterlocks(
    domain: DomainType,
    activeProtocols: string[],
    currentEquipmentStatus: string
  ): SafetyInterlock[] {
    const interlocks: SafetyInterlock[] = [];

    // 1. Protocol Conflict Interlock
    if (activeProtocols.includes('MODBUS') && activeProtocols.includes('MQTT')) {
      interlocks.push({
        id: 'INT-001',
        domain,
        condition: 'MULTI_PROTOCOL_CONFLICT',
        isTripped: true,
        severity: 'BLOCK',
        message: 'Simultaneous Modbus and MQTT control detected. Blocking actuation to prevent race conditions.'
      });
    }

    // 2. Equipment Readiness Interlock
    if (currentEquipmentStatus === 'MAINTENANCE') {
      interlocks.push({
        id: 'INT-002',
        domain,
        condition: 'EQUIPMENT_MAINTENANCE',
        isTripped: true,
        severity: 'BLOCK',
        message: 'Equipment is in maintenance mode. Actuation blocked.'
      });
    }

    return interlocks;
  }
}
