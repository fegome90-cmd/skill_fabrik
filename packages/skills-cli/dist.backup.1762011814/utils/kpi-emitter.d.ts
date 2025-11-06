export interface KPIEvent {
    timestamp: string;
    type: string;
    data: Record<string, unknown>;
}
export declare function emitKPI(event: KPIEvent): Promise<void>;
//# sourceMappingURL=kpi-emitter.d.ts.map