export const CORPORATE_AREAS = [
  'ADMINISTRACION',
  'BATERIAS / BODEGA',
  'CALIDAD',
  'COMERCIO EXTERIOR',
  'MANTENIMIENTO',
  'MEDIO AMBIENTE',
  'PELLET',
  'PIROLISIS',
  'PLASTICO',
  'RECICLAJE / TRATAMIENTO DE AGUAS',
  'RECUPERACION',
  'RECURSOS HUMANOS',
  'REFINACION',
  'SALUD OCUPACIONAL',
  'SEGURIDAD INDUSTRIAL',
  'SISTEMAS INFORMATICOS'
];

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  passwordHash: string; // Stored plain text for simulation, labeled as hash for standard
  createdAt: string;
  isActive: boolean;
  area?: string; // e.g. 'ADMINISTRACION'
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  minScoreToPass: number; // e.g. 7 (scale 0-10)
  maxAttempts: number; // e.g. 3
  timeLimitMinutes: number; // e.g. 15 (0 for unlimited)
  randomizeQuestions: boolean;
  status: 'draft' | 'published';
  dueDate?: string; // Limit date / Due date format: YYYY-MM-DD
  targetAreas?: string[]; // Areas designated to see this topic. If empty/undefined/contains 'TODAS', visible to all.
  hasInitialQuiz?: boolean; // If true, requires a diagnostic / initial assessment first
  isDelivered?: boolean; // Label whether this training topic has been officially delivered/given
  deliveredAt?: string; // Date when it was delivered (YYYY-MM-DD)
  deliveredBy?: string; // Instructor/Trainer who delivered the course
  deliveredNotes?: string; // Delivery notes, observations, or feedback
}

export interface Material {
  id: string;
  topicId: string;
  title: string;
  type: 'document' | 'video' | 'interactive' | 'pdf' | 'pptx';
  content: string; // Markdown/HTML style training text
  url?: string; // Optional link or video embed URL
  estimatedMinutes: number;
  filePath?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface Question {
  id: string;
  topicId: string;
  questionText: string;
  options: string[]; // Options array
  correctOptionIndex: number; // Index of correct option (0, 1, 2, 3)
  type?: 'initial' | 'final'; // Defaults to 'final' if not specified
  format?: 'multiple' | 'true_false';
  points?: number;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  topicId: string;
  topicTitle: string;
  score: number; // 0-10 scale
  answers: { [questionId: string]: number }; // questionId -> chosen index
  passed: boolean;
  takenAt: string;
  durationSeconds: number;
  attemptNumber: number;
  type?: 'initial' | 'final'; // Distinguish between initial and final attempts
}

export interface UserProgress {
  userId: string;
  topicId: string;
  completedMaterialIds: string[]; // materials read
  quizStatus: 'not_started' | 'failed' | 'passed';
  highestScore: number | null;
  attemptsCount: number;
  lastActiveAt: string;
  initialQuizCompleted?: boolean;
  initialQuizScore?: number | null;
  completedAt?: string;
}

export interface CourseReview {
  id: string;
  topicId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5 stars
  comment: string;
  submittedAt: string;
  satisfactionRating?: number; // 0-3 satisfaction
  clarityRating?: number; // 0-3 clarity
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string; // User ID or 'ALL'
  title: string;
  content: string;
  type: 'automatic_progress' | 'automatic_due_date' | 'manual';
  createdAt: string;
  isRead: boolean;
  topicId?: string;
  readByUserIds?: string[];
}

export interface CertificateTemplate {
  id: string;
  title: string;
  subtitle: string;
  bodyText: string;
  signatureName: string;
  signatureRole: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
}


