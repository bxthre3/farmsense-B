import { EventEmitter } from "events";

/**
 * Real-time update service using Server-Sent Events (SSE)
 * Broadcasts metric updates, recommendations, and control actions to connected clients
 */

export type RealtimeEventType =
  | "metric_update"
  | "recommendation_update"
  | "control_action"
  | "equipment_status"
  | "alert";

export interface RealtimeEvent {
  type: RealtimeEventType;
  fieldId: number;
  timestamp: Date;
  data: Record<string, unknown>;
}

export interface MetricUpdateEvent extends RealtimeEvent {
  type: "metric_update";
  data: {
    metricType: string;
    value: number;
    unit: string;
    confidence: number;
    sourceResolution: string;
  };
}

export interface RecommendationUpdateEvent extends RealtimeEvent {
  type: "recommendation_update";
  data: {
    recommendation: "IRRIGATE" | "DELAY" | "HOLD";
    confidence: number;
    reasoning: string;
    durationMinutes?: number;
    flowRatePercent?: number;
  };
}

export interface ControlActionEvent extends RealtimeEvent {
  type: "control_action";
  data: {
    command: string;
    equipmentId: number;
    status: "pending" | "executing" | "completed" | "failed";
    executionMode: "DRY_RUN" | "SIMULATION" | "ACTUAL";
  };
}

export interface EquipmentStatusEvent extends RealtimeEvent {
  type: "equipment_status";
  data: {
    equipmentId: number;
    status: "operational" | "maintenance" | "error" | "offline";
    message?: string;
  };
}

export interface AlertEvent extends RealtimeEvent {
  type: "alert";
  data: {
    severity: "info" | "warning" | "critical";
    message: string;
    code?: string;
  };
}

class RealtimeService extends EventEmitter {
  private subscribers: Map<number, Set<(event: RealtimeEvent) => void>> = new Map();
  private globalSubscribers: Set<(event: RealtimeEvent) => void> = new Set();

  /**
   * Subscribe to field-specific real-time updates
   */
  subscribeToField(fieldId: number, callback: (event: RealtimeEvent) => void): () => void {
    if (!this.subscribers.has(fieldId)) {
      this.subscribers.set(fieldId, new Set());
    }
    this.subscribers.get(fieldId)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(fieldId)?.delete(callback);
    };
  }

  /**
   * Subscribe to all real-time updates
   */
  subscribeGlobal(callback: (event: RealtimeEvent) => void): () => void {
    this.globalSubscribers.add(callback);

    return () => {
      this.globalSubscribers.delete(callback);
    };
  }

  /**
   * Broadcast metric update to all subscribers
   */
  broadcastMetricUpdate(
    fieldId: number,
    metricType: string,
    value: number,
    unit: string,
    confidence: number,
    sourceResolution: string
  ): void {
    const event: MetricUpdateEvent = {
      type: "metric_update",
      fieldId,
      timestamp: new Date(),
      data: {
        metricType,
        value,
        unit,
        confidence,
        sourceResolution,
      },
    };

    this.broadcast(event);
  }

  /**
   * Broadcast irrigation recommendation update
   */
  broadcastRecommendationUpdate(
    fieldId: number,
    recommendation: "IRRIGATE" | "DELAY" | "HOLD",
    confidence: number,
    reasoning: string,
    durationMinutes?: number,
    flowRatePercent?: number
  ): void {
    const event: RecommendationUpdateEvent = {
      type: "recommendation_update",
      fieldId,
      timestamp: new Date(),
      data: {
        recommendation,
        confidence,
        reasoning,
        durationMinutes,
        flowRatePercent,
      },
    };

    this.broadcast(event);
  }

  /**
   * Broadcast control action status
   */
  broadcastControlAction(
    fieldId: number,
    equipmentId: number,
    command: string,
    status: "pending" | "executing" | "completed" | "failed",
    executionMode: "DRY_RUN" | "SIMULATION" | "ACTUAL"
  ): void {
    const event: ControlActionEvent = {
      type: "control_action",
      fieldId,
      timestamp: new Date(),
      data: {
        command,
        equipmentId,
        status,
        executionMode,
      },
    };

    this.broadcast(event);
  }

  /**
   * Broadcast equipment status change
   */
  broadcastEquipmentStatus(
    fieldId: number,
    equipmentId: number,
    status: "operational" | "maintenance" | "error" | "offline",
    message?: string
  ): void {
    const event: EquipmentStatusEvent = {
      type: "equipment_status",
      fieldId,
      timestamp: new Date(),
      data: {
        equipmentId,
        status,
        message,
      },
    };

    this.broadcast(event);
  }

  /**
   * Broadcast alert to all subscribers
   */
  broadcastAlert(
    fieldId: number,
    severity: "info" | "warning" | "critical",
    message: string,
    code?: string
  ): void {
    const event: AlertEvent = {
      type: "alert",
      fieldId,
      timestamp: new Date(),
      data: {
        severity,
        message,
        code,
      },
    };

    this.broadcast(event);
  }

  /**
   * Internal broadcast method
   */
  private broadcast(event: RealtimeEvent): void {
    // Notify field-specific subscribers
    const fieldSubscribers = this.subscribers.get(event.fieldId);
    if (fieldSubscribers) {
      fieldSubscribers.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error("[Realtime] Error in field subscriber:", error);
        }
      });
    }

    // Notify global subscribers
    this.globalSubscribers.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error("[Realtime] Error in global subscriber:", error);
      }
    });

    // Emit for event-based handling
    this.emit(event.type, event);
  }

  /**
   * Get subscriber count for monitoring
   */
  getSubscriberCount(fieldId?: number): number {
    if (fieldId !== undefined) {
      return this.subscribers.get(fieldId)?.size || 0;
    }
    return this.globalSubscribers.size;
  }

  /**
   * Clear all subscribers (for cleanup)
   */
  clearSubscribers(): void {
    this.subscribers.clear();
    this.globalSubscribers.clear();
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
