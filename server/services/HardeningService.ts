/**
 * FarmSense Unified Platform - Cross-Metric Hardening Service
 * 
 * Implements data integrity validation by cross-referencing multiple sensor inputs
 * to detect anomalies, sensor drift, and physical impossibilities.
 */

import { NormalizedMetric, ResolutionMetadata } from '../../shared/types.js';

export interface HardenedMetric extends NormalizedMetric {
  integrityScore: number; // 0.0 to 1.0
  isAnomalous: boolean;
  hardeningNotes: string[];
  originalValue: number;
}

export class HardeningService {
  /**
   * Harden a set of metrics by cross-referencing them
   */
  static hardenMetrics(metrics: Record<string, NormalizedMetric>): Record<string, HardenedMetric> {
    const hardened: Record<string, HardenedMetric> = {};
    
    // Initialize hardened metrics
    for (const [key, metric] of Object.entries(metrics)) {
      hardened[key] = {
        ...metric,
        integrityScore: 1.0,
        isAnomalous: false,
        hardeningNotes: [],
        originalValue: Number(metric.value)
      };
    }

    // 1. Cross-reference: Soil Moisture vs. Precipitation
    this.validateMoistureVsPrecip(hardened);

    // 2. Cross-reference: Soil Temperature vs. Air Temperature
    this.validateSoilVsAirTemp(hardened);

    // 3. Cross-reference: Evapotranspiration vs. Humidity/Solar
    this.validateETVsEnvironment(hardened);

    // 4. Physical Bounds Check
    this.validatePhysicalBounds(hardened);

    return hardened;
  }

  private static validateMoistureVsPrecip(metrics: Record<string, HardenedMetric>) {
    const moisture = metrics['soil_moisture'];
    const precip = metrics['precipitation_24h'];
    
    if (moisture && precip) {
      const moistureVal = Number(moisture.value);
      const precipVal = Number(precip.value);
      
      // If high precipitation but moisture is dropping significantly, flag anomaly
      if (precipVal > 10 && moistureVal < 15) {
        moisture.isAnomalous = true;
        moisture.integrityScore *= 0.5;
        moisture.hardeningNotes.push(`Anomaly: Low soil moisture (${moistureVal}%) despite high 24h precipitation (${precipVal}mm). Possible sensor failure or bypass.`);
      }
    }
  }

  private static validateSoilVsAirTemp(metrics: Record<string, HardenedMetric>) {
    const soilTemp = metrics['soil_temperature'];
    const airTemp = metrics['air_temperature'];
    
    if (soilTemp && airTemp) {
      const sTemp = Number(soilTemp.value);
      const aTemp = Number(airTemp.value);
      
      // Soil temperature usually lags air temperature but stays within a reasonable delta
      const delta = Math.abs(sTemp - aTemp);
      if (delta > 25) {
        soilTemp.isAnomalous = true;
        soilTemp.integrityScore *= 0.6;
        soilTemp.hardeningNotes.push(`Anomaly: Extreme delta (${delta.toFixed(1)}°C) between soil and air temperature. Check sensor placement.`);
      }
    }
  }

  private static validateETVsEnvironment(metrics: Record<string, HardenedMetric>) {
    const et = metrics['evapotranspiration'];
    const humidity = metrics['relative_humidity'];
    
    if (et && humidity) {
      const etVal = Number(et.value);
      const humVal = Number(humidity.value);
      
      // High ET with very high humidity is physically unlikely
      if (etVal > 8 && humVal > 90) {
        et.isAnomalous = true;
        et.integrityScore *= 0.7;
        et.hardeningNotes.push(`Anomaly: High ET (${etVal}mm) reported during high humidity (${humVal}%). Potential calculation error.`);
      }
    }
  }

  private static validatePhysicalBounds(metrics: Record<string, HardenedMetric>) {
    const bounds: Record<string, { min: number; max: number }> = {
      'soil_moisture': { min: 0, max: 100 },
      'relative_humidity': { min: 0, max: 100 },
      'soil_temperature': { min: -20, max: 50 },
      'air_temperature': { min: -40, max: 60 },
      'precipitation': { min: 0, max: 500 }
    };

    for (const [key, metric] of Object.entries(metrics)) {
      const bound = bounds[key];
      if (bound) {
        const val = Number(metric.value);
        if (val < bound.min || val > bound.max) {
          metric.isAnomalous = true;
          metric.integrityScore = 0.1;
          metric.hardeningNotes.push(`Critical: Value ${val} is outside physical bounds [${bound.min}, ${bound.max}].`);
        }
      }
    }
  }
}
