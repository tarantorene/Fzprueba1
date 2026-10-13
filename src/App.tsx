import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import { User, Topic, Material, Question, QuizAttempt, UserProgress, CourseReview, Message, CertificateTemplate } from './types';
import {
  mockUsers,
  mockTopics,
  mockMaterials,
  mockQuestions,
  mockQuizAttempts,
  mockUserProgress,
  mockCourseReviews,
  mockMessages
} from './data/mockData';
import { isSupabaseConfigured, setSupabaseSyncEnabled } from './lib/supabase';
import { SupabaseService } from './lib/supabaseService';
import { Database, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const defaultTemplates: CertificateTemplate[] = [
  {
    id: 'tpl-default',
    title: 'PARTICIPACIÓN',
    subtitle: 'La Empresa Fundametz certifica que el colaborador(a):',
    bodyText: 'POR SU VALIOSA PARTICIPACIÓN EN LA CAPACITACIÓN VIRTUAL DEL CURSO DE:',
    signatureName: 'ING. VIVIANA MUÑOZ',
    signatureRole: 'JEFE DE RECURSOS HUMANOS',
    backgroundColor: '#ffffff',
    textColor: '#0B1F3F',
    isActive: true
  }
];

export default function App() {
  // --- STATE PERSISTENCE IN LOCAL STORAGE ---
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('academia_users');
      const initialUsers: User[] = saved ? JSON.parse(saved) : mockUsers;
      return initialUsers.map(u => 
        u.role === 'admin' 
          ? { ...u, email: 'admin', passwordHash: '2026' } 
          : u
      );
    } catch (e) {
      console.warn('localStorage read error:', e);
      return mockUsers;
    }
  });

  const [topics, setTopics] = useState<Topic[]>(() => {
    try {
      const saved = localStorage.getItem('academia_topics');
      const loaded: Topic[] = saved ? JSON.parse(saved) : mockTopics;
      return loaded.map(t => ({
        ...t,
        minScoreToPass: t.minScoreToPass > 10 ? Math.round(t.minScoreToPass / 10) : (t.minScoreToPass !== undefined ? t.minScoreToPass : 7)
      }));
    } catch (e) {
      console.warn('localStorage read error:', e);
      return mockTopics;
    }
  });

  const [materials, setMaterials] = useState<Material[]>(() => {
    try {
      const saved = localStorage.getItem('academia_materials');
      return saved ? JSON.parse(saved) : mockMaterials;
    } catch (e) {
      console.warn('localStorage read error:', e);
      return mockMaterials;
    }
  });

  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem('academia_questions');
      return saved ? JSON.parse(saved) : mockQuestions;
    } catch (e) {
      console.warn('localStorage read error:', e);
      return mockQuestions;
    }
  });

  const [attempts, setAttempts] = useState<QuizAttempt[]>(() => {
    try {
      const saved = localStorage.getItem('academia_attempts');
      const loaded: QuizAttempt[] = saved ? JSON.parse(saved) : mockQuizAttempts;
      return loaded.map(a => ({
        ...a,
        score: a.score > 10 ? Math.round((a.score / 10) * 10) / 10 : a.score
      }));
    } catch (e) {
      console.warn('localStorage read error:', e);
      return mockQuizAttempts;
    }
  });

  const [progress, setProgress] = useState<UserProgress[]>(() => {
    try {
      const saved = localStorage.getItem('academia_progress');
      const loaded: UserProgress[] = saved ? JSON.parse(saved) : mockUserProgress;
      return loaded.map(p => ({
        ...p,
        highestScore: p.highestScore !== null && p.highestScore > 10 ? Math.round((p.highestScore / 10) * 10) / 10 : p.highestScore,
        initialQuizScore: p.initialQuizScore !== undefined && p.initialQuizScore !== null && p.initialQuizScore > 10 ? Math.round((p.initialQuizScore / 10) * 10) / 10 : p.initialQuizScore
      }));
    } catch (e) {
      console.warn('localStorage read error:', e);
      return mockUserProgress;
    }
  });

  const [reviews, setReviews] = useState<CourseReview[]>(() => {
    try {
      const saved = localStorage.getItem('academia_reviews');
      return saved ? JSON.parse(saved) : mockCourseReviews;
    } catch (e) {
      console.warn('localStorage read error:', e);
      return mockCourseReviews;
    }
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('academia_messages');
      return saved ? JSON.parse(saved) : mockMessages;
    } catch (e) {
      console.warn('localStorage read error:', e);
      return mockMessages;
    }
  });

  const [certificateTemplates, setCertificateTemplates] = useState<CertificateTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('academia_certificate_templates');
      return saved ? JSON.parse(saved) : defaultTemplates;
    } catch (e) {
      console.warn('localStorage read error:', e);
      return defaultTemplates;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = sessionStorage.getItem('academia_session_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn('sessionStorage read error:', e);
      return null;
    }
  });

  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const syncedAttemptIdsRef = useRef<Set<string>>(new Set());
  const syncedReviewIdsRef = useRef<Set<string>>(new Set());

  // Extract project ID or hostname from VITE_SUPABASE_URL dynamically for the indicator
  // @ts-ignore
  const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseProjectId = rawSupabaseUrl
    .replace(/^https?:\/\//i, '')
    .split('.')[0] || 'Desconocido';
  const [dbSyncStatus, setDbSyncStatus] = useState<{
    state: 'idle' | 'syncing' | 'success' | 'error';
    lastSavedTable?: string;
    message?: string;
  }>({ state: 'idle' });

  const triggerSyncNotification = (table: string, status: 'syncing' | 'success' | 'error', errMsg?: string) => {
    setDbSyncStatus({
      state: status,
      lastSavedTable: table,
      message: errMsg || (status === 'success' ? `¡Guardado exitosamente en ${table} de Supabase!` : `Guardando en ${table}...`)
    });
    if (status === 'success' || status === 'error') {
      setTimeout(() => {
        setDbSyncStatus(prev => prev.state === status ? { state: 'idle' } : prev);
      }, 4000);
    }
  };

  // --- AUTOMATIC CLEANUP OF OLD MOCK DATA FOR TESTING ---
  useEffect(() => {
    try {
      const savedTopics = localStorage.getItem('academia_topics');
      const savedUsers = localStorage.getItem('academia_users');
      let parsedUsers: User[] = [];
      try {
        if (savedUsers) parsedUsers = JSON.parse(savedUsers);
      } catch (e) {}

      const hasMultipleUsers = parsedUsers.length > 1;

      if (
        (savedTopics && (savedTopics.includes('tpc-1') || savedTopics.includes('tpc-2') || savedTopics.includes('tpc-3'))) ||
        hasMultipleUsers
      ) {
        console.log('Limpiando base de datos local de demostración para iniciar pruebas limpias con solo administrador...');
        try {
          localStorage.removeItem('academia_topics');
          localStorage.removeItem('academia_materials');
          localStorage.removeItem('academia_questions');
          localStorage.removeItem('academia_attempts');
          localStorage.removeItem('academia_progress');
          localStorage.removeItem('academia_reviews');
          localStorage.removeItem('academia_messages');
          localStorage.removeItem('academia_users');
        } catch (removeErr) {
          console.warn('Failed to remove some localStorage items:', removeErr);
        }
        
        setTopics([]);
        setMaterials([]);
        setQuestions([]);
        setAttempts([]);
        setProgress([]);
        setReviews([]);
        setMessages([]);
        setUsers(mockUsers);
      }
    } catch (err) {
      console.warn('localStorage automatic cleanup check skipped due to error:', err);
    }
  }, []);

  // --- SYNCING FROM SUPABASE ON MOUNT ---
  useEffect(() => {
    async function loadSupabaseData() {
      if (!isSupabaseConfigured()) return;
      
      setSupabaseLoading(true);
      setSupabaseError(null);
      try {
        console.log('Sincronizando Aula Virtual con Supabase (Paralelizado)...');
        console.time('Supabase Load Time');
        
        // Load all tables concurrently using Promise.all to minimize roundtrip latency
        const [
          initialTopics,
          initialMaterials,
          initialQuestions,
          initialAttempts,
          initialProgress,
          initialReviews,
          initialMessages,
          initialUsers
        ] = await Promise.all([
          SupabaseService.getTopics(),
          SupabaseService.getMaterials(),
          SupabaseService.getQuestions(),
          SupabaseService.getAttempts(),
          SupabaseService.getProgress(),
          SupabaseService.getReviews(),
          SupabaseService.getMessages(),
          SupabaseService.getUsers()
        ]);

        let dbTopics = initialTopics;
        let dbMaterials = initialMaterials;
        let dbQuestions = initialQuestions;
        let dbAttempts = initialAttempts;
        let dbProgress = initialProgress;
        let dbReviews = initialReviews;
        let dbMessages = initialMessages;
        let dbUsers = initialUsers;
        
        let hasSeeded = false;

        // Seed if empty so the app is populated out-of-the-box
        if (dbTopics.length === 0) {
          console.log('La base de datos de Supabase está vacía. Sembrando datos iniciales...');
          hasSeeded = true;
          
          for (const topic of mockTopics) {
            await SupabaseService.saveTopic(topic as any);
          }
          dbTopics = await SupabaseService.getTopics();

          for (const material of mockMaterials) {
            await SupabaseService.saveMaterial(material as any);
          }

          for (const question of mockQuestions) {
            await SupabaseService.saveQuestion(question as any);
          }

          for (const message of mockMessages) {
            await SupabaseService.saveMessage(message);
          }
        }

        if (dbUsers.length === 0) {
          console.log('La base de datos de Supabase no tiene usuarios. Sembrando usuarios iniciales...');
          hasSeeded = true;
          for (const u of mockUsers) {
            await SupabaseService.saveUser(u);
          }
          dbUsers = await SupabaseService.getUsers();
        }

        // If seeding occurred, fetch clean up-to-date states
        if (hasSeeded) {
          const [
            syncedTopics,
            syncedMaterials,
            syncedQuestions,
            syncedAttempts,
            syncedProgress,
            syncedReviews,
            syncedMessages,
            syncedUsers
          ] = await Promise.all([
            SupabaseService.getTopics(),
            SupabaseService.getMaterials(),
            SupabaseService.getQuestions(),
            SupabaseService.getAttempts(),
            SupabaseService.getProgress(),
            SupabaseService.getReviews(),
            SupabaseService.getMessages(),
            SupabaseService.getUsers()
          ]);
          dbTopics = syncedTopics;
          dbMaterials = syncedMaterials;
          dbQuestions = syncedQuestions;
          dbAttempts = syncedAttempts;
          dbProgress = syncedProgress;
          dbReviews = syncedReviews;
          dbMessages = syncedMessages;
          dbUsers = syncedUsers;
        }
        
        console.timeEnd('Supabase Load Time');

        setTopics(dbTopics.map(t => ({
          ...t,
          minScoreToPass: t.minScoreToPass > 10 ? Math.round(t.minScoreToPass / 10) : (t.minScoreToPass !== undefined ? t.minScoreToPass : 7)
        })));
        setMaterials(dbMaterials);
        setQuestions(dbQuestions);
        setAttempts(dbAttempts.map(a => ({
          ...a,
          score: a.score > 10 ? Math.round((a.score / 10) * 10) / 10 : a.score
        })));
        setProgress(dbProgress.map(p => ({
          ...p,
          highestScore: p.highestScore !== null && p.highestScore > 10 ? Math.round((p.highestScore / 10) * 10) / 10 : p.highestScore,
          initialQuizScore: p.initialQuizScore !== undefined && p.initialQuizScore !== null && p.initialQuizScore > 10 ? Math.round((p.initialQuizScore / 10) * 10) / 10 : p.initialQuizScore
        })));
        setReviews(dbReviews);
        setMessages(dbMessages);
        setUsers(dbUsers);

        syncedAttemptIdsRef.current = new Set(dbAttempts.map(a => a.id));
        syncedReviewIdsRef.current = new Set(dbReviews.map(r => r.id));
        
        console.log('Sincronización con Supabase completada con éxito.');
        setSupabaseError(null);
      } catch (error: any) {
        const errorMsg = error?.message || String(error);
        console.warn('Conexión con base de datos de Supabase no disponible o tablas no inicializadas. Se activó el modo de almacenamiento local.', errorMsg);
        setSupabaseError(errorMsg);
        setSupabaseSyncEnabled(false);
      } finally {
        setSupabaseLoading(false);
      }
    }

    loadSupabaseData();
  }, [retryCount]);

  // --- INTERCEPTING STATE SETTERS FOR AUTO-SYNC WITH REAL-TIME FEEDBACK ---
  const handleSetTopics: React.Dispatch<React.SetStateAction<Topic[]>> = (value) => {
    setTopics(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (isSupabaseConfigured()) {
        const prevIds = prev.map(t => t.id);
        const nextIds = next.map(t => t.id);
        const promises: Promise<any>[] = [];
        let hasChanges = false;

        // Deleted
        prevIds.filter(id => !nextIds.includes(id)).forEach(id => {
          hasChanges = true;
          promises.push(SupabaseService.deleteTopic(id));
        });

        // Saved / Updated
        next.forEach(topic => {
          const prevTopic = prev.find(t => t.id === topic.id);
          if (!prevTopic || JSON.stringify(prevTopic) !== JSON.stringify(topic)) {
            hasChanges = true;
            promises.push(SupabaseService.saveTopic(topic as any));
          }
        });

        if (hasChanges && promises.length > 0) {
          triggerSyncNotification('Cursos', 'syncing');
          Promise.all(promises)
            .then(() => triggerSyncNotification('Cursos', 'success'))
            .catch(err => {
              console.error(err);
              triggerSyncNotification('Cursos', 'error', `Error al guardar cursos en Supabase: ${err?.message || err}`);
            });
        }
      }
      return next;
    });
  };

  const handleSetMaterials: React.Dispatch<React.SetStateAction<Material[]>> = (value) => {
    setMaterials(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (isSupabaseConfigured()) {
        const prevIds = prev.map(m => m.id);
        const nextIds = next.map(m => m.id);
        const promises: Promise<any>[] = [];
        let hasChanges = false;

        // Deleted
        prevIds.filter(id => !nextIds.includes(id)).forEach(id => {
          hasChanges = true;
          promises.push(SupabaseService.deleteMaterial(id));
        });

        // Saved / Updated
        next.forEach(material => {
          const prevMat = prev.find(m => m.id === material.id);
          if (!prevMat || JSON.stringify(prevMat) !== JSON.stringify(material)) {
            hasChanges = true;
            promises.push(SupabaseService.saveMaterial(material as any));
          }
        });

        if (hasChanges && promises.length > 0) {
          triggerSyncNotification('Materiales', 'syncing');
          Promise.all(promises)
            .then(() => triggerSyncNotification('Materiales', 'success'))
            .catch(err => {
              console.error(err);
              triggerSyncNotification('Materiales', 'error', `Error al guardar materiales en Supabase: ${err?.message || err}`);
            });
        }
      }
      return next;
    });
  };

  const handleSetQuestions: React.Dispatch<React.SetStateAction<Question[]>> = (value) => {
    setQuestions(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (isSupabaseConfigured()) {
        const prevIds = prev.map(q => q.id);
        const nextIds = next.map(q => q.id);
        const promises: Promise<any>[] = [];
        let hasChanges = false;

        // Deleted
        prevIds.filter(id => !nextIds.includes(id)).forEach(id => {
          hasChanges = true;
          promises.push(SupabaseService.deleteQuestion(id));
        });

        // Saved / Updated
        next.forEach(question => {
          const prevQ = prev.find(q => q.id === question.id);
          if (!prevQ || JSON.stringify(prevQ) !== JSON.stringify(question)) {
            hasChanges = true;
            promises.push(SupabaseService.saveQuestion(question as any));
          }
        });

        if (hasChanges && promises.length > 0) {
          triggerSyncNotification('Preguntas', 'syncing');
          Promise.all(promises)
            .then(() => triggerSyncNotification('Preguntas', 'success'))
            .catch(err => {
              if (err?.code === 'PGRST204' && err?.message?.includes('points')) return;
              console.error(err);
              triggerSyncNotification('Preguntas', 'error', `Error al guardar preguntas en Supabase: ${err?.message || err}`);
            });
        }
      }
      return next;
    });
  };

  const handleSetAttempts: React.Dispatch<React.SetStateAction<QuizAttempt[]>> = (value) => {
    setAttempts(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (isSupabaseConfigured()) {
        const prevIds = new Set(prev.map(a => a.id));
        const promises: Promise<any>[] = [];

        next.filter(a => !prevIds.has(a.id) && !syncedAttemptIdsRef.current.has(a.id)).forEach(attempt => {
          syncedAttemptIdsRef.current.add(attempt.id);
          promises.push(
            SupabaseService.saveAttempt(attempt).catch(err => {
              if (err?.code === '23505' || err?.message?.includes('duplicate key')) {
                return attempt;
              }
              syncedAttemptIdsRef.current.delete(attempt.id);
              throw err;
            })
          );
        });

        if (promises.length > 0) {
          triggerSyncNotification('Exámenes', 'syncing');
          Promise.all(promises)
            .then(() => triggerSyncNotification('Exámenes', 'success'))
            .catch(err => {
              if (err?.code === '23505' || err?.message?.includes('duplicate key')) return;
              console.error(err);
              triggerSyncNotification('Exámenes', 'error', `Error al guardar examen en Supabase: ${err?.message || err}`);
            });
        }
      }
      return next;
    });
  };

  const handleSetProgress: React.Dispatch<React.SetStateAction<UserProgress[]>> = (value) => {
    setProgress(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (isSupabaseConfigured()) {
        const promises: Promise<any>[] = [];
        let hasChanges = false;

        next.forEach(prog => {
          const prevProg = prev.find(p => p.userId === prog.userId && p.topicId === prog.topicId);
          if (!prevProg || JSON.stringify(prevProg) !== JSON.stringify(prog)) {
            hasChanges = true;
            promises.push(SupabaseService.saveProgress(prog));
          }
        });

        if (hasChanges && promises.length > 0) {
          triggerSyncNotification('Progreso', 'syncing');
          Promise.all(promises)
            .then(() => triggerSyncNotification('Progreso', 'success'))
            .catch(err => {
              console.error(err);
              triggerSyncNotification('Progreso', 'error', `Error al actualizar progreso en Supabase: ${err?.message || err}`);
            });
        }
      }
      return next;
    });
  };

  const handleSetReviews: React.Dispatch<React.SetStateAction<CourseReview[]>> = (value) => {
    setReviews(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (isSupabaseConfigured()) {
        const prevIds = new Set(prev.map(r => r.id));
        const promises: Promise<any>[] = [];

        next.filter(r => !prevIds.has(r.id) && !syncedReviewIdsRef.current.has(r.id)).forEach(review => {
          syncedReviewIdsRef.current.add(review.id);
          promises.push(
            SupabaseService.saveReview(review).catch(err => {
              if (err?.code === '23505' || err?.message?.includes('duplicate key')) {
                return review;
              }
              syncedReviewIdsRef.current.delete(review.id);
              throw err;
            })
          );
        });

        if (promises.length > 0) {
          triggerSyncNotification('Comentarios', 'syncing');
          Promise.all(promises)
            .then(() => triggerSyncNotification('Comentarios', 'success'))
            .catch(err => {
              if (err?.code === '23505' || err?.message?.includes('duplicate key')) return;
              console.error(err);
              triggerSyncNotification('Comentarios', 'error', `Error al guardar comentario en Supabase: ${err?.message || err}`);
            });
        }
      }
      return next;
    });
  };

  const handleSetMessages: React.Dispatch<React.SetStateAction<Message[]>> = (value) => {
    setMessages(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (isSupabaseConfigured()) {
        const prevIds = prev.map(m => m.id);
        const nextIds = next.map(m => m.id);
        const promises: Promise<any>[] = [];
        let hasChanges = false;

        // Deleted messages
        prevIds.filter(id => !nextIds.includes(id)).forEach(id => {
          hasChanges = true;
          promises.push(SupabaseService.deleteMessage(id));
        });

        // Saved / Updated messages
        next.forEach(msg => {
          const prevMsg = prev.find(m => m.id === msg.id);
          if (!prevMsg || JSON.stringify(prevMsg) !== JSON.stringify(msg)) {
            hasChanges = true;
            promises.push(SupabaseService.saveMessage(msg));
          }
        });

        if (hasChanges && promises.length > 0) {
          triggerSyncNotification('Mensajería', 'syncing');
          Promise.all(promises)
            .then(() => triggerSyncNotification('Mensajería', 'success'))
            .catch(err => {
              console.error(err);
              triggerSyncNotification('Mensajería', 'error', `Error al sincronizar mensajes en Supabase: ${err?.message || err}`);
            });
        }
      }
      return next;
    });
  };

  const handleSetUsers: React.Dispatch<React.SetStateAction<User[]>> = (value) => {
    setUsers(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (isSupabaseConfigured()) {
        const prevIds = prev.map(u => u.id);
        const nextIds = next.map(u => u.id);
        const promises: Promise<any>[] = [];
        let hasChanges = false;

        // Deleted users
        prevIds.filter(id => !nextIds.includes(id)).forEach(id => {
          hasChanges = true;
          promises.push(SupabaseService.deleteUser(id));
        });

        // Saved / Updated users
        next.forEach(user => {
          const prevUser = prev.find(u => u.id === user.id);
          if (!prevUser || JSON.stringify(prevUser) !== JSON.stringify(user)) {
            hasChanges = true;
            promises.push(SupabaseService.saveUser(user));
          }
        });

        if (hasChanges && promises.length > 0) {
          triggerSyncNotification('Perfiles', 'syncing');
          Promise.all(promises)
            .then(() => triggerSyncNotification('Perfiles', 'success'))
            .catch(err => {
              console.error(err);
              triggerSyncNotification('Perfiles', 'error', `Error al guardar usuarios en Supabase: ${err?.message || err}`);
            });
        }
      }
      return next;
    });
  };

  // --- SYNCING TO LOCAL STORAGE ON STATE CHANGE (FALLBACK) ---
  useEffect(() => {
    try {
      localStorage.setItem('academia_users', JSON.stringify(users));
    } catch (e) {
      console.warn('localStorage setItem quota exceeded or failed for academia_users:', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('academia_topics', JSON.stringify(topics));
    } catch (e) {
      console.warn('localStorage setItem quota exceeded or failed for academia_topics:', e);
    }
  }, [topics]);

  useEffect(() => {
    try {
      localStorage.setItem('academia_materials', JSON.stringify(materials));
    } catch (e) {
      console.warn('localStorage setItem quota exceeded or failed for academia_materials:', e);
    }
  }, [materials]);

  useEffect(() => {
    try {
      localStorage.setItem('academia_questions', JSON.stringify(questions));
    } catch (e) {
      console.warn('localStorage setItem quota exceeded or failed for academia_questions:', e);
    }
  }, [questions]);

  useEffect(() => {
    try {
      localStorage.setItem('academia_attempts', JSON.stringify(attempts));
    } catch (e) {
      console.warn('localStorage setItem quota exceeded or failed for academia_attempts:', e);
    }
  }, [attempts]);

  useEffect(() => {
    try {
      localStorage.setItem('academia_progress', JSON.stringify(progress));
    } catch (e) {
      console.warn('localStorage setItem quota exceeded or failed for academia_progress:', e);
    }
  }, [progress]);

  useEffect(() => {
    try {
      localStorage.setItem('academia_reviews', JSON.stringify(reviews));
    } catch (e) {
      console.warn('localStorage setItem quota exceeded or failed for academia_reviews:', e);
    }
  }, [reviews]);

  useEffect(() => {
    try {
      localStorage.setItem('academia_messages', JSON.stringify(messages));
    } catch (e) {
      console.warn('localStorage setItem quota exceeded or failed for academia_messages:', e);
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem('academia_certificate_templates', JSON.stringify(certificateTemplates));
    } catch (e) {
      console.warn('localStorage setItem quota exceeded or failed for academia_certificate_templates:', e);
    }
  }, [certificateTemplates]);

  // --- SESSION HANDLERS ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    try {
      sessionStorage.setItem('academia_session_user', JSON.stringify(user));
    } catch (e) {
      console.warn('sessionStorage setItem error:', e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      sessionStorage.removeItem('academia_session_user');
    } catch (e) {
      console.warn('sessionStorage removeItem error:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 antialiased font-sans selection:bg-emerald-500/20 selection:text-emerald-950">
      <AnimatePresence mode="wait">
        {!currentUser ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <Login users={users} onLoginSuccess={handleLogin} />
          </motion.div>
        ) : currentUser.role === 'admin' ? (
          <motion.div
            key="admin-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <AdminDashboard
              currentUser={currentUser}
              onLogout={handleLogout}
              users={users}
              setUsers={handleSetUsers}
              topics={topics}
              setTopics={handleSetTopics}
              materials={materials}
              setMaterials={handleSetMaterials}
              questions={questions}
              setQuestions={handleSetQuestions}
              attempts={attempts}
              setAttempts={handleSetAttempts}
              progress={progress}
              setProgress={handleSetProgress}
              reviews={reviews}
              messages={messages}
              setMessages={handleSetMessages}
              certificateTemplates={certificateTemplates}
              setCertificateTemplates={setCertificateTemplates}
            />
          </motion.div>
        ) : (
          <motion.div
            key="user-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <UserDashboard
              currentUser={users.find(u => u.id === currentUser.id) || currentUser}
              onLogout={handleLogout}
              topics={topics}
              materials={materials}
              questions={questions}
              attempts={attempts}
              setAttempts={handleSetAttempts}
              progress={progress}
              setProgress={handleSetProgress}
              reviews={reviews}
              setReviews={handleSetReviews}
              messages={messages}
              setMessages={handleSetMessages}
              certificateTemplates={certificateTemplates}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST FLOTANTE DE NOTIFICACIÓN DE SINCRONIZACIÓN (EN CABECERA SUPERIOR) */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col items-end gap-2.5 pointer-events-none">
        <AnimatePresence>
          {dbSyncStatus.state !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`p-3.5 rounded-xl shadow-xl border flex items-center gap-3 max-w-sm pointer-events-auto backdrop-blur-md ${
                dbSyncStatus.state === 'syncing'
                  ? 'bg-slate-900/95 border-slate-700 text-white shadow-slate-900/25'
                  : dbSyncStatus.state === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-emerald-100/40'
                  : 'bg-rose-50 border-rose-200 text-rose-900 shadow-rose-100/40'
              }`}
            >
              <div className="shrink-0">
                {dbSyncStatus.state === 'syncing' ? (
                  <RefreshCw className="h-5 w-5 text-indigo-400 animate-spin" />
                ) : dbSyncStatus.state === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono font-bold uppercase tracking-wider opacity-60">
                  {dbSyncStatus.state === 'syncing'
                    ? 'Sincronizando...'
                    : dbSyncStatus.state === 'success'
                    ? '✓ Sincronizado'
                    : '⚠ Error de Conexión'}
                </p>
                <p className="text-xs mt-0.5 font-medium">
                  {dbSyncStatus.message}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
