import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  GraduationCap,
  Clock,
  Award,
  ChevronRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronLeft,
  Play,
  FileText,
  Presentation,
  Star,
  MessageSquare,
  History,
  Timer,
  AlertTriangle,
  LogOut,
  Send,
  Calendar,
  Zap,
  Shield,
  Sparkles,
  Info,
  Mail,
  X,
  Trash2,
  Maximize2,
  Minimize2,
  LayoutDashboard,
  CheckSquare,
  Bell,
  User as UserIcon,
  CheckCheck,
  Check,
  Lock,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  Menu,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { User, Topic, Material, Question, QuizAttempt, UserProgress, CourseReview, Message, CertificateTemplate } from '../types';
import { getEmbedUrl, getGoogleDriveEmbedUrl } from '../lib/videoUtils';
import { jsPDF } from 'jspdf';
import UserManual from './UserManual';
import { isSupabaseConfigured } from '../lib/supabase';
import { SupabaseService } from '../lib/supabaseService';

interface UserDashboardProps {
  currentUser: User;
  onLogout: () => void;
  topics: Topic[];
  materials: Material[];
  questions: Question[];
  attempts: QuizAttempt[];
  setAttempts: React.Dispatch<React.SetStateAction<QuizAttempt[]>>;
  progress: UserProgress[];
  setProgress: React.Dispatch<React.SetStateAction<UserProgress[]>>;
  reviews: CourseReview[];
  setReviews: React.Dispatch<React.SetStateAction<CourseReview[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  certificateTemplates?: CertificateTemplate[];
}

export default function UserDashboard({
  currentUser,
  onLogout,
  topics,
  materials,
  questions,
  attempts,
  setAttempts,
  progress,
  setProgress,
  reviews,
  setReviews,
  messages,
  setMessages,
  certificateTemplates = []
}: UserDashboardProps) {
  // Current active view
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [catalogTab, setCatalogTab] = useState<'all' | 'pending' | 'passed'>('all');
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // --- MAILBOX / MESSAGES: PERSISTENT READ STATUS METHOD ---
  const [readMessageIds, setReadMessageIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`academia_user_read_messages_${currentUser.id}`);
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch (e) {
      return new Set<string>();
    }
  });

  /**
   * Método que comprueba si un mensaje ya ha sido leído por el colaborador actual.
   * Revisa el registro local persistente, los identificadores de lectura y el estado del mensaje.
   */
  const isMessageRead = (msg: Message): boolean => {
    if (readMessageIds.has(msg.id)) return true;
    if (msg.readByUserIds && msg.readByUserIds.includes(currentUser.id)) return true;
    if (msg.recipientId === currentUser.id && msg.isRead) return true;
    if (msg.recipientId === 'ALL' && msg.isRead) return true;
    return false;
  };

  const myMessages = messages.filter(
    m => m.recipientId === 'ALL' || m.recipientId === currentUser.id
  );

  // Cantidad de notificaciones sin leer calculada en tiempo real
  const unreadCount = myMessages.filter(m => !isMessageRead(m)).length;

  /**
   * Método para marcar un mensaje individual como leído.
   * Hace que la notificación desaparezca de inmediato en la pantalla (0ms)
   * y garantiza su permanencia en localStorage y Supabase.
   */
  const markMessageAsRead = (messageId: string) => {
    // 1. Inmediatamente actualizar el conjunto local de IDs leídos
    setReadMessageIds(prev => {
      const updated = new Set(prev);
      updated.add(messageId);
      try {
        localStorage.setItem(`academia_user_read_messages_${currentUser.id}`, JSON.stringify(Array.from(updated)));
      } catch (err) {
        console.warn('Error guardando mensaje leído en localStorage:', err);
      }
      return updated;
    });

    // 2. Actualizar el estado de mensajes
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const currentReadBy = m.readByUserIds || [];
        const updatedReadBy = currentReadBy.includes(currentUser.id)
          ? currentReadBy
          : [...currentReadBy, currentUser.id];
        return {
          ...m,
          isRead: true,
          readByUserIds: updatedReadBy
        };
      }
      return m;
    }));

    // 3. Sincronizar en Supabase si está disponible
    if (isSupabaseConfigured()) {
      SupabaseService.markMessageAsRead(messageId).catch(err => {
        console.warn('Error sincronizando markMessageAsRead en Supabase:', err);
      });
    }
  };

  /**
   * Método para marcar todos los mensajes del colaborador como leídos.
   * Elimina cualquier globo o banner de notificación de forma definitiva.
   */
  const markAllMessagesAsRead = () => {
    const unreadIds = myMessages.filter(m => !isMessageRead(m)).map(m => m.id);
    if (unreadIds.length === 0) return;

    // 1. Actualizar inmediatamente el conjunto persistente local
    setReadMessageIds(prev => {
      const updated = new Set(prev);
      unreadIds.forEach(id => updated.add(id));
      try {
        localStorage.setItem(`academia_user_read_messages_${currentUser.id}`, JSON.stringify(Array.from(updated)));
      } catch (err) {
        console.warn('Error guardando mensajes leídos en localStorage:', err);
      }
      return updated;
    });

    // 2. Actualizar estado de mensajes
    setMessages(prev => prev.map(m => {
      if (unreadIds.includes(m.id)) {
        const currentReadBy = m.readByUserIds || [];
        const updatedReadBy = currentReadBy.includes(currentUser.id)
          ? currentReadBy
          : [...currentReadBy, currentUser.id];
        return {
          ...m,
          isRead: true,
          readByUserIds: updatedReadBy
        };
      }
      return m;
    }));

    // 3. Sincronizar en Supabase
    if (isSupabaseConfigured()) {
      SupabaseService.markAllMessagesAsRead(currentUser.id).catch(err => {
        console.warn('Error sincronizando markAllMessagesAsRead en Supabase:', err);
      });
    }
  };

  const handleOpenMailbox = () => {
    setIsMailboxOpen(true);
    markAllMessagesAsRead();
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };
  
  // Inside course view state
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [quizMode, setQuizMode] = useState<boolean>(false);
  const [currentSlideIdx, setCurrentSlideIdx] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [isLearningPlanExpanded, setIsLearningPlanExpanded] = useState<boolean>(false);

  // States to enforce reading/watching requirements
  const [visitedSlides, setVisitedSlides] = useState<number[]>([]);
  const [videoCompleted, setVideoCompleted] = useState<boolean>(false);
  const [videoTimeLeft, setVideoTimeLeft] = useState<number>(0);

  // Material and Iframe load-time optimization states
  const [iframeLoading, setIframeLoading] = useState<boolean>(true);
  const [fullscreenIframeLoading, setFullscreenIframeLoading] = useState<boolean>(true);

  // Pre-calculate slides for PPTX materials to optimize performance and prevent repeated splitting on every render
  const activeSlides = useMemo(() => {
    const activeMaterial = materials.find(m => m.id === activeMaterialId);
    if (!activeMaterial || activeMaterial.type !== 'pptx') return [];
    
    const rawContent = activeMaterial.content || '';
    let slides: { title: string; bullets: string[] }[] = [];
    
    if (rawContent.includes('##')) {
      const sections = rawContent.split(/(?=## )/);
      sections.forEach(sec => {
        const lines = sec.trim().split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length > 0) {
          const title = lines[0].replace(/^##\s*/, '').replace(/^Diapositiva \d+:\s*/i, '');
          const bullets = lines.slice(1)
            .filter(l => l.startsWith('-') || l.startsWith('*'))
            .map(l => l.replace(/^[-*]\s*/, ''));
          slides.push({
            title: title || 'Diapositiva',
            bullets: bullets.length > 0 ? bullets : [lines.slice(1).join(' ') || 'Contenido de apoyo.']
          });
        }
      });
    } else {
      slides = [{
        title: activeMaterial.title,
        bullets: [rawContent]
      }];
    }
    return slides;
  }, [activeMaterialId, materials]);

  useEffect(() => {
    setCurrentSlideIdx(0);
    setIsFullscreen(false);
    setIsTheaterMode(false);
    // Reset iframe loading indicators when material changes
    setIframeLoading(true);
    setFullscreenIframeLoading(true);
  }, [activeMaterialId]);

  useEffect(() => {
    // Reset fullscreen loading indicator when fullscreen mode is toggled
    setFullscreenIframeLoading(true);
  }, [isFullscreen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Effect to reset/manage material visual-progress and timer constraints
  useEffect(() => {
    if (!activeMaterialId) {
      setVisitedSlides([]);
      setVideoCompleted(false);
      setVideoTimeLeft(0);
      return;
    }

    const activeMaterial = materials.find(m => m.id === activeMaterialId);
    if (!activeMaterial) return;

    // 1. Reset PPTX slides tracker
    if (activeMaterial.type === 'pptx') {
      setVisitedSlides([0]); // immediately mark slide 0 as visited
      setVideoCompleted(false);
      setVideoTimeLeft(0);
    } 
    // 2. Reset and initialize Video watch timer
    else if (activeMaterial.type === 'video') {
      setVisitedSlides([]);
      
      // Determine if already completed in progress
      const currentTopic = topics.find(t => t.id === activeMaterial.topicId);
      const userProgress = currentTopic ? progress.find(p => p.userId === currentUser.id && p.topicId === currentTopic.id) : null;
      const isAlreadyCompleted = userProgress?.completedMaterialIds.includes(activeMaterialId) || false;

      if (isAlreadyCompleted) {
        setVideoCompleted(true);
        setVideoTimeLeft(0);
      } else {
        setVideoCompleted(false);
        const initialSeconds = 15;
        setVideoTimeLeft(initialSeconds);
      }
    } else {
      setVisitedSlides([]);
      setVideoCompleted(false);
      setVideoTimeLeft(0);
    }
  }, [activeMaterialId, materials]);

  // Handle countdown timer for video materials
  useEffect(() => {
    if (videoTimeLeft <= 0) {
      if (videoTimeLeft === 0 && activeMaterialId) {
        const activeMaterial = materials.find(m => m.id === activeMaterialId);
        if (activeMaterial && activeMaterial.type === 'video') {
          setVideoCompleted(true);
        }
      }
      return;
    }

    const interval = setInterval(() => {
      setVideoTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setVideoCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [videoTimeLeft, activeMaterialId, materials]);

  // Track slide visits for PPTX materials
  useEffect(() => {
    const activeMaterial = materials.find(m => m.id === activeMaterialId);
    if (activeMaterial && activeMaterial.type === 'pptx') {
      if (!visitedSlides.includes(currentSlideIdx)) {
        setVisitedSlides(prev => [...prev, currentSlideIdx]);
      }
    }
  }, [currentSlideIdx, activeMaterialId, materials, visitedSlides]);

  // PDF Blob URL state and effect to bypass data: URI iframe blocks
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const activeMaterial = materials.find(m => m.id === activeMaterialId);
    if (activeMaterial && activeMaterial.type === 'pdf') {
      const targetUrl = activeMaterial.fileUrl || activeMaterial.url;
      if (targetUrl) {
        if (targetUrl.startsWith('data:application/pdf;base64,')) {
          try {
            const base64Data = targetUrl.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setPdfBlobUrl(url);
            return () => {
              URL.revokeObjectURL(url);
            };
          } catch (e) {
            console.error("Error creating blob from base64 PDF:", e);
            setPdfBlobUrl(targetUrl);
          }
        } else {
          setPdfBlobUrl(targetUrl);
        }
      } else {
        setPdfBlobUrl(null);
      }
    } else {
      setPdfBlobUrl(null);
    }
    return undefined;
  }, [activeMaterialId, materials]);

  // Prevent Google Drive/Workspace iframe from auto-scrolling parent page to top when clicked or changing slides
  useEffect(() => {
    const activeMaterial = materials.find(m => m.id === activeMaterialId);
    if (!activeMaterial) return;

    const driveInfo = getGoogleDriveEmbedUrl(activeMaterial.fileUrl || activeMaterial.url);
    if (!driveInfo.isDrive) return;

    let lastScrollY = window.scrollY;
    let lastScrollX = window.scrollX;
    let isUserScroll = false;
    let userScrollTimeout: any = null;

    const handleUserScrollInteraction = () => {
      isUserScroll = true;
      if (userScrollTimeout) clearTimeout(userScrollTimeout);
      userScrollTimeout = setTimeout(() => {
        isUserScroll = false;
      }, 250);
    };

    // Keep track of the actual user scroll position
    const handleScroll = () => {
      if (isUserScroll) {
        lastScrollY = window.scrollY;
        lastScrollX = window.scrollX;
      } else {
        // If it's a programmatic scroll (i.e. browser scrolling because of iframe focus/slide change)
        if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
          window.scrollTo(lastScrollX, lastScrollY);
        }
      }
    };

    // When window loses focus to an iframe (blur), we snapshot the scroll and restore it on any subsequent jumping attempts
    const handleWindowBlur = () => {
      const savedY = window.scrollY;
      const savedX = window.scrollX;
      
      const restore = () => {
        if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
          if (window.scrollY !== savedY || window.scrollX !== savedX) {
            window.scrollTo(savedX, savedY);
          }
        }
      };

      // Check multiple times rapidly immediately after blur to cancel out any scroll jump
      for (let delay = 0; delay <= 400; delay += 10) {
        setTimeout(restore, delay);
      }
    };

    window.addEventListener('wheel', handleUserScrollInteraction, { passive: true });
    window.addEventListener('touchmove', handleUserScrollInteraction, { passive: true });
    window.addEventListener('keydown', handleUserScrollInteraction, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('wheel', handleUserScrollInteraction);
      window.removeEventListener('touchmove', handleUserScrollInteraction);
      window.removeEventListener('keydown', handleUserScrollInteraction);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('blur', handleWindowBlur);
      if (userScrollTimeout) clearTimeout(userScrollTimeout);
    };
  }, [activeMaterialId, materials]);
  
  // Interactive Quiz Taking States
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: number }>({});
  const [quizTimeLeft, setQuizTimeLeft] = useState<number>(0); // in seconds
  const [quizActive, setQuizActive] = useState<boolean>(false);
  const [quizType, setQuizType] = useState<'initial' | 'final'>('final');
  
  // Post-quiz states
  const [lastAttemptResult, setLastAttemptResult] = useState<QuizAttempt | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [satisfactionRating, setSatisfactionRating] = useState<number | null>(null);
  const [clarityRating, setClarityRating] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);

  // Timer reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter out published topics according to logged-in user's corporate area
  const publishedTopics = topics.filter(t => {
    if (t.status !== 'published') return false;
    // If no target areas are specified or targetAreas is empty, it is visible to everyone (TODAS)
    if (!t.targetAreas || t.targetAreas.length === 0) return true;
    
    // Check if the user's assigned area is in the topic's target areas
    const userArea = currentUser.area || 'ADMINISTRACION';
    return t.targetAreas.includes(userArea);
  });

  // Find user progress for a given topic
  const getUserProgressForTopic = (topicId: string) => {
    return progress.find(p => p.userId === currentUser.id && p.topicId === topicId) || {
      userId: currentUser.id,
      topicId,
      completedMaterialIds: [],
      quizStatus: 'not_started' as const,
      highestScore: null,
      attemptsCount: 0,
      lastActiveAt: new Date().toISOString()
    };
  };

  // --- CERTIFICATE GENERATION (PROGRAMMATIC PDF) ---
  const handleDownloadCertificate = (topic: Topic) => {
    // Find active template, or fall back to the first template, or default parameters
    const activeTemplate = certificateTemplates.find(t => t.isActive) || certificateTemplates[0] || {
      id: 'default-approve',
      title: 'PARTICIPACIÓN',
      subtitle: 'La Empresa Fundametz certifica que el colaborador(a):',
      bodyText: 'POR SU VALIOSA PARTICIPACIÓN EN LA CAPACITACIÓN VIRTUAL DEL CURSO DE:',
      signatureName: 'ING. VIVIANA MUÑOZ',
      signatureRole: 'JEFE DE RECURSOS HUMANOS',
      backgroundColor: '#FFFFFF',
      textColor: '#0B1F3F',
      isActive: true
    };

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Dimensions for A4 landscape: 297 x 210
    const w = 297;
    const h = 210;

    // 1. Fill solid background color
    doc.setFillColor(activeTemplate.backgroundColor || '#FFFFFF');
    doc.rect(0, 0, w, h, 'F');

    // 2. TOP-LEFT CORNER: NAVY & GOLD WAVES WITH EMBLEM (Exact SVG bezier curve conversion)
    doc.setFillColor(11, 31, 63); // #0B1F3F
    doc.moveTo(0, 0);
    doc.lineTo(90, 0);
    doc.curveTo(70, 16.67, 53.33, 36.67, 40, 60);
    doc.curveTo(26.67, 73.33, 13.33, 83.33, 0, 90);
    doc.lineTo(0, 0);
    doc.fill();

    // Golden highlight curves matching SVG stroke
    doc.setDrawColor(197, 168, 128); // #C5A880 (Gold)
    doc.setLineWidth(1.2);
    doc.moveTo(0, 90);
    doc.curveTo(14.67, 84, 28.67, 74.33, 42, 61);
    doc.curveTo(55.33, 37.67, 71.67, 17.67, 91, 1);
    doc.stroke();

    doc.setDrawColor(229, 193, 133); // #E5C185 (Light Gold)
    doc.setLineWidth(0.5);
    doc.moveTo(0, 93);
    doc.curveTo(16, 87, 30.67, 77, 44, 63);
    doc.curveTo(57.33, 39.67, 73.67, 19.33, 93, 2);
    doc.stroke();

    // Gold Medal Ribbon 1
    doc.setFillColor(197, 168, 128);
    doc.triangle(19, 23, 15, 38, 21, 36, 'F');
    doc.triangle(21, 36, 23, 23, 19, 23, 'F');
    // Gold Medal Ribbon 2
    doc.setFillColor(229, 193, 133);
    doc.triangle(27, 23, 25, 36, 31, 38, 'F');
    doc.triangle(31, 38, 29, 23, 27, 23, 'F');

    // Gold Medal Circle (Multi-ring premium medal effect matching HTML)
    doc.setFillColor(229, 193, 133); // Light gold outer ring
    doc.ellipse(23, 23, 9.5, 9.5, 'F');
    doc.setFillColor(197, 168, 128); // Medium gold inner ring
    doc.ellipse(23, 23, 8.5, 8.5, 'F');
    doc.setFillColor(245, 158, 11); // Amber inner circle matching screen preview
    doc.ellipse(23, 23, 7.5, 7.5, 'F');
    doc.setDrawColor(254, 243, 199); // Yellow dashed-like inner circle line
    doc.setLineWidth(0.3);
    doc.ellipse(23, 23, 6.8, 6.8, 'S');

    // Medal center decoration (Award silhouette ribbon)
    doc.setFillColor(11, 31, 63); // Navy fill
    const cx = 23;
    const cy = 23;
    doc.ellipse(cx, cy - 1, 1.8, 1.8, 'F'); // Medal head
    doc.triangle(cx - 1.2, cy - 0.2, cx - 2.2, cy + 3.0, cx - 0.5, cy + 2.0, 'F'); // Left ribbon
    doc.triangle(cx + 1.2, cy - 0.2, cx + 2.2, cy + 3.0, cx + 0.5, cy + 2.0, 'F'); // Right ribbon

    // 3. BOTTOM-RIGHT CORNER: NAVY & GOLD WAVES (Exact SVG 180-deg rotated bezier curves)
    doc.setFillColor(11, 31, 63);
    doc.moveTo(w, h);
    doc.lineTo(w - 90, h);
    doc.curveTo(w - 70, h - 16.67, w - 53.33, h - 36.67, w - 40, h - 60);
    doc.curveTo(w - 26.67, h - 73.33, w - 13.33, h - 83.33, w, h - 90);
    doc.lineTo(w, h);
    doc.fill();

    // Golden highlights
    doc.setDrawColor(197, 168, 128);
    doc.setLineWidth(1.2);
    doc.moveTo(w, h - 90);
    doc.curveTo(w - 14.67, h - 84, w - 28.67, h - 74.33, w - 42, h - 61);
    doc.curveTo(w - 55.33, h - 37.67, w - 71.67, h - 17.67, w - 91, h - 1);
    doc.stroke();

    doc.setDrawColor(229, 193, 133);
    doc.setLineWidth(0.5);
    doc.moveTo(w, h - 93);
    doc.curveTo(w - 16, h - 87, w - 30.67, h - 77, w - 44, h - 63);
    doc.curveTo(w - 57.33, h - 39.67, w - 73.67, h - 19.33, w - 93, h - 2);
    doc.stroke();

    // 4. TOP-RIGHT CORNER: GOLD GEOMETRIC LINES (Matches HTML nesting perfectly)
    doc.setDrawColor(197, 168, 128); // #C5A880
    doc.setLineWidth(0.8);
    doc.line(w - 30, 10, w - 10, 10);
    doc.line(w - 10, 10, w - 10, 30);
    
    doc.setLineWidth(0.4);
    doc.line(w - 27, 11.5, w - 11.5, 11.5);
    doc.line(w - 11.5, 11.5, w - 11.5, 27);
    
    doc.line(w - 24, 13, w - 13, 13);
    doc.line(w - 13, 13, w - 13, 24);
    
    doc.setDrawColor(229, 193, 133); // #E5C185
    doc.setLineWidth(0.2);
    doc.line(w - 21, 14.5, w - 14.5, 14.5);
    doc.line(w - 14.5, 14.5, w - 14.5, 21);

    // 5. BOTTOM-LEFT CORNER: GOLD GEOMETRIC LINES (Matches HTML nesting perfectly)
    doc.setDrawColor(197, 168, 128); // #C5A880
    doc.setLineWidth(0.8);
    doc.line(10, h - 30, 10, h - 10);
    doc.line(10, h - 10, 30, h - 10);
    
    doc.setLineWidth(0.4);
    doc.line(11.5, h - 27, 11.5, h - 11.5);
    doc.line(11.5, h - 11.5, 27, h - 11.5);
    
    doc.line(13, h - 24, 13, h - 13);
    doc.line(13, h - 13, 24, h - 13);
    
    doc.setDrawColor(229, 193, 133); // #E5C185
    doc.setLineWidth(0.2);
    doc.line(14.5, h - 21, 14.5, h - 14.5);
    doc.line(14.5, h - 14.5, 21, h - 14.5);

    // 6. BRANDING LOGO & TEXT (EXACT MATCH TO LOGO IMAGE)
    const drawDiamond = (x: number, y: number, d: number) => {
      doc.setLineJoin('round');
      doc.setLineWidth(1.2); // Rounded corner effect matching SVG rx="4.5"
      doc.setDrawColor(11, 31, 63);
      doc.setFillColor(11, 31, 63);
      // Draw diamond as two connected filled triangles with thick stroke to round corners
      doc.triangle(x, y - d, x - d, y, x + d, y, 'FD');
      doc.triangle(x, y + d, x - d, y, x + d, y, 'FD');
    };

    // Draw the 3 rounded diamonds (Perfectly spaced with gap matching SVG layout)
    drawDiamond(119.5, 23.5, 1.8);
    drawDiamond(116.35, 26.65, 1.8);
    drawDiamond(122.65, 26.65, 1.8);

    // "FUNDAMETZ" bold header, side-by-side
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(23);
    doc.setTextColor(11, 31, 63);
    doc.text('FUNDAMETZ', 129.5, 28);

    // "Industria de transformación responsable" subtext
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(11, 31, 63);
    doc.text('Industria de transformación responsable', 129.5, 33.5);

    // 7. TITLE SECTION
    // "CERTIFICADO DE"
    doc.setFont('times', 'italic');
    doc.setFontSize(16);
    doc.setTextColor(197, 168, 128); // Golden text color
    doc.text('CERTIFICADO DE', w / 2, 53, { align: 'center' });

    // "PARTICIPACIÓN" (Times bold to match HTML font-serif perfectly)
    doc.setFont('times', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(11, 31, 63); // Deep corporate navy
    const mainTitle = (activeTemplate.title || 'PARTICIPACIÓN').toUpperCase();
    doc.text(mainTitle, w / 2, 68, { align: 'center' });

    // 8. RECIPIENT NAME
    doc.setFont('times', 'bolditalic');
    doc.setFontSize(24);
    doc.setTextColor(197, 168, 128);
    const recipientName = currentUser.name.toUpperCase();
    doc.text(recipientName, w / 2, 88, { align: 'center' });

    // Elegant line under recipient name
    doc.setDrawColor(197, 168, 128);
    doc.setLineWidth(0.6);
    doc.line(50, 91, w - 50, 91);

    // 9. BODY TEXT & CURRICULAR CONTEXT (EXACT MATCH TO ADMIN TEMPLATE PREVIEW)
    doc.setFont('times', 'normal'); // Serif font matching preview
    doc.setFontSize(10.5);
    doc.setTextColor(11, 31, 63);
    const bodyBase = (activeTemplate.bodyText || 'POR SU VALIOSA PARTICIPACIÓN EN LA CAPACITACIÓN VIRTUAL DEL CURSO DE:').trim().toUpperCase();
    const bodyBasePunct = bodyBase.endsWith(':') ? bodyBase : bodyBase + ':';
    const topicTitle = `"${topic.title.toUpperCase()}"`;
    const fullBodyText = `${bodyBasePunct} ${topicTitle}, CON UNA DURACIÓN APROBADA SEGÚN EL PLAN FORMATIVO CORRESPONDIENTE.`;
    
    const splitBody = doc.splitTextToSize(fullBodyText, 215);
    doc.text(splitBody, w / 2, 105, { align: 'center', lineHeightFactor: 1.45 });

    // Location & Date: Otorgado en Guayaquil, Ecuador, con la fecha exacta en la que finalizó el curso
    doc.setFont('times', 'italic');
    doc.setFontSize(10);

    const userTopicProgress = getUserProgressForTopic(topic.id);
    const passedAttempts = attempts
      .filter(a => a.userId === currentUser.id && a.topicId === topic.id && a.passed)
      .sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime());

    let completionDateObj: Date;
    if (passedAttempts.length > 0 && passedAttempts[0].takenAt) {
      // Fecha en que rindió y aprobó la evaluación final
      completionDateObj = new Date(passedAttempts[0].takenAt);
    } else if (userTopicProgress.completedAt) {
      // Fecha guardada de culminación del curso
      completionDateObj = new Date(userTopicProgress.completedAt);
    } else if (userTopicProgress.quizStatus === 'passed' && userTopicProgress.lastActiveAt) {
      // Fallback a última actividad de aprobación
      completionDateObj = new Date(userTopicProgress.lastActiveAt);
    } else {
      completionDateObj = new Date();
    }

    if (isNaN(completionDateObj.getTime())) {
      completionDateObj = new Date();
    }

    const dateStr = completionDateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Otorgado en Guayaquil, Ecuador, el ${dateStr}.`, w / 2, 133, { align: 'center' });

    // 10. FOOTER SIGNATURE SECTION
    const sigRole = activeTemplate.signatureRole !== undefined ? activeTemplate.signatureRole : 'JEFE DE RECURSOS HUMANOS';
    const sigName = activeTemplate.signatureName !== undefined ? activeTemplate.signatureName : 'ING. VIVIANA MUÑOZ';

    const showRole = sigRole.trim() !== '';
    const showName = sigName.trim() !== '';

    if (showRole || showName) {
      doc.setDrawColor(11, 31, 63);
      doc.setLineWidth(0.4);
      doc.line(90, 168, w - 90, 168);

      if (showRole) {
        doc.setFont('times', 'bolditalic');
        doc.setFontSize(12);
        doc.setTextColor(197, 168, 128);
        doc.text(sigRole.toUpperCase(), w / 2, 174, { align: 'center' });
      }

      if (showName) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(11, 31, 63);
        const yPos = showRole ? 180 : 175;
        doc.text(sigName.toUpperCase(), w / 2, yPos, { align: 'center' });
      }
    }

    // Save PDF
    doc.save(`Certificado_${currentUser.name.replace(/\s+/g, '_')}_${topic.title.replace(/\s+/g, '_')}.pdf`);
  };

  // --- MATERIAL INTERACTIONS ---
  const handleSelectTopic = (topicId: string) => {
    setSelectedTopicId(topicId);
    setQuizMode(false);
    setLastAttemptResult(null);
    setIsLearningPlanExpanded(false);
    setReviewSubmitted(false);
    setReviewComment('');
    setReviewRating(5);
    setSatisfactionRating(null);
    setClarityRating(null);

    const topicMats = materials.filter(m => m.topicId === topicId);
    if (topicMats.length > 0) {
      setActiveMaterialId(topicMats[0].id);
    } else {
      setActiveMaterialId(null);
    }

    // Mark active in progress if not existing
    const existingProgress = progress.find(p => p.userId === currentUser.id && p.topicId === topicId);
    if (!existingProgress) {
      const newProg: UserProgress = {
        userId: currentUser.id,
        topicId,
        completedMaterialIds: [],
        quizStatus: 'not_started',
        highestScore: null,
        attemptsCount: 0,
        lastActiveAt: new Date().toISOString()
      };
      setProgress(prev => [...prev, newProg]);
    } else {
      // update last active date
      setProgress(prev => prev.map(p => p.userId === currentUser.id && p.topicId === topicId ? {
        ...p,
        lastActiveAt: new Date().toISOString()
      } : p));
    }
  };

  const handleMarkMaterialCompleted = (materialId: string, topicId: string) => {
    // Check if topic is overdue
    const topic = topics.find(t => t.id === topicId);
    if (topic && topic.dueDate) {
      const prog = getUserProgressForTopic(topicId);
      const isOverdue = prog.quizStatus !== 'passed' && (new Date(topic.dueDate + 'T23:59:59') < new Date());
      if (isOverdue) {
        alert('Este tema ha vencido y no se pueden registrar nuevos avances.');
        return;
      }
    }

    setProgress(prev => prev.map(p => {
      if (p.userId === currentUser.id && p.topicId === topicId) {
        const alreadyCompleted = p.completedMaterialIds.includes(materialId);
        const updatedCompleted = alreadyCompleted 
          ? p.completedMaterialIds 
          : [...p.completedMaterialIds, materialId];
        
        return {
          ...p,
          completedMaterialIds: updatedCompleted,
          lastActiveAt: new Date().toISOString()
        };
      }
      return p;
    }));
  };

  // --- QUIZ TAKING ACTIONS ---
  const handleStartQuiz = (topic: Topic, type: 'initial' | 'final' = 'final') => {
    const topicProgress = getUserProgressForTopic(topic.id);
    
    // Check if topic is overdue
    if (topic.dueDate) {
      const isOverdue = topicProgress.quizStatus !== 'passed' && (new Date(topic.dueDate + 'T23:59:59') < new Date());
      if (isOverdue) {
        alert(type === 'initial' ? 'Este tema ha vencido.' : 'Este tema ha vencido y no se puede realizar la evaluación final.');
        return;
      }
    }

    if (type === 'final') {
      // Enforce all materials completed
      const topicMats = materials.filter(m => m.topicId === topic.id);
      const allCompleted = topicMats.every(m => topicProgress.completedMaterialIds.includes(m.id));
      if (!allCompleted) {
        alert('Debes marcar todas las lecturas y materiales didácticos como completados para poder realizar la evaluación.');
        return;
      }
      
      // Check attempts limit
      if (topicProgress.attemptsCount >= 3) {
        alert('Has alcanzado el límite máximo de 3 intentos permitidos para este examen.');
        return;
      }

      // Check if they got maximum score (10 on 0-10 scale)
      if (topicProgress.highestScore !== null && topicProgress.highestScore >= 10) {
        alert('Ya has obtenido la calificación máxima (10/10) en esta evaluación. Las repeticiones han sido desactivadas.');
        return;
      }
    }

    // Filter questions by type
    const topicQuestions = questions.filter(q => 
      q.topicId === topic.id && 
      (type === 'initial' ? q.type === 'initial' : (q.type === 'final' || !q.type))
    );
    
    if (topicQuestions.length === 0) {
      if (type === 'initial') {
        alert('Este tema tiene evaluación inicial de conocimientos activada pero no se han cargado preguntas para ella aún. Contacta al administrador.');
        return;
      }
      alert('Esta capacitación no posee preguntas activas todavía. Contacta con tu administrador.');
      return;
    }

    // Configure questions (randomize if parameterized)
    let finalQuestions = [...topicQuestions];
    if (topic.randomizeQuestions && type === 'final') {
      finalQuestions = finalQuestions.sort(() => Math.random() - 0.5);
    }

    setQuizType(type);
    setQuizQuestions(finalQuestions);
    setCurrentQuestionIdx(0);
    setSelectedAnswers({});
    setReviewSubmitted(false);
    setReviewComment('');
    setReviewRating(5);
    setSatisfactionRating(null);
    setClarityRating(null);
    
    // Configure timer
    if (topic.timeLimitMinutes > 0) {
      setQuizTimeLeft(topic.timeLimitMinutes * 60);
    } else {
      setQuizTimeLeft(0);
    }

    setQuizMode(true);
    setLastAttemptResult(null);
    setQuizActive(true);
  };

  // Timer side effect
  useEffect(() => {
    if (quizActive && quizTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setQuizTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizActive, quizTimeLeft]);

  const handleSelectAnswer = (questionId: string, optionIdx: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleAutoSubmitQuiz = () => {
    if (quizActive) {
      alert('¡El tiempo límite ha expirado! Tu prueba se enviará automáticamente con las respuestas guardadas.');
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = () => {
    if (!selectedTopicId) return;
    const topic = topics.find(t => t.id === selectedTopicId);
    if (!topic) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setQuizActive(false);

    // Calculate score based on points (scaled 0 to 10)
    let earnedPoints = 0;
    quizQuestions.forEach(q => {
      const qPoints = q.points !== undefined ? q.points : 10;
      const userAns = selectedAnswers[q.id];
      if (userAns !== undefined && userAns === q.correctOptionIndex) {
        earnedPoints += qPoints;
      }
    });

    const totalPointsPossible = quizQuestions.reduce((sum, q) => sum + (q.points !== undefined ? q.points : 10), 0);
    // Score scaled from 0 to 10 (rounded to 1 decimal place, e.g. 8.5)
    const scoreScaled = totalPointsPossible > 0 
      ? Math.round(((earnedPoints / totalPointsPossible) * 10) * 10) / 10 
      : 0;

    const userProgress = getUserProgressForTopic(selectedTopicId);

    if (quizType === 'initial') {
      const newAttempt: QuizAttempt = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        topicId: selectedTopicId,
        topicTitle: `${topic.title} (Pre-test)`,
        score: scoreScaled,
        answers: { ...selectedAnswers },
        passed: true,
        takenAt: new Date().toISOString(),
        durationSeconds: topic.timeLimitMinutes > 0 ? (topic.timeLimitMinutes * 60 - quizTimeLeft) : 180,
        attemptNumber: 1,
        type: 'initial'
      };

      setAttempts(prev => [newAttempt, ...prev]);
      setLastAttemptResult(newAttempt);

      setProgress(prev => prev.map(p => {
        if (p.userId === currentUser.id && p.topicId === selectedTopicId) {
          return {
            ...p,
            initialQuizCompleted: true,
            initialQuizScore: scoreScaled,
            lastActiveAt: new Date().toISOString()
          };
        }
        return p;
      }));

      setQuizMode(false);
      return;
    }

    const hasPassed = scoreScaled >= topic.minScoreToPass;
    const attemptNum = userProgress.attemptsCount + 1;

    // Create Attempt record
    const newAttempt: QuizAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.name,
      topicId: selectedTopicId,
      topicTitle: topic.title,
      score: scoreScaled,
      answers: { ...selectedAnswers },
      passed: hasPassed,
      takenAt: new Date().toISOString(),
      durationSeconds: topic.timeLimitMinutes > 0 ? (topic.timeLimitMinutes * 60 - quizTimeLeft) : 180,
      attemptNumber: attemptNum,
      type: 'final'
    };

    setAttempts(prev => [newAttempt, ...prev]);
    setLastAttemptResult(newAttempt);

    // Update global progress
    setProgress(prev => prev.map(p => {
      if (p.userId === currentUser.id && p.topicId === selectedTopicId) {
        const newStatus = hasPassed 
          ? 'passed' as const 
          : p.quizStatus === 'passed' ? 'passed' as const : 'failed' as const;
        
        const bestScore = p.highestScore === null 
          ? scoreScaled 
          : Math.max(p.highestScore, scoreScaled);

        const completionDate = p.completedAt || (hasPassed ? newAttempt.takenAt : undefined);

        return {
          ...p,
          quizStatus: newStatus,
          highestScore: bestScore,
          attemptsCount: attemptNum,
          lastActiveAt: new Date().toISOString(),
          completedAt: completionDate
        };
      }
      return p;
    }));

    setQuizMode(false);
  };

  // --- SUBMIT FEEDBACK REVIEW ---
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId || satisfactionRating === null || clarityRating === null) return;

    // Map combined satisfaction (0-3) + clarity (0-3) to a standard 1-5 star scale for backwards-compatibility:
    const finalRating = Math.min(
      5,
      Math.max(1, Math.round(((satisfactionRating + clarityRating) / 6) * 4 + 1))
    );

    const newReview: CourseReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      topicId: selectedTopicId,
      userId: currentUser.id,
      userName: currentUser.name,
      rating: finalRating,
      comment: reviewComment.trim() || 'Sin comentarios adicionales',
      submittedAt: new Date().toISOString(),
      satisfactionRating,
      clarityRating
    };

    setReviews(prev => [newReview, ...prev]);
    setReviewSubmitted(true);
  };

  // --- RENDERING FORMATTING ---
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div className="min-h-screen bg-[#F5F7F8] flex text-[#2D3B45] font-sans antialiased selection:bg-[#0374B5] selection:text-white">
      
      {/* CANVAS GLOBAL NAVIGATION SIDEBAR (LEFT) - DESKTOP ONLY */}
      <aside className="hidden md:flex w-[76px] shrink-0 bg-[#1E2B37] text-white flex-col items-center py-3.5 z-30 sticky top-0 h-screen select-none border-r border-[#15202B]">
        {/* Institutional Logo */}
        <div 
          onClick={() => { setSelectedTopicId(null); setQuizMode(false); }}
          className="flex flex-col items-center justify-center p-1.5 mb-3 text-white hover:opacity-90 cursor-pointer group"
          title="Aula Virtual Fundametz - Ir a Inicio"
        >
          <div className="w-11 h-11 rounded-[4px] bg-[#0374B5] flex items-center justify-center text-white shadow-sm group-hover:bg-[#025a8c] transition-colors">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-bold text-slate-200 mt-1 tracking-tight">Fundametz</span>
        </div>

        {/* Global Navigation Items */}
        <div className="w-full flex-1 flex flex-col items-center space-y-1">
          {/* Cuenta */}
          <button
            onClick={() => setIsAccountOpen(true)}
            title="Cuenta de Usuario"
            className="w-full flex flex-col items-center py-2.5 px-1 text-slate-300 hover:text-white hover:bg-[#263645] transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-600 border border-slate-400 flex items-center justify-center text-white text-xs font-bold mb-1 group-hover:border-white">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-[11px] font-medium leading-none">Cuenta</span>
          </button>

          {/* Tablero */}
          <button
            onClick={() => { setSelectedTopicId(null); setQuizMode(false); }}
            title="Tablero"
            className={`w-full flex flex-col items-center py-2.5 px-1 transition-colors cursor-pointer relative ${
              !selectedTopicId 
                ? 'bg-[#2D3B45] text-white border-l-4 border-[#008EE2]' 
                : 'text-slate-300 hover:text-white hover:bg-[#263645]'
            }`}
          >
            <LayoutDashboard className="h-6 w-6 mb-1 text-inherit" />
            <span className="text-[11px] font-medium leading-none">Tablero</span>
          </button>

          {/* Calendario */}
          <button
            onClick={() => setIsCalendarOpen(true)}
            title="Calendario de Entregas"
            className="w-full flex flex-col items-center py-2.5 px-1 text-slate-300 hover:text-white hover:bg-[#263645] transition-colors cursor-pointer relative"
          >
            <Calendar className="h-6 w-6 mb-1 text-inherit" />
            <span className="text-[11px] font-medium leading-none">Calendario</span>
          </button>

          {/* Bandeja de Entrada */}
          <button
            id="btn-mailbox"
            onClick={handleOpenMailbox}
            title="Bandeja de Entrada"
            className="w-full flex flex-col items-center py-2.5 px-1 text-slate-300 hover:text-white hover:bg-[#263645] transition-colors cursor-pointer relative"
          >
            <div className="relative">
              <Mail className="h-6 w-6 mb-1 text-inherit" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#EE0606] text-[9px] font-bold text-white ring-1 ring-[#1E2B37]">
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-none">Bandeja</span>
          </button>
        </div>

        {/* Salir */}
        <div className="w-full pt-2 border-t border-[#2D3B45]">
          <button
            id="btn-logout"
            onClick={onLogout}
            title="Cerrar sesión"
            className="w-full flex flex-col items-center py-2 px-1 text-slate-400 hover:text-rose-400 hover:bg-[#263645] transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium leading-none">Salir</span>
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (FIXED) */}
      <nav aria-label="Navegación móvil" className="fixed bottom-0 left-0 right-0 z-40 bg-[#1E2B37] text-white flex md:hidden items-center justify-around py-1.5 px-1 border-t border-[#15202B] shadow-2xl safe-area-bottom">
        {/* Tablero */}
        <button
          onClick={() => { setSelectedTopicId(null); setQuizMode(false); }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
            !selectedTopicId
              ? 'text-[#008EE2] font-bold'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <LayoutDashboard className="h-5 w-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Tablero</span>
        </button>

        {/* Si está en un tema: botón de tema activo */}
        {selectedTopicId && (
          <button
            onClick={() => {
              const viewer = document.getElementById('document-viewer-container');
              if (viewer) viewer.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-emerald-400 font-bold transition-colors cursor-pointer"
          >
            <BookOpen className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Tema</span>
          </button>
        )}

        {/* Calendario */}
        <button
          onClick={() => setIsCalendarOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <Calendar className="h-5 w-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Calendario</span>
        </button>

        {/* Bandeja con badge */}
        <button
          onClick={handleOpenMailbox}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer relative"
        >
          <div className="relative">
            <Mail className="h-5 w-5 mb-0.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#EE0606] text-[8px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-tight">Bandeja</span>
        </button>

        {/* Cuenta */}
        <button
          onClick={() => setIsAccountOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <div className="w-5 h-5 rounded-full bg-[#0374B5] text-white flex items-center justify-center text-[10px] font-bold mb-0.5">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-[10px] leading-tight">Cuenta</span>
        </button>

        {/* Menú drawer toggle */}
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Menú</span>
        </button>
      </nav>

      {/* MOBILE SLIDE-OVER DRAWER */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-[280px] max-w-[80vw] bg-[#1E2B37] text-white h-full flex flex-col shadow-2xl z-10"
            >
              {/* Header */}
              <div className="p-4 border-b border-[#2D3B45] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-[4px] bg-[#0374B5] flex items-center justify-center text-white shadow-sm font-bold">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-none">Fundametz</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-none">Aula Virtual</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#263645]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User info banner */}
              <div className="p-4 bg-[#15202B] border-b border-[#2D3B45] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0374B5] border-2 border-white/20 flex items-center justify-center text-white text-sm font-bold">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                  <span className="inline-block px-1.5 py-0.2 mt-1 rounded bg-[#0374B5]/20 text-[#008EE2] text-[10px] font-mono">
                    {currentUser.area || 'Colaborador'}
                  </span>
                </div>
              </div>

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
                <button
                  onClick={() => { setSelectedTopicId(null); setQuizMode(false); setIsMobileNavOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-[#263645] hover:text-white transition-colors"
                >
                  <LayoutDashboard className="h-5 w-5 text-[#008EE2]" />
                  <span className="text-xs font-medium">Tablero de Cursos</span>
                </button>
                <button
                  onClick={() => { setIsCalendarOpen(true); setIsMobileNavOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-[#263645] hover:text-white transition-colors"
                >
                  <Calendar className="h-5 w-5 text-amber-400" />
                  <span className="text-xs font-medium">Calendario de Entregas</span>
                </button>
                <button
                  onClick={() => { handleOpenMailbox(); setIsMobileNavOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-[#263645] hover:text-white transition-colors"
                >
                  <Mail className="h-5 w-5 text-emerald-400" />
                  <span className="text-xs font-medium flex-1 text-left">Bandeja de Entrada</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#EE0606] text-white text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setIsAccountOpen(true); setIsMobileNavOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-[#263645] hover:text-white transition-colors"
                >
                  <UserIcon className="h-5 w-5 text-indigo-400" />
                  <span className="text-xs font-medium">Mi Cuenta y Perfil</span>
                </button>
                <button
                  onClick={() => { setIsManualOpen(true); setIsMobileNavOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-[#263645] hover:text-white transition-colors"
                >
                  <HelpCircle className="h-5 w-5 text-cyan-400" />
                  <span className="text-xs font-medium">Manual de Usuario</span>
                </button>
              </div>

              {/* Logout Footer */}
              <div className="p-3 border-t border-[#2D3B45]">
                <button
                  onClick={() => { setIsMobileNavOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors font-medium text-xs"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CANVAS MAIN APP CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* CANVAS TOP BREADCRUMB HEADER */}
        <header id="user-header" className="bg-white border-b border-[#C7CDD1] px-3.5 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          {/* Left: Mobile Menu Toggle & Breadcrumbs Navigation */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              title="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[#556575] min-w-0">
              <button 
                onClick={() => { setSelectedTopicId(null); setQuizMode(false); }}
                className="font-medium text-[#0374B5] hover:underline cursor-pointer shrink-0"
              >
                Tablero
              </button>
              {selectedTopicId && (
                <>
                  <span className="text-slate-400 shrink-0">/</span>
                  <span className="text-[#2D3B45] font-semibold truncate max-w-[130px] sm:max-w-md">
                    {topics.find(t => t.id === selectedTopicId)?.title || 'Curso'}
                  </span>
                </>
              )}
            </nav>
          </div>

          {/* Right User Status & Actions */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-[#2D3B45] block leading-tight">{currentUser.name}</span>
              <span className="text-[11px] text-[#556575] leading-tight">{currentUser.area || 'Colaborador'}</span>
            </div>
            <button
              onClick={() => setIsAccountOpen(true)}
              className="w-8 h-8 rounded-full bg-[#0374B5] text-white flex items-center justify-center font-bold text-xs hover:bg-[#025a8c] transition-colors cursor-pointer shadow-xs"
              title="Ver perfil de cuenta"
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </button>
          </div>
        </header>

        {/* DASHBOARD CONTAINER */}
        <main className="flex-1 overflow-y-auto p-2.5 sm:p-6 pb-24 md:pb-6 max-w-[1600px] w-full mx-auto">
          {unreadCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-[#C7CDD1] border-l-4 border-l-[#0374B5] rounded-[4px] p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs mb-5"
            >
              <div className="flex gap-3 items-center">
                <div className="p-2 bg-[#F0F2F5] text-[#0374B5] rounded-[4px] shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#2D3B45]">Mensajes nuevos en su buzón</h4>
                  <p className="text-xs text-[#556575]">
                    Tiene <strong>{unreadCount}</strong> {unreadCount === 1 ? 'notificación importante' : 'notificaciones importantes'} de capacitaciones.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={handleOpenMailbox}
                  className="px-3 py-1.5 bg-[#0374B5] hover:bg-[#025a8c] text-white rounded-[4px] text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  Abrir Buzón
                </button>
                <button
                  onClick={markAllMessagesAsRead}
                  title="Marcar como leídos y cerrar aviso"
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-[4px] transition-colors cursor-pointer shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            
            {/* VIEW 1: CANVAS TWO-COLUMN DASHBOARD (MAIN CONTENT + RIGHT SIDE BAR) */}
            {!selectedTopicId ? (
              <motion.div
                key="catalog-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col lg:flex-row gap-6 items-start"
              >
                {/* LEFT: MAIN CONTENT AREA */}
                <div className="flex-1 min-w-0 w-full space-y-5">
                  
                  {/* Title & Canvas Horizontal Divider */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h1 className="text-2xl font-bold text-[#2D3B45] tracking-tight">Tablero</h1>
                        <p className="text-xs text-[#556575] mt-0.5">Mis capacitaciones asignadas y cursos virtuales disponibles</p>
                      </div>
                    </div>
                    <hr className="border-[#C7CDD1] my-4" />
                  </div>

                  {/* CATALOG TABS (CANVAS STYLE) */}
                  <div className="flex flex-wrap border-b border-[#C7CDD1] gap-2 pb-0">
                    <button
                      onClick={() => setCatalogTab('all')}
                      className={`px-4 py-2 text-xs font-semibold rounded-t-[4px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                        catalogTab === 'all'
                          ? 'border-b-2 border-[#0374B5] text-[#0374B5] font-bold'
                          : 'text-[#556575] hover:text-[#2D3B45] hover:bg-[#FFFFFF]'
                      }`}
                    >
                      <span>Todos</span>
                      <span className="text-[11px] px-1.5 py-0.2 bg-[#F0F2F5] text-[#556575] rounded-full">
                        {publishedTopics.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setCatalogTab('pending')}
                      className={`px-4 py-2 text-xs font-semibold rounded-t-[4px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                        catalogTab === 'pending'
                          ? 'border-b-2 border-[#0374B5] text-[#0374B5] font-bold'
                          : 'text-[#556575] hover:text-[#2D3B45] hover:bg-[#FFFFFF]'
                      }`}
                    >
                      <span>Pendientes</span>
                      <span className="text-[11px] px-1.5 py-0.2 bg-[#FC5E13]/10 text-[#FC5E13] rounded-full font-bold">
                        {publishedTopics.filter(t => getUserProgressForTopic(t.id).quizStatus !== 'passed').length}
                      </span>
                    </button>
                    <button
                      onClick={() => setCatalogTab('passed')}
                      className={`px-4 py-2 text-xs font-semibold rounded-t-[4px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                        catalogTab === 'passed'
                          ? 'border-b-2 border-[#0374B5] text-[#0374B5] font-bold'
                          : 'text-[#556575] hover:text-[#2D3B45] hover:bg-[#FFFFFF]'
                      }`}
                    >
                      <span>Aprobados</span>
                      <span className="text-[11px] px-1.5 py-0.2 bg-[#00AC18]/10 text-[#00AC18] rounded-full font-bold">
                        {publishedTopics.filter(t => getUserProgressForTopic(t.id).quizStatus === 'passed').length}
                      </span>
                    </button>
                  </div>

                  {/* TOPICS RENDER GRID OR EMPTY STATES */}
                  {(() => {
                    const filteredTopics = publishedTopics.filter(t => {
                      const prog = getUserProgressForTopic(t.id);
                      if (catalogTab === 'pending') {
                        return prog.quizStatus !== 'passed';
                      }
                      if (catalogTab === 'passed') {
                        return prog.quizStatus === 'passed';
                      }
                      return true;
                    });

                    if (filteredTopics.length === 0) {
                      return (
                        <div className="bg-white rounded-[4px] border border-[#C7CDD1] p-8 text-center space-y-3">
                          <div className="flex justify-center text-slate-400">
                            {catalogTab === 'pending' ? (
                              <CheckCircle2 className="h-10 w-10 text-[#00AC18]" />
                            ) : (
                              <Award className="h-10 w-10 text-[#0374B5]" />
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-[#2D3B45]">
                            {catalogTab === 'pending' ? '¡Excelente trabajo!' : 'Sin capacitaciones registradas'}
                          </h3>
                          <p className="text-xs text-[#556575] max-w-md mx-auto leading-relaxed">
                            {catalogTab === 'pending' 
                              ? 'Ha completado y aprobado todas las capacitaciones asignadas. Está al día con sus cursos formativos.' 
                              : 'Aún no tiene cursos aprobados en esta vista. Inicie sus lecturas y rinda los cuestionarios para certificarse.'}
                          </p>
                        </div>
                      );
                    }

                    // Canvas Palette for Course Card Headers
                    const bannerColors = ['#0374B5', '#008EE2', '#00AC18', '#E65100', '#7B1FA2', '#0097A7', '#D32F2F', '#455A64'];

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredTopics.map((t, idx) => {
                          const prog = getUserProgressForTopic(t.id);
                          const topicMats = materials.filter(m => m.topicId === t.id);
                          const completedCount = prog.completedMaterialIds.length;
                          const totalCount = topicMats.length;
                          const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                          
                          const isOverdue = t.dueDate && prog.quizStatus !== 'passed' && (new Date(t.dueDate + 'T23:59:59') < new Date());
                          const bannerColor = bannerColors[idx % bannerColors.length];

                          return (
                            <div 
                              key={t.id} 
                              onClick={() => handleSelectTopic(t.id)}
                              className="bg-white rounded-[4px] border border-[#C7CDD1] hover:border-[#999DA0] hover:shadow-sm transition-all flex flex-col overflow-hidden relative cursor-pointer group/card"
                            >
                              {/* 1. Canvas Course Card Top Color Banner (18px solid color) */}
                              <div 
                                className="h-5 w-full shrink-0" 
                                style={{ backgroundColor: bannerColor }} 
                              />

                              {/* 2. Course Card Body */}
                              <div className="p-4 flex-1 space-y-3 flex flex-col justify-between">
                                <div className="space-y-2">
                                  {/* Code and Status Badge */}
                                  <div className="flex justify-between items-start gap-2">
                                    <span className="text-[11px] font-bold text-[#0374B5] tracking-wide uppercase">
                                      {t.category || 'CAPACITACIÓN'}
                                    </span>
                                    {prog.quizStatus === 'passed' ? (
                                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#00AC18]/10 text-[#00AC18] border border-[#00AC18]/30 rounded-[3px] shrink-0 flex items-center gap-1 uppercase">
                                        <CheckCircle2 className="h-3 w-3" /> APROBADO
                                      </span>
                                    ) : prog.quizStatus === 'failed' ? (
                                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#EE0606]/10 text-[#EE0606] border border-[#EE0606]/30 rounded-[3px] shrink-0 flex items-center gap-1 uppercase">
                                        <XCircle className="h-3 w-3" /> REPROBADO
                                      </span>
                                    ) : completedCount > 0 ? (
                                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FC5E13]/10 text-[#FC5E13] border border-[#FC5E13]/30 rounded-[3px] shrink-0 uppercase">
                                        EN CURSO
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-medium px-2 py-0.5 bg-[#F5F7F8] text-[#556575] border border-[#C7CDD1] rounded-[3px] shrink-0 uppercase">
                                        NO INICIADO
                                      </span>
                                    )}
                                  </div>

                                  {/* Title & Description */}
                                  <h3 className="text-[15px] font-bold text-[#2D3B45] group-hover/card:text-[#0374B5] transition-colors leading-snug line-clamp-2">
                                    {t.title}
                                  </h3>
                                  <p className="text-xs text-[#556575] line-clamp-2 leading-relaxed">{t.description}</p>
                                </div>

                                <div className="space-y-2 pt-1">
                                  {/* Due Date Indicator */}
                                  {t.dueDate && (
                                    <div className={`px-2.5 py-1.5 rounded-[4px] border text-xs flex items-center gap-2 ${
                                      prog.quizStatus === 'passed'
                                        ? 'bg-green-50/70 border-green-200 text-[#00AC18]'
                                        : isOverdue
                                          ? 'bg-red-50 border-red-200 text-[#EE0606]'
                                          : 'bg-orange-50 border-orange-200 text-[#E09F1F]'
                                    }`}>
                                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                                      <div className="flex-1 flex justify-between items-center text-[11px]">
                                        <span>Fecha límite: <strong>{t.dueDate}</strong></span>
                                        {isOverdue && <span className="font-bold uppercase text-[10px]">VENCIDO</span>}
                                      </div>
                                    </div>
                                  )}

                                  {/* Progress Bar in Canvas Style */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] text-[#556575]">
                                      <span>Avance de Lecturas</span>
                                      <span className="font-semibold text-[#2D3B45]">{completedCount} / {totalCount} ({progressPct}%)</span>
                                    </div>
                                    <div className="w-full bg-[#E0E0E0] h-1.5 rounded-[2px] overflow-hidden">
                                      <div 
                                        className="bg-[#0374B5] h-full transition-all duration-300 rounded-[2px]" 
                                        style={{ width: `${progressPct}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 3. Canvas Card Footer: Clean Status & Single Primary Action */}
                              <div className="px-4 py-2.5 bg-white border-t border-[#C7CDD1] flex items-center justify-between text-xs text-[#556575] shrink-0">
                                <div>
                                  {prog.quizStatus === 'passed' ? (
                                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#00AC18]">
                                      <Award className="h-3.5 w-3.5 shrink-0" />
                                      <span>Aprobado ({prog.highestScore ?? '-'}/10)</span>
                                    </span>
                                  ) : isOverdue ? (
                                    <span className="text-[11px] font-mono font-bold text-rose-600">
                                      Vencido (Solo consulta)
                                    </span>
                                  ) : prog.completedMaterialIds.length > 0 ? (
                                    <span className="text-[11px] font-mono text-indigo-600 font-semibold">
                                      {completedCount} de {totalCount} lecturas listas
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-slate-400 font-mono">
                                      {totalCount} {totalCount === 1 ? 'lectura' : 'lecturas'}
                                    </span>
                                  )}
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectTopic(t.id);
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer bg-[#0374B5] hover:bg-[#025a8c] text-white"
                                >
                                  <span>
                                    {isOverdue 
                                      ? 'Visualizar' 
                                      : prog.completedMaterialIds.length > 0 
                                        ? 'Continuar' 
                                        : 'Iniciar'}
                                  </span>
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* RIGHT SIDE BAR: CANVAS "POR HACER", "TAREAS PRÓXIMAS", "CALIFICACIONES RECIENTES" */}
                <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-5">
                  
                  {/* 1. POR HACER (To Do) */}
                  <div className="bg-white border border-[#C7CDD1] rounded-[4px] p-4 shadow-xs">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E0E0E0]">
                      <h3 className="text-sm font-bold text-[#2D3B45]">Por hacer</h3>
                      <span className="text-[11px] text-[#556575]">
                        {publishedTopics.filter(t => getUserProgressForTopic(t.id).quizStatus !== 'passed').length} tareas
                      </span>
                    </div>

                    {(() => {
                      const pending = publishedTopics.filter(t => getUserProgressForTopic(t.id).quizStatus !== 'passed').slice(0, 4);
                      if (pending.length === 0) {
                        return (
                          <div className="text-center py-4 text-xs text-[#556575]">
                            <CheckCircle2 className="h-6 w-6 text-[#00AC18] mx-auto mb-1.5" />
                            <p className="font-medium">No hay tareas pendientes</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">¡Estás al día con todos tus cursos!</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          {pending.map(t => {
                            const p = getUserProgressForTopic(t.id);
                            return (
                              <div 
                                key={t.id} 
                                onClick={() => handleSelectTopic(t.id)}
                                className="group/item flex items-start gap-2.5 p-2 rounded-[4px] hover:bg-[#F5F7F8] transition-colors cursor-pointer border border-transparent hover:border-[#C7CDD1]"
                              >
                                <div className="mt-0.5 text-[#0374B5]">
                                  <CheckSquare className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-semibold text-[#2D3B45] group-hover/item:text-[#0374B5] transition-colors truncate">
                                    {t.title}
                                  </h4>
                                  <div className="flex items-center gap-2 text-[11px] text-[#556575] mt-0.5">
                                    <span>Mín. {t.minScoreToPass}/10 pts</span>
                                    {t.dueDate && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate">{t.dueDate}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover/item:translate-x-0.5 transition-transform shrink-0 mt-1" />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* 2. TAREAS PRÓXIMAS (Upcoming Deadlines) */}
                  <div className="bg-white border border-[#C7CDD1] rounded-[4px] p-4 shadow-xs">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E0E0E0]">
                      <h3 className="text-sm font-bold text-[#2D3B45]">Tareas Próximas</h3>
                      <button 
                        onClick={() => setIsCalendarOpen(true)}
                        className="text-[11px] text-[#0374B5] hover:underline font-medium cursor-pointer"
                      >
                        Ver calendario
                      </button>
                    </div>

                    {(() => {
                      const withDates = publishedTopics.filter(t => t.dueDate).slice(0, 3);
                      if (withDates.length === 0) {
                        return (
                          <p className="text-xs text-[#556575] italic py-2">No hay fechas programadas próximas.</p>
                        );
                      }

                      return (
                        <div className="space-y-2.5">
                          {withDates.map(t => (
                            <div key={t.id} className="flex items-center justify-between text-xs p-1.5 rounded-[4px] hover:bg-[#F5F7F8] transition-colors">
                              <div className="truncate pr-2">
                                <span className="font-medium text-[#2D3B45] block truncate">{t.title}</span>
                                <span className="text-[11px] text-[#556575]">{t.dueDate}</span>
                              </div>
                              <button 
                                onClick={() => handleSelectTopic(t.id)}
                                className="text-[11px] text-[#0374B5] font-semibold hover:underline shrink-0"
                              >
                                Ir
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* 3. CALIFICACIONES RECIENTES (Recent Feedback & Grades) */}
                  <div className="bg-white border border-[#C7CDD1] rounded-[4px] p-4 shadow-xs">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E0E0E0]">
                      <h3 className="text-sm font-bold text-[#2D3B45]">Calificaciones recientes</h3>
                    </div>

                    {(() => {
                      const userAttempts = attempts.filter(a => a.userId === currentUser.id).slice(-4).reverse();
                      if (userAttempts.length === 0) {
                        return (
                          <div className="text-center py-4 text-xs text-[#556575]">
                            <p>No ha realizado intentos de evaluación aún.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2.5">
                          {userAttempts.map(a => {
                            const relatedTopic = topics.find(t => t.id === a.topicId);
                            return (
                              <div key={a.id} className="flex items-center justify-between p-2 rounded-[4px] bg-[#F5F7F8] border border-[#E0E0E0] text-xs">
                                <div className="truncate pr-2">
                                  <span className="font-semibold text-[#2D3B45] block truncate">
                                    {relatedTopic?.title || 'Evaluación'}
                                  </span>
                                  <span className="text-[10px] text-[#556575]">
                                    {new Date(a.takenAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className={`font-bold text-xs ${a.passed ? 'text-[#00AC18]' : 'text-[#EE0606]'}`}>
                                    {a.score}/10 pts
                                  </span>
                                  <span className={`block text-[9px] uppercase font-bold ${a.passed ? 'text-[#00AC18]' : 'text-[#EE0606]'}`}>
                                    {a.passed ? 'Aprobado' : 'Reprobado'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Quick Shortcut Buttons */}
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={handleOpenMailbox}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white border border-[#C7CDD1] text-[#2D3B45] hover:bg-[#F5F7F8] text-xs font-semibold rounded-[4px] transition-colors cursor-pointer"
                    >
                      <Mail className="h-4 w-4 text-[#0374B5]" />
                      <span>Bandeja de Entrada</span>
                      {unreadCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-[#EE0606] text-white rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </div>
                </aside>

              </motion.div>
            ) : (
            
            /* VIEW 2: COURSE DETAILED WORKSPACE */
            (() => {
              const currentTopic = topics.find(t => t.id === selectedTopicId);
              if (!currentTopic) return null;

              const topicMaterials = materials.filter(m => m.topicId === selectedTopicId);
              const activeMaterial = topicMaterials.find(m => m.id === activeMaterialId);
              const userProgress = getUserProgressForTopic(selectedTopicId);
              const totalMats = topicMaterials.length;
              const completedMats = userProgress.completedMaterialIds.length;
              const isMaterialsFinished = completedMats === totalMats;
              
              const isCurrentTopicOverdue = currentTopic.dueDate && userProgress.quizStatus !== 'passed' && (new Date(currentTopic.dueDate + 'T23:59:59') < new Date());

              const hasMaxScore = userProgress.highestScore !== null && userProgress.highestScore >= 10;
              const isAttemptsLimitReached = userProgress.attemptsCount >= 3;

              return (
                <motion.div
                  key="course-workspace"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  {/* Workspace Sub Header / Navigation */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 bg-white p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs sm:shadow-md">
                    {lastAttemptResult?.passed && lastAttemptResult?.type === 'final' && !reviewSubmitted ? (
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 uppercase tracking-wide">
                        ⚠️ Encuesta de Eficacia Pendiente
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedTopicId(null)}
                        className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 hover:text-indigo-600 uppercase tracking-wider cursor-pointer transition-colors py-1 px-1.5 -ml-1 rounded-lg hover:bg-slate-50 w-fit"
                      >
                        <ChevronLeft className="h-4 w-4 text-indigo-600" /> Volver al Catálogo
                      </button>
                    )}
                    <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">CAPACITACIÓN ACTIVA</span>
                      <h2 className="text-xs sm:text-sm font-serif italic font-bold text-slate-800 truncate max-w-full sm:max-w-md">{currentTopic.title}</h2>
                    </div>
                  </div>

                  {isCurrentTopicOverdue && (
                    <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-2xl text-xs font-mono text-rose-900 space-y-1.5 shadow-sm">
                      <div className="flex items-center gap-2 font-bold text-rose-800 uppercase text-[11px] tracking-wide">
                        <AlertTriangle className="h-4.5 w-4.5 text-rose-600 animate-pulse" />
                        <span>Este Tema de Capacitación ha Vencido</span>
                      </div>
                      <p className="leading-relaxed text-slate-700 font-sans">
                        La fecha límite de entrega era el <strong>{currentTopic.dueDate}</strong>. Como no se completó a tiempo, esta capacitación ha quedado guardada como expediente ("no realizada").
                        Puedes seguir visualizando las lecturas y materiales didácticos, pero ya no se registrará ningún avance ni se podrá realizar la evaluación final.
                      </p>
                    </div>
                  )}

                  {/* ACTIVE SCREEN TYPE PANEL */}
                  {!quizMode && !lastAttemptResult ? (
                    currentTopic.hasInitialQuiz && !userProgress.initialQuizCompleted ? (
                      /* DIAGNOSTIC INVITATION PANEL */
                      <div className="max-w-xl mx-auto bg-white border border-slate-200/80 shadow-xl rounded-2xl p-8 space-y-6 text-center my-4">
                        <div className="space-y-2">
                          <div className="mx-auto h-14 w-14 bg-amber-500/10 text-amber-700 rounded-2xl shadow-sm flex items-center justify-center">
                            <GraduationCap className="h-8 w-8" />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-widest block">Evaluación de Conocimiento Inicial</span>
                          <h3 className="text-xl font-serif italic font-bold text-slate-850">Pre-test Obligatorio: {currentTopic.title}</h3>
                        </div>

                        <button
                          onClick={() => handleStartQuiz(currentTopic, 'initial')}
                          className="w-full py-3.5 px-6 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-widest cursor-pointer shadow-lg shadow-amber-100 hover:shadow-xl transition-all duration-200"
                        >
                          Iniciar Evaluación de Conocimiento Inicial
                        </button>
                      </div>
                    ) : (
                      /* 2.A - STANDARD DOCUMENT / VIDEO READING PANEL */
                      <div className="space-y-4">
                        {/* THEATER MODE RESTORE RIBBON */}
                        {isTheaterMode && (
                          <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-sm text-xs font-mono">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                              <span className="font-bold text-amber-300">Modo Cine Activo:</span>
                              <span className="text-slate-300 hidden sm:inline">Visualización expandida a pantalla ancha</span>
                            </div>
                            <button
                              onClick={() => setIsTheaterMode(false)}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-mono font-bold text-[10px] uppercase rounded-lg transition-colors cursor-pointer"
                            >
                              Mostrar Plan de Aprendizaje
                            </button>
                          </div>
                        )}

                        {/* HORIZONTAL LEARNING PLAN BAR (OPCIÓN 2: ACORDEÓN INTELIGENTE PLEGABLE) */}
                        <div className={`${isTheaterMode ? 'hidden' : 'block'} bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden transition-all duration-200`}>
                          {/* Plan Header: Progress, Count & Action (Barra compacta plegable) */}
                          <div className="p-3 sm:p-3.5 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
                            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
                              {/* Clickable Title & Icon to Toggle */}
                              <button
                                type="button"
                                onClick={() => setIsLearningPlanExpanded(prev => !prev)}
                                className="flex items-center gap-2.5 text-left group cursor-pointer"
                                title={isLearningPlanExpanded ? "Plegar índice de lecturas" : "Expandir índice completo de lecturas"}
                              >
                                <div className="h-8.5 w-8.5 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs transition-colors">
                                  <BookOpen className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-widest group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                                      <span>Plan de Aprendizaje</span>
                                    </h3>
                                    {isMaterialsFinished ? (
                                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        ✓ Lecturas Listas
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                        {completedMats} de {totalMats}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 flex-wrap">
                                    <span>{completedMats} de {totalMats} completados</span>
                                    {activeMaterial && (
                                      <span className="hidden sm:inline text-slate-400">
                                        • Viendo: <strong className="text-slate-700 font-semibold truncate max-w-[200px] md:max-w-xs inline-block align-bottom">{activeMaterial.title}</strong>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>

                              {/* Progress bar pill */}
                              <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs font-mono text-xs">
                                <div className="w-16 sm:w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-500 rounded-full ${isMaterialsFinished ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                    style={{ width: `${totalMats > 0 ? (completedMats / totalMats) * 100 : 0}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-slate-700">
                                  {totalMats > 0 ? Math.round((completedMats / totalMats) * 100) : 0}%
                                </span>
                              </div>
                            </div>

                            {/* Right action: Certificate, Evaluation & Toggle Accordion */}
                            <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
                              {userProgress.quizStatus === 'passed' && (
                                <button
                                  onClick={() => handleDownloadCertificate(currentTopic)}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 border border-amber-600 text-slate-950 font-mono font-bold text-[11px] uppercase tracking-wider rounded-xl shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                                  title="Descargar Certificado Oficial"
                                >
                                  <Award className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Descargar Certificado</span>
                                  <span className="sm:hidden">Certificado</span>
                                </button>
                              )}

                              {isMaterialsFinished && userProgress.quizStatus !== 'passed' && (
                                <button
                                  onClick={() => {
                                    if (!isCurrentTopicOverdue && !isAttemptsLimitReached && !hasMaxScore) {
                                      handleStartQuiz(currentTopic);
                                    }
                                  }}
                                  disabled={isCurrentTopicOverdue || isAttemptsLimitReached || hasMaxScore}
                                  className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition-colors ${
                                    isCurrentTopicOverdue || isAttemptsLimitReached || hasMaxScore
                                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                                  }`}
                                  title="Rendir Evaluación Final"
                                >
                                  <HelpCircle className="h-3.5 w-3.5 text-emerald-200" />
                                  <span>Rendir Evaluación</span>
                                </button>
                              )}

                              {/* Accordion Toggle Button */}
                              <button
                                type="button"
                                onClick={() => setIsLearningPlanExpanded(prev => !prev)}
                                className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                                  isLearningPlanExpanded
                                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                                    : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700'
                                }`}
                                aria-expanded={isLearningPlanExpanded}
                                title={isLearningPlanExpanded ? "Plegar índice de lecturas" : "Ver todas las lecturas de este tema"}
                              >
                                {isLearningPlanExpanded ? (
                                  <>
                                    <ChevronUp className="h-4 w-4 text-slate-600" />
                                    <span>Plegar Índice</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-4 w-4 text-indigo-600" />
                                    <span className="hidden sm:inline">Ver Índice Completo ({totalMats})</span>
                                    <span className="sm:hidden">Ver Índice ({totalMats})</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Collapsible Content: Stepper / Cards for Materials */}
                          <AnimatePresence initial={false}>
                            {isLearningPlanExpanded && (
                              <motion.div
                                key="learning-plan-cards"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.22, ease: 'easeInOut' }}
                                className="overflow-hidden border-t border-slate-100"
                              >
                                <div className="p-2.5 sm:p-3 bg-white">
                            <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-slate-200 scroll-smooth snap-x snap-mandatory">
                              {topicMaterials.map((m, idx) => {
                                const isRead = userProgress.completedMaterialIds.includes(m.id);
                                const isActive = m.id === activeMaterialId;

                                return (
                                  <button
                                    key={m.id}
                                    onClick={() => {
                                      setActiveMaterialId(m.id);
                                      setQuizMode(false);
                                      setLastAttemptResult(null);
                                      setTimeout(() => {
                                        const viewer = document.getElementById('document-viewer-container');
                                        if (viewer && window.innerWidth < 1024) {
                                          viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                      }, 100);
                                    }}
                                    className={`group shrink-0 snap-start w-[210px] sm:w-[250px] max-w-[280px] p-2.5 sm:p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between gap-2 cursor-pointer ${
                                      isActive
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 ring-2 ring-indigo-600/30'
                                        : isRead
                                          ? 'bg-slate-50/70 hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                                          : 'bg-white hover:bg-indigo-50/30 border-slate-200/90 text-slate-700 hover:border-indigo-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1.5 w-full">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                          #{idx + 1}
                                        </span>
                                        <span className={`shrink-0 ${
                                          isActive
                                            ? 'text-white'
                                            : m.type === 'video'
                                              ? 'text-indigo-600'
                                              : m.type === 'pdf'
                                                ? 'text-rose-600'
                                                : m.type === 'pptx'
                                                  ? 'text-orange-600'
                                                  : 'text-slate-500'
                                        }`}>
                                          {m.type === 'video' ? (
                                            <Play className="h-3.5 w-3.5" />
                                          ) : m.type === 'pdf' ? (
                                            <FileText className="h-3.5 w-3.5" />
                                          ) : m.type === 'pptx' ? (
                                            <Presentation className="h-3.5 w-3.5" />
                                          ) : (
                                            <FileText className="h-3.5 w-3.5" />
                                          )}
                                        </span>
                                        <span className={`text-[10px] font-mono uppercase tracking-wider capitalize ${
                                          isActive ? 'text-indigo-100' : 'text-slate-400'
                                        }`}>
                                          {m.type === 'video' ? 'Video' : m.type === 'pdf' ? 'PDF' : m.type === 'pptx' ? 'PPT' : 'Lectura'}
                                        </span>
                                      </div>

                                      {isRead ? (
                                        <span className={`flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                                          isActive ? 'bg-white/20 text-emerald-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                        }`}>
                                          <CheckCircle2 className="h-3 w-3" /> Leído
                                        </span>
                                      ) : (
                                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md ${
                                          isActive ? 'bg-white/10 text-indigo-100' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                          Pendiente
                                        </span>
                                      )}
                                    </div>

                                    <div className="w-full">
                                      <p className={`text-xs font-semibold leading-snug line-clamp-2 ${isActive ? 'text-white' : 'text-slate-800'}`} title={m.title}>
                                        {m.title}
                                      </p>
                                      <span className={`text-[10px] font-mono block mt-1.5 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        ⏱ {m.estimatedMinutes} min
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}

                              {/* Evaluation Step Card in Track */}
                              <button
                                onClick={() => {
                                  if (!isCurrentTopicOverdue && isMaterialsFinished && !isAttemptsLimitReached && !hasMaxScore) {
                                    handleStartQuiz(currentTopic);
                                  }
                                }}
                                disabled={isCurrentTopicOverdue || !isMaterialsFinished || isAttemptsLimitReached || hasMaxScore}
                                className={`group shrink-0 snap-start w-[210px] sm:w-[250px] p-2.5 sm:p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between gap-2 ${
                                  isCurrentTopicOverdue
                                    ? 'bg-rose-50/50 border-rose-200 text-rose-500 cursor-not-allowed'
                                    : !isMaterialsFinished
                                      ? 'bg-slate-50 border-dashed border-slate-300 text-slate-400 cursor-not-allowed'
                                      : hasMaxScore
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 cursor-not-allowed'
                                        : isAttemptsLimitReached
                                          ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                          : userProgress.quizStatus === 'passed'
                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100/70 cursor-pointer shadow-xs'
                                            : 'bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100/70 cursor-pointer shadow-xs'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1.5 w-full">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                                      Final
                                    </span>
                                    <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
                                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Evaluación</span>
                                  </div>
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-white/80 border border-slate-200 font-semibold">
                                    {userProgress.attemptsCount}/3 int.
                                  </span>
                                </div>

                                <div>
                                  <p className="text-xs font-bold leading-snug">
                                    {isCurrentTopicOverdue
                                      ? 'Tema Vencido'
                                      : !isMaterialsFinished
                                        ? 'Bloqueada: Complete lecturas'
                                        : hasMaxScore
                                          ? 'Nota Máxima: 10/10'
                                          : userProgress.quizStatus === 'passed'
                                            ? `Aprobado (${userProgress.highestScore ?? '-'}/10)`
                                            : 'Rendir Evaluación Final'}
                                  </p>
                                  <span className="text-[10px] font-mono block mt-1.5 text-slate-500">
                                    {isMaterialsFinished ? '⚡ Desbloqueada para rendir' : '🔒 Requiere completar todas las lecturas'}
                                  </span>
                                </div>
                              </button>
                            </div>
                          </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Full Width Document / Video Viewer */}
                        <div id="document-viewer-container" className="w-full bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-md p-3.5 sm:p-6 space-y-4 sm:space-y-6">
                        {activeMaterial ? (
                          <>
                            {/* HEADER BAR: TITLE, META & SINGLE CLEAN ACTION */}
                            <div className="border-b border-slate-100 pb-3 sm:pb-3.5 flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-150 uppercase tracking-wider">
                                    {activeMaterial.type === 'document' ? 'Lectura' : activeMaterial.type === 'video' ? 'Video instructivo' : activeMaterial.type === 'interactive' ? 'Laboratorio' : activeMaterial.type === 'pdf' ? 'Documento PDF' : 'PowerPoint'}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-500">
                                    ⏱ {activeMaterial.estimatedMinutes} min
                                  </span>
                                </div>
                                <h3 className="text-base sm:text-xl font-serif italic font-bold text-slate-900 leading-snug break-words">
                                  {activeMaterial.title}
                                </h3>
                              </div>

                              {/* State badge + subtle fullscreen toggle */}
                              <div className="shrink-0 flex items-center gap-2 pt-0.5">
                                {userProgress.completedMaterialIds.includes(activeMaterial.id) ? (
                                  <span className="text-[10px] sm:text-xs font-mono font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                    <span>Leído</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] sm:text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg uppercase tracking-wider flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                    <span>Pendiente</span>
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setIsFullscreen(true)}
                                  className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-mono font-bold"
                                  title="Expandir a pantalla completa"
                                >
                                  <Maximize2 className="h-3.5 w-3.5 shrink-0" />
                                  <span className="hidden sm:inline">Pantalla Completa</span>
                                </button>
                              </div>
                            </div>

                            {/* Original File Attachment Card */}
                            {false && (activeMaterial.fileName || activeMaterial.fileUrl || (activeMaterial.type === 'pdf' && activeMaterial.url)) && !getGoogleDriveEmbedUrl(activeMaterial.fileUrl || activeMaterial.url).isDrive && (
                              <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in">
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                  <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md shrink-0">
                                    <FileText className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-wider block">Archivo Original Adjunto</span>
                                    <span className="text-xs font-bold text-slate-900 block truncate max-w-[280px] md:max-w-md">
                                      {activeMaterial.fileName || `${activeMaterial.title}.${activeMaterial.type === 'pdf' ? 'pdf' : activeMaterial.type === 'pptx' ? 'pptx' : 'bin'}`}
                                    </span>
                                    {activeMaterial.fileSize && (
                                      <span className="text-[10px] font-mono text-slate-500 block">
                                        Tamaño: {(activeMaterial.fileSize / (1024 * 1024)).toFixed(2)} MB
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                                  <a
                                    href={activeMaterial.fileUrl || activeMaterial.url || pdfBlobUrl || undefined}
                                    download={activeMaterial.fileName || `${activeMaterial.title}.${activeMaterial.type === 'pdf' ? 'pdf' : activeMaterial.type === 'pptx' ? 'pptx' : 'bin'}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-[10px] uppercase rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-center cursor-pointer inline-flex items-center justify-center gap-1.5 font-sans"
                                  >
                                    Descargar Archivo Tal Cual 📥
                                  </a>
                                </div>
                              </div>
                            )}

                            {/* Google Drive / Google Docs Embed Integration */}
                            {(() => {
                              const driveInfo = getGoogleDriveEmbedUrl(activeMaterial.fileUrl || activeMaterial.url);
                              if (driveInfo.isDrive) {
                                return (
                                  <div className="space-y-3">
                                    {/* Embedded iframe with integrated header & external link */}
                                    <div className="w-full h-[420px] sm:h-[580px] md:h-[660px] lg:h-[750px] xl:h-[820px] border border-slate-200 bg-slate-50 relative rounded-xl sm:rounded-2xl shadow-inner overflow-hidden flex flex-col">
                                      <div className="bg-slate-100 border-b border-slate-200 px-3.5 py-2 flex items-center justify-between text-xs font-mono text-slate-600">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                                          <span className="font-semibold text-slate-800 truncate text-[11px] sm:text-xs">Documento Interactivo Google Workspace</span>
                                        </div>
                                        <a
                                          href={activeMaterial.fileUrl || activeMaterial.url || undefined}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 shrink-0 ml-2 hover:underline"
                                          title="Abrir en pestaña nueva"
                                        >
                                          <span>Abrir en pestaña ↗</span>
                                        </a>
                                      </div>
                                      
                                      <div className="flex-1 w-full h-full relative bg-white">
                                        {iframeLoading && (
                                          <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4 z-10 transition-opacity duration-300">
                                            <div className="relative flex items-center justify-center">
                                              <div className="h-12 w-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                                              <span className="absolute text-[10px] font-mono font-bold text-indigo-600">GD</span>
                                            </div>
                                            <div className="space-y-1">
                                              <p className="font-mono font-bold text-xs text-slate-700 uppercase tracking-wider">Estableciendo Conexión Segura</p>
                                              <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">Cargando material interactivo desde servidores de Google...</p>
                                            </div>
                                          </div>
                                        )}
                                        <iframe
                                          src={driveInfo.embedUrl}
                                          className={`w-full h-full border-0 absolute inset-0 bg-white transition-opacity duration-305 ${iframeLoading ? 'opacity-0' : 'opacity-100'}`}
                                          title={activeMaterial.title}
                                          allow="autoplay; fullscreen; picture-in-picture"
                                          allowFullScreen
                                          onLoad={() => setIframeLoading(false)}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {/* Dynamic Inline Video Player */}
                            {activeMaterial.type === 'video' && activeMaterial.url && !getGoogleDriveEmbedUrl(activeMaterial.fileUrl || activeMaterial.url).isDrive && (() => {
                              const parsedVideo = getEmbedUrl(activeMaterial.url);
                              return (
                                <div className="space-y-4">
                                  {parsedVideo.type === 'direct' ? (
                                    <div className="aspect-video w-full rounded-2xl border border-slate-200 bg-slate-950 overflow-hidden shadow-lg relative">
                                      <video
                                        src={parsedVideo.embedUrl}
                                        className="w-full h-full object-contain absolute inset-0"
                                        controls
                                        playsInline
                                        onEnded={() => setVideoCompleted(true)}
                                      />
                                    </div>
                                  ) : (
                                    <div className="aspect-video w-full rounded-2xl border border-slate-200 bg-slate-950 overflow-hidden shadow-lg relative">
                                      {iframeLoading && (
                                        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4 z-10">
                                          <div className="relative flex items-center justify-center">
                                            <div className="h-12 w-12 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
                                          </div>
                                          <div className="space-y-1">
                                            <p className="font-mono font-bold text-xs text-slate-300 uppercase tracking-wider">Cargando Video Instructivo</p>
                                            <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">Preparando la reproducción de alta definición...</p>
                                          </div>
                                        </div>
                                      )}
                                      <iframe
                                        src={parsedVideo.embedUrl}
                                        title={activeMaterial.title}
                                        className={`w-full h-full border-0 absolute inset-0 transition-opacity duration-305 ${iframeLoading ? 'opacity-0' : 'opacity-100'}`}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        onLoad={() => setIframeLoading(false)}
                                      />
                                    </div>
                                  )}

                                  {/* Sleek watch countdown feedback */}
                                  {!videoCompleted ? (
                                    <div className="p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl flex items-center gap-3.5 shadow-sm text-indigo-950">
                                      <div className="h-10 w-10 shrink-0 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-mono font-bold animate-pulse text-xs">
                                        {videoTimeLeft}s
                                      </div>
                                      <div className="text-xs">
                                        <p className="font-bold font-mono text-[10px] uppercase tracking-wider text-indigo-700">Validando atención del video</p>
                                        <p className="text-slate-600 mt-0.5 leading-relaxed">
                                          Por favor, permanezca viendo el video instructivo. El botón de completado se desbloqueará automáticamente al finalizar los {videoTimeLeft} segundos restantes.
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    !userProgress.completedMaterialIds.includes(activeMaterial.id) && (
                                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3.5 shadow-sm text-emerald-950">
                                        <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                                          <CheckCircle2 className="h-5 w-5 animate-bounce" />
                                        </div>
                                        <div className="text-xs">
                                          <p className="font-bold font-mono text-[10px] uppercase tracking-wider text-emerald-700">✓ Video Completado</p>
                                          <p className="text-slate-600 mt-0.5 leading-relaxed">
                                            ¡Excelente! Ha visualizado el video instructivo de manera exitosa. Presione el botón de abajo para registrar sus avances en el sistema.
                                          </p>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              );
                            })()}

                            {/* PDF Document Viewer */}
                            {activeMaterial.type === 'pdf' && !getGoogleDriveEmbedUrl(activeMaterial.fileUrl || activeMaterial.url).isDrive && (() => {
                              const pdfUrl = pdfBlobUrl || activeMaterial.fileUrl || activeMaterial.url;
                              return (
                                <div className="space-y-4">
                                  {/* Document Header Banner */}
                                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs shadow-sm">
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                      <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-sm shrink-0">
                                        <FileText className="h-5 w-5" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <span className="text-[10px] text-rose-700 font-bold block uppercase tracking-wider">DOCUMENTO PDF</span>
                                        <span className="font-bold text-slate-950 block truncate max-w-[250px] sm:max-w-xs">{activeMaterial.title}</span>
                                      </div>
                                    </div>
                                  </div>

                                   {pdfUrl ? (
                                     <div className="w-full h-[380px] sm:h-[480px] md:h-[550px] lg:h-[650px] border border-slate-200 bg-slate-50 relative rounded-2xl shadow-inner overflow-hidden flex flex-col">
                                       {/* Document Toolbar */}
                                       <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs font-mono text-slate-500">
                                         <div className="flex items-center gap-2">
                                           <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                           <span className="font-bold uppercase tracking-wider text-[10px]">Visor de PDF Corporativo</span>
                                         </div>
                                       </div>
                                      
                                      <div className="flex-1 w-full h-full relative bg-white">
                                        {iframeLoading && (
                                          <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4 z-10 transition-opacity duration-300">
                                            <div className="relative flex items-center justify-center">
                                              <div className="h-12 w-12 rounded-full border-4 border-rose-100 border-t-rose-600 animate-spin" />
                                              <span className="absolute text-[10px] font-mono font-bold text-rose-600">PDF</span>
                                            </div>
                                            <div className="space-y-1">
                                              <p className="font-mono font-bold text-xs text-slate-700 uppercase tracking-wider">Procesando Documento Corporativo</p>
                                              <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">Optimizando calidad de texto y gráficos...</p>
                                            </div>
                                          </div>
                                        )}
                                        <iframe
                                          src={pdfUrl}
                                          className={`w-full h-full border-0 absolute inset-0 text-[#141414] bg-white transition-opacity duration-305 ${iframeLoading ? 'opacity-0' : 'opacity-100'}`}
                                          title={activeMaterial.title}
                                          onLoad={() => setIframeLoading(false)}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-full h-[200px] border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-2 font-mono text-xs rounded-2xl">
                                      <FileText className="h-8 w-8 text-slate-400 animate-pulse" />
                                      <p className="font-bold text-slate-850">Cargando documento PDF...</p>
                                      <p className="text-slate-500 text-[10px] max-w-xs leading-relaxed">
                                        Por favor espere mientras procesamos el archivo adjunto para su visualización.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {/* PPTX PowerPoint Presentation Viewer */}
                            {activeMaterial.type === 'pptx' && !getGoogleDriveEmbedUrl(activeMaterial.fileUrl || activeMaterial.url).isDrive && (() => {
                              const slides = activeSlides;
                              const currentSlide = slides[currentSlideIdx] || slides[0] || { title: 'Inicio', bullets: [] };

                              return (
                                <div className="space-y-4">
                                  {/* PowerPoint Screen */}
                                  <div className="w-full aspect-[16/10] bg-slate-900 border border-slate-800 p-6 md:p-8 flex flex-col justify-between text-white relative rounded-2xl shadow-xl overflow-hidden select-none">
                                    {/* Slide Header Accent */}
                                    <div className="flex justify-between items-center text-[9px] font-mono text-amber-500 uppercase tracking-widest border-b border-white/10 pb-2">
                                      <span>AULA VIRTUAL FUNDAMETZ - PRESENTACIÓN</span>
                                      <span>Filmina {currentSlideIdx + 1} de {slides.length}</span>
                                    </div>

                                    {/* Slide Main Content */}
                                    <div className="my-auto space-y-4 md:space-y-6">
                                      <h4 className="text-xl md:text-2xl font-serif italic font-bold text-amber-400 leading-tight">
                                        {currentSlide.title}
                                      </h4>
                                      <ul className="space-y-2 md:space-y-3.5 text-xs md:text-sm text-slate-200 max-w-2xl font-sans list-disc list-inside">
                                        {currentSlide.bullets.map((b, bIdx) => (
                                          <li key={bIdx} className="leading-relaxed">
                                            {b}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>

                                    {/* Slide Footer */}
                                    <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 border-t border-white/10 pt-2">
                                      <span>FUNDAMETZ CAPACITACIONES</span>
                                      <span>PowerPoint Interactive Player</span>
                                    </div>
                                  </div>

                                  {/* Controller Bar */}
                                  <div className="flex items-center justify-between bg-slate-50 p-3 border border-slate-200/80 rounded-xl font-mono text-xs">
                                    <button
                                      type="button"
                                      onClick={() => setCurrentSlideIdx(prev => Math.max(0, prev - 1))}
                                      disabled={currentSlideIdx === 0}
                                      className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold uppercase text-[10px] rounded-lg cursor-pointer transition-all duration-200"
                                    >
                                      Anterior
                                    </button>

                                    <div className="flex gap-1.5">
                                      {slides.map((_, sIdx) => (
                                        <button
                                          key={sIdx}
                                          type="button"
                                          onClick={() => setCurrentSlideIdx(sIdx)}
                                          className={`h-2.5 w-2.5 border rounded-full transition-all duration-150 ${
                                            currentSlideIdx === sIdx ? 'bg-amber-500 border-amber-500 scale-110' : 'bg-white border-slate-300 hover:bg-slate-200'
                                          }`}
                                        />
                                      ))}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => setCurrentSlideIdx(prev => Math.min(slides.length - 1, prev + 1))}
                                      disabled={currentSlideIdx === slides.length - 1}
                                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed font-bold uppercase text-[10px] rounded-lg cursor-pointer transition-all duration-200"
                                    >
                                      Siguiente
                                    </button>
                                  </div>

                                  {/* Slide completion feedback */}
                                  {(() => {
                                    const isCompleted = visitedSlides.length >= slides.length;
                                    if (isCompleted) {
                                      if (userProgress.completedMaterialIds.includes(activeMaterial.id)) return null;
                                      return (
                                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3.5 shadow-sm text-emerald-950">
                                          <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                                            <CheckCircle2 className="h-5 w-5 animate-bounce" />
                                          </div>
                                          <div className="text-xs">
                                            <p className="font-bold font-mono text-[10px] uppercase tracking-wider text-emerald-700">✓ Presentación Analizada</p>
                                            <p className="text-slate-600 mt-0.5 leading-relaxed">
                                              ¡Excelente! Ha navegado por las {slides.length} diapositivas de la lección. Presione el botón de abajo para guardar su progreso.
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return (
                                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3.5 shadow-sm text-slate-800">
                                        <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-500 text-white flex items-center justify-center font-mono font-bold text-xs">
                                          {visitedSlides.length}/{slides.length}
                                        </div>
                                        <div className="text-xs">
                                          <p className="font-bold font-mono text-[10px] uppercase tracking-wider text-amber-700">Diapositivas pendientes por revisar</p>
                                          <p className="text-slate-600 mt-0.5 leading-relaxed">
                                            Por favor navegue por todas las diapositivas de la presentación para habilitar el registro de avance (Has visto {visitedSlides.length} de {slides.length} filminas).
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              );
                            })()}

                            {/* Material Written Content (Rendering Markdown text simulated with clean styles) */}
                            {(activeMaterial.type === 'document' || activeMaterial.type === 'interactive' || activeMaterial.type === 'pdf') && !getGoogleDriveEmbedUrl(activeMaterial.fileUrl || activeMaterial.url).isDrive && (
                              <div className="prose max-w-none text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                                {activeMaterial.content}
                              </div>
                            )}

                             {/* Mark read button */}
                            {(() => {
                              const isMaterialFullyConsumed = (() => {
                                if (!activeMaterial) return true;
                                if (userProgress.completedMaterialIds.includes(activeMaterial.id)) return true;

                                if (activeMaterial.type === 'video') {
                                  return videoCompleted;
                                }

                                if (activeMaterial.type === 'pptx') {
                                  const rawContent = activeMaterial.content || '';
                                  let totalSlidesCount = 1;
                                  if (rawContent.includes('##')) {
                                    totalSlidesCount = rawContent.split(/(?=## )/).length;
                                  }
                                  return visitedSlides.length >= totalSlidesCount;
                                }

                                return true;
                              })();

                              const currentIndex = topicMaterials.findIndex(m => m.id === activeMaterial.id);
                              const prevMaterial = currentIndex > 0 ? topicMaterials[currentIndex - 1] : null;
                              const nextMaterial = currentIndex >= 0 && currentIndex < topicMaterials.length - 1 ? topicMaterials[currentIndex + 1] : null;
                              const isCurrentCompleted = userProgress.completedMaterialIds.includes(activeMaterial.id);

                              const navigateToMat = (targetId: string) => {
                                setActiveMaterialId(targetId);
                                setQuizMode(false);
                                setLastAttemptResult(null);
                                setTimeout(() => {
                                  const viewer = document.getElementById('document-viewer-container');
                                  if (viewer) {
                                    viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }
                                }, 60);
                              };

                              const handleCompleteAndNext = (currentMatId: string, nextMatId: string) => {
                                handleMarkMaterialCompleted(currentMatId, currentTopic.id);
                                navigateToMat(nextMatId);
                              };

                              const handleScrollToViewerTop = () => {
                                const viewer = document.getElementById('document-viewer-container');
                                if (viewer) {
                                  viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                } else {
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                              };

                              return (
                                <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-slate-200/90 -mx-3.5 -mb-3.5 p-3.5 sm:-mx-6 sm:-mb-6 sm:p-5 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/90 rounded-b-xl sm:rounded-b-2xl space-y-3 sm:space-y-4">
                                  {/* TOP ROW: Indicador de Posición y Enlace Volver Arriba */}
                                  <div className="flex items-center justify-between gap-3 text-xs">
                                    {/* Left: Position Indicator & Mini Progress Bar */}
                                    <div className="flex items-center gap-2 sm:gap-2.5 font-mono text-slate-600">
                                      <span className="flex h-2 w-2 relative shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                                      </span>
                                      <span className="text-[11px] font-bold text-slate-700">
                                        Lectura <strong className="text-indigo-600">{currentIndex + 1}</strong> de <strong className="text-slate-800">{totalMats}</strong>
                                      </span>
                                      <span className="text-slate-300 hidden sm:inline">•</span>
                                      {/* Sleek inline progress bar */}
                                      <div className="hidden sm:block w-24 md:w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                                          style={{ width: `${totalMats > 0 ? ((currentIndex + 1) / totalMats) * 100 : 0}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-500 hidden md:inline">
                                        {totalMats > 0 ? Math.round(((currentIndex + 1) / totalMats) * 100) : 0}%
                                      </span>
                                    </div>

                                    {/* Right: Subir al inicio de la lectura */}
                                    <button
                                      type="button"
                                      onClick={handleScrollToViewerTop}
                                      className="text-[11px] font-mono text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors cursor-pointer group shrink-0"
                                      title="Volver a la parte superior de esta lectura"
                                    >
                                      <ArrowUp className="h-3.5 w-3.5 group-hover:-translate-y-0.5 transition-transform text-slate-400 group-hover:text-indigo-600" />
                                      <span>Volver arriba</span>
                                    </button>
                                  </div>

                                  {/* BOTTOM ROW: Navegación Limpia y Enfocada (Máximo 2 Botones) */}
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/70">
                                    {/* 1. BOTÓN ANTERIOR (Solo si existe lectura previa) */}
                                    <div className="w-full sm:w-auto flex justify-start">
                                      {prevMaterial ? (
                                        <button
                                          type="button"
                                          onClick={() => navigateToMat(prevMaterial.id)}
                                          className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-mono text-xs font-semibold transition-all duration-200 shadow-2xs hover:shadow-xs flex items-center justify-center sm:justify-start gap-2 cursor-pointer group active:scale-95"
                                          title={`Ir a lectura previa: ${prevMaterial.title}`}
                                        >
                                          <ArrowLeft className="h-4 w-4 text-slate-400 group-hover:text-slate-700 group-hover:-translate-x-0.5 transition-all shrink-0" />
                                          <div className="text-left hidden sm:block">
                                            <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-semibold leading-none">Anterior</span>
                                            <span className="text-xs truncate max-w-[140px] md:max-w-[180px] block font-semibold text-slate-800 leading-tight">
                                              {prevMaterial.title}
                                            </span>
                                          </div>
                                          <span className="sm:hidden font-bold">Anterior</span>
                                        </button>
                                      ) : (
                                        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline px-1">Inicio del plan</span>
                                      )}
                                    </div>

                                    {/* 2. ESTADO / REQUISITOS (Sutil, solo si requiere atención) */}
                                    {isCurrentTopicOverdue ? (
                                      <span className="text-rose-700 font-mono text-[11px] font-bold bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg uppercase tracking-wide text-center">
                                        Tema Vencido: Solo Consulta
                                      </span>
                                    ) : !isMaterialFullyConsumed ? (
                                      <span className="text-indigo-700 font-mono text-[10px] font-bold bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg uppercase tracking-wider animate-pulse flex items-center justify-center gap-1.5">
                                        <Info className="h-3.5 w-3.5 shrink-0" />
                                        {activeMaterial.type === 'video' 
                                          ? 'Ver video para desbloquear avance' 
                                          : 'Visitar diapositivas para avanzar'}
                                      </span>
                                    ) : null}

                                    {/* 3. BOTÓN PRINCIPAL DE AVANCE (Única acción primaria clara) */}
                                    <div className="w-full sm:w-auto flex flex-wrap items-center justify-end gap-2">
                                      {!isCurrentCompleted ? (
                                        /* LECTURA AÚN PENDIENTE */
                                        <>
                                          {!isMaterialFullyConsumed ? (
                                            <button
                                              id="btn-mark-completed"
                                              disabled
                                              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                            >
                                              <Info className="h-4 w-4 shrink-0" />
                                              <span>{activeMaterial.type === 'video' ? 'Completar Video' : 'Revisar Diapositivas'}</span>
                                            </button>
                                          ) : isCurrentTopicOverdue ? (
                                            <button
                                              id="btn-mark-completed"
                                              disabled
                                              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 bg-rose-50 text-rose-400 border border-rose-100 cursor-not-allowed"
                                            >
                                              <span>Tema Vencido</span>
                                            </button>
                                          ) : nextMaterial ? (
                                            /* Acción Principal: Completar y pasar al siguiente en 1 solo clic */
                                            <button
                                              id="btn-mark-completed"
                                              type="button"
                                              onClick={() => handleCompleteAndNext(activeMaterial.id, nextMaterial.id)}
                                              className="w-full sm:w-auto px-4.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md shadow-emerald-100 hover:shadow-emerald-200 flex items-center justify-between sm:justify-center gap-2.5 cursor-pointer group active:scale-95"
                                              title={`Completar y avanzar a: ${nextMaterial.title}`}
                                            >
                                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-200" />
                                              <div className="text-left">
                                                <span className="block text-[9px] text-emerald-200 uppercase tracking-widest leading-none">Completar y Avanzar</span>
                                                <span className="text-xs font-bold truncate max-w-[130px] sm:max-w-[170px] md:max-w-[200px] block leading-tight">
                                                  {nextMaterial.title}
                                                </span>
                                              </div>
                                              <ArrowRight className="h-4 w-4 text-emerald-200 group-hover:translate-x-0.5 transition-transform shrink-0" />
                                            </button>
                                          ) : (
                                            /* Último material: Finalizar lecturas y desbloquear evaluación */
                                            <button
                                              id="btn-mark-completed"
                                              type="button"
                                              onClick={() => handleMarkMaterialCompleted(activeMaterial.id, currentTopic.id)}
                                              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md shadow-emerald-100 hover:shadow-emerald-200 flex items-center justify-center gap-2 cursor-pointer group active:scale-95"
                                            >
                                              <CheckCircle2 className="h-4 w-4" />
                                              <span>Finalizar Lecturas y Rendir Examen</span>
                                              <ArrowRight className="h-4 w-4" />
                                            </button>
                                          )}
                                        </>
                                      ) : (
                                        /* LECTURA YA COMPLETADA */
                                        <>
                                          {nextMaterial ? (
                                            <button
                                              type="button"
                                              onClick={() => navigateToMat(nextMaterial.id)}
                                              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md shadow-indigo-100 hover:shadow-indigo-200 flex items-center justify-between sm:justify-center gap-2.5 cursor-pointer group active:scale-95"
                                              title={`Avanzar a: ${nextMaterial.title}`}
                                            >
                                              <div className="text-left">
                                                <span className="block text-[9px] text-indigo-200 uppercase tracking-widest leading-none">Siguiente Lectura</span>
                                                <span className="text-xs font-bold truncate max-w-[140px] sm:max-w-[180px] md:max-w-[200px] block leading-tight">
                                                  {nextMaterial.title}
                                                </span>
                                              </div>
                                              <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-0.5 transition-transform shrink-0" />
                                            </button>
                                          ) : (
                                            /* Último material completado: Rendir Evaluación o Certificado */
                                            <div className="flex flex-wrap items-center gap-2">
                                              {userProgress.quizStatus === 'passed' && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleDownloadCertificate(currentTopic)}
                                                  className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 border border-amber-600 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs hover:shadow transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                                                  title="Descargar Certificado Oficial"
                                                >
                                                  <Award className="h-3.5 w-3.5" />
                                                  <span>Certificado</span>
                                                </button>
                                              )}

                                              {isMaterialsFinished ? (
                                                <button
                                                  id="btn-bottom-start-eval"
                                                  type="button"
                                                  onClick={() => handleStartQuiz(currentTopic)}
                                                  disabled={isCurrentTopicOverdue || isAttemptsLimitReached || hasMaxScore}
                                                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer group active:scale-95 ${
                                                    isCurrentTopicOverdue
                                                      ? 'bg-rose-50 text-rose-400 border border-rose-100 cursor-not-allowed shadow-none'
                                                      : hasMaxScore
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-not-allowed shadow-none'
                                                        : isAttemptsLimitReached
                                                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                                                          : userProgress.quizStatus === 'passed'
                                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'
                                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 hover:shadow-indigo-200'
                                                  }`}
                                                >
                                                  <HelpCircle className="h-4 w-4 shrink-0" />
                                                  <span>
                                                    {hasMaxScore
                                                      ? 'Plan Finalizado (10/10)'
                                                      : isAttemptsLimitReached
                                                        ? 'Intentos Agotados (3/3)'
                                                        : userProgress.quizStatus === 'passed'
                                                          ? 'Repetir Evaluación'
                                                          : 'Rendir Evaluación Final'}
                                                  </span>
                                                  {!hasMaxScore && !isAttemptsLimitReached && !isCurrentTopicOverdue && (
                                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform shrink-0" />
                                                  )}
                                                </button>
                                              ) : (
                                                <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                                                  <Info className="h-3.5 w-3.5 shrink-0" />
                                                  <span>Complete lecturas anteriores para rendir examen</span>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </>
                        ) : (
                          <div className="text-center py-16 text-slate-500 font-mono text-xs">
                            Selecciona una lectura de la barra superior del plan de aprendizaje para comenzar.
                          </div>
                        )}
                      </div>
                    </div>
                  )
                ) : quizMode ? (
                    
                    /* 2.B - ACTIVE PARAMETERIZED QUIZ INTERFACE */
                    <div className="max-w-2xl w-full mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                      {/* Quiz Header & Countdown */}
                      <div className="px-6 py-4.5 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono font-bold text-green-400 uppercase tracking-widest block">PRUEBA EN CURSO</span>
                          <h3 className="text-sm font-serif italic font-bold truncate max-w-[300px]">{currentTopic.title}</h3>
                        </div>

                        {/* Real-time Parameterized Timer */}
                        {currentTopic.timeLimitMinutes > 0 && (
                          <div className="flex items-center gap-2 bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-700 text-amber-300 font-mono">
                            <Timer className="h-4 w-4 text-amber-300 animate-pulse shrink-0" />
                            <span className="font-mono text-xs font-bold leading-none">{formatTime(quizTimeLeft)}</span>
                          </div>
                        )}
                      </div>

                      {/* Question Content */}
                      {quizQuestions.length > 0 ? (() => {
                        const currentQ = quizQuestions[currentQuestionIdx];
                        const chosenOptionIdx = selectedAnswers[currentQ.id];

                        return (
                          <div className="p-6 space-y-6">
                            {/* Progress bar */}
                            <div className="space-y-1.5 font-mono">
                              <div className="flex justify-between text-xs text-slate-500 font-bold">
                                <span>Pregunta {currentQuestionIdx + 1} de {quizQuestions.length}</span>
                                <span>{Math.round(((currentQuestionIdx) / quizQuestions.length) * 100)}% Completado</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-indigo-600 h-full rounded-full transition-all duration-300" 
                                  style={{ width: `${((currentQuestionIdx) / quizQuestions.length) * 100}%` }}
                                />
                              </div>
                            </div>

                            {/* Statement */}
                            <div className="space-y-2">
                              <h4 className="text-base font-serif italic font-bold text-slate-800 leading-snug">
                                {currentQ.questionText}
                              </h4>
                            </div>

                            {/* Multi choices options / True-False grid */}
                            {currentQ.format === 'true_false' ? (
                              <div className="grid grid-cols-2 gap-4 pt-2">
                                {currentQ.options.map((optionText, oIdx) => {
                                  const isSelected = chosenOptionIdx === oIdx;
                                  const isVerdadero = oIdx === 0;

                                  return (
                                    <button
                                      key={oIdx}
                                      onClick={() => handleSelectAnswer(currentQ.id, oIdx)}
                                      className={`p-6 rounded-2xl border-2 text-center transition-all duration-300 flex flex-col items-center justify-center gap-3 cursor-pointer ${
                                        isSelected
                                          ? isVerdadero
                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 shadow-md scale-[1.02]'
                                            : 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-500/20 shadow-md scale-[1.02]'
                                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm'
                                      }`}
                                    >
                                      <div className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                        isSelected 
                                          ? isVerdadero 
                                            ? 'border-emerald-600 bg-emerald-600' 
                                            : 'border-rose-600 bg-rose-600' 
                                          : 'border-slate-300 bg-white'
                                      }`}>
                                        {isSelected && <div className="h-2 w-2 bg-white rounded-full" />}
                                      </div>
                                      <span className="font-sans font-semibold text-sm tracking-wide leading-none">{optionText}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="space-y-2.5 pt-2">
                                {currentQ.options.map((optionText, oIdx) => {
                                  const isSelected = chosenOptionIdx === oIdx;

                                  return (
                                    <button
                                      key={oIdx}
                                      onClick={() => handleSelectAnswer(currentQ.id, oIdx)}
                                      className={`w-full text-left p-4 rounded-xl border text-sm font-sans transition-all duration-200 flex items-start gap-3 cursor-pointer ${
                                        isSelected
                                          ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 text-slate-900 font-semibold shadow-sm'
                                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50/50 hover:border-slate-300'
                                      }`}
                                    >
                                      <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                        isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                                      }`}>
                                        {isSelected && <div className="h-2 w-2 bg-white rounded-full" />}
                                      </div>
                                      <span className="leading-normal">{optionText}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Navigation controls */}
                            <div className="flex justify-between items-center border-t border-slate-100 pt-5 mt-4">
                              <button
                                type="button"
                                onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestionIdx === 0}
                                className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-xl flex items-center gap-1 border border-slate-200 cursor-pointer transition-all duration-200 ${
                                  currentQuestionIdx === 0 ? 'opacity-30 cursor-not-allowed' : 'text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm'
                                }`}
                              >
                                <ChevronLeft className="h-4 w-4" /> Anterior
                              </button>

                              {currentQuestionIdx < quizQuestions.length - 1 ? (
                                <button
                                  type="button"
                                  onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                                  className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1 shadow-lg shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                                >
                                  Siguiente <ChevronRight className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  id="btn-finish-quiz"
                                  onClick={handleSubmitQuiz}
                                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold uppercase tracking-widest rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-100 hover:shadow-emerald-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                                >
                                  <Send className="h-4 w-4" /> Enviar Evaluación
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })() : (
                        <div className="p-12 text-center text-slate-400">Sin preguntas cargadas.</div>
                      )}
                    </div>
                  ) : (
                    
                    /* 2.C - RESULTS AND FEEDBACK EVALUATION PANEL */
                    /* 2.C - RESULTS AND FEEDBACK EVALUATION PANEL */
                    <div className="max-w-2xl w-full mx-auto space-y-6">
                      
                      {lastAttemptResult?.type === 'initial' ? (
                        /* Pre-test Diagnostic Results Card */
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-8 space-y-6 text-center relative">
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono font-bold text-amber-600 uppercase tracking-widest block">DIAGNÓSTICO COMPLETADO</span>
                            <h3 className="text-xl font-serif italic font-bold text-slate-800">{currentTopic.title}</h3>
                            <p className="text-xs font-mono text-slate-500">Evaluación de Conocimiento Inicial (Pre-test)</p>
                          </div>

                          <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="h-24 w-24 rounded-full flex flex-col items-center justify-center border border-amber-200 bg-amber-50/50 text-amber-700 shadow-inner">
                              <span className="text-2xl font-black font-mono leading-none">{lastAttemptResult?.score}/10</span>
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider mt-0.5">Calificación</span>
                            </div>

                            <p className="text-xs text-emerald-800 font-mono font-bold max-w-md mx-auto">
                              ¡Las lecturas y el examen final del menú normal ya han sido habilitados!
                            </p>
                          </div>

                          <div className="flex justify-center pt-2">
                            <button
                              onClick={() => { setLastAttemptResult(null); setQuizMode(false); }}
                              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all duration-200 cursor-pointer"
                            >
                              Acceder al Material de Estudio
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Score Result Card */
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 space-y-6 text-center relative">
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">RESULTADO OBTENIDO</span>
                            <h3 className="text-2xl font-serif italic font-bold text-slate-800">{currentTopic.title}</h3>
                            <p className="text-xs font-mono text-slate-500">Intento de evaluación #{lastAttemptResult?.attemptNumber}</p>
                          </div>

                          {(() => {
                            const attemptQuestions = questions.filter(q => q.topicId === currentTopic.id && (q.type || 'final') === (lastAttemptResult?.type || 'final'));
                            const currentQuizTotalPoints = attemptQuestions.reduce((sum, q) => sum + (q.points ?? 10), 0);
                            const earnedPoints = attemptQuestions.reduce((sum, q) => {
                              const userAns = lastAttemptResult?.answers?.[q.id];
                              if (userAns !== undefined && userAns === q.correctOptionIndex) {
                                return sum + (q.points ?? 10);
                              }
                              return sum;
                            }, 0);
                            return (
                              <div className="flex flex-col items-center justify-center space-y-2">
                                <div className={`px-4 py-2.5 h-24 min-w-[7rem] rounded-full flex flex-col items-center justify-center border shadow-inner ${
                                  lastAttemptResult?.passed
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-rose-200 bg-rose-50 text-rose-700'
                                }`}>
                                  <span className="text-xl font-black font-mono leading-none">{lastAttemptResult?.score} / 10</span>
                                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider mt-1">Calificación</span>
                                </div>

                                <div className="space-y-1">
                                  {lastAttemptResult?.passed ? (
                                    <>
                                      <h4 className="text-base font-serif italic font-bold text-emerald-700 flex items-center gap-1 justify-center mt-1">
                                        <CheckCircle2 className="h-5 w-5" /> ¡Felicitaciones, Aprobado!
                                      </h4>
                                      <p className="text-xs text-slate-500 font-mono">Has alcanzado la calificación mínima requerida de {currentTopic.minScoreToPass}/10 para este tema corporativo.</p>
                                    </>
                                  ) : (
                                    <>
                                      <h4 className="text-base font-serif italic font-bold text-rose-700 flex items-center gap-1 justify-center mt-1">
                                        <XCircle className="h-5 w-5" /> Evaluación Reprobada
                                      </h4>
                                      <p className="text-xs text-slate-500 font-mono">No lograste alcanzar el mínimo de {currentTopic.minScoreToPass}/10 para aprobar. Repasa el material didáctico e inténtalo de nuevo.</p>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          <div className="flex flex-col items-center gap-3 justify-center pt-2">
                            {(!lastAttemptResult?.passed || lastAttemptResult?.type === 'initial' || reviewSubmitted) ? (
                              <button
                                onClick={() => { setLastAttemptResult(null); setQuizMode(false); }}
                                className="px-4.5 py-2.5 border border-slate-200 text-slate-700 text-xs font-mono font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 cursor-pointer shadow-sm"
                              >
                                Volver al Material Didáctico
                              </button>
                            ) : (
                              <div className="text-center px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl font-mono text-[11px] font-bold uppercase tracking-wide">
                                ⚠️ Responda la encuesta de eficacia obligatoria de abajo para completar el tema
                              </div>
                            )}
                            
                            {(!lastAttemptResult?.passed && lastAttemptResult?.score !== 10 && userProgress.attemptsCount < 3) && (
                              <button
                                onClick={() => handleStartQuiz(currentTopic)}
                                className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                              >
                                Volver a Intentar
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Feedback Submission (Efficacy feedback loop!) */}
                      {lastAttemptResult?.passed && lastAttemptResult?.type === 'final' && (
                        <div className="bg-gradient-to-br from-indigo-50/40 via-white to-slate-50/60 rounded-3xl border border-indigo-100/80 shadow-xl p-6 sm:p-8 space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-50 pb-5">
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-indigo-600 text-white rounded-2xl shrink-0 shadow-lg shadow-indigo-100">
                                <MessageSquare className="h-6 w-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm sm:text-base font-serif italic font-bold text-slate-800">Encuesta de Eficacia Formativa</h4>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                    Obligatorio
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 font-sans mt-0.5">Su opinión sincera nos ayuda a medir y calibrar el impacto de este programa de capacitación.</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 self-start sm:self-center bg-slate-100 px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold text-slate-600">
                              <span>Progreso:</span>
                              <span className="text-indigo-600">
                                {Number(satisfactionRating !== null) + Number(clarityRating !== null)} / 2 completado
                              </span>
                            </div>
                          </div>

                          {!reviewSubmitted ? (
                            <form onSubmit={handleSubmitReview} className="space-y-6 text-xs">
                              {/* Question 1 Card */}
                              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-4 hover:border-slate-300/80 transition-colors">
                                <div className="flex items-start gap-2.5">
                                  <span className="flex items-center justify-center h-5 w-5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold shrink-0 mt-0.5">1</span>
                                  <label className="block font-bold text-slate-700 text-[12px] leading-relaxed font-sans">
                                    ¿Cómo calificaría su nivel de satisfacción y aceptación general respecto a la capacitación recibida? <span className="text-rose-500 font-bold">*</span>
                                  </label>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                                  {['Regular', 'Bueno', 'Muy Bueno', 'Excelente'].map((label, idx) => {
                                    const isSelected = satisfactionRating === idx;
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setSatisfactionRating(idx)}
                                        className={`px-3.5 py-3 rounded-2xl border font-sans font-bold text-[11px] transition-all duration-200 cursor-pointer text-center relative overflow-hidden flex flex-col items-center justify-center gap-0.5 ${
                                          isSelected
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 ring-2 ring-indigo-600 ring-offset-2 scale-[1.02]'
                                            : 'bg-slate-50/80 border-slate-150 text-slate-600 hover:bg-slate-100 hover:border-slate-250'
                                        }`}
                                      >
                                        <span className={`text-[9px] block uppercase tracking-wider font-mono font-bold ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                                          Opción {idx}
                                        </span>
                                        <span className="text-xs">{label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Question 2 Card */}
                              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-4 hover:border-slate-300/80 transition-colors">
                                <div className="flex items-start gap-2.5">
                                  <span className="flex items-center justify-center h-5 w-5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold shrink-0 mt-0.5">2</span>
                                  <label className="block font-bold text-slate-700 text-[12px] leading-relaxed font-sans">
                                    ¿La información proporcionada durante la capacitación fue clara, estructurada y fácil de comprender? <span className="text-rose-500 font-bold">*</span>
                                  </label>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                                  {['Regular', 'Bueno', 'Muy Bueno', 'Excelente'].map((label, idx) => {
                                    const isSelected = clarityRating === idx;
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setClarityRating(idx)}
                                        className={`px-3.5 py-3 rounded-2xl border font-sans font-bold text-[11px] transition-all duration-200 cursor-pointer text-center relative overflow-hidden flex flex-col items-center justify-center gap-0.5 ${
                                          isSelected
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 ring-2 ring-indigo-600 ring-offset-2 scale-[1.02]'
                                            : 'bg-slate-50/80 border-slate-150 text-slate-600 hover:bg-slate-100 hover:border-slate-250'
                                        }`}
                                      >
                                        <span className={`text-[9px] block uppercase tracking-wider font-mono font-bold ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                                          Opción {idx}
                                        </span>
                                        <span className="text-xs">{label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Question 3 Card */}
                              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3 hover:border-slate-300/80 transition-colors">
                                <div className="flex items-start gap-2.5">
                                  <span className="flex items-center justify-center h-5 w-5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold shrink-0 mt-0.5">3</span>
                                  <label className="block font-bold text-slate-700 text-[12px] leading-relaxed font-sans">
                                    Si tienes algún comentario o pregunta, escríbalo a continuación: <span className="text-slate-400 font-normal font-mono text-[10px]">(Opcional)</span>
                                  </label>
                                </div>
                                <textarea
                                  value={reviewComment}
                                  onChange={(e) => setReviewComment(e.target.value)}
                                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none h-24 resize-none text-xs font-mono transition-all duration-200 shadow-inner"
                                  placeholder="Escribe tus comentarios, sugerencias o dudas aquí..."
                                />
                              </div>

                              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
                                <p className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                  Ambas preguntas obligatorias con asterisco (*) son requeridas.
                                </p>
                                <button
                                  type="submit"
                                  disabled={satisfactionRating === null || clarityRating === null}
                                  className={`px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider rounded-2xl cursor-pointer flex items-center gap-2 transition-all duration-300 shadow-md ${
                                    satisfactionRating === null || clarityRating === null
                                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0'
                                  }`}
                                >
                                  <span>Enviar Encuesta Obligatoria</span>
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="text-center py-10 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-emerald-800 font-sans font-bold text-xs flex flex-col items-center gap-4 px-6">
                              <CheckCircle2 className="h-10 w-10 text-emerald-600 animate-bounce" />
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-emerald-900">¡Muchas gracias por su retroalimentación!</p>
                                <p className="text-xs text-emerald-600 font-normal font-mono max-w-md mx-auto leading-relaxed animate-fade-in">
                                  Sus respuestas se han guardado con éxito. Su participación ayuda a optimizar y validar el nivel formativo del programa.
                                </p>
                              </div>

                              <div className="pt-2 w-full max-w-xs border-t border-emerald-100/60 mt-2">
                                <p className="text-[10px] text-amber-800 font-mono font-bold uppercase tracking-wider mb-2">🎓 ¡CERTIFICADO DISPONIBLE!</p>
                                <button
                                  onClick={() => handleDownloadCertificate(currentTopic)}
                                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-mono font-bold text-[11px] uppercase tracking-wider rounded-xl shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 border border-amber-600"
                                >
                                  <Award className="h-4 w-4" />
                                  Descargar Certificado
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Question review detail */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 space-y-4">
                        <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Revisión de Respuestas de tu Examen</h4>
                        
                        <div className="space-y-4">
                          {quizQuestions.map((q, idx) => {
                            const userChoiceIdx = lastAttemptResult?.answers[q.id];
                            const isCorrect = userChoiceIdx !== undefined && userChoiceIdx === q.correctOptionIndex;

                            return (
                              <div key={q.id} className="p-4 rounded-xl border border-slate-150 bg-slate-50/40 text-sm space-y-3 font-sans">
                                <div className="flex justify-between items-start gap-4">
                                  <span className="font-semibold text-slate-800 flex items-center flex-wrap gap-1.5 leading-relaxed">
                                    <span>{idx + 1}. {q.questionText}</span>
                                    {q.format === 'true_false' ? (
                                      <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase tracking-wider">V/F</span>
                                    ) : (
                                      <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded uppercase tracking-wider">Múltiple</span>
                                    )}
                                  </span>
                                  {isCorrect ? (
                                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-0.5 shrink-0">
                                      Correcto
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-0.5 shrink-0">
                                      Incorrecto
                                    </span>
                                  )}
                                </div>

                                <div className="pl-3.5 border-l-2 border-slate-200 space-y-2 text-slate-600">
                                  {q.options.map((option, oIdx) => {
                                    const isUserChoice = userChoiceIdx === oIdx;
                                    const isAnswerKey = q.correctOptionIndex === oIdx;

                                    return (
                                      <div 
                                        key={oIdx} 
                                        className={`p-2.5 rounded-xl text-xs border transition-all duration-150 ${
                                          isAnswerKey 
                                            ? 'bg-emerald-50 border-emerald-100 text-emerald-900 font-medium shadow-sm' 
                                            : isUserChoice 
                                              ? 'bg-rose-50 border-rose-100 text-rose-900 font-medium' 
                                              : 'bg-white border-slate-100 text-slate-600'
                                        }`}
                                      >
                                        <span className="font-bold mr-1">{String.fromCharCode(65 + oIdx)}.</span> {option}
                                        {isAnswerKey && <strong className="text-[9px] text-emerald-700 ml-2 font-mono font-bold uppercase tracking-wider bg-emerald-100/50 px-1.5 py-0.5 rounded">(Respuesta Correcta)</strong>}
                                        {isUserChoice && !isAnswerKey && <strong className="text-[9px] text-rose-700 ml-2 font-mono font-bold uppercase tracking-wider bg-rose-100/50 px-1.5 py-0.5 rounded">(Tu Selección)</strong>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  )}

                </motion.div>
              );
            })()
          )}

        </AnimatePresence>
      </main>

      {/* BUZÓN DE MENSAJES SLIDE-OVER DRAWER */}
      <AnimatePresence>
        {isMailboxOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMailboxOpen(false)}
              className="fixed inset-0 bg-slate-950 z-40 cursor-pointer"
            />

            {/* Sliding Drawer Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-150 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-serif italic font-bold text-slate-800 text-sm">Buzón de Mensajes</h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Avisos del Administrador</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {myMessages.length > 0 && (
                    <button
                      onClick={markAllMessagesAsRead}
                      title="Marcar todos los mensajes como leídos"
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      <span>Marcar todo leído</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsMailboxOpen(false)}
                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {myMessages.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-3">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-mono font-bold text-slate-600">Tu buzón está vacío</p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Aquí recibirás recordatorios automáticos sobre fechas de vencimiento de temas, felicitaciones por tu buen avance, o comunicados personalizados del administrador.
                      </p>
                    </div>
                  </div>
                ) : (
                  myMessages.map(msg => {
                    const msgIsRead = isMessageRead(msg);
                    return (
                      <div
                        key={msg.id}
                        onClick={() => {
                          if (!msgIsRead) markMessageAsRead(msg.id);
                        }}
                        className={`p-3.5 rounded-xl border relative group transition-all duration-200 cursor-pointer ${
                          !msgIsRead 
                            ? 'bg-indigo-50/50 border-indigo-200 shadow-xs' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMessage(msg.id);
                          }}
                          className="absolute top-3 right-3 p-1 hover:bg-rose-50 hover:text-rose-600 text-slate-300 rounded-lg cursor-pointer transition-all opacity-0 group-hover:opacity-100"
                          title="Eliminar mensaje"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        <div className="flex items-start gap-2.5">
                          {/* Indicator dot or type icon */}
                          <div className={`mt-0.5 p-1 rounded-md shrink-0 ${
                            msg.type === 'automatic_due_date' 
                              ? 'bg-amber-100 text-amber-700' 
                              : msg.type === 'automatic_progress' 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            <Mail className="h-3 w-3" />
                          </div>

                          <div className="space-y-1 pr-6 w-full">
                            <div className="flex flex-wrap items-center gap-1.5 justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                  {msg.type === 'automatic_due_date' 
                                    ? 'Vencimiento' 
                                    : msg.type === 'automatic_progress' 
                                      ? 'Buen Avance' 
                                      : 'Aviso'}
                                </span>
                                {!msgIsRead ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold bg-indigo-600 text-white rounded-full">
                                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                    Nuevo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] text-slate-400 font-medium">
                                    <Check className="h-3 w-3 text-emerald-500" />
                                    Leído
                                  </span>
                                )}
                              </div>
                              {!msgIsRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markMessageAsRead(msg.id);
                                  }}
                                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold hover:underline cursor-pointer"
                                >
                                  Marcar como leído
                                </button>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-slate-800">{msg.title}</h4>
                            <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line">{msg.content}</p>
                            
                            <div className="pt-1.5 flex justify-between items-center text-[9px] font-mono text-slate-400">
                              <span>De: Administrador</span>
                              <span>{new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-3 border-t border-slate-150 bg-slate-50 text-center">
                <p className="text-[10px] font-mono text-slate-400">
                  Fundametz Capacitación Continua
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FULLSCREEN MATERIAL VIEWPORT OVERLAY */}
      {(() => {
        const activeFullscreenMaterial = materials.find(m => m.id === activeMaterialId);
        return (
          <AnimatePresence>
            {isFullscreen && activeFullscreenMaterial && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 shrink-0 shadow-md">
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-widest block mb-0.5">
                      Visualización de Material — Modo Pantalla Completa
                    </span>
                    <h3 className="text-xs sm:text-sm md:text-base font-bold text-white truncate font-sans">
                      {activeFullscreenMaterial.title}
                    </h3>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(false)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 font-mono font-bold text-[10px] sm:text-xs uppercase rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 border border-slate-700/50 shrink-0"
                  >
                    <Minimize2 className="h-4 w-4" /> <span>Cerrar Pantalla Completa</span>
                  </button>
                </div>

                {/* Viewer Content */}
                <div className="flex-1 w-full h-full relative p-2 sm:p-4 md:p-6 bg-slate-950 flex items-center justify-center overflow-auto">
                  {(() => {
                    const driveInfo = getGoogleDriveEmbedUrl(activeFullscreenMaterial.fileUrl || activeFullscreenMaterial.url);
                    
                    // 1. Google Drive
                    if (driveInfo.isDrive) {
                      return (
                        <div className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-2xl relative border border-slate-800">
                          {fullscreenIframeLoading && (
                            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4 z-10 transition-opacity duration-300">
                              <div className="relative flex items-center justify-center">
                                <div className="h-12 w-12 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
                                <span className="absolute text-[10px] font-mono font-bold text-indigo-400">GD</span>
                              </div>
                              <div className="space-y-1">
                                <p className="font-mono font-bold text-xs text-slate-200 uppercase tracking-wider">Estableciendo Conexión en Pantalla Completa</p>
                                <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">Optimizando la resolución para visualización expandida...</p>
                              </div>
                            </div>
                          )}
                          <iframe
                            src={driveInfo.embedUrl}
                            className={`w-full h-full border-0 absolute inset-0 bg-white transition-opacity duration-305 ${fullscreenIframeLoading ? 'opacity-0' : 'opacity-100'}`}
                            title={activeFullscreenMaterial.title}
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            onLoad={() => setFullscreenIframeLoading(false)}
                          />
                        </div>
                      );
                    }

                    // 2. Video Player
                    if (activeFullscreenMaterial.type === 'video' && activeFullscreenMaterial.url) {
                      const parsedVideo = getEmbedUrl(activeFullscreenMaterial.url);
                      return (
                        <div className="w-full h-full flex flex-col justify-center max-w-5xl mx-auto space-y-4">
                          {parsedVideo.type === 'direct' ? (
                            <div className="aspect-video w-full rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl relative max-h-[80vh]">
                              <video
                                src={parsedVideo.embedUrl}
                                className="w-full h-full object-contain absolute inset-0"
                                controls
                                playsInline
                                onEnded={() => setVideoCompleted(true)}
                              />
                            </div>
                          ) : (
                            <div className="aspect-video w-full rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl relative max-h-[80vh]">
                              {fullscreenIframeLoading && (
                                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4 z-10">
                                  <div className="relative flex items-center justify-center">
                                    <div className="h-12 w-12 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
                                  </div>
                                  <div className="space-y-1">
                                    <p className="font-mono font-bold text-xs text-slate-300 uppercase tracking-wider">Cargando Video Instructivo</p>
                                    <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">Preparando la reproducción expandida...</p>
                                  </div>
                                </div>
                              )}
                              <iframe
                                src={parsedVideo.embedUrl}
                                title={activeFullscreenMaterial.title}
                                className={`w-full h-full border-0 absolute inset-0 transition-opacity duration-305 ${fullscreenIframeLoading ? 'opacity-0' : 'opacity-100'}`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                onLoad={() => setFullscreenIframeLoading(false)}
                              />
                            </div>
                          )}
                        </div>
                      );
                    }

                    // 3. PDF
                    if (activeFullscreenMaterial.type === 'pdf') {
                      const pdfUrl = pdfBlobUrl || activeFullscreenMaterial.fileUrl || activeFullscreenMaterial.url;
                      if (pdfUrl) {
                        return (
                          <div className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-2xl relative border border-slate-800">
                            {fullscreenIframeLoading && (
                              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4 z-10 transition-opacity duration-300">
                                <div className="relative flex items-center justify-center">
                                  <div className="h-12 w-12 rounded-full border-4 border-rose-900 border-t-rose-600 animate-spin" />
                                  <span className="absolute text-[10px] font-mono font-bold text-rose-500">PDF</span>
                                </div>
                                <div className="space-y-1">
                                  <p className="font-mono font-bold text-xs text-slate-200 uppercase tracking-wider">Procesando Documento Corporativo</p>
                                  <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">Renderizando gráficos de alta definición...</p>
                                </div>
                              </div>
                            )}
                            <iframe
                              src={pdfUrl}
                              className={`w-full h-full border-0 absolute inset-0 bg-white transition-opacity duration-305 ${fullscreenIframeLoading ? 'opacity-0' : 'opacity-100'}`}
                              title={activeFullscreenMaterial.title}
                              onLoad={() => setFullscreenIframeLoading(false)}
                            />
                          </div>
                        );
                      }
                      return (
                        <div className="p-12 text-center text-slate-400 font-mono text-xs">
                          <FileText className="h-10 w-10 mx-auto text-slate-500 animate-pulse mb-3" />
                          Cargando documento PDF...
                        </div>
                      );
                    }

                    // 4. PPTX (PowerPoint)
                    if (activeFullscreenMaterial.type === 'pptx') {
                      const slides = activeSlides;
                      const currentSlide = slides[currentSlideIdx] || slides[0] || { title: 'Inicio', bullets: [] };

                      return (
                        <div className="w-full max-w-5xl h-full flex flex-col justify-center space-y-4">
                          {/* PowerPoint Screen */}
                          <div className="w-full aspect-[16/10] max-h-[70vh] bg-slate-900 border border-slate-800 p-6 md:p-8 flex flex-col justify-between text-white relative rounded-2xl shadow-xl overflow-hidden select-none">
                            <div className="flex justify-between items-center text-[9px] font-mono text-amber-500 uppercase tracking-widest border-b border-white/10 pb-2">
                              <span>AULA VIRTUAL FUNDAMETZ - PRESENTACIÓN</span>
                              <span>Filmina {currentSlideIdx + 1} de {slides.length}</span>
                            </div>
                            <div className="my-auto space-y-4 md:space-y-6">
                              <h4 className="text-xl md:text-2xl font-serif italic font-bold text-amber-400 leading-tight">
                                {currentSlide.title}
                              </h4>
                              <ul className="space-y-2 md:space-y-3.5 text-xs md:text-sm text-slate-200 font-sans list-disc list-inside">
                                {currentSlide.bullets.map((b, bIdx) => (
                                  <li key={bIdx} className="leading-relaxed">{b}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 border-t border-white/10 pt-2">
                              <span>FUNDAMETZ CAPACITACIONES</span>
                              <span>PowerPoint Interactive Player</span>
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center justify-between bg-slate-900 p-3 border border-slate-800 rounded-xl font-mono text-xs text-white">
                            <button
                              type="button"
                              onClick={() => setCurrentSlideIdx(prev => Math.max(0, prev - 1))}
                              disabled={currentSlideIdx === 0}
                              className="px-3.5 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed font-bold uppercase text-[10px] rounded-lg cursor-pointer transition-all hover:bg-slate-700"
                            >
                              Anterior
                            </button>
                            <div className="flex gap-1.5">
                              {slides.map((_, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() => setCurrentSlideIdx(sIdx)}
                                  className={`h-2.5 w-2.5 border rounded-full transition-all duration-150 ${
                                    currentSlideIdx === sIdx ? 'bg-amber-500 border-amber-500 scale-110' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                                  }`}
                                />
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => setCurrentSlideIdx(prev => Math.min(slides.length - 1, prev + 1))}
                              disabled={currentSlideIdx === slides.length - 1}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed font-bold uppercase text-[10px] rounded-lg cursor-pointer transition-all"
                            >
                              Siguiente
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // 5. Document/Interactive Reading text
                    return (
                      <div className="w-full max-w-3xl h-full bg-white rounded-2xl shadow-2xl overflow-y-auto p-6 md:p-10 border border-slate-800 text-slate-800">
                        <div className="prose max-w-none text-slate-800 text-base leading-relaxed whitespace-pre-wrap font-sans">
                          {activeFullscreenMaterial.content}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        );
      })()}

      {/* CANVAS MODAL: PERFIL DE CUENTA */}
      <AnimatePresence>
        {isAccountOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[4px] border border-[#C7CDD1] shadow-xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-[#1E2B37] text-white flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <UserIcon className="h-5 w-5 text-[#008EE2]" />
                  <h3 className="font-bold text-base">Perfil de Cuenta</h3>
                </div>
                <button 
                  onClick={() => setIsAccountOpen(false)}
                  className="text-slate-300 hover:text-white p-1 rounded hover:bg-[#2D3B45] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-4 pb-4 border-b border-[#E0E0E0]">
                  <div className="w-16 h-16 rounded-full bg-[#0374B5] text-white flex items-center justify-center text-2xl font-bold border-2 border-white shadow-sm">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#2D3B45]">{currentUser.name}</h4>
                    <p className="text-xs text-[#556575]">{currentUser.email || currentUser.id}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#F0F2F5] text-[#2D3B45] rounded-[3px] border border-[#C7CDD1]">
                        {currentUser.role === 'admin' ? 'Administrador' : 'Colaborador'}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#0374B5]/10 text-[#0374B5] rounded-[3px]">
                        {currentUser.area || 'Operaciones'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress summary stats */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-[#F5F7F8] border border-[#C7CDD1] rounded-[4px]">
                    <span className="text-xl font-bold text-[#2D3B45] block">{publishedTopics.length}</span>
                    <span className="text-[11px] text-[#556575]">Asignados</span>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-[4px]">
                    <span className="text-xl font-bold text-[#00AC18] block">
                      {publishedTopics.filter(t => getUserProgressForTopic(t.id).quizStatus === 'passed').length}
                    </span>
                    <span className="text-[11px] text-[#00AC18]">Aprobados</span>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-[4px]">
                    <span className="text-xl font-bold text-[#0374B5] block">
                      {attempts.filter(a => a.userId === currentUser.id && a.passed).length}
                    </span>
                    <span className="text-[11px] text-[#0374B5]">Certificados</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-[#F5F7F8] border-t border-[#C7CDD1] flex justify-between items-center">
                <button
                  onClick={() => { setIsAccountOpen(false); onLogout(); }}
                  className="px-3 py-1.5 text-xs text-[#EE0606] font-semibold hover:bg-red-50 rounded-[4px] transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
                <button
                  onClick={() => setIsAccountOpen(false)}
                  className="px-4 py-1.5 bg-[#0374B5] hover:bg-[#025a8c] text-white text-xs font-semibold rounded-[4px] transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CANVAS MODAL: CALENDARIO DE ENTREGAS */}
      <AnimatePresence>
        {isCalendarOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[4px] border border-[#C7CDD1] shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#1E2B37] text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-5 w-5 text-[#008EE2]" />
                  <div>
                    <h3 className="font-bold text-sm sm:text-base leading-tight">Calendario de Capacitaciones</h3>
                    <p className="text-[11px] text-slate-300">Fechas límite y cronograma de cursos</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCalendarOpen(false)}
                  className="text-slate-300 hover:text-white p-1 rounded hover:bg-[#2D3B45] transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-3 sm:p-6 overflow-y-auto space-y-3 flex-1">
                {publishedTopics.length === 0 ? (
                  <p className="text-center text-xs text-[#556575] py-8">No hay cursos disponibles actualmente.</p>
                ) : (
                  <div className="space-y-3">
                    {publishedTopics.map(t => {
                      const prog = getUserProgressForTopic(t.id);
                      const isOverdue = t.dueDate && prog.quizStatus !== 'passed' && (new Date(t.dueDate + 'T23:59:59') < new Date());
                      return (
                        <div 
                          key={t.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-[4px] border border-[#C7CDD1] bg-white hover:bg-[#F5F7F8] transition-colors"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-[#0374B5] bg-blue-50 px-2 py-0.5 rounded-[3px] uppercase tracking-wide">
                                {t.category || 'CURSO'}
                              </span>
                              {/* Mobile badge indicator */}
                              <span className="sm:hidden">
                                {prog.quizStatus === 'passed' ? (
                                  <span className="text-[10px] font-semibold text-[#00AC18] bg-green-50 px-2 py-0.5 rounded-[3px] border border-green-200">
                                    ✓ Completado
                                  </span>
                                ) : isOverdue ? (
                                  <span className="text-[10px] font-semibold text-[#EE0606] bg-red-50 px-2 py-0.5 rounded-[3px] border border-red-200">
                                    Vencido
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-[#FC5E13] bg-orange-50 px-2 py-0.5 rounded-[3px] border border-orange-200">
                                    Pendiente
                                  </span>
                                )}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-[#2D3B45] leading-snug break-words">{t.title}</h4>

                            <div className="flex items-center gap-1.5 text-xs text-[#556575]">
                              <Calendar className="h-3.5 w-3.5 shrink-0 text-[#556575]" />
                              <span>Fecha límite: <strong className="text-[#2D3B45]">{t.dueDate || 'Sin fecha programada'}</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[#E0E0E0]">
                            {/* Desktop badge */}
                            <div className="hidden sm:block">
                              {prog.quizStatus === 'passed' ? (
                                <span className="text-[11px] font-semibold text-[#00AC18] bg-green-50 px-2.5 py-1 rounded-[3px] border border-green-200 inline-block">
                                  ✓ Completado
                                </span>
                              ) : isOverdue ? (
                                <span className="text-[11px] font-semibold text-[#EE0606] bg-red-50 px-2.5 py-1 rounded-[3px] border border-red-200 inline-block">
                                  Vencido
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-[#FC5E13] bg-orange-50 px-2.5 py-1 rounded-[3px] border border-orange-200 inline-block">
                                  Pendiente
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                setSelectedTopicId(t.id);
                                setIsCalendarOpen(false);
                              }}
                              className="w-full sm:w-auto px-4 py-1.5 bg-[#0374B5] hover:bg-[#025a8c] text-white text-xs font-semibold rounded-[4px] transition-colors cursor-pointer text-center"
                            >
                              Ir al Curso
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-6 py-3 bg-[#F5F7F8] border-t border-[#C7CDD1] flex justify-end shrink-0">
                <button
                  onClick={() => setIsCalendarOpen(false)}
                  className="w-full sm:w-auto px-4 py-1.5 bg-white border border-[#C7CDD1] text-[#2D3B45] hover:bg-[#F5F7F8] text-xs font-semibold rounded-[4px] transition-colors cursor-pointer text-center"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANUAL DE USUARIO */}
      <UserManual isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} userRole="user" />
      </div>
    </div>
  );
}
