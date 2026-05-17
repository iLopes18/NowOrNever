import { Timestamp } from 'firebase/firestore';

export type PlanType = 'day' | 'month';

export interface PlanConfig {
  months?: string[]; // YYYY-MM
  dates?: string[]; // YYYY-MM-DD
  timeStart?: string;
  timeEnd?: string;
}

export interface Plan {
  id: string; // The access code
  type: PlanType;
  creatorId: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  config: PlanConfig;
}

export interface Participant {
  id: string;
  displayName: string;
  availability: string[]; // ISO dates or time slots
  lastActive: Timestamp;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}
