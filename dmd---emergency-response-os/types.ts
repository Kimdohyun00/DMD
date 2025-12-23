export type ViewMode = 'paramedic' | 'hospital';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  bloodType: string;
  condition: string;
}

export interface VitalSign {
  label: string;
  value: string;
  unit?: string;
  subValue?: string;
  status: 'normal' | 'warning' | 'critical';
  trend?: string;
}

export interface ChartData {
  year: string;
  value: number;
  color: string;
}

export type ChartType = 'bp' | 'bs' | 'chol';

export interface Treatment {
  id: string;
  name: string;
  icon: any; // Lucide icon type
  subText?: string;
  color: string;
  locked?: boolean;
}