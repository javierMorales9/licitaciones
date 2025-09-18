export enum EventType {
  LICITATION_CREATED = "licitation_created",
  LICITATION_FINISHED_SUBMISSION_PERIOD = "licitation_finished_submission_period",
  LICITATION_RESOLVED = "licitation_resolved",
  LICITATION_LOT_AWARDED = "licitation_lot_awarded",
  LICITATION_AWARDED = "licitation_awarded",
}

export class Event {
  public createdAt: Date;
  public type: EventType;
  public licitationId: string;
  public lotId?: string | undefined;

  constructor(p: {
    createdAt: Date,
    type: EventType,
    licitationId: string,
    lotId?: string,
  }) {
    this.createdAt = p.createdAt;
    this.type = p.type;
    this.licitationId = p.licitationId;
    this.lotId = p.lotId;
  }
};

