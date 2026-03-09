export enum Priority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface Location {
  id: string;
  name: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export interface Beehive {
  id: string;
  name: string;
  locationId: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export interface Recording {
  id: string;
  beehiveId: string;
  locationId: string;
  userId: string;
  audioUrl: string;
  localPath: string;
  date: string;
  duration: number;
  priority: Priority;
  solved: boolean;
  lastListenedAt: number | null;
  notes?: string;
  photos?: string[];
  createdAt: number;
  updatedAt: number;
}
