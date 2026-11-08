export interface WorkoutExecution {
  id: string;
  workoutId: string;
  studentId: string;
  executedAt: string;
  durationMinutes?: number;
  notes?: string;
  createdAt: string;
}
