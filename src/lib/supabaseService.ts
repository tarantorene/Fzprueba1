import { getSupabaseClient } from './supabase';
import { User, Topic, Material, Question, QuizAttempt, UserProgress, CourseReview, Message } from '../types';

// ============================================================================
// MAPPING HELPER FUNCTIONS (PostgreSQL snake_case <=> TypeScript camelCase)
// ============================================================================

function mapTopicFromDB(row: any): Topic {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    minScoreToPass: row.min_score_to_pass !== undefined && row.min_score_to_pass !== null ? Number(row.min_score_to_pass) : 7,
    maxAttempts: row.max_attempts,
    timeLimitMinutes: row.time_limit_minutes,
    randomizeQuestions: row.randomize_questions,
    status: row.status,
    dueDate: row.due_date || undefined,
    targetAreas: row.target_areas || [],
    hasInitialQuiz: row.has_initial_quiz || false,
    createdAt: row.created_at,
    isDelivered: row.is_delivered || false,
    deliveredAt: row.delivered_at || undefined,
    deliveredBy: row.delivered_by || undefined,
    deliveredNotes: row.delivered_notes || undefined,
  };
}

function mapTopicToDB(topic: Partial<Topic>): any {
  const dbRow: any = {};
  if (topic.id) dbRow.id = topic.id;
  if (topic.title !== undefined) dbRow.title = topic.title;
  if (topic.description !== undefined) dbRow.description = topic.description;
  if (topic.category !== undefined) dbRow.category = topic.category;
  if (topic.minScoreToPass !== undefined) dbRow.min_score_to_pass = topic.minScoreToPass;
  if (topic.maxAttempts !== undefined) dbRow.max_attempts = topic.maxAttempts;
  if (topic.timeLimitMinutes !== undefined) dbRow.time_limit_minutes = topic.timeLimitMinutes;
  if (topic.randomizeQuestions !== undefined) dbRow.randomize_questions = topic.randomizeQuestions;
  if (topic.status !== undefined) dbRow.status = topic.status;
  if (topic.dueDate !== undefined) dbRow.due_date = topic.dueDate || null;
  if (topic.targetAreas !== undefined) dbRow.target_areas = topic.targetAreas;
  if (topic.hasInitialQuiz !== undefined) dbRow.has_initial_quiz = topic.hasInitialQuiz;
  if (topic.isDelivered !== undefined) dbRow.is_delivered = topic.isDelivered;
  if (topic.deliveredAt !== undefined) dbRow.delivered_at = topic.deliveredAt || null;
  if (topic.deliveredBy !== undefined) dbRow.delivered_by = topic.deliveredBy || null;
  if (topic.deliveredNotes !== undefined) dbRow.delivered_notes = topic.deliveredNotes || null;
  return dbRow;
}

function mapMaterialFromDB(row: any): Material & { filePath?: string; fileUrl?: string; fileName?: string; fileSize?: number } {
  return {
    id: row.id,
    topicId: row.topic_id,
    title: row.title,
    type: row.type,
    content: row.content,
    url: row.url || undefined,
    estimatedMinutes: row.estimated_minutes,
    filePath: row.file_path || undefined,
    fileUrl: row.file_url || undefined,
    fileName: row.file_name || undefined,
    fileSize: row.file_size || undefined,
  };
}

function mapMaterialToDB(material: Partial<Material & { filePath?: string; fileUrl?: string; fileName?: string; fileSize?: number }>): any {
  const dbRow: any = {};
  if (material.id) dbRow.id = material.id;
  if (material.topicId !== undefined) dbRow.topic_id = material.topicId;
  if (material.title !== undefined) dbRow.title = material.title;
  if (material.type !== undefined) dbRow.type = material.type;
  if (material.content !== undefined) dbRow.content = material.content;
  if (material.url !== undefined) dbRow.url = material.url || null;
  if (material.estimatedMinutes !== undefined) dbRow.estimated_minutes = material.estimatedMinutes;
  if (material.filePath !== undefined) dbRow.file_path = material.filePath || null;
  if (material.fileUrl !== undefined) dbRow.file_url = material.fileUrl || null;
  if (material.fileName !== undefined) dbRow.file_name = material.fileName || null;
  if (material.fileSize !== undefined) dbRow.file_size = material.fileSize || null;
  return dbRow;
}

let hasPointsColumnInQuestions = true;

function mapQuestionFromDB(row: any): Question {
  return {
    id: row.id,
    topicId: row.topic_id,
    questionText: row.question_text,
    options: row.options,
    correctOptionIndex: row.correct_option_index,
    type: row.type,
    format: row.format,
    points: row.points !== undefined && row.points !== null ? Number(row.points) : 10,
  };
}

function mapQuestionToDB(question: Partial<Question>): any {
  const dbRow: any = {};
  if (question.id) dbRow.id = question.id;
  if (question.topicId !== undefined) dbRow.topic_id = question.topicId;
  if (question.questionText !== undefined) dbRow.question_text = question.questionText;
  if (question.options !== undefined) dbRow.options = question.options;
  if (question.correctOptionIndex !== undefined) dbRow.correct_option_index = question.correctOptionIndex;
  if (question.type !== undefined) dbRow.type = question.type;
  if (question.format !== undefined) dbRow.format = question.format;
  if (hasPointsColumnInQuestions && question.points !== undefined) dbRow.points = question.points;
  return dbRow;
}

function mapAttemptFromDB(row: any): QuizAttempt {
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    topicId: row.topic_id,
    topicTitle: row.topic_title,
    score: Number(row.score),
    answers: row.answers,
    passed: row.passed,
    takenAt: row.taken_at,
    durationSeconds: row.duration_seconds,
    attemptNumber: row.attempt_number,
    type: row.type,
  };
}

function mapAttemptToDB(attempt: QuizAttempt): any {
  return {
    id: attempt.id,
    user_id: attempt.userId,
    user_email: attempt.userEmail,
    user_name: attempt.userName,
    topic_id: attempt.topicId,
    topic_title: attempt.topicTitle,
    score: attempt.score,
    answers: attempt.answers,
    passed: attempt.passed,
    duration_seconds: attempt.durationSeconds,
    attempt_number: attempt.attemptNumber,
    type: attempt.type || 'final',
    taken_at: attempt.takenAt,
  };
}

function mapProgressFromDB(row: any): UserProgress {
  return {
    userId: row.user_id,
    topicId: row.topic_id,
    completedMaterialIds: row.completed_material_ids || [],
    quizStatus: row.quiz_status,
    highestScore: row.highest_score !== null ? Number(row.highest_score) : null,
    attemptsCount: row.attempts_count,
    lastActiveAt: row.last_active_at,
    initialQuizCompleted: row.initial_quiz_completed,
    initialQuizScore: row.initial_quiz_score !== null ? Number(row.initial_quiz_score) : null,
  };
}

function mapProgressToDB(p: UserProgress): any {
  return {
    user_id: p.userId,
    topic_id: p.topicId,
    completed_material_ids: p.completedMaterialIds,
    quiz_status: p.quizStatus,
    highest_score: p.highestScore,
    attempts_count: p.attemptsCount,
    last_active_at: p.lastActiveAt,
    initial_quiz_completed: p.initialQuizCompleted || false,
    initial_quiz_score: p.initialQuizScore || null,
  };
}

function mapReviewFromDB(row: any): CourseReview {
  return {
    id: row.id,
    topicId: row.topic_id,
    userId: row.user_id,
    userName: row.user_name,
    rating: row.rating,
    comment: row.comment,
    submittedAt: row.submitted_at,
    satisfactionRating: row.satisfaction_rating,
    clarityRating: row.clarity_rating,
  };
}

function mapReviewToDB(review: CourseReview): any {
  return {
    id: review.id,
    topic_id: review.topicId,
    user_id: review.userId,
    user_name: review.userName,
    rating: review.rating,
    comment: review.comment,
    submitted_at: review.submittedAt,
    satisfaction_rating: review.satisfactionRating,
    clarity_rating: review.clarityRating,
  };
}

function mapMessageFromDB(row: any): Message {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    recipientId: row.recipient_id,
    title: row.title,
    content: row.content,
    type: row.type,
    createdAt: row.created_at,
    isRead: Boolean(row.is_read),
    topicId: row.topic_id || undefined,
    readByUserIds: Array.isArray(row.read_by_user_ids) ? row.read_by_user_ids : [],
  };
}

function mapMessageToDB(msg: Message): any {
  return {
    id: msg.id,
    sender_id: msg.senderId,
    sender_name: msg.senderName,
    recipient_id: msg.recipientId,
    title: msg.title,
    content: msg.content,
    type: msg.type,
    is_read: msg.isRead,
    topic_id: msg.topicId || null,
    created_at: msg.createdAt,
  };
}

function mapUserFromDB(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as 'admin' | 'user',
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    isActive: row.is_active,
    area: row.area || undefined,
  };
}

function mapUserToDB(user: User): any {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    password_hash: user.passwordHash,
    created_at: user.createdAt,
    is_active: user.isActive,
    area: user.area || null,
  };
}

// ============================================================================
// CORE SERVICE METHODS
// ============================================================================

export const SupabaseService = {
  // --- TOPICS ---
  async getTopics(): Promise<Topic[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error al obtener temas de Supabase:', error);
      throw error;
    }
    return (data || []).map(mapTopicFromDB);
  },

  async saveTopic(topic: Partial<Topic> & { id: string }): Promise<Topic> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase no está configurado');

    const dbRow = mapTopicToDB(topic);
    let { data, error } = await supabase
      .from('topics')
      .upsert(dbRow)
      .select()
      .single();

    if (error && (error.code === 'PGRST204' || error.message?.includes('delivered'))) {
      console.warn('Columnas de entrega no disponibles en tabla topics. Reintentando sin campos de entrega:', error.message);
      delete dbRow.is_delivered;
      delete dbRow.delivered_at;
      delete dbRow.delivered_by;
      delete dbRow.delivered_notes;
      const retryResult = await supabase
        .from('topics')
        .upsert(dbRow)
        .select()
        .single();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.warn('Error al guardar tema en Supabase:', error);
      throw error;
    }
    return mapTopicFromDB(data);
  },

  async deleteTopic(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase no está configurado');

    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Error al borrar tema de Supabase:', error);
      throw error;
    }
  },

  // --- MATERIALS & FILE UPLOADS ---
  async getMaterials(): Promise<Material[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error al obtener materiales de Supabase:', error);
      throw error;
    }
    return (data || []).map(mapMaterialFromDB);
  },

  async saveMaterial(material: Partial<Material> & { id: string }): Promise<Material> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase no está configurado');

    const dbRow = mapMaterialToDB(material);
    const { data, error } = await supabase
      .from('materials')
      .upsert(dbRow)
      .select()
      .single();

    if (error) {
      console.warn('Error al guardar material en Supabase:', error);
      throw error;
    }
    return mapMaterialFromDB(data);
  },

  async deleteMaterial(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase no está configurado');

    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Error al borrar material de Supabase:', error);
      throw error;
    }
  },

  /**
   * Carga un archivo (.pptx, .pdf, mp4) en el bucket 'materials' de Supabase Storage.
   * Retorna la ruta del archivo y su URL de descarga pública.
   */
  async uploadMaterialFile(file: File, topicId: string): Promise<{ filePath: string; fileUrl: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase no está configurado');

    const fileExt = file.name.split('.').pop();
    const cleanedFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
    const filePath = `materials/${topicId}/${cleanedFileName}`;

    try {
      // Intentar crear el bucket 'materials' en caso de que no exista
      try {
        await supabase.storage.createBucket('materials', { public: true });
      } catch (e) {
        // Ignorar error si ya existe o no hay permisos globales para crear buckets
      }

      // Carga el archivo en el bucket 'materials'
      let { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      // Si falló por bucket no encontrado, intentar crearlo explícitamente y reintentar la subida
      if (uploadError && (uploadError.message?.toLowerCase().includes('not found') || uploadError.message?.toLowerCase().includes('bucket'))) {
        try {
          const { error: createError } = await supabase.storage.createBucket('materials', { public: true });
          if (!createError) {
            const retryResult = await supabase.storage
              .from('materials')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
              });
            uploadError = retryResult.error;
          }
        } catch (retryErr) {
          console.error('Error al intentar crear el bucket de materiales:', retryErr);
        }
      }

      if (uploadError) {
        console.warn('Error al cargar archivo en Supabase Storage, aplicando fallback local:', uploadError);
        // Fallback local utilizando FileReader/Base64 para que el usuario pueda avanzar sin interrupciones
        const localUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        return {
          filePath: `local-fallback/${cleanedFileName}`,
          fileUrl: localUrl
        };
      }

      // Obtiene la URL pública para descargar/visualizar el archivo
      const { data } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath);

      return {
        filePath,
        fileUrl: data.publicUrl
      };
    } catch (fallbackErr) {
      console.warn('Excepción de almacenamiento detectada, aplicando fallback local:', fallbackErr);
      const localUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      return {
        filePath: `local-fallback/${cleanedFileName}`,
        fileUrl: localUrl
      };
    }
  },

  // --- QUESTIONS ---
  async getQuestions(): Promise<Question[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error al obtener preguntas de Supabase:', error);
      throw error;
    }

    // Auto-detect if questions table has points column in schema
    if (data && data.length > 0) {
      const sampleRow = data[0];
      if (!('points' in sampleRow)) {
        hasPointsColumnInQuestions = false;
      }
    }

    return (data || []).map(mapQuestionFromDB);
  },

  async saveQuestion(question: Partial<Question> & { id: string }): Promise<Question> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase no está configurado');

    const dbRow = mapQuestionToDB(question);
    if (!hasPointsColumnInQuestions) {
      delete dbRow.points;
    }

    let { data, error } = await supabase
      .from('questions')
      .upsert(dbRow)
      .select()
      .single();

    // If 'points' column does not exist in schema cache (PGRST204)
    if (error && (error.code === 'PGRST204' || error.message?.includes('points'))) {
      console.warn('La tabla questions no tiene la columna points en Supabase (PGRST204). Reintentando sin el campo points:', error.message);
      hasPointsColumnInQuestions = false;
      const retryRow = { ...dbRow };
      delete retryRow.points;

      const retryResult = await supabase
        .from('questions')
        .upsert(retryRow)
        .select()
        .single();
      
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.warn('Error al guardar pregunta en Supabase:', error);
      throw error;
    }
    const result = mapQuestionFromDB(data || dbRow);
    if (question.points !== undefined) {
      result.points = question.points;
    }
    return result;
  },

  async deleteQuestion(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase no está configurado');

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Error al eliminar pregunta de Supabase:', error);
      throw error;
    }
  },

  // --- QUIZ ATTEMPTS ---
  async getAttempts(): Promise<QuizAttempt[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .order('taken_at', { ascending: false });

    if (error) {
      console.warn('Error al obtener intentos de Supabase:', error);
      throw error;
    }
    return (data || []).map(mapAttemptFromDB);
  },

  async saveAttempt(attempt: QuizAttempt): Promise<QuizAttempt> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase no está configurado');

    const dbRow = mapAttemptToDB(attempt);
    const { data, error } = await supabase
      .from('quiz_attempts')
      .upsert(dbRow, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      // Catch unique key violation (23505) and return attempt safely
      if (error.code === '23505' || error.message?.includes('quiz_attempts_pkey') || error.message?.includes('duplicate key')) {
        console.info('Intento de examen ya existe en Supabase (duplicado absorbido):', attempt.id);
        return attempt;
      }
      console.warn('Error al registrar intento en Supabase:', error);
      throw error;
    }
    return mapAttemptFromDB(data);
  },

  // --- USER PROGRESS ---
  async getProgress(): Promise<UserProgress[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('user_progress')
      .select('*');

    if (error) {
      console.warn('Error al obtener progreso de Supabase:', error);
      throw error;
    }
    return (data || []).map(mapProgressFromDB);
  },

  async saveProgress(progress: UserProgress): Promise<UserProgress> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase no está configurado');

    const dbRow = mapProgressToDB(progress);
    const { data, error } = await supabase
      .from('user_progress')
      .upsert(dbRow)
      .select()
      .single();

    if (error) {
      console.warn('Error al actualizar progreso en Supabase:', error);
      throw error;
    }
    return mapProgressFromDB(data);
  },

  // --- COURSE REVIEWS ---
  async getReviews(): Promise<CourseReview[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('course_reviews')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.warn('Error al obtener comentarios de Supabase:', error);
      throw error;
    }
    return (data || []).map(mapReviewFromDB);
  },

  async saveReview(review: CourseReview): Promise<CourseReview> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase no está configurado');

    const dbRow = mapReviewToDB(review);
    const { data, error } = await supabase
      .from('course_reviews')
      .upsert(dbRow, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      // Catch unique key violation (23505) and return review safely
      if (error.code === '23505' || error.message?.includes('course_reviews_pkey') || error.message?.includes('duplicate key')) {
        console.info('Comentario de curso ya existe en Supabase (duplicado absorbido):', review.id);
        return review;
      }
      console.warn('Error al registrar retroalimentación en Supabase:', error);
      throw error;
    }
    return mapReviewFromDB(data);
  },

  // --- MESSAGES ---
  async getMessages(): Promise<Message[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error al obtener mensajes de Supabase:', error);
      throw error;
    }
    return (data || []).map(mapMessageFromDB);
  },

  async saveMessage(msg: Message): Promise<Message> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase no está configurado');

    const dbRow = mapMessageToDB(msg);
    const { data, error } = await supabase
      .from('messages')
      .upsert(dbRow)
      .select()
      .single();

    if (error) {
      console.warn('Error al guardar mensaje en Supabase:', error);
      throw error;
    }
    return mapMessageFromDB(data);
  },

  async markMessageAsRead(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.warn('Error al marcar mensaje como leído en Supabase:', error);
    }
  },

  async markAllMessagesAsRead(recipientId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .or(`recipient_id.eq.${recipientId},recipient_id.eq.ALL`);

      if (error) {
        console.warn('Error al marcar todos los mensajes como leídos en Supabase:', error);
      }
    } catch (err) {
      console.warn('Excepción al marcar todos los mensajes como leídos:', err);
    }
  },

  async deleteMessage(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Error al eliminar mensaje de Supabase:', error);
      throw error;
    }
  },

  // --- SUBMISSIONS (Colaboradores cargan tareas o evidencias) ---
  async uploadSubmissionFile(file: File, userId: string, topicId: string): Promise<{ fileUrl: string; filePath: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase no está configurado');

    const fileExt = file.name.split('.').pop();
    const cleanedFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
    const filePath = `submissions/${userId}/${topicId}/${cleanedFileName}`;

    try {
      // Intentar crear el bucket 'submissions' en caso de que no exista
      try {
        await supabase.storage.createBucket('submissions', { public: true });
      } catch (e) {
        // Ignorar error si ya existe o no hay permisos globales para crear buckets
      }

      // Carga el archivo en el bucket 'submissions'
      let { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      // Si falló por bucket no encontrado, intentar crearlo explícitamente y reintentar la subida
      if (uploadError && (uploadError.message?.toLowerCase().includes('not found') || uploadError.message?.toLowerCase().includes('bucket'))) {
        try {
          const { error: createError } = await supabase.storage.createBucket('submissions', { public: true });
          if (!createError) {
            const retryResult = await supabase.storage
              .from('submissions')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
              });
            uploadError = retryResult.error;
          }
        } catch (retryErr) {
          console.error('Error al intentar crear el bucket de entregables:', retryErr);
        }
      }

      let finalUrl = '';
      let finalPath = filePath;

      if (uploadError) {
        console.warn('Error al cargar entregable en Supabase, aplicando fallback local:', uploadError);
        const localUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        finalUrl = localUrl;
        finalPath = `local-fallback/${cleanedFileName}`;
      } else {
        // Obtiene la URL pública del entregable
        const { data } = supabase.storage
          .from('submissions')
          .getPublicUrl(filePath);
        finalUrl = data.publicUrl;
      }

      // Registra la entrega en la tabla 'user_assignments'
      await supabase.from('user_assignments').insert({
        user_id: userId,
        topic_id: topicId,
        title: file.name.replace(/\.[^/.]+$/, ""),
        file_path: finalPath,
        file_url: finalUrl,
        file_name: file.name,
        file_size: file.size,
      });

      return {
        filePath: finalPath,
        fileUrl: finalUrl
      };
    } catch (fallbackErr) {
      console.warn('Excepción de almacenamiento detectada, aplicando fallback local:', fallbackErr);
      const localUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      try {
        await supabase.from('user_assignments').insert({
          user_id: userId,
          topic_id: topicId,
          title: file.name.replace(/\.[^/.]+$/, ""),
          file_path: `local-fallback/${cleanedFileName}`,
          file_url: localUrl,
          file_name: file.name,
          file_size: file.size,
        });
      } catch (dbErr) {
        console.error('Error al insertar registro local en la base de datos:', dbErr);
      }

      return {
        filePath: `local-fallback/${cleanedFileName}`,
        fileUrl: localUrl
      };
    }
  },

  // --- USERS / PROFILES ---
  async getUsers(): Promise<User[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error al obtener perfiles de Supabase:', error);
      throw error;
    }
    return (data || []).map(mapUserFromDB);
  },

  async saveUser(user: User): Promise<User> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase no está configurado');

    const dbRow = mapUserToDB(user);
    const { data, error } = await supabase
      .from('profiles')
      .upsert(dbRow)
      .select()
      .single();

    if (error) {
      console.warn('Error al guardar perfil en Supabase:', error);
      throw error;
    }
    return mapUserFromDB(data);
  },

  async deleteUser(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase no está configurado');

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Error al borrar perfil de Supabase:', error);
      throw error;
    }
  }
};
