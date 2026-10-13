import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Users,
  LineChart,
  Plus,
  Trash2,
  Edit3,
  Settings,
  FileText,
  HelpCircle,
  Clock,
  Award,
  ChevronRight,
  UserPlus,
  CheckCircle,
  AlertCircle,
  X,
  Search,
  ArrowUpRight,
  Star,
  RefreshCw,
  LogOut,
  Calendar,
  Layers,
  GraduationCap,
  Upload,
  Presentation,
  Filter,
  ArrowUpDown,
  Mail,
  Send,
  Bell,
  Database,
  LayoutDashboard,
  User as UserIcon,
  Menu
} from 'lucide-react';
import { User, Topic, Material, Question, QuizAttempt, UserProgress, CourseReview, Message, CORPORATE_AREAS, CertificateTemplate } from '../types';
import { getEmbedUrl, getGoogleDriveEmbedUrl } from '../lib/videoUtils';
import { isSupabaseConfigured } from '../lib/supabase';
import { SupabaseService } from '../lib/supabaseService';
import UserManual from './UserManual';

interface AdminDashboardProps {
  currentUser: User;
  onLogout: () => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  topics: Topic[];
  setTopics: React.Dispatch<React.SetStateAction<Topic[]>>;
  materials: Material[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  attempts: QuizAttempt[];
  setAttempts: React.Dispatch<React.SetStateAction<QuizAttempt[]>>;
  progress: UserProgress[];
  setProgress: React.Dispatch<React.SetStateAction<UserProgress[]>>;
  reviews: CourseReview[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  certificateTemplates: CertificateTemplate[];
  setCertificateTemplates: React.Dispatch<React.SetStateAction<CertificateTemplate[]>>;
}

export default function AdminDashboard({
  currentUser,
  onLogout,
  users,
  setUsers,
  topics,
  setTopics,
  materials,
  setMaterials,
  questions,
  setQuestions,
  attempts,
  setAttempts,
  progress,
  setProgress,
  reviews,
  messages,
  setMessages,
  certificateTemplates,
  setCertificateTemplates
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'topics' | 'tracking' | 'control' | 'users' | 'messages' | 'supabase' | 'certificates'>('topics');
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // Topic selected for metrics review
  const [selectedTopicId, setSelectedTopicId] = useState<string>(topics[0]?.id || '');
  
  // Selected user for detailed progress tracking
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Tracking Mode and Filters for topic-based tracking
  const [trackingMode, setTrackingMode] = useState<'user' | 'topic'>('user');
  const [trackingSelectedTopicId, setTrackingSelectedTopicId] = useState<string>('');
  const [collaboratorFilter, setCollaboratorFilter] = useState<'all' | 'passed' | 'in_progress' | 'pending'>('all');
  const [collaboratorSort, setCollaboratorSort] = useState<'name' | 'progress' | 'score'>('name');

  useEffect(() => {
    if (!trackingSelectedTopicId && topics.length > 0) {
      setTrackingSelectedTopicId(topics[0].id);
    }
  }, [topics, trackingSelectedTopicId]);

  // Modal / Form States
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  
  // Course/Topic Form fields
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [topicCategory, setTopicCategory] = useState('');
  const [topicMinScore, setTopicMinScore] = useState(7);
  const [topicMaxAttempts, setTopicMaxAttempts] = useState(3);
  const [topicTimeLimit, setTopicTimeLimit] = useState(15);
  const [topicRandomize, setTopicRandomize] = useState(true);
  const [topicDueDate, setTopicDueDate] = useState('');
  const [topicHasInitialQuiz, setTopicHasInitialQuiz] = useState(false);

  // Material Form States
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialTopicId, setMaterialTopicId] = useState('');
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialType, setMaterialType] = useState<'document' | 'video' | 'interactive' | 'pdf' | 'pptx'>('document');
  const [materialContent, setMaterialContent] = useState('');
  const [materialUrl, setMaterialUrl] = useState('');
  const [materialMinutes, setMaterialMinutes] = useState(5);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<{
    filePath?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  }>({});

  // Question Form States
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [questionTopicId, setQuestionTopicId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [questionOptions, setQuestionOptions] = useState<string[]>(['', '', '', '']);
  const [questionCorrectIndex, setQuestionCorrectIndex] = useState(0);
  const [questionType, setQuestionType] = useState<'initial' | 'final'>('final');
  const [questionFormat, setQuestionFormat] = useState<'multiple' | 'true_false'>('multiple');
  const [questionPoints, setQuestionPoints] = useState<number>(10);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // User Account Form States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userNameField, setUserNameField] = useState('');
  const [userEmailField, setUserEmailField] = useState('');
  const [userPasswordField, setUserPasswordField] = useState('');
  const [userRoleField, setUserRoleField] = useState<'admin' | 'user'>('user');
  const [userAreaField, setUserAreaField] = useState('ADMINISTRACION');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Topic target areas state
  const [topicTargetAreas, setTopicTargetAreas] = useState<string[]>([]);

  // Training Delivery / Classes Control States
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliverySelectedTopic, setDeliverySelectedTopic] = useState<Topic | null>(null);
  const [deliveryIsDelivered, setDeliveryIsDelivered] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryInstructor, setDeliveryInstructor] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliverySearchTerm, setDeliverySearchTerm] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'delivered' | 'pending'>('all');

  // Messaging Form States
  const [msgRecipientId, setMsgRecipientId] = useState('ALL');
  const [msgTitle, setMsgTitle] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [msgTopicId, setMsgTopicId] = useState('');
  const [autoRemindTopicId, setAutoRemindTopicId] = useState('');

  // Certificate Template form & modal states
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [tplTitle, setTplTitle] = useState('');
  const [tplSubtitle, setTplSubtitle] = useState('');
  const [tplBodyText, setTplBodyText] = useState('');
  const [tplSignatureName, setTplSignatureName] = useState('');
  const [tplSignatureRole, setTplSignatureRole] = useState('');
  const [tplBgColor, setTplBgColor] = useState('#ffffff');
  const [tplTextColor, setTplTextColor] = useState('#0f172a');

  const handleOpenCreateTemplate = () => {
    setEditingTemplate(null);
    setTplTitle('CERTIFICADO DE APROBACIÓN');
    setTplSubtitle('La Empresa Fundametz certifica que el colaborador(a):');
    setTplBodyText('Ha completado exitosamente y aprobado con distinción los requisitos del curso de capacitación técnica obligatoria de:');
    setTplSignatureName('Ing. Carlos Metz');
    setTplSignatureRole('Gerente General - Fundametz');
    setTplBgColor('#ffffff');
    setTplTextColor('#0f172a');
    setIsCertificateModalOpen(true);
  };

  const handleOpenEditTemplate = (tpl: CertificateTemplate) => {
    setEditingTemplate(tpl);
    setTplTitle(tpl.title);
    setTplSubtitle(tpl.subtitle);
    setTplBodyText(tpl.bodyText);
    setTplSignatureName(tpl.signatureName);
    setTplSignatureRole(tpl.signatureRole);
    setTplBgColor(tpl.backgroundColor || '#ffffff');
    setTplTextColor(tpl.textColor || '#0f172a');
    setIsCertificateModalOpen(true);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplTitle.trim() || !tplSubtitle.trim() || !tplBodyText.trim()) {
      showNotification('error', 'El título, subtítulo y cuerpo del certificado son obligatorios.');
      return;
    }

    if (editingTemplate) {
      setCertificateTemplates(prev => prev.map(t => t.id === editingTemplate.id ? {
        ...t,
        title: tplTitle,
        subtitle: tplSubtitle,
        bodyText: tplBodyText,
        signatureName: tplSignatureName,
        signatureRole: tplSignatureRole,
        backgroundColor: tplBgColor,
        textColor: tplTextColor
      } : t));
      showNotification('success', 'Plantilla de certificado modificada con éxito.');
    } else {
      const newTpl: CertificateTemplate = {
        id: 'tpl-' + Date.now(),
        title: tplTitle,
        subtitle: tplSubtitle,
        bodyText: tplBodyText,
        signatureName: tplSignatureName,
        signatureRole: tplSignatureRole,
        backgroundColor: tplBgColor,
        textColor: tplTextColor,
        isActive: certificateTemplates.length === 0
      };
      setCertificateTemplates(prev => [...prev, newTpl]);
      showNotification('success', 'Nueva plantilla de certificado creada con éxito.');
    }
    setIsCertificateModalOpen(false);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id: string) => {
    const tpl = certificateTemplates.find(t => t.id === id);
    if (!tpl) return;
    if (tpl.isActive && certificateTemplates.length > 1) {
      showNotification('error', 'No puede eliminar la plantilla activa. Active otra primero.');
      return;
    }
    requestConfirmation(
      '¿Eliminar Plantilla?',
      `¿Está seguro de que desea eliminar la plantilla "${tpl.title}"? Esta acción no se puede deshacer.`,
      () => {
        setCertificateTemplates(prev => prev.filter(t => t.id !== id));
        showNotification('success', 'Plantilla de certificado eliminada.');
      }
    );
  };

  const handleActivateTemplate = (id: string) => {
    setCertificateTemplates(prev => prev.map(t => ({
      ...t,
      isActive: t.id === id
    })));
    showNotification('success', 'Plantilla de certificado establecida como activa.');
  };

  // Success / Alert notification simulation
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const requestConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- TOPIC ACTIONS ---
  const handleOpenCreateTopic = () => {
    setEditingTopic(null);
    setTopicTitle('');
    setTopicDescription('');
    setTopicCategory('');
    setTopicMinScore(80);
    setTopicMaxAttempts(3);
    setTopicTimeLimit(15);
    setTopicRandomize(true);
    setTopicDueDate('');
    setTopicTargetAreas([]);
    setTopicHasInitialQuiz(false);
    setIsTopicModalOpen(true);
  };

  const handleOpenEditTopic = (topic: Topic) => {
    setEditingTopic(topic);
    setTopicTitle(topic.title);
    setTopicDescription(topic.description);
    setTopicCategory(topic.category);
    setTopicMinScore(topic.minScoreToPass);
    setTopicMaxAttempts(topic.maxAttempts);
    setTopicTimeLimit(topic.timeLimitMinutes);
    setTopicRandomize(topic.randomizeQuestions);
    setTopicDueDate(topic.dueDate || '');
    setTopicTargetAreas(topic.targetAreas || []);
    setTopicHasInitialQuiz(!!topic.hasInitialQuiz);
    setIsTopicModalOpen(true);
  };

  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim() || !topicCategory.trim()) {
      showNotification('error', 'El título y la categoría son obligatorios.');
      return;
    }

    if (editingTopic) {
      // Edit existing
      setTopics(prev => prev.map(t => t.id === editingTopic.id ? {
        ...t,
        title: topicTitle,
        description: topicDescription,
        category: topicCategory,
        minScoreToPass: topicMinScore,
        maxAttempts: topicMaxAttempts,
        timeLimitMinutes: topicTimeLimit,
        randomizeQuestions: topicRandomize,
        dueDate: topicDueDate || undefined,
        targetAreas: topicTargetAreas,
        hasInitialQuiz: topicHasInitialQuiz
      } : t));
      showNotification('success', 'Tema actualizado correctamente.');
    } else {
      // Create new
      const newTopic: Topic = {
        id: `tpc-${Date.now()}`,
        title: topicTitle,
        description: topicDescription,
        category: topicCategory,
        createdAt: new Date().toISOString(),
        minScoreToPass: topicMinScore,
        maxAttempts: topicMaxAttempts,
        timeLimitMinutes: topicTimeLimit,
        randomizeQuestions: topicRandomize,
        status: 'published',
        dueDate: topicDueDate || undefined,
        targetAreas: topicTargetAreas,
        hasInitialQuiz: topicHasInitialQuiz
      };
      setTopics(prev => [newTopic, ...prev]);
      if (!selectedTopicId) setSelectedTopicId(newTopic.id);
      showNotification('success', 'Nuevo tema creado y publicado de inmediato.');
    }
    setIsTopicModalOpen(false);
  };

  const handleDeleteTopic = (id: string) => {
    requestConfirmation(
      '¿Eliminar tema?',
      '¿Está seguro de que desea eliminar este tema? Se eliminarán también sus materiales y evaluaciones relacionadas de forma definitiva.',
      () => {
        setTopics(prev => prev.filter(t => t.id !== id));
        setMaterials(prev => prev.filter(m => m.topicId !== id));
        setQuestions(prev => prev.filter(q => q.topicId !== id));
        showNotification('success', 'Tema eliminado del sistema.');
      }
    );
  };

  // --- MATERIAL ACTIONS ---
  const handleOpenCreateMaterial = (topicId: string) => {
    setEditingMaterial(null);
    setMaterialTopicId(topicId);
    setMaterialTitle('');
    setMaterialType('document');
    setMaterialContent('');
    setMaterialUrl('');
    setMaterialMinutes(5);
    setUploadedFileName('');
    setIsDragging(false);
    setIsUploadingFile(false);
    setFileMetadata({});
    setIsMaterialModalOpen(true);
  };

  const handleOpenEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setMaterialTopicId(material.topicId);
    setMaterialTitle(material.title);
    setMaterialType(material.type);
    setMaterialContent(material.content);
    setMaterialUrl(material.url || '');
    setMaterialMinutes(material.estimatedMinutes);
    setUploadedFileName(material.fileName || '');
    setIsDragging(false);
    setIsUploadingFile(false);
    setFileMetadata({
      filePath: material.filePath,
      fileUrl: material.fileUrl,
      fileName: material.fileName,
      fileSize: material.fileSize
    });
    setIsMaterialModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    const fileName = file.name;
    const fileExt = fileName.split('.').pop()?.toLowerCase();
    
    setUploadedFileName(fileName);
    if (!materialTitle) {
      setMaterialTitle(fileName.replace(/\.[^/.]+$/, ""));
    }

    // Auto-detect format type based on extension
    let detectedType: 'document' | 'video' | 'interactive' | 'pdf' | 'pptx' = 'document';
    if (fileExt === 'pdf') {
      detectedType = 'pdf';
    } else if (fileExt === 'pptx' || fileExt === 'ppt') {
      detectedType = 'pptx';
    } else if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(fileExt || '')) {
      detectedType = 'video';
    } else {
      detectedType = 'document';
    }
    setMaterialType(detectedType);

    // Provide default Markdown content for clarity
    let defaultContent = '';
    if (detectedType === 'pptx') {
      const slideName = fileName.replace(/\.[^/.]+$/, "");
      defaultContent = `## Diapositiva 1: ${slideName}
- Presentación de diapositivas interactiva
- Documento cargado exitosamente por la administración
- Utilice los controles inferiores de la lámina para navegar

## Diapositiva 2: Conceptos Claves
- Síntesis automática del archivo PowerPoint adjunto
- Análisis de metodologías de trabajo recomendadas
- Guías de resolución y casos prácticos

## Diapositiva 3: Desarrollo del Módulo
- Estrategia integral de respuesta y monitoreo
- Indicadores métricos y matemáticos de efectividad
- Revisiones cruzadas e integraciones de sistemas

## Diapositiva 4: Conclusión y Cierre
- Verifique haber comprendido cada punto
- Proceda con las preguntas del cuestionario de evaluación
- Éxitos en su proceso de capacitación corporativa`;
    } else if (detectedType === 'pdf') {
      defaultContent = `### Documento PDF: ${fileName}
Este es un documento de capacitación en formato PDF cargado por la administración.

- **Nombre del archivo:** ${fileName}
- **Tamaño:** ${(file.size / (1024 * 1024)).toFixed(2)} MB

Por favor visualice el archivo en el visor interactivo integrado a continuación o descárguelo utilizando el botón correspondiente. Asegúrese de leer y analizar todo su contenido antes de proceder a la evaluación final de este tema.`;
    } else {
      defaultContent = `### Material Didáctico Adjunto: ${fileName}
Se ha adjuntado un archivo original para esta capacitación.

- **Nombre del archivo:** ${fileName}
- **Tipo de recurso:** ${fileExt?.toUpperCase() || 'Archivo'}
- **Tamaño del archivo:** ${(file.size / (1024 * 1024)).toFixed(2)} MB

Utilice los botones para abrir, descargar y revisar este material de capacitación en su dispositivo.`;
    }

    setMaterialContent(defaultContent);

    // If Supabase is configured, upload to Storage Bucket 'materials'
    if (isSupabaseConfigured()) {
      setIsUploadingFile(true);
      try {
        showNotification('success', `Subiendo "${fileName}" a Supabase Storage...`);
        const result = await SupabaseService.uploadMaterialFile(file, materialTopicId);
        
        setMaterialUrl(result.fileUrl);
        setFileMetadata({
          filePath: result.filePath,
          fileUrl: result.fileUrl,
          fileName: fileName,
          fileSize: file.size
        });
        showNotification('success', 'Archivo guardado exitosamente en el servidor de almacenamiento.');
      } catch (err: any) {
        console.error('Error al subir archivo a Supabase Storage:', err);
        showNotification('error', `Error de almacenamiento: ${err?.message || err}. Procesando localmente en Base64...`);
        readAsBase64Local(file);
      } finally {
        setIsUploadingFile(false);
      }
    } else {
      // Offline fallback: read file as Base64 to save inside state/localStorage (within size limit constraints)
      readAsBase64Local(file);
    }
  };

  const readAsBase64Local = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      showNotification('success', 'Aviso: Los archivos de más de 2MB pueden tener un rendimiento degradado sin configurar Supabase.');
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      setMaterialUrl(base64Url);
      setFileMetadata({
        fileUrl: base64Url,
        fileName: file.name,
        fileSize: file.size
      });
      showNotification('success', 'Archivo procesado localmente en Base64.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialTitle.trim() || !materialContent.trim()) {
      showNotification('error', 'El título y el contenido son obligatorios.');
      return;
    }

    if (editingMaterial) {
      setMaterials(prev => prev.map(m => m.id === editingMaterial.id ? {
        ...m,
        title: materialTitle,
        type: materialType,
        content: materialContent,
        url: materialUrl || undefined,
        estimatedMinutes: materialMinutes,
        filePath: fileMetadata.filePath,
        fileUrl: fileMetadata.fileUrl || materialUrl || undefined,
        fileName: fileMetadata.fileName || uploadedFileName || undefined,
        fileSize: fileMetadata.fileSize || undefined
      } : m));
      setIsMaterialModalOpen(false);
      showNotification('success', 'Material didáctico modificado con éxito.');
    } else {
      const newMaterial: Material = {
        id: `mat-${Date.now()}`,
        topicId: materialTopicId,
        title: materialTitle,
        type: materialType,
        content: materialContent,
        url: materialUrl || undefined,
        estimatedMinutes: materialMinutes,
        filePath: fileMetadata.filePath,
        fileUrl: fileMetadata.fileUrl || materialUrl || undefined,
        fileName: fileMetadata.fileName || uploadedFileName || undefined,
        fileSize: fileMetadata.fileSize || undefined
      };

      setMaterials(prev => [...prev, newMaterial]);
      setIsMaterialModalOpen(false);
      showNotification('success', 'Material didáctico cargado exitosamente.');
    }
  };

  const handleDeleteMaterial = (id: string) => {
    requestConfirmation(
      '¿Eliminar material?',
      '¿Está seguro de que desea eliminar este material didáctico del tema actual?',
      () => {
        setMaterials(prev => prev.filter(m => m.id !== id));
        showNotification('success', 'Material didáctico eliminado.');
      }
    );
  };

  // --- TRAINING DELIVERY ACTIONS ---
  const handleOpenRegisterDelivery = (topic: Topic) => {
    setDeliverySelectedTopic(topic);
    setDeliveryIsDelivered(topic.isDelivered ?? false);
    setDeliveryDate(topic.deliveredAt || new Date().toISOString().split('T')[0]);
    setDeliveryInstructor(topic.deliveredBy || '');
    setDeliveryNotes(topic.deliveredNotes || '');
    setIsDeliveryModalOpen(true);
  };

  const handleSaveDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverySelectedTopic) return;

    setTopics(prev => prev.map(t => t.id === deliverySelectedTopic.id ? {
      ...t,
      isDelivered: deliveryIsDelivered,
      deliveredAt: deliveryIsDelivered ? deliveryDate : undefined,
      deliveredBy: deliveryIsDelivered ? deliveryInstructor : undefined,
      deliveredNotes: deliveryIsDelivered ? deliveryNotes : undefined
    } : t));

    setIsDeliveryModalOpen(false);
    showNotification('success', deliveryIsDelivered 
      ? 'Control de capacitación actualizado: tema marcado como CERRADO.' 
      : 'Control de capacitación actualizado: tema marcado como PENDIENTE.'
    );
  };

  // --- QUESTION ACTIONS ---
  const handleOpenCreateQuestion = (topicId: string, type: 'initial' | 'final' = 'final') => {
    setEditingQuestion(null);
    setQuestionTopicId(topicId);
    setQuestionText('');
    setQuestionOptions(['', '', '', '']);
    setQuestionCorrectIndex(0);
    setQuestionType(type);
    setQuestionFormat('multiple');
    setQuestionPoints(10);
    setIsQuestionModalOpen(true);
  };

  const handleOpenEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionTopicId(question.topicId);
    setQuestionText(question.questionText);
    setQuestionFormat(question.format || 'multiple');
    if (question.format === 'multiple') {
      setQuestionOptions([...question.options]);
    } else {
      setQuestionOptions(['', '', '', '']);
    }
    setQuestionCorrectIndex(question.correctOptionIndex);
    setQuestionType(question.type || 'final');
    setQuestionPoints(question.points ?? 10);
    setIsQuestionModalOpen(true);
  };

  const handleAddQuestionOption = () => {
    if (questionOptions.length >= 10) {
      showNotification('error', 'Máximo 10 opciones permitidas.');
      return;
    }
    setQuestionOptions([...questionOptions, '']);
  };

  const handleRemoveQuestionOption = (indexToRemove: number) => {
    if (questionOptions.length <= 2) {
      showNotification('error', 'Debe haber al menos 2 opciones de respuesta.');
      return;
    }
    const updated = questionOptions.filter((_, idx) => idx !== indexToRemove);
    setQuestionOptions(updated);
    
    if (questionCorrectIndex === indexToRemove) {
      setQuestionCorrectIndex(0);
    } else if (indexToRemove < questionCorrectIndex) {
      setQuestionCorrectIndex(questionCorrectIndex - 1);
    }
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (questionFormat === 'multiple') {
      if (!questionText.trim() || questionOptions.some(o => !o.trim())) {
        showNotification('error', 'Escriba la pregunta y todas las alternativas.');
        return;
      }
    } else {
      if (!questionText.trim()) {
        showNotification('error', 'Escriba el enunciado de la pregunta.');
        return;
      }
    }

    const finalOptions = questionFormat === 'multiple' 
      ? [...questionOptions] 
      : ['Verdadero', 'Falso'];

    if (editingQuestion) {
      setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? {
        ...q,
        questionText: questionText,
        options: finalOptions,
        correctOptionIndex: questionCorrectIndex,
        type: questionType,
        format: questionFormat,
        points: questionPoints
      } : q));
      setIsQuestionModalOpen(false);
      showNotification('success', 'Pregunta modificada con éxito.');
    } else {
      const newQuestion: Question = {
        id: `q-${Date.now()}`,
        topicId: questionTopicId,
        questionText: questionText,
        options: finalOptions,
        correctOptionIndex: questionCorrectIndex,
        type: questionType,
        format: questionFormat,
        points: questionPoints
      };

      setQuestions(prev => [...prev, newQuestion]);
      setIsQuestionModalOpen(false);
      showNotification('success', questionType === 'initial' ? 'Pregunta agregada a la evaluación de conocimientos inicial.' : 'Pregunta agregada a la evaluación final.');
    }
  };

  const handleDeleteQuestion = (id: string) => {
    requestConfirmation(
      '¿Eliminar pregunta?',
      '¿Está seguro de que desea eliminar esta pregunta de la prueba evaluativa?',
      () => {
        setQuestions(prev => prev.filter(q => q.id !== id));
        showNotification('success', 'Pregunta eliminada.');
      }
    );
  };

  // --- USER ACCOUNT ACTIONS ---
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserNameField('');
    setUserEmailField('');
    setUserPasswordField('');
    setUserRoleField('user');
    setUserAreaField('ADMINISTRACION');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setUserNameField(user.name);
    setUserEmailField(user.email);
    setUserPasswordField(user.passwordHash);
    setUserRoleField(user.role);
    setUserAreaField(user.area || 'ADMINISTRACION');
    setIsUserModalOpen(true);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userNameField.trim() || !userEmailField.trim() || !userPasswordField.trim()) {
      showNotification('error', 'Todos los campos de cuenta son requeridos.');
      return;
    }

    if (!editingUser && users.some(u => u.email.toLowerCase() === userEmailField.toLowerCase().trim())) {
      showNotification('error', 'Este número de cédula ya está registrado.');
      return;
    }

    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? {
        ...u,
        name: userNameField,
        email: userEmailField.trim(),
        role: userRoleField,
        passwordHash: userPasswordField,
        area: userAreaField
      } : u));
      showNotification('success', 'Cuenta de usuario actualizada con éxito.');
    } else {
      const newUser: User = {
        id: `usr-${Date.now()}`,
        name: userNameField,
        email: userEmailField.trim(),
        role: userRoleField,
        passwordHash: userPasswordField,
        createdAt: new Date().toISOString(),
        isActive: true,
        area: userAreaField
      };

      setUsers(prev => [...prev, newUser]);
      showNotification('success', 'Cuenta de usuario creada con contraseña.');
    }

    setIsUserModalOpen(false);
    setEditingUser(null);
    
    // Clear fields
    setUserNameField('');
    setUserEmailField('');
    setUserPasswordField('');
    setUserRoleField('user');
    setUserAreaField('ADMINISTRACION');
  };

  const toggleUserActive = (userId: string) => {
    if (userId === currentUser.id) {
      showNotification('error', 'No puede desactivarse a usted mismo.');
      return;
    }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
    showNotification('success', 'Estado del usuario actualizado.');
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      showNotification('error', 'No puede eliminar su propia cuenta de administrador.');
      return;
    }
    requestConfirmation(
      '¿Eliminar usuario?',
      '¿Está seguro de que desea eliminar permanentemente esta cuenta de usuario? Se borrarán sus datos asociados de avance e historial formativo.',
      () => {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setProgress(prev => prev.filter(p => p.userId !== userId));
        setAttempts(prev => prev.filter(a => a.userId !== userId));
        showNotification('success', 'Cuenta de usuario eliminada permanentemente.');
        if (selectedUserId === userId) {
          setSelectedUserId(null);
        }
      }
    );
  };

  // --- MESSAGE HANDLERS ---
  const handleSendManualMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgTitle.trim() || !msgContent.trim()) {
      showNotification('error', 'El título y el contenido son campos obligatorios.');
      return;
    }

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      recipientId: msgRecipientId,
      title: msgTitle.trim(),
      content: msgContent.trim(),
      type: 'manual',
      createdAt: new Date().toISOString(),
      isRead: false,
      topicId: msgTopicId || undefined
    };

    setMessages(prev => [newMessage, ...prev]);
    setMsgTitle('');
    setMsgContent('');
    setMsgTopicId('');
    showNotification('success', 'Mensaje enviado correctamente.');
  };

  const handleSendAutomaticDueDateReminders = () => {
    if (!autoRemindTopicId) {
      showNotification('error', 'Por favor seleccione un tema para el recordatorio.');
      return;
    }

    const topic = topics.find(t => t.id === autoRemindTopicId);
    if (!topic) return;

    // Find all active students who haven't passed this topic
    const targetStudents = users.filter(u => u.role === 'user' && u.isActive);
    let sentCount = 0;

    const newMessages: Message[] = [];

    targetStudents.forEach(student => {
      // Check if student has passed this topic
      const studentProg = progress.find(p => p.userId === student.id && p.topicId === topic.id);
      const isPassed = studentProg?.quizStatus === 'passed';

      if (!isPassed) {
        newMessages.push({
          id: `msg-auto-due-${student.id}-${topic.id}-${Date.now()}`,
          senderId: currentUser.id,
          senderName: 'Remitente Automático',
          recipientId: student.id,
          title: `⚠️ Recordatorio: Evaluación Pendiente - ${topic.title}`,
          content: `Estimado/a ${student.name}, le recordamos que tiene pendiente realizar la capacitación del tema "${topic.title}". La fecha límite establecida es ${topic.dueDate ? new Date(topic.dueDate).toLocaleDateString() : 'próximamente'}. Por favor revise el material didáctico y complete la evaluación final.`,
          type: 'automatic_due_date',
          createdAt: new Date().toISOString(),
          isRead: false,
          topicId: topic.id
        });
        sentCount++;
      }
    });

    if (newMessages.length > 0) {
      setMessages(prev => [...newMessages, ...prev]);
      showNotification('success', `Se enviaron ${sentCount} recordatorios automáticos de vencimiento.`);
    } else {
      showNotification('error', 'Todos los alumnos ya han aprobado este tema, no fue necesario enviar recordatorios.');
    }
  };

  const handleDeleteMessage = (id: string) => {
    requestConfirmation(
      '¿Eliminar mensaje?',
      '¿Está seguro de que desea eliminar permanentemente este mensaje del buzón? Ya no estará visible para el alumno.',
      () => {
        setMessages(prev => prev.filter(m => m.id !== id));
        showNotification('success', 'Mensaje eliminado del buzón.');
      }
    );
  };

  // --- MATHEMATICAL METRICS (EFFICACY CALCULATIONS) ---
  const getEfficacyMetrics = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return null;

    // Filter completions (progress having quiz status passed or failed)
    const topicProgress = progress.filter(p => p.topicId === topicId);
    const totalEnrolled = users.filter(u => u.role === 'user').length;
    const progressCompleted = topicProgress.filter(p => p.quizStatus === 'passed');
    const progressFailed = topicProgress.filter(p => p.quizStatus === 'failed');
    
    const attemptsForTopic = attempts.filter(a => a.topicId === topicId);
    
    // Unique participants who attempted the quiz
    const uniqueParticipants = Array.from(new Set(attemptsForTopic.map(a => a.userId)));
    const totalAttempted = uniqueParticipants.length;
    
    // Success rate on first attempt vs later
    const firstAttempts = uniqueParticipants.map(uId => {
      const userAtts = attemptsForTopic.filter(a => a.userId === uId);
      // Sort by date to get the first one
      const sorted = [...userAtts].sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime());
      return sorted[0];
    }).filter(Boolean);

    const firstAttemptPassCount = firstAttempts.filter(a => a.passed).length;
    const firstAttemptPassRate = firstAttempts.length > 0 ? (firstAttemptPassCount / firstAttempts.length) * 100 : 0;

    // Average final score of users
    const passedAttempts = attemptsForTopic.filter(a => a.passed);
    const avgScore = attemptsForTopic.length > 0 
      ? attemptsForTopic.reduce((acc, current) => acc + current.score, 0) / attemptsForTopic.length 
      : 0;

    // Highest attempt scores vs initial attempt score to calculate "Learning Curve" or "Efficacy Improvement"
    let avgImprovementPercent = 0;
    let improvementPairsCount = 0;
    let sumImprovement = 0;

    uniqueParticipants.forEach(uId => {
      const userAtts = attemptsForTopic.filter(a => a.userId === uId);
      if (userAtts.length > 1) {
        const sorted = [...userAtts].sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime());
        const firstScore = sorted[0].score;
        const highestScore = Math.max(...userAtts.map(a => a.score));
        sumImprovement += (highestScore - firstScore);
        improvementPairsCount++;
      }
    });
    if (improvementPairsCount > 0) {
      avgImprovementPercent = sumImprovement / improvementPairsCount;
    }

    // Pass rate overall
    const totalUniquePassed = topicProgress.filter(p => p.quizStatus === 'passed').length;
    const generalPassRate = totalAttempted > 0 ? (totalUniquePassed / totalAttempted) * 100 : 0;
    
    // Enrollment / Completion progress rate
    const completionRate = totalEnrolled > 0 ? (totalUniquePassed / totalEnrolled) * 100 : 0;

    // Average attempts needed to pass
    const usersPassedProgress = topicProgress.filter(p => p.quizStatus === 'passed');
    const avgAttemptsToPass = usersPassedProgress.length > 0
      ? usersPassedProgress.reduce((acc, curr) => acc + curr.attemptsCount, 0) / usersPassedProgress.length
      : 0;

    // Course reviews rating
    const topicReviews = reviews.filter(r => r.topicId === topicId);
    const avgRating = topicReviews.length > 0
      ? topicReviews.reduce((acc, curr) => acc + curr.rating, 0) / topicReviews.length
      : 0;

    const reviewsWithSat = topicReviews.filter(r => r.satisfactionRating !== undefined);
    const avgSatisfaction = reviewsWithSat.length > 0
      ? reviewsWithSat.reduce((acc, curr) => acc + (curr.satisfactionRating ?? 0), 0) / reviewsWithSat.length
      : null;

    const reviewsWithClar = topicReviews.filter(r => r.clarityRating !== undefined);
    const avgClarity = reviewsWithClar.length > 0
      ? reviewsWithClar.reduce((acc, curr) => acc + (curr.clarityRating ?? 0), 0) / reviewsWithClar.length
      : null;

    // Word-based feedback distributions
    const satisfactionCounts = { regular: 0, bueno: 0, muyBueno: 0, excelente: 0 };
    const clarityCounts = { regular: 0, bueno: 0, muyBueno: 0, excelente: 0 };

    topicReviews.forEach(r => {
      if (r.satisfactionRating === 0) satisfactionCounts.regular++;
      else if (r.satisfactionRating === 1) satisfactionCounts.bueno++;
      else if (r.satisfactionRating === 2) satisfactionCounts.muyBueno++;
      else if (r.satisfactionRating === 3) satisfactionCounts.excelente++;

      if (r.clarityRating === 0) clarityCounts.regular++;
      else if (r.clarityRating === 1) clarityCounts.bueno++;
      else if (r.clarityRating === 2) clarityCounts.muyBueno++;
      else if (r.clarityRating === 3) clarityCounts.excelente++;
    });

    // Score Range distribution for SVG charts
    const scoreRanges = {
      excellent: 0, // 90-100%
      good: 0,      // 75-89%
      regular: 0,   // 50-74%
      poor: 0       // 0-49%
    };

    const topicQs = questions.filter(q => q.topicId === topicId && (q.type || 'final') === 'final');
    const maxPts = topicQs.reduce((sum, q) => sum + (q.points ?? 10), 0);

    // Calculate distribution using highest score of unique users (0-10 scale)
    topicProgress.forEach(p => {
      if (p.highestScore !== null) {
        const scoreNorm = p.highestScore > 10 ? p.highestScore / 10 : p.highestScore;
        if (scoreNorm >= 9.0) scoreRanges.excellent++;
        else if (scoreNorm >= 7.5) scoreRanges.good++;
        else if (scoreNorm >= 5.0) scoreRanges.regular++;
        else scoreRanges.poor++;
      }
    });

    return {
      totalEnrolled,
      totalAttempted,
      totalUniquePassed,
      generalPassRate,
      firstAttemptPassRate,
      avgScore,
      avgAttemptsToPass,
      completionRate,
      avgImprovementPercent,
      topicReviews,
      avgRating,
      avgSatisfaction,
      avgClarity,
      satisfactionCounts,
      clarityCounts,
      scoreRanges,
      totalProgressRecord: topicProgress.length,
      notStartedCount: totalEnrolled - topicProgress.length
    };
  };

  const selectedMetrics = getEfficacyMetrics(selectedTopicId);

  // --- RENDERING VIEWS ---
  return (
    <div className="min-h-screen bg-[#F5F7F8] flex text-[#2D3B45] font-sans antialiased selection:bg-[#0374B5] selection:text-white">
      {/* CANVAS GLOBAL NAVIGATION SIDEBAR (LEFT) - DESKTOP ONLY */}
      <aside className="hidden md:flex w-[76px] shrink-0 bg-[#1E2B37] text-white flex-col items-center py-3.5 z-30 sticky top-0 h-screen select-none border-r border-[#15202B]">
        {/* Institutional Logo */}
        <div 
          onClick={() => setActiveTab('topics')}
          className="flex flex-col items-center justify-center p-1.5 mb-3 text-white hover:opacity-90 cursor-pointer group"
          title="Aula Virtual Fundametz"
        >
          <div className="w-11 h-11 rounded-[4px] bg-[#0374B5] flex items-center justify-center text-white shadow-sm group-hover:bg-[#025a8c] transition-colors">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-bold text-slate-200 mt-1 tracking-tight">Fundametz</span>
        </div>

        {/* Global Navigation Items */}
        <div className="w-full flex-1 flex flex-col items-center space-y-1">
          {/* Cuenta */}
          <div
            title="Cuenta de Administrador"
            className="w-full flex flex-col items-center py-2.5 px-1 text-slate-300 hover:text-white hover:bg-[#263645] transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-600 border border-slate-400 flex items-center justify-center text-white text-xs font-bold mb-1 group-hover:border-white">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-[11px] font-medium leading-none">Cuenta</span>
          </div>

          {/* Tablero */}
          <button
            id="sidebar-tablero"
            onClick={() => { setActiveTab('topics'); setSelectedUserId(null); }}
            title="Tablero"
            className={`w-full flex flex-col items-center py-2.5 px-1 transition-colors cursor-pointer relative ${
              activeTab === 'topics' 
                ? 'bg-[#2D3B45] text-white border-l-4 border-[#008EE2]' 
                : 'text-slate-300 hover:text-white hover:bg-[#263645]'
            }`}
          >
            <LayoutDashboard className="h-6 w-6 mb-1 text-inherit" />
            <span className="text-[11px] font-medium leading-none">Tablero</span>
          </button>

          {/* Usuarios / Seguimiento */}
          <button
            onClick={() => setActiveTab('tracking')}
            title="Seguimiento de Estudiantes"
            className={`w-full flex flex-col items-center py-2.5 px-1 transition-colors cursor-pointer relative ${
              activeTab === 'tracking' 
                ? 'bg-[#2D3B45] text-white border-l-4 border-[#008EE2]' 
                : 'text-slate-300 hover:text-white hover:bg-[#263645]'
            }`}
          >
            <Users className="h-6 w-6 mb-1 text-inherit" />
            <span className="text-[10px] font-medium leading-none">Alumnos</span>
          </button>

          {/* Buzón */}
          <button
            onClick={() => setActiveTab('messages')}
            title="Buzón de Mensajes"
            className={`w-full flex flex-col items-center py-2.5 px-1 transition-colors cursor-pointer relative ${
              activeTab === 'messages' 
                ? 'bg-[#2D3B45] text-white border-l-4 border-[#008EE2]' 
                : 'text-slate-300 hover:text-white hover:bg-[#263645]'
            }`}
          >
            <Mail className="h-6 w-6 mb-1 text-inherit" />
            <span className="text-[10px] font-medium leading-none">Buzón</span>
          </button>
        </div>

        {/* Salir */}
        <div className="w-full pt-2 border-t border-[#2D3B45]">
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="w-full flex flex-col items-center py-2 px-1 text-slate-400 hover:text-rose-400 hover:bg-[#263645] transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium leading-none">Salir</span>
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR FOR ADMIN */}
      <nav aria-label="Navegación móvil" className="fixed bottom-0 left-0 right-0 z-40 bg-[#1E2B37] text-white flex md:hidden items-center justify-around py-1.5 px-1 border-t border-[#15202B] shadow-2xl safe-area-bottom">
        <button
          onClick={() => { setActiveTab('topics'); setSelectedUserId(null); }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'topics' ? 'text-[#008EE2] font-bold' : 'text-slate-300 hover:text-white'
          }`}
        >
          <LayoutDashboard className="h-5 w-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Cursos</span>
        </button>

        <button
          onClick={() => setActiveTab('tracking')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'tracking' ? 'text-[#008EE2] font-bold' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Users className="h-5 w-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Alumnos</span>
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'messages' ? 'text-[#008EE2] font-bold' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Mail className="h-5 w-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Buzón</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'users' ? 'text-[#008EE2] font-bold' : 'text-slate-300 hover:text-white'
          }`}
        >
          <UserPlus className="h-5 w-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Cuentas</span>
        </button>

        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Menú</span>
        </button>
      </nav>

      {/* MOBILE SLIDE-OVER DRAWER FOR ADMIN */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-[280px] max-w-[80vw] bg-[#1E2B37] text-white h-full flex flex-col shadow-2xl z-10"
            >
              <div className="p-4 border-b border-[#2D3B45] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-[4px] bg-[#0374B5] flex items-center justify-center text-white shadow-sm font-bold">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-none">Fundametz</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-none">Panel Administrador</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#263645]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 bg-[#15202B] border-b border-[#2D3B45] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0374B5] border-2 border-white/20 flex items-center justify-center text-white text-sm font-bold">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                  <span className="inline-block px-1.5 py-0.2 mt-1 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                    Administrador
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
                <button
                  onClick={() => { setActiveTab('topics'); setIsMobileNavOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-[#263645] hover:text-white transition-colors"
                >
                  <BookOpen className="h-5 w-5 text-[#008EE2]" />
                  <span className="text-xs font-medium">Temas y Contenido</span>
                </button>
                <button
                  onClick={() => { setActiveTab('tracking'); setIsMobileNavOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-[#263645] hover:text-white transition-colors"
                >
                  <Users className="h-5 w-5 text-indigo-400" />
                  <span className="text-xs font-medium">Seguimiento de Alumnos</span>
                </button>
                <button
                  onClick={() => { setActiveTab('control'); setIsMobileNavOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-[#263645] hover:text-white transition-colors"
                >
                  <Layers className="h-5 w-5 text-amber-400" />
                  <span className="text-xs font-medium">Control de Fechas</span>
                </button>
                <button
                  onClick={() => { setActiveTab('users'); setIsMobileNavOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-[#263645] hover:text-white transition-colors"
                >
                  <UserPlus className="h-5 w-5 text-emerald-400" />
                  <span className="text-xs font-medium">Gestión de Cuentas</span>
                </button>
                <button
                  onClick={() => { setActiveTab('messages'); setIsMobileNavOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-[#263645] hover:text-white transition-colors"
                >
                  <Mail className="h-5 w-5 text-rose-400" />
                  <span className="text-xs font-medium">Buzón de Mensajes</span>
                </button>
                <button
                  onClick={() => { setActiveTab('certificates'); setIsMobileNavOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-[#263645] hover:text-white transition-colors"
                >
                  <Award className="h-5 w-5 text-yellow-400" />
                  <span className="text-xs font-medium">Plantillas de Certificados</span>
                </button>
              </div>

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
        <header id="admin-header" className="bg-white border-b border-[#C7CDD1] px-3.5 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              title="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[#556575] min-w-0">
              <span className="font-semibold text-[#2D3B45]">Admin</span>
              <span className="text-slate-400">/</span>
              <span className="text-[#0374B5] font-medium capitalize truncate max-w-[130px] sm:max-w-md">
                {activeTab === 'topics' ? 'Tablero' :
                 activeTab === 'tracking' ? 'Seguimiento' :
                 activeTab === 'control' ? 'Control Fechas' :
                 activeTab === 'users' ? 'Cuentas' :
                 activeTab === 'messages' ? 'Buzón' : 'Certificados'}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-[#2D3B45] block leading-tight">{currentUser.name}</span>
              <span className="text-[11px] text-[#556575] leading-tight font-medium">Administrador</span>
            </div>
            <button
              id="btn-logout"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-[#EE0606] rounded-[4px] text-xs font-semibold border border-[#C7CDD1] hover:border-red-200 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        {/* TABS SELECTOR (CANVAS TABS) */}
        <div className="bg-white border-b border-[#C7CDD1] px-3 sm:px-6 pt-1 flex overflow-x-auto scrollbar-none gap-1">
          <button
            id="tab-topics"
            onClick={() => { setActiveTab('topics'); setSelectedUserId(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-[4px] transition-colors cursor-pointer shrink-0 ${
              activeTab === 'topics'
                ? 'border-b-2 border-[#0374B5] text-[#0374B5] font-bold'
                : 'text-[#556575] hover:text-[#2D3B45] hover:bg-[#F5F7F8]'
            }`}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            Temas y Contenido
          </button>
          <button
            id="tab-tracking"
            onClick={() => { setActiveTab('tracking'); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-[4px] transition-colors cursor-pointer shrink-0 ${
              activeTab === 'tracking'
                ? 'border-b-2 border-[#0374B5] text-[#0374B5] font-bold'
                : 'text-[#556575] hover:text-[#2D3B45] hover:bg-[#F5F7F8]'
            }`}
          >
            <Users className="h-4 w-4 shrink-0" />
            Seguimiento de Avance
          </button>
          <button
            id="tab-control"
            onClick={() => { setActiveTab('control'); setSelectedUserId(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-[4px] transition-colors cursor-pointer shrink-0 ${
              activeTab === 'control'
                ? 'border-b-2 border-[#0374B5] text-[#0374B5] font-bold'
                : 'text-[#556575] hover:text-[#2D3B45] hover:bg-[#F5F7F8]'
            }`}
          >
            <Presentation className="h-4 w-4 shrink-0" />
            Control de Capacitaciones
          </button>
          <button
            id="tab-users"
            onClick={() => { setActiveTab('users'); setSelectedUserId(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-[4px] transition-colors cursor-pointer shrink-0 ${
              activeTab === 'users'
                ? 'border-b-2 border-[#0374B5] text-[#0374B5] font-bold'
                : 'text-[#556575] hover:text-[#2D3B45] hover:bg-[#F5F7F8]'
            }`}
          >
            <Settings className="h-4 w-4 shrink-0" />
            Gestión de Cuentas
          </button>
          <button
            id="tab-messages"
            onClick={() => { setActiveTab('messages'); setSelectedUserId(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-[4px] transition-colors cursor-pointer shrink-0 ${
              activeTab === 'messages'
                ? 'border-b-2 border-[#0374B5] text-[#0374B5] font-bold'
                : 'text-[#556575] hover:text-[#2D3B45] hover:bg-[#F5F7F8]'
            }`}
          >
            <Mail className="h-4 w-4 shrink-0" />
            Buzón de Mensajes
          </button>
          <button
            id="tab-certificates"
            onClick={() => { setActiveTab('certificates'); setSelectedUserId(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-[4px] transition-colors cursor-pointer shrink-0 ${
              activeTab === 'certificates'
                ? 'border-b-2 border-[#0374B5] text-[#0374B5] font-bold'
                : 'text-[#556575] hover:text-[#2D3B45] hover:bg-[#F5F7F8]'
            }`}
          >
            <Award className="h-4 w-4 shrink-0" />
            Plantillas de Certificados
          </button>
        </div>

      {/* TOAST SYSTEM SIMULATION */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-xs font-mono font-bold uppercase tracking-wider ${
              notification.type === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0 text-white" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-white" />
            )}
            <span>[ALERTA]: {notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTENT AREA */}
      <main className="flex-1 p-2.5 sm:p-6 pb-24 md:pb-6 max-w-7xl w-full mx-auto">
        <AnimatePresence mode="wait">
          
          {/* TAB 2: TOPICS & MATERIAL MANAGEMENT */}
          {activeTab === 'topics' && (
            <motion.div
              key="topics-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-serif italic font-bold text-slate-800">Capacitaciones y Materiales</h2>
                  <p className="text-xs text-slate-500">Cargue material de lectura, configure límites de tiempo, intentos de pruebas y elabore preguntas.</p>
                </div>
                <button
                  id="btn-create-topic"
                  onClick={handleOpenCreateTopic}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-100 hover:shadow-emerald-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo Tema
                </button>
              </div>

              {/* LIST OF TOPICS WITH MANAGEMENT ACCORDIONS */}
              <div className="space-y-4">
                {topics.map(t => {
                  const topicMaterials = materials.filter(m => m.topicId === t.id);
                  const topicQuestions = questions.filter(q => q.topicId === t.id);

                  return (
                    <div key={t.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-100 overflow-hidden">
                      {/* Course Header */}
                      <div className="p-5 bg-slate-50 border-b border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-slate-200/60 text-slate-700 rounded-lg uppercase tracking-wider">
                              {t.category}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">ID: {t.id}</span>
                          </div>
                          <h3 className="text-base font-serif italic font-bold text-slate-800">{t.title}</h3>
                          <p className="text-xs text-slate-500 leading-relaxed">{t.description}</p>
                          
                          {/* Destinatarios */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 text-[10px] font-mono">
                            <span className="text-slate-400 font-bold uppercase">Dirigido a:</span>
                            {!t.targetAreas || t.targetAreas.length === 0 ? (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[9px] font-bold uppercase">TODAS LAS ÁREAS</span>
                            ) : t.targetAreas.length === CORPORATE_AREAS.length ? (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[9px] font-bold uppercase">TODAS LAS ÁREAS</span>
                            ) : (
                              <div className="flex flex-wrap items-center gap-1">
                                {t.targetAreas.map(area => (
                                  <span key={area} className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[9px] font-bold uppercase">
                                    {area}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Topic actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditTopic(t)}
                            className="p-2 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 bg-white cursor-pointer transition-all duration-200 active:scale-95 shadow-sm"
                            title="Editar parámetros del tema"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTopic(t.id)}
                            className="p-2 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-xl border border-slate-200 bg-white cursor-pointer transition-all duration-200 active:scale-95 shadow-sm"
                            title="Eliminar tema"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Topic Sub-sections: Materials & Evaluation */}
                      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Material Loading Section */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                              <FileText className="h-4 w-4 text-emerald-600" />
                              Material Didáctico ({topicMaterials.length})
                            </h4>
                            <button
                              onClick={() => handleOpenCreateMaterial(t.id)}
                              className="text-[11px] font-mono font-bold text-emerald-600 hover:text-emerald-750 flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="h-3 w-3" /> Cargar Material
                            </button>
                          </div>

                          {topicMaterials.length > 0 ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {topicMaterials.map(mat => (
                                <div key={mat.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-xs transition-all duration-200">
                                  <div className="space-y-0.5 truncate pr-4">
                                    <span className="font-bold text-slate-800 block truncate">{mat.title}</span>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                      <span className="capitalize">{mat.type === 'document' ? 'Lectura' : mat.type === 'video' ? 'Video' : 'Interactiva'}</span>
                                      <span>•</span>
                                      <span>{mat.estimatedMinutes} min</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={() => handleOpenEditMaterial(mat)}
                                      className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer transition-colors"
                                      title="Editar Material"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMaterial(mat.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer transition-colors"
                                      title="Eliminar Material"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center text-xs font-mono text-slate-500 bg-slate-50/30">
                              No hay materiales didácticos cargados. Los alumnos no podrán iniciar la capacitación sin material.
                            </div>
                          )}
                        </div>

                        {/* Quiz Questions Section */}
                        <div className="space-y-4 pt-2 border-t border-slate-100 lg:border-t-0 lg:pt-0">
                          {(() => {
                            const initialQuestions = topicQuestions.filter(q => q.type === 'initial');
                            const finalQuestions = topicQuestions.filter(q => q.type === 'final' || !q.type);
                            
                            return (
                              <>
                                {t.hasInitialQuiz && (
                                  <div className="space-y-3 p-4 bg-amber-50/30 border border-amber-200/60 rounded-xl">
                                    <div className="flex justify-between items-center">
                                      <h4 className="text-xs font-mono font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <GraduationCap className="h-4 w-4 text-amber-750" />
                                        1. Evaluación Inicial (Pre-test: {initialQuestions.length} Preguntas)
                                      </h4>
                                      <button
                                        onClick={() => handleOpenCreateQuestion(t.id, 'initial')}
                                        className="text-[11px] font-mono font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                                      >
                                        <Plus className="h-3 w-3" /> Agregar Pregunta
                                      </button>
                                    </div>

                                    {initialQuestions.length > 0 ? (
                                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {initialQuestions.map((q, idx) => (
                                          <div key={q.id} className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-2">
                                            <div className="flex justify-between items-start gap-4">
                                              <span className="font-bold text-slate-800 flex items-center flex-wrap gap-1.5">
                                                <span>{idx + 1}. {q.questionText}</span>
                                                {q.format === 'true_false' ? (
                                                  <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md uppercase shrink-0">V/F</span>
                                                ) : (
                                                  <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md uppercase shrink-0">Múltiple</span>
                                                )}
                                                <span className="text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-md uppercase shrink-0">
                                                  {q.points ?? 10} pts
                                                </span>
                                              </span>
                                              <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                  onClick={() => handleOpenEditQuestion(q)}
                                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer transition-colors"
                                                  title="Editar Pregunta"
                                                >
                                                  <Edit3 className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteQuestion(q.id)}
                                                  className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer transition-colors"
                                                  title="Eliminar Pregunta"
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                              </div>
                                            </div>
                                            <div className="pl-4 border-l-2 border-amber-500 space-y-0.5 text-[11px] text-slate-500 font-mono">
                                              {q.options.map((opt, oIdx) => (
                                                <div key={oIdx} className={oIdx === q.correctOptionIndex ? 'text-amber-800 font-bold' : ''}>
                                                  {oIdx === q.correctOptionIndex ? '✓' : '•'} {opt}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="border border-dashed border-amber-200 rounded-xl p-4 text-center text-xs font-mono text-amber-600/70 bg-amber-50/10">
                                        Sin preguntas de Pre-test creadas. Los alumnos iniciarán directamente las lecturas. Agregue preguntas de pre-test para medir conocimiento inicial.
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <h4 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                      <HelpCircle className="h-4 w-4 text-slate-600" />
                                      {t.hasInitialQuiz ? '2. Evaluación Final (Examen: ' : 'Evaluación (Prueba: '}{finalQuestions.length} Preguntas)
                                    </h4>
                                    <button
                                      onClick={() => handleOpenCreateQuestion(t.id, 'final')}
                                      className="text-[11px] font-mono font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus className="h-3 w-3" /> Agregar Pregunta
                                    </button>
                                  </div>

                                  {finalQuestions.length > 0 ? (
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                      {finalQuestions.map((q, idx) => (
                                        <div key={q.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-2">
                                          <div className="flex justify-between items-start gap-4">
                                            <span className="font-bold text-slate-800 flex items-center flex-wrap gap-1.5">
                                              <span>{idx + 1}. {q.questionText}</span>
                                              {q.format === 'true_false' ? (
                                                <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md uppercase shrink-0">V/F</span>
                                              ) : (
                                                <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md uppercase shrink-0">Múltiple</span>
                                              )}
                                              <span className="text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-md uppercase shrink-0">
                                                {q.points ?? 10} pts
                                              </span>
                                            </span>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                              <button
                                                onClick={() => handleOpenEditQuestion(q)}
                                                className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer transition-colors"
                                                title="Editar Pregunta"
                                              >
                                                <Edit3 className="h-3.5 w-3.5" />
                                              </button>
                                              <button
                                                onClick={() => handleDeleteQuestion(q.id)}
                                                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer transition-colors"
                                                title="Eliminar Pregunta"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                          <div className="pl-4 border-l-2 border-slate-400 space-y-0.5 text-[11px] text-slate-500 font-mono">
                                            {q.options.map((opt, oIdx) => (
                                              <div key={oIdx} className={oIdx === q.correctOptionIndex ? 'text-emerald-700 font-bold' : ''}>
                                                {oIdx === q.correctOptionIndex ? '✓' : '•'} {opt}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center text-xs font-mono text-slate-500 bg-slate-50/30">
                                      No hay preguntas creadas. Agregue preguntas de alternativas para activar la prueba de este tema.
                                    </div>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* PARAMETERS SUMMARY */}
                      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200/60 flex flex-wrap gap-4 text-[11px] text-slate-500 font-mono font-semibold">
                        <span className="flex items-center gap-1">
                          <Award className="h-3.5 w-3.5 text-slate-400" />
                          Mínimo para Aprobar: <strong className="text-slate-800 font-bold">{t.minScoreToPass}/10 pts</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                          Intentos Máximos: <strong className="text-slate-800 font-bold">{t.maxAttempts}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          Límite de Tiempo: <strong className="text-slate-800 font-bold">{t.timeLimitMinutes > 0 ? `${t.timeLimitMinutes} min` : 'Ilimitado'}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5 text-slate-400" />
                          Orden de preguntas: <strong className="text-slate-800 font-bold">{t.randomizeQuestions ? 'Aleatorio' : 'Fijo'}</strong>
                        </span>
                        {t.dueDate && (
                          <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2.5 py-0.5 border border-rose-200 rounded-lg">
                            <Calendar className="h-3.5 w-3.5 text-rose-500" />
                            Vence el: <strong className="font-bold">{t.dueDate}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* TAB 3: USER PROGRESS TRACKING */}
          {activeTab === 'tracking' && (
            <motion.div
              key="tracking-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Header and Tracking Mode Toggle */}
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-serif italic font-bold text-slate-800">Seguimiento de Avance</h2>
                  <p className="text-xs text-slate-500">Supervise el estado de aprendizaje, avance de lecturas y evaluaciones de sus colaboradores.</p>
                </div>
                
                {/* Visual selector for tracking mode */}
                <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto">
                  <button
                    onClick={() => {
                      setTrackingMode('user');
                      setSearchTerm('');
                    }}
                    className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition-all duration-200 cursor-pointer rounded-lg ${
                      trackingMode === 'user'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Por Colaborador
                  </button>
                  <button
                    onClick={() => {
                      setTrackingMode('topic');
                      setSearchTerm('');
                      if (!trackingSelectedTopicId && topics.length > 0) {
                        setTrackingSelectedTopicId(topics[0].id);
                      }
                    }}
                    className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition-all duration-200 cursor-pointer rounded-lg flex items-center gap-1.5 ${
                      trackingMode === 'topic'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Por Tema <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded-md font-sans">NUEVO</span>
                  </button>
                </div>
              </div>

              {/* MODE 1: BY USER / COLLABORATOR (ORIGINAL DETAIL DRILL-DOWN) */}
              {trackingMode === 'user' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                      Vista: Listado de Colaboradores
                    </span>
                    <div className="relative max-w-xs w-full">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Search className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar colaborador..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Employee List Roster */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-100 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200/60 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                              <th className="py-3 px-4">Colaborador</th>
                              <th className="py-3 px-4">Capacitaciones</th>
                              <th className="py-3 px-4">Última Actividad</th>
                              <th className="py-3 px-4 text-right">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                            {users
                              .filter(u => u.role === 'user' && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
                              .map(u => {
                                const userProgressList = progress.filter(p => p.userId === u.id);
                                const passedCount = userProgressList.filter(p => p.quizStatus === 'passed').length;
                                
                                return (
                                  <tr 
                                    key={u.id} 
                                    className={`hover:bg-slate-50/60 transition-colors cursor-pointer ${selectedUserId === u.id ? 'bg-indigo-50/40 text-indigo-950 font-medium' : ''}`}
                                    onClick={() => setSelectedUserId(u.id)}
                                  >
                                    <td className="py-3.5 px-4">
                                      <div>
                                        <div className="font-semibold text-slate-800">{u.name}</div>
                                        <div className="text-[11px] text-slate-400 font-mono">Cédula: {u.email}</div>
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-4">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-slate-800 font-mono">{passedCount} / {topics.length}</span>
                                        <span className="text-[10px] text-slate-400 font-mono">aprobados</span>
                                      </div>
                                      <div className="w-24 bg-slate-100 h-2 rounded-full mt-1 overflow-hidden border border-slate-200">
                                        <div 
                                          className="bg-emerald-500 h-full rounded-full" 
                                          style={{ width: `${topics.length > 0 ? (passedCount / topics.length) * 100 : 0}%` }}
                                        />
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                                      {userProgressList.length > 0 
                                        ? new Date([...userProgressList].sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime())[0].lastActiveAt).toLocaleDateString()
                                        : 'Sin actividad'}
                                    </td>
                                    <td className="py-3.5 px-4 text-right">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedUserId(u.id); }}
                                        className="text-[11px] font-mono font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-0.5 uppercase tracking-wide"
                                      >
                                        Ver Detalle <ChevronRight className="h-3 w-3" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Right Panel: Selected Employee Details */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-100 p-6 space-y-6">
                      {selectedUserId ? (() => {
                        const selectedUser = users.find(u => u.id === selectedUserId);
                        if (!selectedUser) return null;
                        const userProgress = progress.filter(p => p.userId === selectedUserId);
                        const userAttempts = attempts.filter(a => a.userId === selectedUserId);

                        return (
                          <>
                            <div className="border-b border-slate-100 pb-4 flex justify-between items-start">
                              <div>
                                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest block">PERFIL DE AVANCE</span>
                                <h4 className="text-base font-serif italic font-bold text-slate-800 mt-1">{selectedUser.name}</h4>
                                <p className="text-xs text-slate-500 font-mono truncate mt-0.5">Cédula: {selectedUser.email}</p>
                              </div>
                              <button 
                                onClick={() => setSelectedUserId(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Status Course by Course */}
                            <div className="space-y-4">
                              <h5 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-widest">Temas Asignados</h5>
                              
                              {topics.map(t => {
                                const prog = userProgress.find(p => p.topicId === t.id);
                                const totalMats = materials.filter(m => m.topicId === t.id).length;
                                const completedMats = prog ? prog.completedMaterialIds.length : 0;
                                const attemptsCount = prog ? prog.attemptsCount : 0;
                                const highestScore = prog ? prog.highestScore : null;

                                return (
                                  <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                                    <div className="flex justify-between items-start gap-2">
                                      <span className="font-bold text-slate-800 truncate font-serif italic">{t.title}</span>
                                      {prog?.quizStatus === 'passed' ? (
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg shrink-0 flex items-center gap-1 border border-emerald-200 uppercase">
                                          Aprobado
                                        </span>
                                      ) : prog?.quizStatus === 'failed' ? (
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-rose-50 text-rose-700 rounded-lg shrink-0 flex items-center gap-1 border border-rose-200 uppercase">
                                          Reprobado
                                        </span>
                                      ) : completedMats > 0 ? (
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg shrink-0 flex items-center gap-1 border border-indigo-200 uppercase">
                                          En curso
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-50 text-slate-500 rounded-lg shrink-0 flex items-center gap-1 border border-slate-200 uppercase">
                                          Pendiente
                                        </span>
                                      )}
                                    </div>

                                    {/* Reading Material Checkboxes */}
                                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 font-mono">
                                      <span>Lecturas completadas:</span>
                                      <span className="font-semibold text-slate-700">{completedMats} / {totalMats}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                                      <div 
                                        className="bg-slate-700 h-full rounded-full" 
                                        style={{ width: `${totalMats > 0 ? (completedMats / totalMats) * 100 : 0}%` }}
                                      />
                                    </div>

                                    {/* Quiz Score info */}
                                    {attemptsCount > 0 && (
                                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-150 mt-1.5 font-mono text-[11px]">
                                        <span className="text-slate-500">Intentos: <strong className="text-slate-800 font-bold">{attemptsCount}</strong></span>
                                        <span className="text-slate-500">Calificación Máxima: <strong className="text-emerald-600 font-bold">{highestScore !== null ? (highestScore > 10 ? (highestScore / 10).toFixed(1) : highestScore) : '-'}/10</strong></span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Recent Attempts Timeline */}
                            <div className="space-y-3.5 border-t border-slate-100 pt-5">
                              <h5 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-widest">Historial de Intentos</h5>
                              {userAttempts.length > 0 ? (
                                <div className="space-y-2.5">
                                  {[...userAttempts]
                                    .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime())
                                    .map(att => (
                                      <div key={att.id} className="flex gap-2.5 text-[11px] text-slate-500">
                                        <div className="flex flex-col items-center mt-1 shrink-0">
                                          <div className={`h-3.5 w-3.5 rounded-full border border-slate-200 ${att.passed ? 'bg-emerald-550' : 'bg-rose-500'}`} />
                                          <div className="w-0.5 bg-slate-200 flex-1 mt-1" />
                                        </div>
                                        <div className="flex-1 space-y-0.5 pb-2 border-b border-slate-100">
                                          <div className="flex justify-between font-mono font-semibold text-slate-800">
                                            <span>Intento #{att.attemptNumber}</span>
                                            <span className={att.passed ? 'text-emerald-600' : 'text-rose-600'}>{(att.score > 10 ? (att.score / 10).toFixed(1) : att.score)}/10</span>
                                          </div>
                                          <p className="text-slate-500 font-sans italic truncate max-w-[200px]">{att.topicTitle}</p>
                                          <p className="text-[10px] text-slate-400 font-mono">{new Date(att.takenAt).toLocaleString()}</p>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-slate-400 text-xs font-mono">
                                  Aún no ha realizado intentos de evaluación.
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })() : (
                        <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2 font-mono">
                          <Users className="h-8 w-8 text-slate-300" />
                          Seleccione un colaborador de la lista de la izquierda para analizar detalladamente su avance formativo.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 2: BY TOPIC / THEME (DETAILED LIST OF COLLABORATOR STATUSES BY TOPIC) */}
              {trackingMode === 'topic' && (() => {
                const selectedTopic = topics.find(t => t.id === trackingSelectedTopicId) || topics[0];
                if (!selectedTopic) {
                  return (
                    <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl font-mono text-xs text-slate-400 shadow-sm">
                      No hay temas registrados en el sistema para realizar seguimiento.
                    </div>
                  );
                }

                // Compute states for all collaborators for this selected topic
                const colabData = users
                  .filter(u => u.role === 'user')
                  .map(u => {
                    const progRecord = progress.find(p => p.userId === u.id && p.topicId === selectedTopic.id);
                    const totalMats = materials.filter(m => m.topicId === selectedTopic.id).length;
                    const completedMats = progRecord ? progRecord.completedMaterialIds.length : 0;
                    const highestScore = progRecord ? progRecord.highestScore : null;
                    const attemptsCount = progRecord ? progRecord.attemptsCount : 0;
                    
                    let status: 'passed' | 'failed' | 'in_progress' | 'pending' = 'pending';
                    if (progRecord?.quizStatus === 'passed') {
                      status = 'passed';
                    } else if (progRecord?.quizStatus === 'failed') {
                      status = 'failed';
                    } else if (completedMats > 0) {
                      status = 'in_progress';
                    }

                    const readingPercentage = totalMats > 0 ? (completedMats / totalMats) * 100 : 0;

                    return {
                      user: u,
                      progRecord,
                      totalMats,
                      completedMats,
                      readingPercentage,
                      highestScore,
                      attemptsCount,
                      status,
                      lastActive: progRecord ? new Date(progRecord.lastActiveAt) : null
                    };
                  });

                // Compute summary metrics for selected topic
                const totalColabs = colabData.length;
                const countPassed = colabData.filter(c => c.status === 'passed').length;
                const countInProgress = colabData.filter(c => c.status === 'in_progress').length;
                const countPending = colabData.filter(c => c.status === 'pending').length;
                const countFailed = colabData.filter(c => c.status === 'failed').length;
                const approvedPercent = totalColabs > 0 ? Math.round((countPassed / totalColabs) * 100) : 0;

                // Filter & Sort
                const displayedColabs = colabData
                  .filter(c => {
                    const matchesSearch = c.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                          c.user.email.toLowerCase().includes(searchTerm.toLowerCase());
                    
                    if (collaboratorFilter === 'all') return matchesSearch;
                    return matchesSearch && c.status === collaboratorFilter;
                  })
                  .sort((a, b) => {
                    if (collaboratorSort === 'name') {
                      return a.user.name.localeCompare(b.user.name);
                    }
                    if (collaboratorSort === 'progress') {
                      return b.readingPercentage - a.readingPercentage;
                    }
                    if (collaboratorSort === 'score') {
                      const scoreA = a.highestScore ?? -1;
                      const scoreB = b.highestScore ?? -1;
                      return scoreB - scoreA;
                    }
                    return 0;
                  });

                return (
                  <div className="space-y-6">
                    {/* Topic Selector and Summary Cards */}
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-stretch">
                      
                      {/* Topic Selector Box */}
                      <div className="xl:col-span-1 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between">
                        <div className="space-y-2">
                          <label className="block font-mono font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                            Seleccionar Tema Educativo
                          </label>
                          <select
                            value={trackingSelectedTopicId}
                            onChange={(e) => setTrackingSelectedTopicId(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-xl shadow-sm"
                          >
                            {topics.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs">
                          <p className="font-mono text-slate-400 text-[10px] uppercase">Categoría</p>
                          <p className="font-bold text-slate-800 font-serif italic">{selectedTopic.category || 'General'}</p>
                          <p className="font-mono text-slate-400 text-[10px] uppercase mt-2">Calificación de Aprobación</p>
                          <p className="font-bold text-slate-800 font-mono">{selectedTopic.minScoreToPass}/10 pts requerido</p>
                        </div>
                      </div>

                      {/* Summary Badges Panel */}
                      <div className="xl:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white border border-slate-200 p-4 flex flex-col justify-between rounded-2xl shadow-sm shadow-slate-50">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Total Matriculados</span>
                          <span className="text-2xl font-mono font-bold text-slate-800 mt-2">{totalColabs}</span>
                          <span className="text-[10px] font-mono text-slate-400 mt-1">Colaboradores</span>
                        </div>

                        <div className="bg-emerald-50/50 border border-emerald-100 p-4 flex flex-col justify-between rounded-2xl">
                          <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-widest block">Aprobados (Listo)</span>
                          <span className="text-2xl font-mono font-bold text-emerald-700 mt-2">{countPassed}</span>
                          <span className="text-[10px] font-mono text-emerald-600 mt-1 font-bold">{approvedPercent}% de éxito</span>
                        </div>

                        <div className="bg-indigo-50/50 border border-indigo-100 p-4 flex flex-col justify-between rounded-2xl">
                          <span className="text-[10px] font-mono font-bold text-indigo-800 uppercase tracking-widest block">En Progreso</span>
                          <span className="text-2xl font-mono font-bold text-indigo-700 mt-2">{countInProgress}</span>
                          <span className="text-[10px] font-mono text-indigo-500 mt-1">Leyendo material</span>
                        </div>

                        <div className="bg-rose-50/50 border border-rose-100 p-4 flex flex-col justify-between rounded-2xl">
                          <span className="text-[10px] font-mono font-bold text-rose-800 uppercase tracking-widest block">Pendientes</span>
                          <span className="text-2xl font-mono font-bold text-rose-600 mt-2">{countPending + countFailed}</span>
                          <span className="text-[10px] font-mono text-rose-500 mt-1 font-bold">
                            {countPending} sin iniciar • {countFailed} reprobados
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Controls Bar: Filters and Sorting */}
                    <div className="bg-slate-50 border border-slate-200/85 p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center rounded-2xl">
                      
                      {/* Interactive Filter Group */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
                          <Filter className="h-3.5 w-3.5 text-slate-500" /> Filtrar por Estado:
                        </span>
                        
                        <button
                          onClick={() => setCollaboratorFilter('all')}
                          className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase transition-all border border-slate-200 rounded-xl cursor-pointer ${
                            collaboratorFilter === 'all'
                              ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                              : 'bg-white hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          Todos ({totalColabs})
                        </button>

                        <button
                          onClick={() => setCollaboratorFilter('pending')}
                          className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase transition-all border border-slate-200 rounded-xl cursor-pointer flex items-center gap-1.5 ${
                            collaboratorFilter === 'pending'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                              : 'bg-white hover:bg-rose-50 text-rose-700'
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
                          Pendientes ({countPending})
                        </button>

                        <button
                          onClick={() => setCollaboratorFilter('in_progress')}
                          className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase transition-all border border-slate-200 rounded-xl cursor-pointer flex items-center gap-1.5 ${
                            collaboratorFilter === 'in_progress'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white hover:bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-indigo-500 inline-block" />
                          En curso ({countInProgress})
                        </button>

                        <button
                          onClick={() => setCollaboratorFilter('passed')}
                          className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase transition-all border border-slate-200 rounded-xl cursor-pointer flex items-center gap-1.5 ${
                            collaboratorFilter === 'passed'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-white hover:bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                          Aprobados ({countPassed})
                        </button>
                      </div>

                      {/* Sorting and Search Box */}
                      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
                        {/* Sort Selector */}
                        <div className="flex items-center gap-1.5 shrink-0 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                          <ArrowUpDown className="h-3 w-3 text-slate-400 pl-0.5" />
                          <select
                            value={collaboratorSort}
                            onChange={(e) => setCollaboratorSort(e.target.value as any)}
                            className="bg-transparent text-[11px] font-mono font-bold uppercase tracking-wider focus:outline-none p-1 text-slate-700"
                          >
                            <option value="name">Ordenar: Nombre</option>
                            <option value="progress">Ordenar: Avance de Lectura</option>
                            <option value="score">Ordenar: Calificación</option>
                          </select>
                        </div>

                        {/* Local Search Input */}
                        <div className="relative max-w-xs w-full">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Search className="h-3.5 w-3.5" />
                          </div>
                          <input
                            type="text"
                            placeholder="Buscar persona..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-8 pr-2 py-1.5 border border-slate-200 rounded-xl text-slate-900 bg-white placeholder-slate-400 focus:outline-none text-[11px] font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Collaborator Grid / Table */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-100 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200/60 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                              <th className="py-3.5 px-4">Colaborador</th>
                              <th className="py-3.5 px-4">Estado en Tema</th>
                              <th className="py-3.5 px-4">Progreso de Materiales</th>
                              <th className="py-3.5 px-4">Resultado Evaluación</th>
                              <th className="py-3.5 px-4">Último Acceso</th>
                              <th className="py-3.5 px-4 text-right">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                            {displayedColabs.length > 0 ? (
                              displayedColabs.map(colab => {
                                return (
                                  <tr key={colab.user.id} className="hover:bg-slate-50/40 transition-colors">
                                    <td className="py-3.5 px-4">
                                      <div>
                                        <div className="font-semibold text-slate-800">{colab.user.name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">Cédula: {colab.user.email}</div>
                                      </div>
                                    </td>
                                    
                                    <td className="py-3.5 px-4">
                                      {colab.status === 'passed' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 border border-emerald-200 bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold uppercase rounded-lg">
                                          <CheckCircle className="h-3 w-3 text-emerald-600" /> Aprobado
                                        </span>
                                      ) : colab.status === 'failed' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 border border-rose-200 bg-rose-50 text-rose-700 font-mono text-[10px] font-bold uppercase rounded-lg">
                                          <AlertCircle className="h-3 w-3 text-rose-500" /> Reprobado
                                        </span>
                                      ) : colab.status === 'in_progress' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 border border-indigo-200 bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold uppercase rounded-lg">
                                          <Clock className="h-3 w-3 text-indigo-500" /> En curso
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 bg-slate-50 text-slate-500 font-mono text-[10px] font-bold uppercase rounded-lg">
                                          <AlertCircle className="h-3 w-3 text-slate-400" /> Pendiente
                                        </span>
                                      )}
                                    </td>

                                    <td className="py-3.5 px-4">
                                      <div className="space-y-1 max-w-[150px]">
                                        <div className="flex justify-between items-center text-[10px] font-mono">
                                          <span className="font-semibold text-slate-700">{colab.completedMats} / {colab.totalMats}</span>
                                          <span className="text-slate-400">{Math.round(colab.readingPercentage)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-100">
                                          <div
                                            className="bg-slate-700 h-full rounded-full"
                                            style={{ width: `${colab.readingPercentage}%` }}
                                          />
                                        </div>
                                      </div>
                                    </td>

                                    <td className="py-3.5 px-4 font-mono">
                                      {colab.highestScore !== null ? (
                                        <div className="space-y-0.5">
                                          <div className={`font-bold text-xs ${colab.highestScore >= selectedTopic.minScoreToPass ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {colab.highestScore > 10 ? (colab.highestScore / 10).toFixed(1) : colab.highestScore} / 10
                                          </div>
                                          <div className="text-[9px] text-slate-400 font-mono uppercase">
                                            {colab.attemptsCount} {colab.attemptsCount === 1 ? 'intento' : 'intentos'}
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-slate-400 italic text-[11px]">Sin evaluación</span>
                                      )}
                                    </td>

                                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                                      {colab.lastActive 
                                        ? colab.lastActive.toLocaleDateString() + ' ' + colab.lastActive.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                        : 'Sin actividad'}
                                    </td>

                                    <td className="py-3.5 px-4 text-right">
                                      <button
                                        onClick={() => {
                                          setSelectedUserId(colab.user.id);
                                          setTrackingMode('user');
                                        }}
                                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-mono text-[10px] font-bold uppercase rounded-xl transition-all duration-200 cursor-pointer inline-flex items-center gap-1 shadow-sm"
                                      >
                                        Detalle completo <ChevronRight className="h-3 w-3" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={6} className="py-12 text-center text-slate-400 font-mono text-xs">
                                  No se encontraron colaboradores que cumplan con los filtros seleccionados para este tema.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* TAB: TRAINING DELIVERY & CLASSES CONTROL */}
          {activeTab === 'control' && (() => {
            // Computed counts and items
            const computedTopicsList = topics.map(t => {
              const assignedUsers = users.filter(u => {
                if (u.role !== 'user') return false;
                if (!t.targetAreas || t.targetAreas.length === 0 || t.targetAreas.includes('TODAS')) return true;
                const userArea = u.area || 'ADMINISTRACION';
                return t.targetAreas.includes(userArea);
              });

              const totalAssigned = assignedUsers.length;

              const passedUsers = assignedUsers.filter(u => {
                const pRecord = progress.find(p => p.userId === u.id && p.topicId === t.id);
                return pRecord?.quizStatus === 'passed';
              });
              const totalPassed = passedUsers.length;

              const inProgressUsers = assignedUsers.filter(u => {
                const pRecord = progress.find(p => p.userId === u.id && p.topicId === t.id);
                if (pRecord?.quizStatus === 'passed') return false;
                const completedMats = pRecord ? pRecord.completedMaterialIds.length : 0;
                return completedMats > 0 || (pRecord && pRecord.attemptsCount > 0);
              });
              const totalInProgress = inProgressUsers.length;

              const scoreRecords = progress.filter(p => p.topicId === t.id && p.highestScore !== null);
              const avgScore = scoreRecords.length > 0 
                ? scoreRecords.reduce((sum, p) => sum + (p.highestScore || 0), 0) / scoreRecords.length 
                : 0;

              return {
                topic: t,
                totalAssigned,
                totalPassed,
                totalInProgress,
                avgScore,
                materialsCount: materials.filter(m => m.topicId === t.id).length,
                questionsCount: questions.filter(q => q.topicId === t.id).length
              };
            });

            const filteredComputedTopics = computedTopicsList.filter(item => {
              const matchesSearch = item.topic.title.toLowerCase().includes(deliverySearchTerm.toLowerCase()) ||
                                    item.topic.category.toLowerCase().includes(deliverySearchTerm.toLowerCase());
              
              if (deliveryFilter === 'all') return matchesSearch;
              if (deliveryFilter === 'delivered') return matchesSearch && item.topic.isDelivered;
              if (deliveryFilter === 'pending') return matchesSearch && !item.topic.isDelivered;
              return matchesSearch;
            });

            const totalTopicsCount = topics.length;
            const totalDeliveredCount = topics.filter(t => t.isDelivered).length;
            const totalPendingCount = totalTopicsCount - totalDeliveredCount;
            const totalPeopleTrained = progress.filter(p => p.quizStatus === 'passed').length;

            return (
              <motion.div
                key="control-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-serif italic font-bold text-slate-800">Control de Capacitaciones</h2>
                    <p className="text-xs text-slate-500">Registre, cierre y administre el estado de las capacitaciones (Temas Cerrados vs Temas Pendientes).</p>
                  </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
                    <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Temas Registrados</p>
                    <h4 className="text-2xl font-bold font-mono text-slate-800 mt-2">{totalTopicsCount}</h4>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">Total de capacitaciones creadas</p>
                    <div className="absolute top-0 right-0 h-1 w-1/3 bg-indigo-400" />
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
                    <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Temas Cerrados</p>
                    <h4 className="text-2xl font-bold font-mono text-emerald-600 mt-2">
                      {totalDeliveredCount} <span className="text-slate-400 text-sm font-normal">/ {totalTopicsCount}</span>
                    </h4>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">
                      {totalTopicsCount > 0 ? Math.round((totalDeliveredCount / totalTopicsCount) * 100) : 0}% de avance en cierres
                    </p>
                    <div className="absolute top-0 right-0 h-1 w-1/3 bg-emerald-500" />
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
                    <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Temas Pendientes</p>
                    <h4 className="text-2xl font-bold font-mono text-amber-600 mt-2">{totalPendingCount}</h4>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">Capacitaciones pendientes de impartir/cerrar</p>
                    <div className="absolute top-0 right-0 h-1 w-1/3 bg-amber-500" />
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
                    <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Evaluaciones Aprobadas</p>
                    <h4 className="text-2xl font-bold font-mono text-slate-800 mt-2">{totalPeopleTrained}</h4>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">Personal con evaluación completada</p>
                    <div className="absolute top-0 right-0 h-1 w-1/3 bg-indigo-600" />
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Filter tabs */}
                  <div className="flex bg-slate-100 p-1 rounded-xl self-start">
                    <button
                      onClick={() => setDeliveryFilter('all')}
                      className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition-all duration-200 cursor-pointer rounded-lg ${
                        deliveryFilter === 'all'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setDeliveryFilter('delivered')}
                      className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition-all duration-200 cursor-pointer rounded-lg flex items-center gap-1.5 ${
                        deliveryFilter === 'delivered'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Cerrados
                    </button>
                    <button
                      onClick={() => setDeliveryFilter('pending')}
                      className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition-all duration-200 cursor-pointer rounded-lg flex items-center gap-1.5 ${
                        deliveryFilter === 'pending'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Pendientes
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative max-w-xs w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar tema o categoría..."
                      value={deliverySearchTerm}
                      onChange={(e) => setDeliverySearchTerm(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono transition-all"
                    />
                  </div>
                </div>

                {/* Topics Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3.5 px-6">Tema Educativo</th>
                          <th className="py-3.5 px-4">Estado del Tema</th>
                          <th className="py-3.5 px-4">Colaboradores Capacitados</th>
                          <th className="py-3.5 px-4">Promedio Evaluación</th>
                          <th className="py-3.5 px-4">Contenido</th>
                          <th className="py-3.5 px-6 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredComputedTopics.length > 0 ? (
                          filteredComputedTopics.map(item => {
                            const pctPassed = item.totalAssigned > 0 
                              ? Math.round((item.totalPassed / item.totalAssigned) * 100) 
                              : 0;

                            return (
                              <tr key={item.topic.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-6">
                                  <div className="space-y-1">
                                    <h4 className="font-serif italic font-bold text-slate-800 text-sm leading-tight">
                                      {item.topic.title}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase">
                                        {item.topic.category}
                                      </span>
                                      {item.topic.dueDate && (
                                        <span className="text-[9px] font-mono text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-md">
                                          Vence: {item.topic.dueDate}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                <td className="py-4 px-4">
                                  {item.topic.isDelivered ? (
                                    <div className="space-y-1">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-emerald-200 bg-emerald-50 text-emerald-700 font-mono text-[9px] font-bold uppercase rounded-md">
                                        <CheckCircle className="h-3 w-3 text-emerald-500" /> Cerrado
                                      </span>
                                      {item.topic.deliveredAt && (
                                        <p className="text-[9px] font-mono text-slate-400">
                                          Cerrado el {item.topic.deliveredAt} {item.topic.deliveredBy && `por ${item.topic.deliveredBy}`}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-amber-200 bg-amber-50 text-amber-700 font-mono text-[9px] font-bold uppercase rounded-md">
                                        <Clock className="h-3 w-3 text-amber-500" /> Pendiente
                                      </span>
                                      <p className="text-[9px] text-slate-400 font-sans">Abierto / Sin cerrar</p>
                                    </div>
                                  )}
                                </td>

                                <td className="py-4 px-4">
                                  <div className="space-y-1 max-w-[150px]">
                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                      <span className="font-semibold text-slate-700">
                                        {item.totalPassed} / {item.totalAssigned} <span className="text-[9px] text-slate-400 font-normal">Aprobados</span>
                                      </span>
                                      <span className="text-slate-500 font-bold">{pctPassed}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-100">
                                      <div
                                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${pctPassed}%` }}
                                      />
                                    </div>
                                    {item.totalInProgress > 0 && (
                                      <p className="text-[9px] text-indigo-500 font-mono">
                                        {item.totalInProgress} en capacitación activa
                                      </p>
                                    )}
                                  </div>
                                </td>

                                <td className="py-4 px-4 font-mono">
                                  {item.avgScore > 0 ? (
                                    <div className="space-y-0.5">
                                      <span className={`text-xs font-bold ${item.avgScore >= item.topic.minScoreToPass ? 'text-emerald-600' : 'text-slate-600'}`}>
                                        {(item.avgScore > 10 ? item.avgScore / 10 : item.avgScore).toFixed(1)} / 10
                                      </span>
                                      <p className="text-[9px] text-slate-400">Requerido: {item.topic.minScoreToPass}/10</p>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic text-[11px]">Sin evaluaciones</span>
                                  )}
                                </td>

                                <td className="py-4 px-4 text-slate-500 font-mono text-[10px]">
                                  <div className="space-y-0.5">
                                    <div>📁 {item.materialsCount} lecturas</div>
                                    <div>❓ {item.questionsCount} reactivos</div>
                                  </div>
                                </td>

                                <td className="py-4 px-6 text-right">
                                  <button
                                    onClick={() => handleOpenRegisterDelivery(item.topic)}
                                    className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 font-mono text-[10px] font-bold uppercase rounded-xl transition-all duration-200 cursor-pointer inline-flex items-center gap-1 shadow-sm"
                                  >
                                    <Calendar className="h-3 w-3" />
                                    {item.topic.isDelivered ? 'Editar Cierre' : 'Cerrar Tema'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400 font-mono text-xs">
                              No se encontraron temas educativos con los filtros aplicados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Delivered notes section for quick overview */}
                {topics.some(t => t.isDelivered && t.deliveredNotes) && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
                    <h3 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-indigo-500" /> Bitácora Reciente de Cierres de Temas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {topics
                        .filter(t => t.isDelivered && t.deliveredNotes)
                        .slice(0, 4)
                        .map(t => (
                          <div key={t.id} className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm space-y-1">
                            <p className="font-serif italic font-bold text-slate-800 text-xs">{t.title}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Cerrado el {t.deliveredAt} {t.deliveredBy && `por ${t.deliveredBy}`}
                            </p>
                            <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 font-sans italic">
                              "{t.deliveredNotes}"
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })()}

          {/* TAB 4: USER & CREDENTIALS MANAGEMENT */}
          {activeTab === 'users' && (
            <motion.div
              key="users-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-serif italic font-bold text-slate-800">Gestión de Cuentas</h2>
                  <p className="text-xs text-slate-500">Registre nuevos administradores o colaboradores de forma manual e instale claves de ingreso al portal.</p>
                </div>
                <button
                  id="btn-create-user"
                  onClick={handleOpenCreateUser}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all active:scale-95 duration-200"
                >
                  <UserPlus className="h-4 w-4" />
                  Nueva Cuenta
                </button>
              </div>

              {/* USER ACCOUNTS LIST */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/60 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-4">Nombre Completo</th>
                        <th className="py-3.5 px-4">Número de Cédula</th>
                        <th className="py-3.5 px-4">Área</th>
                        <th className="py-3.5 px-4">Rol en Sistema</th>
                        <th className="py-3.5 px-4 font-mono">Clave Activa</th>
                        <th className="py-3.5 px-4">Fecha de Alta</th>
                        <th className="py-3.5 px-4">Estado</th>
                        <th className="py-3.5 px-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-800">{u.name}</td>
                          <td className="py-3.5 px-4 font-mono">{u.email}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-[10px] text-amber-850 uppercase">
                            {u.area || 'ADMINISTRACION'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wide border ${
                              u.role === 'admin' 
                                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {u.role === 'admin' ? 'Administrador' : 'Colaborador'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] bg-slate-50/50 border-l border-r border-slate-100/80">{u.passwordHash}</td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1.5 font-mono font-bold text-[10px] uppercase ${u.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                              <span className={`h-2 w-2 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              {u.isActive ? 'Activo' : 'Desactivado'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-end gap-3 font-mono font-semibold">
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="text-[11px] text-indigo-600 hover:text-indigo-800 uppercase cursor-pointer"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => toggleUserActive(u.id)}
                                disabled={u.id === currentUser.id}
                                className={`text-[11px] uppercase cursor-pointer ${
                                  u.id === currentUser.id 
                                    ? 'text-slate-300 cursor-not-allowed' 
                                    : u.isActive ? 'text-slate-400 hover:text-slate-600' : 'text-emerald-600 hover:text-emerald-700'
                                }`}
                              >
                                {u.id === currentUser.id ? 'Tú' : u.isActive ? 'Desactivar' : 'Activar'}
                              </button>
                              {u.id !== currentUser.id && (
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="text-[11px] text-rose-600 hover:text-rose-800 uppercase cursor-pointer"
                                  title="Eliminar cuenta permanentemente"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: MESSAGES & REMINDERS */}
          {activeTab === 'messages' && (
            <motion.div
              key="messages-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-serif italic font-bold text-slate-800">Buzón de Mensajes y Recordatorios</h2>
                <p className="text-xs text-slate-500">Deje mensajes de recordatorios manuales, felicitaciones por buen avance, o genere recordatorios masivos del vencimiento de un tema.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT COLUMN: CREATION FORMS */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* FORM 1: COMPOSE MANUAL MESSAGE */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Mail className="h-4.5 w-4.5 text-indigo-600" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">Nuevo Mensaje Personalizado</h3>
                    </div>

                    <form onSubmit={handleSendManualMessage} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Destinatario</label>
                        <select
                          value={msgRecipientId}
                          onChange={(e) => setMsgRecipientId(e.target.value)}
                          className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer transition-all duration-200"
                        >
                          <option value="ALL">📢 Todos los Alumnos</option>
                          {users.filter(u => u.role === 'user' && u.isActive).map(u => (
                            <option key={u.id} value={u.id}>
                              👤 {u.name} ({u.area})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Título del Mensaje</label>
                        <input
                          type="text"
                          required
                          value={msgTitle}
                          onChange={(e) => setMsgTitle(e.target.value)}
                          placeholder="ej. Recordatorio Importante: Avance en Cursos"
                          className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Tema Relacionado (Opcional)</label>
                        <select
                          value={msgTopicId}
                          onChange={(e) => setMsgTopicId(e.target.value)}
                          className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer transition-all duration-200"
                        >
                          <option value="">Ninguno</option>
                          {topics.map(t => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Contenido del Mensaje</label>
                        <textarea
                          required
                          rows={4}
                          value={msgContent}
                          onChange={(e) => setMsgContent(e.target.value)}
                          placeholder="Escriba aquí el mensaje o recordatorio para el alumno..."
                          className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all duration-200"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Enviar Mensaje
                      </button>
                    </form>
                  </div>

                  {/* FORM 2: AUTOMATIC MASSIVE REMINDERS */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                      <Bell className="h-4.5 w-4.5 text-amber-600" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">Recordatorios Automáticos Masivos</h3>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                      Busca automáticamente a los alumnos que <strong>no hayan aprobado</strong> un tema específico y les envía un recordatorio formal con la fecha límite establecida.
                    </p>

                    <div className="space-y-3.5 text-xs">
                      <div>
                        <label className="block font-mono font-bold text-slate-600 uppercase tracking-wider text-[10px] mb-1">Seleccionar Tema Educativo</label>
                        <select
                          value={autoRemindTopicId}
                          onChange={(e) => setAutoRemindTopicId(e.target.value)}
                          className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer transition-all duration-200"
                        >
                          <option value="">-- Seleccione un Tema --</option>
                          {topics.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.title} {t.dueDate ? `(Vence: ${new Date(t.dueDate).toLocaleDateString()})` : '(Sin fecha límite)'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleSendAutomaticDueDateReminders}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer shadow-md shadow-amber-100 hover:shadow-amber-200 transition-all duration-200"
                      >
                        <Bell className="h-3.5 w-3.5" />
                        Enviar Recordatorio de Vencimiento
                      </button>
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: LIST OF SENT MESSAGES */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm h-full flex flex-col">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4.5 w-4.5 text-slate-500" />
                        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">Mensajes Enviados Históricos ({messages.length})</h3>
                      </div>
                    </div>

                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 flex-1">
                        <div className="p-4 bg-slate-50 rounded-2xl text-slate-400">
                          <Mail className="h-8 w-8" />
                        </div>
                        <div>
                          <p className="text-xs font-mono font-bold text-slate-600">Historial de Buzón Vacío</p>
                          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">No hay mensajes guardados o enviados actualmente en el sistema.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                        {messages.map(msg => {
                          const recipient = msg.recipientId === 'ALL' ? 'Todos los Alumnos' : users.find(u => u.id === msg.recipientId)?.name || 'Usuario desconocido';
                          const relatedTopic = topics.find(t => t.id === msg.topicId)?.title;
                          
                          return (
                            <div key={msg.id} className="p-4 rounded-xl border border-slate-150 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all duration-200 relative group">
                              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                                  msg.type === 'automatic_due_date'
                                    ? 'bg-amber-100 text-amber-800'
                                    : msg.type === 'automatic_progress'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}>
                                  {msg.type === 'automatic_due_date' ? 'Vencimiento' : msg.type === 'automatic_progress' ? 'Progreso' : 'Manual'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(msg.createdAt).toLocaleString()}
                                </span>
                              </div>

                              <h4 className="text-xs font-bold text-slate-800 font-mono mb-1">{msg.title}</h4>
                              <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap font-sans mb-2.5">
                                {msg.content}
                              </p>

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-500">
                                <div>
                                  Para: <strong className="text-slate-700">{recipient}</strong>
                                </div>
                                {relatedTopic && (
                                  <div>
                                    Tema: <span className="italic text-slate-600 font-semibold">{relatedTopic}</span>
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
                                title="Eliminar mensaje"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 6: SUPABASE INTEGRATION CENTER */}
          {activeTab === 'supabase' && (
            <motion.div
              key="supabase-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-serif italic font-bold text-slate-800">Centro de Integración Supabase</h2>
                <p className="text-xs text-slate-500">Prepare, configure y conecte esta aula virtual con su base de datos relacional de Supabase y almacenamiento de archivos didácticos.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT SIDE: CONNECTION STATUS & VARIABLES */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Database className="h-4.5 w-4.5 text-indigo-600" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">Estado de Conexión</h3>
                    </div>

                    {isSupabaseConfigured() ? (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-mono font-bold text-emerald-800 text-xs uppercase tracking-wider">Supabase Conectado</span>
                        </div>
                        <p className="text-[11px] text-emerald-700 font-sans leading-relaxed">
                          La aplicación se está comunicando exitosamente con su instancia de base de datos relacional de PostgreSQL.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                          <span className="font-mono font-bold text-amber-800 text-xs uppercase tracking-wider">Simulación Local (Modo Fallback)</span>
                        </div>
                        <p className="text-[11px] text-amber-700 font-sans leading-relaxed">
                          Supabase no está configurado. La aplicación está utilizando almacenamiento local (LocalStorage) con simulación persistente de datos.
                        </p>
                      </div>
                    )}

                    <div className="space-y-4 text-xs font-mono">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">VITE_SUPABASE_URL</span>
                        <div className="p-2 bg-slate-50 border border-slate-150 rounded-lg text-[11px] truncate text-slate-700 select-all font-mono">
                          {(import.meta as any).env.VITE_SUPABASE_URL || 'No Configurado (Local Fallback)'}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">VITE_SUPABASE_ANON_KEY</span>
                        <div className="p-2 bg-slate-50 border border-slate-150 rounded-lg text-[11px] truncate text-slate-700 select-all font-mono">
                          {(import.meta as any).env.VITE_SUPABASE_ANON_KEY ? '••••••••••••••••' + (import.meta as any).env.VITE_SUPABASE_ANON_KEY.slice(-6) : 'No Configurado (Local Fallback)'}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                        Para activar Supabase, defina estas variables en la sección de <strong>Ajustes / Ajustar Claves</strong> de su espacio de trabajo de AI Studio.
                      </p>
                    </div>
                  </div>

                  {/* STORAGE BUCKETS CARD */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                      <Upload className="h-4.5 w-4.5 text-slate-600" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">Buckets de Almacenamiento</h3>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                      Para dar soporte a la carga de diapositivas de capacitación, PDFs, videos y reportes de eficacia, debe crear los siguientes buckets en Supabase Storage:
                    </p>

                    <ul className="space-y-2 text-[11px] text-slate-600 font-mono">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <div>
                          <strong className="text-slate-800 font-bold">'materials'</strong> (Público)
                          <p className="text-[10px] text-slate-400 font-sans mt-0.5">Para presentaciones .pptx, PDFs de temas y videos didácticos.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <div>
                          <strong className="text-slate-800 font-bold">'submissions'</strong> (Público o Privado)
                          <p className="text-[10px] text-slate-400 font-sans mt-0.5">Para la carga de evidencias y reportes por parte de los colaboradores.</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* RIGHT SIDE: SQL SCHEMA VIEW AND EXPLANATION */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4.5 w-4.5 text-indigo-600" />
                        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">Script de Base de Datos (PostgreSQL / Supabase SQL)</h3>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const sqlCode = `-- ============================================================================
-- SCHEMAS Y TABLAS PARA LA INTEGRACIÓN CON SUPABASE
-- Plataforma: Aula Virtual Fundametz
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: PROFILES (Perfiles de usuario)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    area TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABLA: TOPICS (Temas o cursos)
CREATE TABLE IF NOT EXISTS public.topics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    min_score_to_pass NUMERIC NOT NULL DEFAULT 7,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    time_limit_minutes INTEGER NOT NULL DEFAULT 0,
    randomize_questions BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    due_date DATE,
    target_areas TEXT[] DEFAULT '{}',
    has_initial_quiz BOOLEAN NOT NULL DEFAULT false,
    is_delivered BOOLEAN NOT NULL DEFAULT false,
    delivered_at DATE,
    delivered_by TEXT,
    delivered_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABLA: MATERIALS (Materiales didácticos con campos de archivos)
CREATE TABLE IF NOT EXISTS public.materials (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('document', 'video', 'interactive', 'pdf', 'pptx')),
    content TEXT NOT NULL,
    url TEXT,
    file_path TEXT,      -- Almacenamiento en bucket materials
    file_url TEXT,       -- URL pública
    file_size INTEGER,   -- Tamaño en bytes
    file_name TEXT,      -- Nombre original
    estimated_minutes INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLA: QUESTIONS (Evaluaciones)
CREATE TABLE IF NOT EXISTS public.questions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_option_index INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'final',
    format TEXT NOT NULL DEFAULT 'multiple',
    points INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABLA: QUIZ_ATTEMPTS (Intentos de exámenes)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    topic_title TEXT NOT NULL,
    score NUMERIC(5,2) NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    passed BOOLEAN NOT NULL,
    duration_seconds INTEGER NOT NULL,
    attempt_number INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'final',
    taken_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABLA: USER_PROGRESS (Seguimiento de progreso)
CREATE TABLE IF NOT EXISTS public.user_progress (
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    completed_material_ids TEXT[] DEFAULT '{}',
    quiz_status TEXT NOT NULL DEFAULT 'not_started',
    highest_score NUMERIC(5,2),
    attempts_count INTEGER NOT NULL DEFAULT 0,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    initial_quiz_completed BOOLEAN NOT NULL DEFAULT false,
    initial_quiz_score NUMERIC(5,2),
    PRIMARY KEY (user_id, topic_id)
);

-- 7. TABLA: COURSE_REVIEWS (Retroalimentación de eficacia)
CREATE TABLE IF NOT EXISTS public.course_reviews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    satisfaction_rating INTEGER,  -- 0-3 satisfaction
    clarity_rating INTEGER       -- 0-3 clarity
);

-- 8. TABLA: MESSAGES (Mensajería)
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sender_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    topic_id TEXT REFERENCES public.topics(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. TABLA: USER_ASSIGNMENTS (Entregables y reportes)
CREATE TABLE IF NOT EXISTS public.user_assignments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    comments TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`;
                          navigator.clipboard.writeText(sqlCode);
                          setCopiedSchema(true);
                          setTimeout(() => setCopiedSchema(false), 2500);
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1 shadow-sm ${
                          copiedSchema
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {copiedSchema ? '¡Copiado al Portapapeles!' : 'Copiar Código SQL'}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                      Copie el siguiente código SQL y ejecútelo en el <strong>SQL Editor</strong> de su panel de Supabase para generar todas las tablas de manera automática. Incluye la extensión UUID, las llaves foráneas en cascada y las políticas RLS.
                    </p>

                    <div className="bg-slate-900 rounded-xl p-4 overflow-hidden relative border border-slate-850">
                      <div className="absolute top-2 right-3 font-mono text-[9px] text-slate-500 uppercase tracking-widest pointer-events-none">
                        PostgreSQL
                      </div>
                      <pre className="font-mono text-[10.5px] text-slate-300 leading-relaxed max-h-[350px] overflow-y-auto pr-2 select-text whitespace-pre text-left">
{`-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Crear Tabla de Perfiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    area TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Crear Tabla de Cursos / Temas
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    min_score_to_pass NUMERIC NOT NULL DEFAULT 7,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    time_limit_minutes INTEGER NOT NULL DEFAULT 0,
    randomize_questions BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'draft',
    due_date DATE,
    target_areas TEXT[] DEFAULT '{}',
    has_initial_quiz BOOLEAN NOT NULL DEFAULT false,
    is_delivered BOOLEAN NOT NULL DEFAULT false,
    delivered_at DATE,
    delivered_by TEXT,
    delivered_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Crear Tabla de Materiales Didácticos (Archivos y Diapositivas)
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('document', 'video', 'interactive', 'pdf', 'pptx')),
    content TEXT NOT NULL,
    url TEXT,
    file_path TEXT,      -- Ruta del archivo en el Storage bucket 'materials'
    file_url TEXT,       -- URL de descarga pública
    file_size INTEGER,   -- Tamaño en bytes
    file_name TEXT,      -- Nombre original del archivo .pptx o .pdf
    estimated_minutes INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Crear Tabla de Preguntas de Examen
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_option_index INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'final',
    format TEXT NOT NULL DEFAULT 'multiple',
    points INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Crear Tabla de Historial de Exámenes
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    topic_title TEXT NOT NULL,
    score NUMERIC(5,2) NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    passed BOOLEAN NOT NULL,
    duration_seconds INTEGER NOT NULL,
    attempt_number INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'final',
    taken_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Crear Tabla de Progreso de Colaboradores
CREATE TABLE IF NOT EXISTS public.user_progress (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    completed_material_ids UUID[] DEFAULT '{}',
    quiz_status TEXT NOT NULL DEFAULT 'not_started',
    highest_score NUMERIC(5,2),
    attempts_count INTEGER NOT NULL DEFAULT 0,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    initial_quiz_completed BOOLEAN NOT NULL DEFAULT false,
    initial_quiz_score NUMERIC(5,2),
    PRIMARY KEY (user_id, topic_id)
);

-- 8. Crear Tabla de Retroalimentación de Cursos
CREATE TABLE IF NOT EXISTS public.course_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    satisfaction_rating INTEGER,  -- 0-3 satisfaction
    clarity_rating INTEGER       -- 0-3 clarity
);

-- 9. Crear Tabla de Buzón de Mensajes
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Crear Tabla de Archivos / Entregables Subidos por Colaboradores
CREATE TABLE IF NOT EXISTS public.user_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,   -- Ruta del archivo en el Storage bucket 'submissions'
    file_url TEXT NOT NULL,    -- URL de descarga de la evidencia
    file_name TEXT NOT NULL,   -- Nombre original del archivo
    file_size INTEGER,         -- Tamaño en bytes
    comments TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`}
                      </pre>
                    </div>

                    {/* SECCIÓN DE MIGRACIÓN / ACTUALIZACIÓN DE TABLAS EXISTENTES */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <h4 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">¿Ya configuró Supabase antes?</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 font-sans">
                        Si ya tiene las tablas creadas en su base de datos de Supabase, no necesita borrarlas ni recrearlas. Simplemente copie y ejecute las siguientes líneas en el <strong>SQL Editor</strong> de Supabase para agregar las columnas de <strong>Control de Cierre de Temas</strong> y el campo <strong>points</strong> de evaluaciones:
                      </p>
                      <pre className="bg-slate-900 text-slate-300 font-mono text-[10px] p-3 rounded-lg overflow-x-auto select-all border border-slate-800 text-left">
{`-- 1. Agregar columnas para el Control de Cierre de Temas
ALTER TABLE public.topics 
ADD COLUMN IF NOT EXISTS is_delivered BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS delivered_at DATE,
ADD COLUMN IF NOT EXISTS delivered_by TEXT,
ADD COLUMN IF NOT EXISTS delivered_notes TEXT;

-- 2. Agregar columna de puntaje en la tabla de preguntas
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 10;`}
                      </pre>
                    </div>

                    <div className="pt-2 flex items-center gap-2 text-[11px] text-indigo-700 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                      <HelpCircle className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                      <p className="font-sans">
                        <strong>Nota:</strong> Al habilitar la clave de Supabase, la aplicación cargará de manera dinámica los datos directo de las tablas, y permitirá subir las presentaciones <strong>PowerPoint (.pptx)</strong> o reportes de evidencias directamente a su nube de almacenamiento.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 7: CERTIFICATE TEMPLATES MANAGEMENT */}
          {activeTab === 'certificates' && (
            <motion.div
              key="certificates-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-serif italic font-bold text-slate-800">Módulo de Certificados Académicos</h2>
                  <p className="text-xs text-slate-500 font-sans">
                    Cree y administre las plantillas de diplomas que se generarán de forma automática para los colaboradores que aprueben sus evaluaciones.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreateTemplate}
                  className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-none border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  Nueva Plantilla
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LIST OF TEMPLATES */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white rounded-none border-2 border-slate-900 p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-4 border-b pb-2 flex items-center gap-2">
                      <Award className="h-4 w-4 text-indigo-600" />
                      Plantillas Guardadas ({certificateTemplates.length})
                    </h3>

                    <div className="space-y-3">
                      {certificateTemplates.map(tpl => (
                        <div 
                          key={tpl.id}
                          className={`p-4 border-2 transition-all duration-150 ${
                            tpl.isActive 
                              ? 'border-indigo-600 bg-indigo-50/20 shadow-[2px_2px_0px_0px_rgba(79,70,229,1)]' 
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-bold text-slate-800 font-mono truncate max-w-[180px]">{tpl.title}</h4>
                                {tpl.isActive && (
                                  <span className="bg-indigo-600 text-white text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                                    Activo
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono mt-1">
                                {tpl.signatureName?.trim() || tpl.signatureRole?.trim()
                                  ? `Firma: ${tpl.signatureName || ''} ${tpl.signatureRole ? `(${tpl.signatureRole})` : ''}`
                                  : 'Firma: Desactivada/Oculta'}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              {!tpl.isActive && (
                                <button
                                  onClick={() => handleActivateTemplate(tpl.id)}
                                  className="px-2 py-1 bg-white border border-slate-300 hover:border-indigo-500 text-[9px] font-mono font-bold uppercase tracking-wider text-slate-600 hover:text-indigo-600 cursor-pointer transition-all rounded"
                                  title="Establecer como plantilla activa para diplomas"
                                >
                                  Activar
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEditTemplate(tpl)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 rounded cursor-pointer transition-all"
                                title="Editar plantilla"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(tpl.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded cursor-pointer transition-all"
                                title="Eliminar plantilla"
                                disabled={tpl.isActive && certificateTemplates.length > 1}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 border-2 border-slate-900 text-xs text-slate-600 leading-relaxed space-y-2.5 font-mono shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    <p className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                      <span className="h-2 w-2 rounded-full bg-indigo-600" />
                      ¿Cómo funciona el Generador?
                    </p>
                    <p className="text-[10px] leading-relaxed text-slate-600">
                      El sistema utiliza la plantilla que esté configurada como <strong className="text-slate-800">"ACTIVA"</strong>. Cada vez que un alumno aprueba el examen final del curso (es decir, cuando obtiene un puntaje superior o igual al mínimo requerido), la plataforma le habilitará un botón de descarga en su respectivo portal.
                    </p>
                    <p className="text-[10px] leading-relaxed text-slate-600">
                      El PDF descargable incluirá la información personalizada del colaborador, el nombre de la capacitación aprobada, la firma digital configurada en la plantilla activa, la fecha de aprobación y el puntaje obtenido de manera dinámica.
                    </p>
                  </div>
                </div>

                {/* INTERACTIVE PREVIEW */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white rounded-none border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-4 border-b pb-2">
                      Previsualización en Tiempo Real del Certificado (Diploma)
                    </h3>

                    {/* DIPLOMA SIMULATOR */}
                    {(() => {
                      const activeTpl = certificateTemplates.find(t => t.isActive) || certificateTemplates[0];
                      if (!activeTpl) return null;
                      return (
                        <div 
                          className="w-full aspect-[1.414/1] bg-white text-[#0B1F3F] text-center shadow-lg border border-slate-200 select-none relative overflow-hidden p-6 md:p-10 flex flex-col justify-between"
                          style={{ backgroundColor: activeTpl.backgroundColor || '#ffffff' }}
                        >
                          {/* TOP-LEFT CORNER: NAVY & GOLD WAVES WITH EMBLEM */}
                          <div className="absolute top-0 left-0 w-36 h-36 md:w-44 md:h-44 pointer-events-none z-10">
                            <svg viewBox="0 0 100 100" className="w-full h-full fill-none">
                              {/* Dark Blue main wave */}
                              <path d="M0,0 L90,0 Q60,25 40,60 Q20,80 0,90 Z" fill="#0B1F3F" />
                              {/* Gold highlight waves */}
                              <path d="M0,90 Q22,81 42,61 Q62,26 91,1" stroke="#C5A880" strokeWidth="2.5" />
                              <path d="M0,93 Q24,84 44,63 Q64,28 93,2" stroke="#E5C185" strokeWidth="1" />
                            </svg>
                            {/* Gold Medal Badge sitting elegantly */}
                            <div className="absolute top-6 left-6 md:top-8 md:left-8 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                              {/* Ribbon Left */}
                              <div className="absolute top-5 left-2 w-2.5 h-6 md:w-3 md:h-8 bg-[#C5A880] rounded-sm transform rotate-12 border-r border-amber-600/30 shadow-sm" />
                              {/* Ribbon Right */}
                              <div className="absolute top-5 right-2 w-2.5 h-6 md:w-3 md:h-8 bg-[#E5C185] rounded-sm transform -rotate-12 border-l border-amber-600/30 shadow-sm" />
                              {/* Circle Medal */}
                              <div className="absolute w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-yellow-200 via-amber-400 to-amber-600 p-0.5 shadow-md flex items-center justify-center border border-amber-200/50">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-dashed border-amber-100 flex items-center justify-center bg-gradient-to-br from-amber-400 to-yellow-300">
                                  <Award className="h-4 w-4 md:h-5 md:w-5 text-amber-950 opacity-90" />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* TOP-RIGHT CORNER: GOLD GEOMETRIC LINES */}
                          <div className="absolute top-4 right-4 md:top-5 md:right-5 w-12 h-12 md:w-16 md:h-16 pointer-events-none">
                            <div className="absolute top-0 right-0 w-full h-full border-t-2 border-r-2 border-[#C5A880] opacity-80" />
                            <div className="absolute top-1 right-1 w-[85%] h-[85%] border-t border-r border-[#C5A880] opacity-60" />
                            <div className="absolute top-2 right-2 w-[70%] h-[70%] border-t border-r border-[#C5A880]/60" />
                            <div className="absolute top-3 right-3 w-[55%] h-[55%] border-t border-r border-[#C5A880]/40" />
                          </div>

                          {/* BOTTOM-LEFT CORNER: GOLD GEOMETRIC LINES */}
                          <div className="absolute bottom-4 left-4 md:bottom-5 md:left-5 w-12 h-12 md:w-16 md:h-16 pointer-events-none">
                            <div className="absolute bottom-0 left-0 w-full h-full border-b-2 border-l-2 border-[#C5A880] opacity-80" />
                            <div className="absolute bottom-1 left-1 w-[85%] h-[85%] border-b border-l border-[#C5A880] opacity-60" />
                            <div className="absolute bottom-2 left-2 w-[70%] h-[70%] border-b border-l border-[#C5A880]/60" />
                            <div className="absolute bottom-3 left-3 w-[55%] h-[55%] border-b border-l border-[#C5A880]/40" />
                          </div>

                          {/* BOTTOM-RIGHT CORNER: NAVY & GOLD WAVES */}
                          <div className="absolute bottom-0 right-0 w-36 h-36 md:w-44 md:h-44 pointer-events-none z-10 transform rotate-180">
                            <svg viewBox="0 0 100 100" className="w-full h-full fill-none">
                              <path d="M0,0 L90,0 Q60,25 40,60 Q20,80 0,90 Z" fill="#0B1F3F" />
                              <path d="M0,90 Q22,81 42,61 Q62,26 91,1" stroke="#C5A880" strokeWidth="2.5" />
                              <path d="M0,93 Q24,84 44,63 Q64,28 93,2" stroke="#E5C185" strokeWidth="1" />
                            </svg>
                          </div>

                          {/* HEADER LOGO SECTION */}
                          <div className="z-20 mt-4 md:mt-6 flex items-center justify-center gap-3 text-left">
                            {/* Three Rounded Diamonds Logo Graphic matching target image */}
                            <svg className="h-10 w-10 md:h-12 md:w-12 fill-[#0B1F3F] shrink-0" viewBox="0 0 100 70">
                              {/* Top diamond */}
                              <rect x="38" y="12" width="24" height="24" rx="4.5" transform="rotate(45 50 24)" />
                              {/* Bottom Left diamond */}
                              <rect x="19.05" y="30.95" width="24" height="24" rx="4.5" transform="rotate(45 31.05 42.95)" />
                              {/* Bottom Right diamond */}
                              <rect x="56.95" y="30.95" width="24" height="24" rx="4.5" transform="rotate(45 68.95 42.95)" />
                            </svg>
                            <div className="flex flex-col justify-center">
                              <h1 className="text-xl md:text-2xl font-black tracking-[0.02em] text-[#0B1F3F] font-sans leading-none">
                                FUNDAMETZ
                              </h1>
                              <p className="text-[9px] md:text-[11px] text-[#0B1F3F] opacity-90 font-sans mt-1">
                                Industria de transformación responsable
                              </p>
                            </div>
                          </div>

                          {/* MIDDLE CONTENT: TITLES */}
                          <div className="z-20 space-y-1 md:space-y-2 my-auto px-2 md:px-12">
                            <span className="text-[9px] md:text-[11px] font-serif italic text-[#C5A880] font-bold tracking-[0.2em] block uppercase">
                              CERTIFICADO DE
                            </span>
                            <h2 className="text-xl md:text-3xl font-serif font-bold text-[#0B1F3F] tracking-wide uppercase">
                              {activeTpl.title}
                            </h2>

                            {/* RECIPIENT NAME */}
                            <div className="pt-2 md:pt-4 pb-1">
                              <h3 className="text-sm md:text-lg font-bold font-serif text-[#C5A880] tracking-wider border-b border-[#C5A880]/40 pb-1 max-w-lg mx-auto uppercase">
                                [Nombre del Colaborador]
                              </h3>
                            </div>

                            {/* BODY TEXT */}
                            <p className="text-[8px] md:text-[11px] text-[#0B1F3F] opacity-90 max-w-xl mx-auto leading-relaxed font-serif uppercase tracking-wider py-1.5">
                              {activeTpl.bodyText} <strong className="text-[#0B1F3F] font-bold font-sans">[Nombre del Curso o Tema de Capacitación]</strong>, con una duración aprobada según el plan formativo correspondiente.
                            </p>

                            {/* LOCATION & COMPLETION DATE */}
                            <p className="text-[7.5px] md:text-[10px] font-serif italic text-[#0B1F3F]/80 pt-1">
                              Otorgado en Guayaquil, Ecuador, el [Fecha en la que terminó el curso].
                            </p>
                          </div>

                          {/* FOOTER SIGNATURE & METRICS */}
                          {(activeTpl.signatureRole?.trim() || activeTpl.signatureName?.trim()) ? (
                            <div className="z-20 mt-auto pb-2 md:pb-4 max-w-md mx-auto w-full">
                              <div className="w-full border-t border-slate-300 pt-2 flex flex-col items-center">
                                {activeTpl.signatureRole?.trim() && (
                                  <p className="text-[9px] md:text-[11px] font-serif font-bold text-[#C5A880] uppercase tracking-wider">
                                    {activeTpl.signatureRole}
                                  </p>
                                )}
                                {activeTpl.signatureName?.trim() && (
                                  <p className="text-[8px] md:text-[10px] font-sans font-bold text-[#0B1F3F] tracking-widest uppercase">
                                    {activeTpl.signatureName}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="z-20 mt-auto pb-2 md:pb-4"></div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* --- MODALS SECTION --- */}
      
      {/* 1. TOPIC CREATE/EDIT PARAMETER MODAL */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] md:max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="flex justify-between items-center border-b border-slate-100 px-6 py-4 shrink-0 bg-slate-50">
              <h3 className="text-base font-serif italic font-bold text-slate-800">
                {editingTopic ? 'Editar Parámetros del Tema' : 'Crear Nuevo Tema de Capacitación'}
              </h3>
              <button 
                onClick={() => setIsTopicModalOpen(false)} 
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-500 rounded-lg cursor-pointer transition-all duration-200 shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-4 text-xs overflow-y-auto p-6 flex-1 pt-4">
              <div>
                <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Título del Tema</label>
                <input
                  type="text"
                  required
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                  placeholder="ej. Seguridad en el Teletrabajo"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Categoría</label>
                  <input
                    type="text"
                    required
                    value={topicCategory}
                    onChange={(e) => setTopicCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                    placeholder="ej. Operaciones, Tecnología"
                  />
                </div>

                <div>
                  <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Calificación Mínima para Aprobar (0 - 10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    required
                    value={topicMinScore}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setTopicMinScore(isNaN(val) ? 0 : Math.min(10, Math.max(0, val)));
                    }}
                    className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Descripción Breve</label>
                <textarea
                  value={topicDescription}
                  onChange={(e) => setTopicDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none h-20 resize-none transition-all duration-200"
                  placeholder="Resuma brevemente qué habilidades adquirirá el alumno."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Intentos Permitidos</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={topicMaxAttempts}
                    onChange={(e) => setTopicMaxAttempts(parseInt(e.target.value))}
                    className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Límite de Tiempo (Minutos)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={topicTimeLimit}
                    onChange={(e) => setTopicTimeLimit(parseInt(e.target.value))}
                    className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">* Use 0 para tiempo ilimitado</span>
                </div>
              </div>

              <div>
                <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Fecha de Vencimiento (Opcional)</label>
                <input
                  type="date"
                  value={topicDueDate}
                  onChange={(e) => setTopicDueDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer transition-all duration-200"
                />
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">* Dejar vacío si no hay fecha de vencimiento obligatoria</span>
              </div>

              <div className="flex flex-col gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-100 font-mono font-bold text-xs">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="hasInitialQuiz"
                    checked={topicHasInitialQuiz}
                    onChange={(e) => setTopicHasInitialQuiz(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="hasInitialQuiz" className="font-mono font-bold text-slate-700 cursor-pointer">
                    Habilitar evaluación de conocimientos inicial (Pre-test)
                  </label>
                </div>
                
                <div className="flex items-center gap-2.5 border-t border-slate-150 pt-2.5">
                  <input
                    type="checkbox"
                    id="rand"
                    checked={topicRandomize}
                    onChange={(e) => setTopicRandomize(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="rand" className="font-mono font-bold text-slate-700 cursor-pointer">Aleatorizar preguntas en la prueba final</label>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider text-[10px]">Áreas Destinatarias (A quiénes les aparecerá)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTopicTargetAreas(CORPORATE_AREAS)}
                      className="text-[10px] font-mono font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      [Marcar Todas]
                    </button>
                    <button
                      type="button"
                      onClick={() => setTopicTargetAreas([])}
                      className="text-[10px] font-mono font-bold text-slate-400 hover:text-slate-500 cursor-pointer"
                    >
                      [Desmarcar Todas]
                    </button>
                  </div>
                </div>
                
                <p className="text-[10px] text-slate-500 font-mono mb-2">
                  * Si no se marca ninguna área, el tema será visible para <strong>TODAS</strong> las áreas de la corporación.
                </p>

                <div className="max-h-36 overflow-y-auto border border-slate-200 p-3 bg-white space-y-2 rounded-xl shadow-inner text-slate-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px]">
                    {CORPORATE_AREAS.map(area => {
                      const isChecked = topicTargetAreas.includes(area);
                      return (
                        <label key={area} className="flex items-center gap-2 cursor-pointer font-mono hover:text-slate-900 transition-colors">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setTopicTargetAreas(prev => 
                                prev.includes(area) 
                                  ? prev.filter(a => a !== area) 
                                  : [...prev, area]
                              );
                            }}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className={`${isChecked ? 'font-bold text-slate-800' : 'text-slate-600'}`}>{area}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl font-mono font-bold text-xs uppercase tracking-wide hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wide cursor-pointer transition-all duration-200 shadow-lg shadow-indigo-100 hover:shadow-indigo-200"
                >
                  Guardar Tema
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 2. ADD MATERIAL DIDÁCTICO MODAL */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] md:max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="flex justify-between items-center border-b border-slate-100 px-6 py-4 shrink-0 bg-slate-50">
              <h3 className="text-base font-serif italic font-bold text-slate-800">
                {editingMaterial ? 'Modificar Material Didáctico' : 'Cargar Material Didáctico'}
              </h3>
              <button 
                onClick={() => setIsMaterialModalOpen(false)} 
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-500 rounded-lg cursor-pointer transition-all duration-200 shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-4 text-xs overflow-y-auto p-6 flex-1 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Título del Material</label>
                  <input
                    type="text"
                    required
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                    placeholder="ej. Introducción al Caso Clave"
                  />
                </div>

                <div>
                  <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Tipo de Formato</label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-bold uppercase tracking-wider cursor-pointer transition-all duration-200"
                  >
                    <option value="document">Texto / Documento Escrito</option>
                    <option value="pdf">Enlace de Google Drive / Workspace</option>
                    <option value="video">Enlace de Video (YouTube)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Estimación de Lectura (Minutos)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={materialMinutes}
                    onChange={(e) => setMaterialMinutes(parseInt(e.target.value))}
                    className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                  />
                </div>

                {materialType !== 'document' ? (
                  <div>
                    <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {materialType === 'video' ? 'Enlace de Video (YouTube)' : 'Enlace de Google Drive / Workspace'}
                    </label>
                    <input
                      type="url"
                      required
                      value={materialUrl}
                      onChange={(e) => setMaterialUrl(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                      placeholder={materialType === 'video' ? 'ej. https://www.youtube.com/watch?v=...' : 'ej. https://docs.google.com/presentation/d/...'}
                    />
                  </div>
                ) : (
                  <div className="hidden md:block">
                    {/* Grid alignment placeholder */}
                  </div>
                )}
              </div>

              {materialType === 'video' && materialUrl && (() => {
                const parsedVideo = getEmbedUrl(materialUrl);
                return (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[11px] font-mono font-bold text-indigo-950 uppercase">Previsualización en Aula Virtual (En Vivo)</span>
                      </div>
                      <span className="text-[9px] font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md uppercase font-bold">
                        Tipo: {parsedVideo.type}
                      </span>
                    </div>
                    <div className="aspect-video w-full rounded-xl border border-slate-200 bg-slate-950 overflow-hidden relative shadow-sm">
                      {parsedVideo.type === 'direct' ? (
                        <video
                          src={parsedVideo.embedUrl}
                          className="w-full h-full object-contain absolute inset-0"
                          controls
                          playsInline
                        />
                      ) : (
                        <iframe
                          src={parsedVideo.embedUrl}
                          title="Preview"
                          className="w-full h-full border-0 absolute inset-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                      * El reproductor de arriba simula exactamente cómo verán y escucharán este video los colaboradores desde su portal. Se soporta YouTube, Vimeo, Loom, Google Drive, Dropbox y archivos de video directo (.mp4, .webm).
                    </p>
                  </div>
                );
              })()}

              {materialUrl && getGoogleDriveEmbedUrl(materialUrl).isDrive && (() => {
                const driveInfo = getGoogleDriveEmbedUrl(materialUrl);
                return (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-mono font-bold text-slate-800 uppercase">Previsualización de Google Drive / Workspace (En Vivo)</span>
                      </div>
                      <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md uppercase font-bold">
                        Google Cloud Embed
                      </span>
                    </div>
                    <div className="w-full h-[300px] rounded-xl border border-slate-200 bg-white overflow-hidden relative shadow-sm">
                      <iframe
                        src={driveInfo.embedUrl}
                        title="Preview Drive"
                        className="w-full h-full border-0 absolute inset-0"
                        allow="autoplay"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                      * ¡Enlace de Google Drive/Workspace detectado con éxito! Se cargará exactamente con este lector interactivo integrado en el portal de los alumnos. Asegúrate de que el archivo en Drive tenga los permisos de <strong>"Cualquier persona con el enlace puede ver"</strong> para que todos los alumnos puedan visualizarlo sin problemas.
                    </p>
                  </div>
                );
              })()}



              <div>
                <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Contenido Didáctico (Formato Markdown)</label>
                <textarea
                  required
                  value={materialContent}
                  onChange={(e) => setMaterialContent(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none h-44 resize-none transition-all duration-200"
                  placeholder="### Use Markdown para estructurar el curso&#10;&#10;Use asteriscos para **negrita** o listas con guiones - para mayor claridad."
                />
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl font-mono font-bold text-xs uppercase tracking-wide hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wide cursor-pointer transition-all duration-200 shadow-lg shadow-indigo-100 hover:shadow-indigo-200"
                >
                  {editingMaterial ? 'Guardar Cambios' : 'Confirmar Carga'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 3. ADD TEST QUESTION MODAL */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] md:max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="flex justify-between items-center border-b border-slate-100 px-6 py-4 shrink-0 bg-slate-50">
              <h3 className="text-base font-serif italic font-bold text-slate-800">
                {editingQuestion ? 'Modificar Pregunta de Evaluación' : 'Agregar Pregunta de Prueba'}
              </h3>
              <button 
                onClick={() => setIsQuestionModalOpen(false)} 
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-500 rounded-lg cursor-pointer transition-all duration-200 shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs overflow-y-auto p-6 flex-1 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Tipo de Evaluación</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as 'initial' | 'final')}
                    className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-bold uppercase tracking-wider cursor-pointer transition-all duration-200"
                  >
                    <option value="final">Evaluación Final (Examen)</option>
                    <option value="initial">Evaluación Inicial (Pre-test)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Puntos de Pregunta</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={questionPoints}
                    onChange={(e) => setQuestionPoints(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Enunciado de la Pregunta</label>
                <input
                  type="text"
                  required
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                  placeholder="ej. ¿Cuál de las siguientes alternativas describe el ransomware?"
                />
              </div>

              <div>
                <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Formato de Pregunta</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuestionFormat('multiple');
                      setQuestionCorrectIndex(0);
                    }}
                    className={`py-2 text-center rounded-lg font-mono font-bold transition-all duration-200 cursor-pointer ${
                      questionFormat === 'multiple'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Opción Múltiple
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuestionFormat('true_false');
                      setQuestionCorrectIndex(0); // Default to Verdadero
                    }}
                    className={`py-2 text-center rounded-lg font-mono font-bold transition-all duration-200 cursor-pointer ${
                      questionFormat === 'true_false'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Verdadero / Falso
                  </button>
                </div>
              </div>

              {questionFormat === 'multiple' ? (
                /* Alternatives loop */
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider">Opciones de Respuesta</label>
                    <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded">
                      {questionOptions.length} opciones
                    </span>
                  </div>
                  
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {questionOptions.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correct"
                          checked={questionCorrectIndex === oIdx}
                          onChange={() => setQuestionCorrectIndex(oIdx)}
                          className="h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 shrink-0 cursor-pointer accent-indigo-600"
                          title="Marcar como alternativa correcta"
                        />
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => {
                            const updated = [...questionOptions];
                            updated[oIdx] = e.target.value;
                            setQuestionOptions(updated);
                          }}
                          className="flex-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                          placeholder={`Alternativa ${String.fromCharCode(65 + oIdx)}`}
                        />
                        {questionOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestionOption(oIdx)}
                            className="p-1.5 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-all duration-200 shrink-0"
                            title="Eliminar esta opción"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-1.5">
                    <button
                      type="button"
                      onClick={handleAddQuestionOption}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 font-mono text-[10px] font-bold uppercase rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar Opción
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono block mt-1.5">
                    • Seleccione el botón circular al costado izquierdo de la alternativa que sea la <strong>correcta</strong>. Puede tener de 2 a 10 opciones.
                  </span>
                </div>
              ) : (
                /* True/False Selector */
                <div className="space-y-3">
                  <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Respuesta Correcta</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setQuestionCorrectIndex(0)}
                      className={`py-4 rounded-2xl border-2 font-mono font-bold text-center flex flex-col items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                        questionCorrectIndex === 0
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-md shadow-emerald-50'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-sm">Verdadero</span>
                      <span className="text-[9px] font-bold text-emerald-600/70 uppercase">Correcto ✓</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionCorrectIndex(1)}
                      className={`py-4 rounded-2xl border-2 font-mono font-bold text-center flex flex-col items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                        questionCorrectIndex === 1
                          ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-md shadow-rose-50'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-sm">Falso</span>
                      <span className="text-[9px] font-bold text-rose-600/70 uppercase">Correcto ✓</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-1.5">• El sistema guardará "Verdadero" y "Falso" como opciones automáticas y marcará la seleccionada como correcta.</span>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl font-mono font-bold text-xs uppercase tracking-wide hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wide cursor-pointer transition-all duration-200 shadow-lg shadow-indigo-100 hover:shadow-indigo-200"
                >
                  {editingQuestion ? 'Guardar Cambios' : 'Añadir Pregunta'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 3.5 REGISTER TRAINING DELIVERY DETAILS MODAL */}
      {isDeliveryModalOpen && deliverySelectedTopic && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded uppercase">
                  Control de Cierres
                </span>
                <h3 className="text-sm font-serif italic font-bold text-slate-800">
                  Registrar Cierre de Capacitación
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsDeliveryModalOpen(false);
                  setDeliverySelectedTopic(null);
                }} 
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-500 rounded-lg cursor-pointer transition-all duration-200 shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDelivery} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Capacitación Seleccionada</p>
                <h4 className="font-serif italic font-bold text-slate-800 text-xs mt-0.5">{deliverySelectedTopic.title}</h4>
                <p className="text-[10px] text-slate-500 font-sans mt-1">{deliverySelectedTopic.description}</p>
              </div>

              {/* Toggle delivered status */}
              <div className="flex items-center justify-between bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <div>
                  <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider">¿Dar por cerrado este tema?</label>
                  <p className="text-[10px] text-slate-400 font-sans">Marque para cerrar oficialmente esta capacitación y registrar los datos de dictado.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeliveryIsDelivered(!deliveryIsDelivered)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                    deliveryIsDelivered ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <motion.div 
                    layout 
                    className="bg-white w-4 h-4 rounded-full shadow-md"
                  />
                </button>
              </div>

              {deliveryIsDelivered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 overflow-hidden pt-1"
                >
                  <div>
                    <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Fecha de Cierre / Dictado</label>
                    <input
                      type="date"
                      required
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Facilitador / Instructor</label>
                    <input
                      type="text"
                      required
                      placeholder="Nombre del capacitador..."
                      value={deliveryInstructor}
                      onChange={(e) => setDeliveryInstructor(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Notas / Observaciones del Cierre</label>
                    <textarea
                      rows={3}
                      placeholder="Concurrencia, observaciones, comentarios del aula..."
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none text-xs font-sans resize-none"
                    />
                  </div>
                </motion.div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeliveryModalOpen(false);
                    setDeliverySelectedTopic(null);
                  }}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-mono font-bold text-xs uppercase tracking-wide cursor-pointer transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wide cursor-pointer transition-all duration-200 shadow-lg shadow-indigo-100 hover:shadow-indigo-200"
                >
                  Guardar Cierre
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 5. CREATE/EDIT CERTIFICATE TEMPLATE MODAL */}
      {isCertificateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-serif italic font-bold text-slate-800">
                {editingTemplate ? 'Editar Plantilla de Certificado' : 'Registrar Nueva Plantilla'}
              </h3>
              <button 
                onClick={() => {
                  setIsCertificateModalOpen(false);
                  setEditingTemplate(null);
                }} 
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-500 rounded-lg cursor-pointer transition-all duration-200 shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Título del Certificado</label>
                <input
                  type="text"
                  required
                  value={tplTitle}
                  onChange={(e) => setTplTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                  placeholder="ej. CERTIFICADO DE APROBACIÓN"
                />
              </div>

              <div>
                <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Subtítulo / Introducción</label>
                <input
                  type="text"
                  required
                  value={tplSubtitle}
                  onChange={(e) => setTplSubtitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                  placeholder="La Empresa Fundametz certifica que el colaborador(a):"
                />
              </div>

              <div>
                <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Texto de Cuerpo / Detalle</label>
                <textarea
                  rows={3}
                  required
                  value={tplBodyText}
                  onChange={(e) => setTplBodyText(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200 resize-none"
                  placeholder="Ha completado exitosamente y aprobado con distinción los requisitos del curso de capacitación técnica obligatoria de:"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre del Firmante <span className="text-[10px] text-slate-400 font-normal lowercase">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={tplSignatureName}
                    onChange={(e) => setTplSignatureName(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                    placeholder="Dejar vacío para ocultar"
                  />
                  <span className="text-[9px] text-slate-400 mt-0.5 block font-mono">Dejar vacío para ocultar firma</span>
                </div>

                <div>
                  <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cargo de Firma <span className="text-[10px] text-slate-400 font-normal lowercase">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={tplSignatureRole}
                    onChange={(e) => setTplSignatureRole(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                    placeholder="Dejar vacío para ocultar"
                  />
                  <span className="text-[9px] text-slate-400 mt-0.5 block font-mono">Dejar vacío para ocultar cargo</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Color de Fondo</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={tplBgColor}
                      onChange={(e) => setTplBgColor(e.target.value)}
                      className="h-9 w-9 border border-slate-250 cursor-pointer p-0.5 rounded-lg bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={tplBgColor}
                      onChange={(e) => setTplBgColor(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Color de Texto</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={tplTextColor}
                      onChange={(e) => setTplTextColor(e.target.value)}
                      className="h-9 w-9 border border-slate-250 cursor-pointer p-0.5 rounded-lg bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={tplTextColor}
                      onChange={(e) => setTplTextColor(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCertificateModalOpen(false);
                    setEditingTemplate(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl font-mono font-bold text-xs uppercase tracking-wide hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wide cursor-pointer transition-all duration-200 shadow-lg shadow-indigo-100 hover:shadow-indigo-200"
                >
                  {editingTemplate ? 'Guardar Cambios' : 'Crear Plantilla'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 4. CREATE/EDIT USER ACCOUNT MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-serif italic font-bold text-slate-800">
                {editingUser ? 'Editar Cuenta de Usuario' : 'Registrar Nueva Cuenta'}
              </h3>
              <button 
                onClick={() => {
                  setIsUserModalOpen(false);
                  setEditingUser(null);
                }} 
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-500 rounded-lg cursor-pointer transition-all duration-200 shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={userNameField}
                  onChange={(e) => setUserNameField(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                  placeholder="ej. Daniel Silva"
                />
              </div>

              <div>
                <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Número de Cédula</label>
                <input
                  type="text"
                  required
                  value={userEmailField}
                  onChange={(e) => setUserEmailField(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                  placeholder="ej. 1723456789"
                />
              </div>

              <div>
                <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Contraseña o clave de ingreso</label>
                <input
                  type="text"
                  required
                  value={userPasswordField}
                  onChange={(e) => setUserPasswordField(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                  placeholder="clave123"
                />
              </div>

              <div>
                <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Área Organizacional</label>
                <select
                  value={userAreaField}
                  onChange={(e) => setUserAreaField(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-bold uppercase tracking-wider cursor-pointer text-[11px] transition-all duration-200"
                >
                  {CORPORATE_AREAS.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">Rol Operativo</label>
                <select
                  value={userRoleField}
                  onChange={(e) => setUserRoleField(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-bold uppercase tracking-wider cursor-pointer text-[11px] transition-all duration-200"
                >
                  <option value="user">Colaborador / Alumno</option>
                  <option value="admin">Administrador General</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl font-mono font-bold text-xs uppercase tracking-wide hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wide cursor-pointer transition-all duration-200 shadow-lg shadow-indigo-100 hover:shadow-indigo-200"
                >
                  {editingUser ? 'Guardar Cambios' : 'Crear Cuenta'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wide text-slate-800">
                {confirmDialog.title}
              </h3>
            </div>
            
            <p className="text-xs text-slate-600 font-sans leading-relaxed">
              {confirmDialog.message}
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 border border-slate-200 text-slate-500 bg-white rounded-xl font-mono font-bold text-xs uppercase tracking-wide hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
              >
                No, Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wide cursor-pointer shadow-lg shadow-rose-100 transition-all duration-200"
              >
                Sí, Eliminar
              </button>
            </div>
          </motion.div>
        </div>
      )}

        {/* MANUAL DE USUARIO */}
        <UserManual isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} userRole="admin" />
      </div>
    </div>
  );
}
