export * from './profile';
export * from './training';

export interface PlanSchema {
  id: string;
  category: '5k' | '10k' | 'half-marathon' | 'marathon';
  weeks: number;
}

export const schemaPlaceholder: PlanSchema = {
  id: 'placeholder-plan',
  category: '10k',
  weeks: 8
};
