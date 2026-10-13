export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseName: string;
  sets: number;
  repetitions: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Workout {
  id: string;
  studentId: string;
  title: string;
  notes?: string;
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
}
