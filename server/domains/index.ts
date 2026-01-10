/**
 * FarmSense Unified Platform - Domain Engine Registry
 * 
 * Central registry for all domain engines
 */

import { DomainType } from '../../shared/types.js';
import { BaseEngine } from './BaseEngine.js';
import { PlanningEngine } from './PlanningEngine.js';
import { FieldPrepEngine } from './FieldPrepEngine.js';
import { PlantingEngine } from './PlantingEngine.js';
import { IrrigationEngine } from './IrrigationEngine.js';
import { NutrientEngine } from './NutrientEngine.js';
import { PestWeedEngine } from './PestWeedEngine.js';
import { HarvestEngine } from './HarvestEngine.js';
import { ProcessingEngine } from './ProcessingEngine.js';
import { PackagingEngine } from './PackagingEngine.js';
import { WarehousingEngine } from './WarehousingEngine.js';
import { LogisticsEngine } from './LogisticsEngine.js';

export class DomainEngineRegistry {
  private engines: Map<DomainType, BaseEngine>;

  constructor() {
    this.engines = new Map();
    this.registerEngines();
  }

  private registerEngines(): void {
    this.engines.set(DomainType.PLANNING, new PlanningEngine());
    this.engines.set(DomainType.FIELD_PREP, new FieldPrepEngine());
    this.engines.set(DomainType.PLANTING, new PlantingEngine());
    this.engines.set(DomainType.IRRIGATION, new IrrigationEngine());
    this.engines.set(DomainType.NUTRIENT, new NutrientEngine());
    this.engines.set(DomainType.PEST_WEED, new PestWeedEngine());
    this.engines.set(DomainType.HARVEST, new HarvestEngine());
    this.engines.set(DomainType.PROCESSING, new ProcessingEngine());
    this.engines.set(DomainType.PACKAGING, new PackagingEngine());
    this.engines.set(DomainType.WAREHOUSING, new WarehousingEngine());
    this.engines.set(DomainType.LOGISTICS, new LogisticsEngine());
  }

  /**
   * Get a specific domain engine
   */
  getEngine(domain: DomainType): BaseEngine | undefined {
    return this.engines.get(domain);
  }

  /**
   * Get all registered engines
   */
  getAllEngines(): Map<DomainType, BaseEngine> {
    return this.engines;
  }

  /**
   * Get list of available domains
   */
  getAvailableDomains(): DomainType[] {
    return Array.from(this.engines.keys());
  }

  /**
   * Check if a domain is available
   */
  isDomainAvailable(domain: DomainType): boolean {
    return this.engines.has(domain);
  }
}

// Singleton instance
export const domainRegistry = new DomainEngineRegistry();
