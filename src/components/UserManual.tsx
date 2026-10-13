import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HelpCircle, 
  X, 
  BookOpen, 
  Shield, 
  Lock, 
  Play, 
  FileText, 
  CheckSquare, 
  Users, 
  Mail, 
  Clock, 
  Award, 
  CheckCircle2, 
  BookOpenCheck,
  Smartphone,
  Laptop,
  MessageSquare,
  Activity,
  UserCheck,
  AlertTriangle,
  Download,
  Search,
  Plus,
  Send,
  Trash,
  Settings,
  Layers
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface UserManualProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'admin' | 'user';
}

type ManualSection = 
  | 'intro' 
  | 'login' 
  | 'dashboard' 
  | 'materials' 
  | 'exams' 
  | 'messages'
  | 'admin_dashboard'
  | 'admin_courses'
  | 'admin_questions'
  | 'admin_tracking'
  | 'admin_messages';

export default function UserManual({ isOpen, onClose, userRole = 'user' }: UserManualProps) {
  const [manualRoleView, setManualRoleView] = useState<'admin' | 'user'>(userRole);
  const [activeSection, setActiveSection] = useState<ManualSection>('intro');

  // Synchronize manual view with logged in user when manual is opened
  useEffect(() => {
    if (isOpen) {
      setManualRoleView(userRole);
      setActiveSection('intro');
    }
  }, [isOpen, userRole]);

  const downloadManualPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let pageNum = 1;
    let currentY = 20;

    const addHeader = () => {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate 400
      const systemTitle = manualRoleView === 'admin' 
        ? "AULA VIRTUAL FUNDAMETZ // NIVEL DE SUPERVISIÓN Y ADMINISTRACIÓN"
        : "AULA VIRTUAL FUNDAMETZ // NIVEL DE ESTUDIANTE Y COLABORADOR";
      doc.text(systemTitle, 15, 12);
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.3);
      doc.line(15, 14, 195, 14);
    };

    const addFooter = () => {
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.3);
      doc.line(15, 280, 195, 280);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      const docFooterText = manualRoleView === 'admin'
        ? "Empresa Fundametz v2.6.4 - Manual de Gestión y Supervisión"
        : "Empresa Fundametz v2.6.4 - Manual de Aula Virtual del Colaborador";
      doc.text(docFooterText, 15, 285);
      doc.text(`Página ${pageNum}`, 180, 285);
    };

    const addPageBreak = () => {
      addFooter();
      doc.addPage();
      pageNum++;
      currentY = 25;
      addHeader();
    };

    const writeParagraph = (text: string, size: number = 10, style: 'normal' | 'bold' = 'normal', color: [number, number, number] = [51, 65, 85], spaceAfter: number = 4) => {
      doc.setFont('Helvetica', style);
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(text, 180);
      for (const line of lines) {
        if (currentY > 265) {
          addPageBreak();
        }
        doc.text(line, 15, currentY);
        currentY += (size * 0.3527) + 2.2;
      }
      currentY += spaceAfter;
    };

    const writeHeading = (text: string, level: 1 | 2 | 3) => {
      if (level === 1) {
        if (currentY > 230) {
          addPageBreak();
        } else {
          currentY += 4;
        }
        doc.setDrawColor(15, 23, 42); // Slate 900
        doc.setLineWidth(1.2);
        doc.line(15, currentY, 195, currentY);
        currentY += 6;
        writeParagraph(text.toUpperCase(), 13, 'bold', [15, 23, 42], 4);
      } else if (level === 2) {
        if (currentY > 245) {
          addPageBreak();
        } else {
          currentY += 3;
        }
        const titleColor: [number, number, number] = manualRoleView === 'admin' ? [217, 119, 6] : [2, 132, 199]; // Amber for admin, Sky for user
        writeParagraph(text, 10.5, 'bold', titleColor, 3);
      } else {
        if (currentY > 255) {
          addPageBreak();
        }
        writeParagraph(text, 9, 'bold', [71, 85, 105], 2);
      }
    };

    const drawLoginMockup = (x: number, y: number) => {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(15, 23, 42); // slate-900
      doc.setLineWidth(0.4);
      doc.rect(x, y, 80, 48, 'FD');

      doc.setFillColor(15, 23, 42);
      doc.rect(x, y, 80, 7, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text("SISTEMA DE CAPACITACIÓN - INGRESO", x + 4, y + 4.8);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(71, 85, 105);
      doc.text("CÉDULA DE IDENTIDAD (USUARIO)", x + 6, y + 13);
      
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.rect(x + 6, y + 15, 68, 6, 'FD');
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      doc.text("123456789", x + 9, y + 19.2);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(71, 85, 105);
      doc.text("CONTRASEÑA", x + 6, y + 25);
      
      doc.setFillColor(255, 255, 255);
      doc.rect(x + 6, y + 27, 68, 6, 'FD');
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text("••••••••", x + 9, y + 31.2);

      doc.setFillColor(2, 132, 199); // Sky blue button
      doc.rect(x + 6, y + 36, 68, 7, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text("INGRESAR AL AULA ➔", x + 24, y + 40.5);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(148, 163, 184);
      doc.text("CONEXIÓN DE DATOS PROTEGIDA POR TLS 1.3", x + 6, y + 46);
    };

    const drawCourseCardMockup = (x: number, y: number) => {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.4);
      doc.rect(x, y, 80, 44, 'FD');

      doc.setFillColor(15, 23, 42);
      doc.rect(x + 4, y + 4, 18, 4.5, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(56, 189, 248);
      doc.text("MEDICINA", x + 6, y + 7.2);

      doc.setFillColor(245, 158, 11); // Amber 500
      doc.rect(x + 60, y + 4, 16, 4.5, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(15, 23, 42);
      doc.text("EN CURSO", x + 62, y + 7.2);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text("RCP Básico de Urgencia", x + 4, y + 13);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(71, 85, 105);
      doc.text("Guía interactiva de reanimación cardiopulmonar básica para", x + 4, y + 17.5);
      doc.text("equipos de salud de la Empresa Fundametz.", x + 4, y + 21);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Progreso de Estudio (50%)", x + 4, y + 27);

      doc.setFillColor(226, 232, 240);
      doc.rect(x + 4, y + 29, 72, 3, 'F');
      doc.setFillColor(2, 132, 199);
      doc.rect(x + 4, y + 29, 36, 3, 'F');

      doc.setFillColor(15, 23, 42);
      doc.rect(x + 50, y + 35, 26, 6, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(255, 255, 255);
      doc.text("ESTUDIAR AHORA ➔", x + 53, y + 39.2);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(148, 163, 184);
      doc.text("⏱ ESTIMADO: 10 MINUTOS", x + 4, y + 39);
    };

    const drawExamMockup = (x: number, y: number) => {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.4);
      doc.rect(x, y, 80, 44, 'FD');

      doc.setFillColor(15, 23, 42);
      doc.rect(x, y, 80, 6, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(255, 255, 255);
      doc.text("MÓDULO DE EXAMEN", x + 4, y + 4.2);
      doc.setTextColor(239, 68, 68);
      doc.text("TIEMPO RESTANTE: 09:45 MIN", x + 48, y + 4.2);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(71, 85, 105);
      doc.text("PREGUNTA DE EVALUACIÓN (TEMA: RCP BÁSICO)", x + 4, y + 11);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text("¿El RCP de emergencia básico en adultos requiere de", x + 4, y + 15.5);
      doc.text("compresiones de al menos 5 centímetros de profundidad?", x + 4, y + 19);

      doc.setFillColor(224, 242, 254);
      doc.setDrawColor(14, 165, 233);
      doc.rect(x + 4, y + 23, 72, 7, 'FD');
      doc.setFillColor(14, 165, 233);
      doc.circle(x + 8, y + 26.5, 1.5, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(3, 105, 161);
      doc.text("Verdadero (Respuesta Seleccionada)", x + 12, y + 27.8);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.rect(x + 4, y + 31, 72, 7, 'FD');
      doc.setDrawColor(203, 213, 225);
      doc.circle(x + 8, y + 34.5, 1.5, 'D');
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text("Falso", x + 12, y + 35.8);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(4.5);
      doc.setTextColor(148, 163, 184);
      doc.text("PUNTAJE REQUERIDO: 80% DE RESPUESTAS CORRECTAS", x + 4, y + 41.5);
    };

    const drawChatMockup = (x: number, y: number) => {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.4);
      doc.rect(x, y, 80, 44, 'FD');

      doc.setFillColor(15, 23, 42);
      doc.rect(x, y, 80, 6, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(255, 255, 255);
      doc.text("SOPORTE AL ESTUDIANTE", x + 4, y + 4.2);
      doc.setTextColor(52, 211, 153);
      doc.text("● CANAL ACTIVO (SUPABASE)", x + 46, y + 4.2);

      doc.setFillColor(224, 242, 254);
      doc.rect(x + 4, y + 9, 52, 13, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(3, 105, 161);
      doc.text("COLABORADOR (Usted)", x + 6, y + 13);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(15, 23, 42);
      doc.text("Buenas tardes, ¿cuál es el porcentaje de nota", x + 6, y + 17);
      doc.text("mínimo de aprobación para el examen?", x + 6, y + 20.2);

      doc.setFillColor(255, 255, 255);
      doc.rect(x + 24, y + 24, 52, 13, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(15, 23, 42);
      doc.text("SOPORTE ACADÉMICO FUNDAMETZ", x + 26, y + 28);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(71, 85, 105);
      doc.text("Hola. El puntaje mínimo es del 80% (ocho", x + 26, y + 32);
      doc.text("respuestas de diez correctas).", x + 26, y + 35.2);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(4);
      doc.setTextColor(148, 163, 184);
      doc.text("CONEXIÓN EN TIEMPO REAL CON LA BASE DE DATOS SUPABASE", x + 4, y + 41.5);
    };

    if (manualRoleView === 'admin') {
      // ==========================================
      // ------ MANUAL DE SUPERVISIÓN (ADMIN) -----
      // ==========================================
      
      // --- PAGINA 1: PORTADA ---
      addHeader();
      currentY = 40;
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.rect(15, currentY, 180, 25, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("EMPRESA FUNDAMETZ - SISTEMA ACADÉMICO", 22, currentY + 16);
      currentY += 35;

      writeParagraph("MANUAL DE GESTIÓN Y SUPERVISIÓN ACADÉMICA", 17, 'bold', [217, 119, 6], 8);
      writeParagraph("Nivel Supervisor: Métricas, Cursos, Evaluaciones y Auditoría Continua", 11, 'normal', [71, 85, 105], 15);

      // Metadata block
      doc.setFillColor(254, 251, 241); // amber bg
      doc.rect(15, currentY, 180, 50, 'F');
      doc.setDrawColor(245, 158, 11); // amber-500
      doc.setLineWidth(0.5);
      doc.rect(15, currentY, 180, 50, 'D');

      let metaY = currentY + 8;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("CREDENCIAES Y ESPECIFICACIONES DE CONTROL:", 20, metaY);
      
      metaY += 6;
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text("- Usuario Supervisor de Prueba: 'admin'  /  Contraseña: '2026'", 20, metaY);
      metaY += 5;
      doc.text("- Base de Datos en Tiempo Real: Supabase (Sincronización Híbrida)", 20, metaY);
      metaY += 5;
      doc.text("- Capacidad Administrativa: Gestión Curricular, Reactivos y Auditoría", 20, metaY);
      metaY += 5;
      doc.text("- Tecnología de Compilación: React 19 / Tailwind / Node.js Engine", 20, metaY);
      metaY += 5;
      doc.text("- Versión Actual: v2.6.4 Standard Edition", 20, metaY);

      currentY += 62;

      writeParagraph("Este manual está diseñado exclusivamente para el personal directivo, entrenadores o supervisores académicos de la Empresa Fundametz. Detalla los procesos para el alta de cursos, creación de exámenes, seguimiento exhaustivo de lecturas del personal y mensajería académica interactiva.", 9.5, 'normal', [51, 65, 85], 8);
      writeParagraph("La correcta manipulación de estas herramientas asegura el cumplimiento de las metas anuales de capacitación de cada departamento.", 9.5, 'bold', [15, 23, 42], 10);

      // --- PAGINA 2: INTRODUCCIÓN Y ACCESO ---
      addPageBreak();
      writeHeading("Introducción al Nivel de Supervisión", 1);
      writeParagraph("El rol de Supervisor Académico tiene la responsabilidad de coordinar las áreas de aprendizaje y auditar las actividades de los alumnos. El sistema provee un panel de control avanzado que se actualiza en tiempo real cada vez que un colaborador avanza en su capacitación.", 9.5, 'normal', [51, 65, 85], 4);

      writeHeading("Mecanismos Claves del Administrador", 2);
      writeParagraph("• Gestión de Contenidos: Modificar o crear cursos, agregar diapositivas, empotrar videos educativos o archivos de guías operativas PDF.", 9.5, 'normal', [51, 65, 85], 3);
      writeParagraph("• Banco de Reactivos: Configurar exámenes con límite de tiempo, puntajes mínimos de aprobación, orden aleatorio y claves correctas.", 9.5, 'normal', [51, 65, 85], 3);
      writeParagraph("• Auditoría Integral de Alumnos: Visualizar logs con marcas de tiempo exactas (horas y segundos) de las actividades de cada colaborador.", 9.5, 'normal', [51, 65, 85], 8);

      writeHeading("1. Acceso y Autenticación del Supervisor", 1);
      writeParagraph("Para acceder a la consola administrativa, el supervisor debe autenticarse en el panel general usando el código especial de rol directivo.", 9.5, 'normal', [51, 65, 85], 5);
      
      writeHeading("Credenciales de Acceso Directivo", 2);
      writeParagraph("Cédula de Identidad (Usuario): admin", 9.5, 'bold', [15, 23, 42], 2);
      writeParagraph("Contraseña de Acceso: 2026", 9.5, 'bold', [15, 23, 42], 8);

      currentY += 4;
      writeParagraph("Nota de Seguridad Académica: El acceso supervisor utiliza autenticación local validada con almacenamiento seguro. Mantenga estas credenciales bajo estricto resguardo.", 9, 'bold', [100, 116, 139], 4);

      // --- PAGINA 3: DASHBOARD METRICAS & CREAR CURSOS ---
      addPageBreak();
      writeHeading("2. Visualización de Métricas & Rendimiento", 1);
      writeParagraph("Al iniciar sesión en modo directivo, el sistema presenta un Dashboard con gráficos estadísticos avanzados:", 9.5, 'normal', [51, 65, 85], 5);
      
      writeHeading("Módulos Estadísticos y Reportes", 2);
      writeParagraph("• Tarjetas Informativas: Muestran el promedio global de notas, total de colaboradores registrados, cantidad de temas publicados y tasa de aprobación de la currícula.", 9.5, 'normal', [51, 65, 85], 3);
      writeParagraph("• Distribución por Departamento: Gráfico interactivo que segmenta las calificaciones promedio en cada una de las áreas corporativas de Fundametz (por ejemplo, Medicina, Pellet, Calidad).", 9.5, 'normal', [51, 65, 85], 3);
      writeParagraph("• Descarga de Informes: Botón integrado para exportar la base de datos de calificaciones de colaboradores en un informe consolidado.", 9.5, 'normal', [51, 65, 85], 8);

      writeHeading("3. Creador y Gestor de Cursos", 1);
      writeParagraph("El supervisor puede dar de alta temas de capacitación de forma interactiva y modular.", 9.5, 'normal', [51, 65, 85], 5);
      
      writeHeading("Parámetros Obligatorios del Curso", 2);
      writeParagraph("• Áreas de Destino (Target): El supervisor puede asignar el curso a departamentos específicos de la organización o dejarlo asignado para 'TODAS' las áreas corporativas.", 9.5, 'normal', [51, 65, 85], 3);
      writeParagraph("• Examen Diagnóstico Inicial: Al activar la opción, el estudiante tendrá la obligación de realizar un examen de diagnóstico previo de conocimientos antes de poder acceder a los materiales interactivos.", 9.5, 'normal', [51, 65, 85], 3);
      writeParagraph("• Materiales Híbridos: Se permite subir diapositivas personalizadas, empotrar enlaces de videos explicativos y enlazar guías clínicas en formato PDF.", 9.5, 'normal', [51, 65, 85], 8);

      currentY += 4;
      writeParagraph("Nota Curricular: La asignación multi-área simplifica la inducción del personal nuevo al direccionar contenidos automáticamente de acuerdo al organigrama de Fundametz.", 9, 'bold', [100, 116, 139], 4);

      // --- PAGINA 4: BANCO DE PREGUNTAS Y SEGUIMIENTO ---
      addPageBreak();
      writeHeading("4. Configuración de Evaluaciones y Exámenes", 1);
      writeParagraph("El aula virtual administra cuestionarios de forma estricta. El administrador puede editar el banco de preguntas por curso.", 9.5, 'normal', [51, 65, 85], 5);
      
      writeHeading("Reglas Técnicas de Exámenes", 2);
      writeParagraph("• Tipos de Reactivos: El sistema soporta preguntas de opción múltiple (con hasta 4 opciones) o preguntas de Verdadero/Falso.", 9.5, 'normal', [51, 65, 85], 3);
      writeParagraph("• Límites de Tiempo Estrictos: Se puede configurar el tiempo límite de resolución (por ejemplo, 10 minutos). Si el cronómetro del alumno llega a cero, el sistema bloquea la pantalla y envía automáticamente sus respuestas.", 9.5, 'normal', [51, 65, 85], 3);
      writeParagraph("• Aleatoriedad de Preguntas: Al activar esta opción, el sistema barajará las preguntas de manera distinta para cada colaborador con el fin de evitar duplicaciones e intercambios.", 9.5, 'normal', [51, 65, 85], 8);

      writeHeading("5. Auditoría y Seguimiento de Alumnos", 1);
      writeParagraph("El sistema registra cada acción de estudio con precisión. El supervisor puede buscar a cualquier colaborador mediante su número de cédula para auditar su desempeño académico de la siguiente manera:", 9.5, 'normal', [51, 65, 85], 5);
      
      writeHeading("Métricas de Auditoría", 2);
      writeParagraph("• Tiempos de Estudio Exactos: El supervisor visualiza los segundos exactos dedicados a mirar un video educativo, el número de diapositivas leídas y si se completó el scroll obligatorio del PDF.", 9.5, 'normal', [51, 65, 85], 3);
      writeParagraph("• Reportes de Intentos de Exámenes: Historial de todos los intentos, con la calificación, la duración del examen en segundos y la fecha exacta.", 9.5, 'normal', [51, 65, 85], 3);
      writeParagraph("• Resetear Intentos: En caso de que un alumno repruebe o tenga un inconveniente, el supervisor puede resetear el progreso del curso con un solo clic.", 9.5, 'normal', [51, 65, 85], 10);

      currentY += 4;
      writeParagraph("Nota de Auditoría: El sistema genera una huella criptográfica para cada intento de examen, asociando las respuestas dadas, el puntaje obtenido y el tiempo consumido.", 9, 'bold', [100, 116, 139], 4);

      // --- PAGINA 5: MENSAJERÍA, SOPORTE Y SEGURIDAD ---
      addPageBreak();
      writeHeading("6. Buzón de Mensajería y Consultas Académicas", 1);
      writeParagraph("La plataforma incorpora un chat asincrónico bidireccional conectado de forma directa a la base de datos de Supabase, permitiendo dar soporte al personal:", 9.5, 'normal', [51, 65, 85], 5);
      
      writeHeading("Atención de Consultas", 2);
      writeParagraph("• Bandeja de Entrada Centralizada: El supervisor visualiza las dudas agrupadas por estudiante con un listado del tema correspondiente de consulta.", 9.5, 'normal', [51, 65, 85], 3);
      writeParagraph("• Respuestas Instantáneas: Al responder el chat, el alumno recibirá una insignia luminosa de color rojo en su aula virtual para alertarle de la respuesta académica del supervisor.", 9.5, 'normal', [51, 65, 85], 8);

      writeHeading("Garantía de Seguridad y Compliance", 1);
      writeParagraph("El Aula Virtual Fundametz cumple con estrictas regulaciones de consistencia informática:", 9.5, 'normal', [51, 65, 85], 5);
      
      writeHeading("Normas de Uso Obligatorias", 2);
      writeParagraph("• No alterar la base de datos en horas de alta concurrencia de exámenes.", 9.5, 'normal', [51, 65, 85], 2);
      writeParagraph("• Mantener la confidencialidad absoluta de la cuenta directiva 'admin' para resguardar la validez de los resultados.", 9.5, 'normal', [51, 65, 85], 2);
      writeParagraph("• Revisar de forma semanal el buzón de consultas de los colaboradores para brindar un feedback pedagógico oportuno.", 9.5, 'normal', [51, 65, 85], 10);

      currentY += 4;
      writeParagraph("Nota de Soporte: Todos los mensajes y conversaciones académicas quedan registrados con marcas de tiempo en el servidor central de Fundametz para resguardo de la calidad formativa.", 9, 'bold', [100, 116, 139], 4);

      // Final signature
      currentY += 8;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text("CONSEJO DIRECTIVO - EMPRESA FUNDAMETZ", 15, currentY);
      currentY += 5;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text("Desarrollo Tecnológico y Académico de Vanguardia, 2026.", 15, currentY);

      addFooter();
      doc.save("Manual_Supervisor_Gestion_Academica_Fundametz.pdf");

    } else {
      // ==========================================
      // ------ MANUAL DE COLABORADOR (USER) ------
      // ==========================================
      
      // --- PAGINA 1: PORTADA ---
      addHeader();
      currentY = 40;
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.rect(15, currentY, 180, 25, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("EMPRESA FUNDAMETZ - AULA VIRTUAL", 22, currentY + 16);
      currentY += 35;

      writeParagraph("MANUAL DE USUARIO & GUÍA DE APRENDIZAJE", 17, 'bold', [2, 132, 199], 8);
      writeParagraph("Nivel Colaborador: Estudio Autónomo, Evaluaciones y Consultas al Tutor", 11, 'normal', [71, 85, 105], 15);

      // Metadata block
      doc.setFillColor(240, 249, 255); // sky-50 bg
      doc.rect(15, currentY, 180, 50, 'F');
      doc.setDrawColor(14, 165, 233); // sky-500 border
      doc.setLineWidth(0.5);
      doc.rect(15, currentY, 180, 50, 'D');

      let metaY = currentY + 8;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("DETALLES DE SU AULA VIRTUAL:", 20, metaY);
      
      metaY += 6;
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text("- Acceso Personalizado: Mediante Cédula de Identidad Registrada", 20, metaY);
      metaY += 5;
      doc.text("- Formatos Académicos: Presentaciones, Videos, PDFs de Referencia", 20, metaY);
      metaY += 5;
      doc.text("- Evaluaciones Integradas: Con reloj regresivo y retroalimentación interactiva", 20, metaY);
      metaY += 5;
      doc.text("- Canal de Mensajería: Comunicación asincrónica directa con los tutores", 20, metaY);
      metaY += 5;
      doc.text("- Plataforma v2.6.4: Totalmente adaptada a equipos móviles y computadoras", 20, metaY);

      currentY += 62;

      writeParagraph("Este manual describe el funcionamiento completo del Aula Virtual de Fundametz para todos los colaboradores de las diversas áreas (Medicina, Pirolisis, Pellet, Calidad, etc.). Aquí conocerá cómo interactuar con las lecturas, realizar sus exámenes obligatorios y resolver inquietudes con soporte.", 9.5, 'normal', [51, 65, 85], 8);
      writeParagraph("Siga de manera rigurosa las indicaciones para asegurar el éxito en su plan de capacitación.", 9.5, 'bold', [15, 23, 42], 10);

      // --- PAGINA 2: INTRODUCCIÓN Y ACCESO ---
      addPageBreak();
      writeHeading("Introducción al Aula Virtual del Estudiante", 1);
      writeParagraph("El Aula Virtual Fundametz es una plataforma neobrutalista de alto rendimiento desarrollada para gestionar sus cursos obligatorios y voluntarios. Puede estudiar a su propio ritmo, y sus calificaciones y avances se guardan automáticamente en nuestro servidor centralizado en la nube.", 9.5, 'normal', [51, 65, 85], 4);

      writeHeading("Mecanismos Académicos para el Alumno", 2);
      writeParagraph("• Materiales Secuenciales: El sistema controla que el material de estudio sea completamente visualizado antes de habilitar el examen final.", 9.5, 'normal', [51, 65, 85], 3);
      writeParagraph("• Diagnósticos Iniciales: Ciertos temas de estudio requieren completar un test breve de autodiagnóstico previo para iniciar.", 9.5, 'normal', [51, 65, 85], 3);
      writeParagraph("• Calificación Automática: El sistema evalúa sus test de forma inmediata y provee explicaciones correctivas de cada respuesta fallada.", 9.5, 'normal', [51, 65, 85], 8);

      writeHeading("1. Acceso y Autenticación del Alumno", 1);
      writeParagraph("Cada colaborador tiene asignada una cuenta personal. Para ingresar, complete el formulario de ingreso con sus datos personales provistos por Recursos Humanos.", 9.5, 'normal', [51, 65, 85], 5);
      
      writeHeading("Datos de Autenticación", 2);
      writeParagraph("Cédula de Identidad: Su número de identificación registrado (numérico, sin guiones).", 9.5, 'normal', [51, 65, 85], 2);
      writeParagraph("Contraseña: Clave privada otorgada por la organización (modificable por el tutor).", 9.5, 'normal', [51, 65, 85], 8);

      currentY += 4;
      writeParagraph("Recomendación de Seguridad: Nunca comparta sus credenciales personales. La empresa Fundametz valida su avance únicamente si accede desde su cuenta oficial asignada.", 9, 'bold', [100, 116, 139], 4);

      // --- PAGINA 3: NAVEGACIÓN Y MATERIALES ---
      addPageBreak();
      writeHeading("2. Navegación en el Aula Virtual", 1);
      writeParagraph("Al iniciar sesión, visualizará su Dashboard Personal de Capacitación con las siguientes características:", 9.5, 'normal', [51, 65, 85], 5);
      
      writeHeading("Secciones de la Pantalla Principal", 2);
      writeParagraph("• Panel de Progreso Académico: Muestra su porcentaje global de avance, horas estimadas de estudio, promedio general e insignias de cursos aprobados.", 9.5, 'normal', [51, 65, 85], 3);
      writeParagraph("• Catálogo de Cursos: Organizado mediante pestañas para filtrar temas en 'Pendientes' (por realizar o reprobados), 'Aprobados' (completados con éxito) y 'Todos'.", 9.5, 'normal', [51, 65, 85], 3);
      writeParagraph("• Buzón Flotante de Consultas: Un ícono de mensajería con alerta de globo rojo le advertirá sobre comunicados nuevos de los directores.", 9.5, 'normal', [51, 65, 85], 8);

      writeHeading("3. Visualización Obligatoria de Materiales", 1);
      writeParagraph("El sistema monitorea activamente que lea con atención las guías del tema antes de rendir la evaluación final, utilizando las siguientes reglas:", 9.5, 'normal', [51, 65, 85], 5);
      
      writeHeading("Tipos de Contenidos y Validación de Lectura", 2);
      writeParagraph("• Diapositivas (Carrusel de Slides): Debe navegar e interactuar obligatoriamente con el total de diapositivas del curso. Si omite alguna, el botón de evaluación permanecerá bloqueado indicando 'Diapositivas pendientes por revisar'.", 9.5, 'normal', [51, 65, 85], 3);
      writeParagraph("• Videos Educativos: El sistema activa un cronómetro inteligente de permanencia mínima obligatoria proporcional a la duración del tema de estudio.", 9.5, 'normal', [51, 65, 85], 3);
      writeParagraph("• Documentos Guía (PDF): El lector de PDF interactivo requiere hacer scroll vertical completo hasta el final para validar la lectura como completada.", 9.5, 'normal', [51, 65, 85], 8);

      currentY += 4;
      writeParagraph("Recomendación de Lectura: Lea todos los capítulos de las guías técnicas para asimilar mejor los conceptos antes de proceder con las autoevaluaciones.", 9, 'bold', [100, 116, 139], 4);

      // --- PAGINA 4: EXAMENES ---
      addPageBreak();
      writeHeading("4. Evaluaciones y Exámenes del Alumno", 1);
      writeParagraph("Cuando el sistema valida que ha revisado con éxito todos los materiales interactivos, se desbloquea el botón 'Rendir Evaluación'.", 9.5, 'normal', [51, 65, 85], 5);
      
      writeHeading("Reglas de Exámenes", 2);
      writeParagraph("• Reloj Regresivo en Vivo: Al iniciar el test, un reloj en la esquina superior derecha indicará los minutos restantes. Si el tiempo expira, sus respuestas se enviarán automáticamente.", 9.5, 'normal', [51, 65, 85], 3);
      writeParagraph("• Puntaje de Aprobación: El estudiante debe alcanzar la nota mínima configurada para el tema (ejemplo: 80 puntos).", 9.5, 'normal', [51, 65, 85], 3);
      writeParagraph("• Retroalimentación Correctiva: Al finalizar, el sistema le mostrará las respuestas correctas frente a sus errores y una explicación didáctica para reforzar su conocimiento.", 9.5, 'normal', [51, 65, 85], 8);

      currentY += 4;
      writeParagraph("Advertencia de Examen: El recargar la pestaña del navegador durante una evaluación activa resultará en el envío inmediato de sus respuestas acumuladas.", 9, 'bold', [100, 116, 139], 4);

      // --- PAGINA 5: MENSAJERÍA Y CONSEJOS ---
      addPageBreak();
      writeHeading("5. Buzón de Mensajería y Soporte", 1);
      writeParagraph("La plataforma tiene un canal de mensajería integrado de doble vía directa con los supervisores para resolver cualquier inquietud de los temas de estudio:", 9.5, 'normal', [51, 65, 85], 5);
      
      writeHeading("Funcionamiento de Consultas", 2);
      writeParagraph("• Enviar Consulta: Pulse sobre el ícono de mensajería flotante para redactar su mensaje especificando la duda técnica de estudio o novedades administrativas.", 9.5, 'normal', [51, 65, 85], 3);
      writeParagraph("• Respuesta de Tutores: El equipo de supervisores responderá a su consulta y se le alertará mediante un globo rojo en la campana de su menú principal.", 9.5, 'normal', [51, 65, 85], 8);

      writeHeading("Consejos Prácticos para Colaboradores", 1);
      writeParagraph("Para una óptima experiencia dentro del Aula Virtual Fundametz, le aconsejamos lo siguiente:", 9.5, 'normal', [51, 65, 85], 5);
      
      writeHeading("Consejos de Éxito", 2);
      writeParagraph("• Realice las lecturas en un ambiente silencioso para captar los conceptos clínicos e industriales.", 9.5, 'normal', [51, 65, 85], 2);
      writeParagraph("• No refresque o recargue la pestaña del navegador web durante un examen activo para evitar la anulación del mismo.", 9.5, 'normal', [51, 65, 85], 2);
      writeParagraph("• Al terminar sus estudios en computadoras compartidas, use obligatoriamente el botón 'Salir' para proteger su avance personal.", 9.5, 'normal', [51, 65, 85], 10);

      currentY += 4;
      writeParagraph("Nota de Soporte de Fundametz: Si experimenta algún inconveniente técnico con la visualización de los materiales didácticos, contacte a su supervisor de área.", 9, 'bold', [100, 116, 139], 4);

      // Final signature
      currentY += 8;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text("CONSEJO DIRECTIVO - EMPRESA FUNDAMETZ", 15, currentY);
      currentY += 5;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text("Desarrollo Tecnológico y Académico de Vanguardia, 2026.", 15, currentY);

      addFooter();
      doc.save("Manual_Colaborador_Aula_Virtual_Fundametz.pdf");
    }
  };

  if (!isOpen) return null;

  const sections = manualRoleView === 'admin' 
    ? [
        { id: 'intro' as const, label: 'Introducción Supervisor', icon: <HelpCircle className="h-4 w-4 text-amber-500" /> },
        { id: 'admin_dashboard' as const, label: '1. Métricas & Analytics', icon: <Activity className="h-4 w-4" /> },
        { id: 'admin_courses' as const, label: '2. Gestión de Cursos', icon: <BookOpen className="h-4 w-4" /> },
        { id: 'admin_questions' as const, label: '3. Banco de Reactivos', icon: <CheckSquare className="h-4 w-4" /> },
        { id: 'admin_tracking' as const, label: '4. Tracking de Alumnos', icon: <Users className="h-4 w-4" /> },
        { id: 'admin_messages' as const, label: '5. Soporte & Chat Admin', icon: <Mail className="h-4 w-4" /> },
      ]
    : [
        { id: 'intro' as const, label: 'Introducción Estudiante', icon: <HelpCircle className="h-4 w-4 text-sky-500" /> },
        { id: 'login' as const, label: '1. Acceso al Sistema', icon: <Lock className="h-4 w-4" /> },
        { id: 'dashboard' as const, label: '2. Aula Virtual', icon: <BookOpen className="h-4 w-4" /> },
        { id: 'materials' as const, label: '3. Materiales de Estudio', icon: <FileText className="h-4 w-4" /> },
        { id: 'exams' as const, label: '4. Evaluaciones & Test', icon: <CheckSquare className="h-4 w-4" /> },
        { id: 'messages' as const, label: '5. Buzón de Soporte', icon: <Mail className="h-4 w-4" /> },
      ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white border-4 border-slate-900 w-full max-w-5xl h-[85vh] flex flex-col shadow-[8px_8px_0px_0px_rgba(2,132,199,1)] rounded-none overflow-hidden"
      >
        {/* MANUAL HEADER */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b-4 border-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500 text-slate-900 border border-slate-900 font-bold">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-extrabold uppercase tracking-tight text-white">Manual de Usuario & Guía Técnica</h2>
              <p className="text-[9px] uppercase tracking-widest text-sky-400 font-mono mt-0.5">
                Aula Virtual Fundametz // {manualRoleView === 'admin' ? 'CONSOLA DE SUPERVISIÓN' : 'PORTAL DEL COLABORADOR'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={downloadManualPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-slate-900 border-2 border-slate-950 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-150 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:shadow-none active:translate-y-0.5 cursor-pointer"
              title="Descargar Manual en PDF"
            >
              <Download className="h-4 w-4" />
              <span className="hidden xs:inline">Descargar PDF ({manualRoleView === 'admin' ? 'Admin' : 'Estudiante'})</span>
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white border-2 border-slate-950 font-bold uppercase transition-all duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none active:translate-y-0.5 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* MANUAL BODY */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-100">
          
          {/* SIDEBAR TABS */}
          <div className="w-64 border-r-4 border-slate-900 bg-slate-200 p-4 flex flex-col gap-2 overflow-y-auto shrink-0 select-none">
            
            {/* ROLE SWITCHER */}
            <div className="mb-2 p-2 bg-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] rounded-none">
              <p className="text-[8px] font-mono font-bold uppercase tracking-widest text-slate-500 mb-1.5">Cambiar Nivel de Manual</p>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => {
                    setManualRoleView('user');
                    setActiveSection('intro');
                  }}
                  className={`px-1 py-1.5 font-mono font-bold text-[8.5px] uppercase border text-center transition-all cursor-pointer ${
                    manualRoleView === 'user'
                      ? 'bg-sky-500 text-slate-900 border-slate-900 font-extrabold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Estudiante
                </button>
                <button
                  onClick={() => {
                    setManualRoleView('admin');
                    setActiveSection('intro');
                  }}
                  className={`px-1 py-1.5 font-mono font-bold text-[8.5px] uppercase border text-center transition-all cursor-pointer ${
                    manualRoleView === 'admin'
                      ? 'bg-amber-500 text-slate-900 border-slate-900 font-extrabold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Supervisor
                </button>
              </div>
            </div>

            <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 px-1 mt-1 mb-1">Secciones del Manual</p>
            
            {sections.map(sec => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 border-2 border-slate-900 font-mono font-bold text-[10.5px] uppercase tracking-wide text-left cursor-pointer transition-all ${
                  activeSection === sec.id
                    ? 'bg-slate-900 text-sky-400 shadow-[3px_3px_0px_0px_rgba(2,132,199,1)]'
                    : 'bg-white text-slate-700 hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-none active:translate-y-0.5'
                }`}
              >
                {sec.icon}
                <span className="truncate">{sec.label}</span>
              </button>
            ))}

            <div className="mt-auto p-3 bg-slate-900 text-sky-300 border-2 border-slate-900 font-mono text-[9px] uppercase leading-relaxed rounded-none">
              <div className="flex items-center gap-1.5 font-bold mb-1 text-white">
                <Activity className="h-3 w-3 text-sky-400" />
                SISTEMA INTEGRADO
              </div>
              <div className="space-y-0.5 text-slate-400 text-[8px]">
                <div>ROL DETECTADO: <span className={userRole === 'admin' ? 'text-amber-400 font-bold' : 'text-sky-400 font-bold'}>{userRole === 'admin' ? 'SUPERVISOR' : 'COLABORADOR'}</span></div>
                <div>MODO: <span className="text-emerald-400 font-bold">ONLINE</span></div>
                <div>BD: <span className="text-white">SUPABASE HYBRID</span></div>
              </div>
            </div>
          </div>

          {/* DOCUMENTATION CONTENT AREA */}
          <div className="flex-1 p-6 overflow-y-auto bg-white font-sans text-slate-800 space-y-6">
            
            {/* INTRUDUCTION OF THE ACTIVE VIEW */}
            {activeSection === 'intro' && (
              <div className="space-y-6">
                {manualRoleView === 'admin' ? (
                  <>
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-500 text-slate-950 border border-slate-950 uppercase tracking-widest">
                        DIRECTIVA & SUPERVISIÓN
                      </span>
                      <h3 className="text-2xl font-serif font-extrabold uppercase text-slate-900 mt-2.5">Introducción a la Consola de Supervisión Académica</h3>
                      <p className="text-slate-600 mt-2 leading-relaxed">
                        Bienvenido al manual de administración de la <strong>Empresa Fundametz</strong>. Como supervisor o entrenador del aula virtual, usted cuenta con capacidades avanzadas para configurar todo el flujo académico, subir materiales, armar el banco de reactivos para las evaluaciones de cada departamento y hacer auditorías de cumplimiento.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border-2 border-slate-900 bg-amber-50 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-none">
                        <h4 className="font-mono font-bold text-sm uppercase text-amber-950 flex items-center gap-1.5 mb-2">
                          <Shield className="h-4 w-4" /> Control de Contenidos
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Gestione los cursos activos y configúrelos por áreas corporativas específicas. Suba diapositivas interactivas, archivos PDF descargables o empotre videos, configurando un tiempo de permanencia mínimo obligatorio de estudio.
                        </p>
                      </div>

                      <div className="p-4 border-2 border-slate-900 bg-sky-50 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-none">
                        <h4 className="font-mono font-bold text-sm uppercase text-sky-950 flex items-center gap-1.5 mb-2">
                          <Users className="h-4 w-4" /> Auditoría de Colaboradores
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Consulte detalladamente las marcas de tiempo que registran el momento en que un alumno abrió o terminó de leer las diapositivas, finalizó el PDF o visualizó un video, incluyendo reset de intentos de examen.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-900 text-sky-400 border border-slate-900 uppercase tracking-widest">
                        AULA DEL ESTUDIANTE
                      </span>
                      <h3 className="text-2xl font-serif font-extrabold uppercase text-slate-900 mt-2.5">Guía del Colaborador (Estudio Autónomo)</h3>
                      <p className="text-slate-600 mt-2 leading-relaxed">
                        Bienvenidos al Aula Virtual de la <strong>Empresa Fundametz</strong>. Esta plataforma web ha sido diseñada para capacitarle de forma autónoma y eficaz en los protocolos de su área de especialización laboral (Medicina, Pirolisis, Pellet, Calidad, etc.). 
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border-2 border-slate-900 bg-sky-50 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-none">
                        <h4 className="font-mono font-bold text-sm uppercase text-sky-950 flex items-center gap-1.5 mb-2">
                          <Laptop className="h-4 w-4" /> Autoaprendizaje Guiado
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Acceda a materiales dinámicos de estudio (Presentaciones interactivas de diapositivas, videos empotrados de YouTube, guías PDF descargables) asignados por sus directores con resguardo de su progreso de lectura.
                        </p>
                      </div>

                      <div className="p-4 border-2 border-slate-900 bg-emerald-50 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-none">
                        <h4 className="font-mono font-bold text-sm uppercase text-emerald-950 flex items-center gap-1.5 mb-2">
                          <UserCheck className="h-4 w-4" /> Evaluaciones Integradas
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Resuelva exámenes interactivos tipo test con límite de tiempo, puntajes mínimos de aprobación y retroalimentación interactiva del sistema que le explica didácticamente sus errores al instante de entregar.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* ARCHITECTURE CARD SCHEMA */}
                <div className="border-2 border-slate-900 p-4 bg-slate-50">
                  <span className="text-[9px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 uppercase tracking-wider block w-max">
                    Arquitectura Académica Coordinada - Fundametz
                  </span>
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-around gap-4 text-center font-mono text-xs">
                    <div className="p-3 bg-white border border-slate-900 font-bold w-full sm:w-36 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      Portal Alumno
                      <p className="text-[9px] text-slate-500 font-normal mt-1">Estudio, Video, Examen</p>
                    </div>
                    <div className="text-slate-500 font-bold hidden sm:block">➔</div>
                    <div className="p-3 bg-slate-950 text-white border border-slate-900 font-bold w-full sm:w-36 shadow-[2px_2px_0px_0px_rgba(2,132,199,1)]">
                      Base Supabase Cloud
                      <p className="text-[9px] text-sky-300 font-normal mt-1">Auditorías, Calificaciones</p>
                    </div>
                    <div className="text-slate-500 font-bold hidden sm:block">➔</div>
                    <div className="p-3 bg-white border border-slate-900 font-bold w-full sm:w-36 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      Monitoreo Supervisor
                      <p className="text-[9px] text-slate-500 font-normal mt-1">Gestión, Estadísticas, Chat</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ====== STUDENT SECTIONS ON SCREEN ====== */}
            {manualRoleView === 'user' && activeSection === 'login' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-900 text-sky-400 border border-slate-900 uppercase tracking-widest animate-pulse">
                    ESTUDIANTE: PASO A PASO 1
                  </span>
                  <h3 className="text-2xl font-serif font-extrabold uppercase text-slate-900 mt-2.5">¿Cómo ingresar al Aula Virtual?</h3>
                  <p className="text-slate-600 mt-2 leading-relaxed">
                    ¡Ingresar a capacitarte es muy sencillo! Sigue estos simples pasos para iniciar sesión de manera correcta y segura:
                  </p>
                </div>

                <div className="border-2 border-slate-900 rounded-none overflow-hidden bg-slate-200 p-4">
                  <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-slate-300 font-mono text-[10px] text-slate-600">
                    <Laptop className="h-3.5 w-3.5 text-sky-600" /> <strong>VISTA DE PANTALLA:</strong> Formulario de Ingreso para Alumnos
                  </div>
                  <div className="max-w-sm mx-auto bg-gradient-to-br from-slate-100 via-sky-50 to-slate-200 border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-none">
                    <div className="text-center space-y-1 mb-4">
                      <div className="text-[10px] font-mono font-bold text-sky-600 uppercase tracking-widest">SISTEMA ACADÉMICO FUNDAMETZ</div>
                      <h4 className="text-base font-serif font-extrabold uppercase text-slate-900">Ingreso de Personal</h4>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[8px] font-mono font-bold text-slate-700 uppercase">Número de Cédula de Identidad</label>
                        <div className="mt-1 p-2 bg-white border border-slate-400 font-mono text-xs text-slate-500 select-none">
                          123456789
                        </div>
                      </div>
                      <div>
                        <label className="block text-[8px] font-mono font-bold text-slate-700 uppercase">Tu Contraseña Privada</label>
                        <div className="mt-1 p-2 bg-white border border-slate-400 font-mono text-xs text-slate-500 select-none">
                          ••••••••
                        </div>
                      </div>
                      <div className="bg-slate-900 text-white font-mono text-[9px] py-2 text-center border-2 border-slate-950 font-bold uppercase tracking-widest cursor-not-allowed">
                        INGRESAR AL AULA ➔
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 font-mono text-xs leading-relaxed text-slate-700">
                  <h4 className="font-bold text-slate-950 uppercase border-b-2 border-slate-900 pb-1 text-sm">Explicación detallada de los datos solicitados:</h4>
                  <div className="flex gap-3 items-start bg-sky-50 p-4 border-l-4 border-sky-500">
                    <div className="p-1 bg-sky-500 text-white font-bold rounded-sm text-[10px] uppercase shrink-0">CÉDULA</div>
                    <div>
                      <span className="font-bold text-slate-900">Tu Cédula de Identidad (Usuario):</span>
                      <p className="mt-1 text-slate-600">
                        Introduce tu número de identificación nacional sin puntos, guiones ni espacios (por ejemplo: <code className="bg-slate-200 px-1 rounded">123456789</code>). Recuerda que tu cédula está registrada previamente por Recursos Humanos de la empresa.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-sky-50 p-4 border-l-4 border-sky-500">
                    <div className="p-1 bg-sky-500 text-white font-bold rounded-sm text-[10px] uppercase shrink-0">CONTRASEÑA</div>
                    <div>
                      <span className="font-bold text-slate-900">Tu Contraseña de Seguridad:</span>
                      <p className="mt-1 text-slate-600">
                        Escribe la clave secreta que te fue asignada. Esta contraseña protege tu identidad académica para evitar que otra persona realice los exámenes a tu nombre. Si olvidas tu contraseña o la introduces con errores, ponte en contacto con tu supervisor o tutor académico para que te asigne una nueva clave temporal de inmediato.
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50 p-4 border-2 border-amber-400 space-y-1 text-slate-800">
                    <p className="font-bold flex items-center gap-1 text-amber-950 uppercase text-[11px]">
                      <AlertTriangle className="h-4 w-4 text-amber-600" /> ¡IMPORTANTE EN CASO DE ERRORES!
                    </p>
                    <p className="text-slate-600 text-xs">
                      Si el sistema te indica que el usuario o la contraseña son incorrectos, verifica que el teclado numérico esté activo y que no hayas agregado caracteres adicionales. Si el problema persiste, es posible que tu cuenta requiera ser activada por el supervisor.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {manualRoleView === 'user' && activeSection === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-900 text-sky-400 border border-slate-900 uppercase tracking-widest">
                    ESTUDIANTE: PASO A PASO 2
                  </span>
                  <h3 className="text-2xl font-serif font-extrabold uppercase text-slate-900 mt-2.5">Tu Aula Virtual: Panel de Control y Catálogo de Cursos</h3>
                  <p className="text-slate-600 mt-2 leading-relaxed">
                    Una vez que ingresas al sistema, te encontrarás en tu **Aula Virtual** o panel de estudiante. Esta pantalla recopila de forma visual y ordenada todo tu progreso para que estudies cómodamente:
                  </p>
                </div>

                <div className="border-2 border-slate-900 rounded-none overflow-hidden bg-slate-200 p-4">
                  <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-slate-300 font-mono text-[10px] text-slate-600">
                    <Laptop className="h-3.5 w-3.5 text-sky-600" /> <strong>VISTA DE PANTALLA:</strong> Panel Principal y Catálogo de Temas
                  </div>
                  <div className="bg-white border-2 border-slate-900 p-5 rounded-none space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b-2 border-slate-900">
                      <div className="text-xs font-serif font-extrabold uppercase text-slate-950">Capacitaciones Disponibles</div>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-slate-900 text-sky-400 font-mono text-[9px] font-bold border border-slate-900">PENDIENTES (2)</span>
                        <span className="px-2 py-1 bg-white text-slate-700 font-mono text-[9px] font-bold border border-slate-300">APROBADOS (1)</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white border-2 border-slate-900 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-mono font-bold px-2 py-0.5 bg-slate-900 text-sky-400">MEDICINA</span>
                          <span className="text-[8px] font-mono font-bold px-2 py-0.5 bg-amber-500 text-slate-900">EN CURSO</span>
                        </div>
                        <h5 className="font-serif font-extrabold uppercase text-sm leading-tight text-slate-950">RCP Básico de Urgencia</h5>
                        <p className="text-[10px] text-slate-500 line-clamp-2">Aprende los conceptos clave para realizar maniobras de reanimación cardiopulmonar en equipos de salud.</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                            <span>Lecturas Realizadas</span>
                            <span>1 de 2 completadas</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 border border-slate-400 p-0.5">
                            <div className="bg-sky-500 h-full w-1/2" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200 pt-2 font-mono text-[8px] text-slate-500">
                          <span>⏱ TIEMPO: 10 MINUTOS</span>
                          <span className="px-2.5 py-1 bg-slate-900 text-white font-bold border border-slate-900">ESTUDIAR ➔</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 font-mono text-xs text-slate-700">
                  <h4 className="font-bold text-slate-950 uppercase border-b-2 border-slate-900 pb-1 text-sm">Explicación detallada de todas las funciones del Aula Virtual:</h4>
                  
                  <ul className="space-y-3 list-none pl-0">
                    <li className="p-3 bg-slate-50 border border-slate-300">
                      <strong className="text-slate-900 uppercase block mb-1">📊 Panel Superior de Resumen (Tus Estadísticas):</strong>
                      <p className="text-slate-600">
                        Muestra de forma gráfica tu rendimiento. Contiene tres indicadores esenciales:
                        <br />• <span className="font-bold">Porcentaje de Avance Global:</span> Qué porcentaje total de lecturas y exámenes de la currícula de tu departamento has completado.
                        <br />• <span className="font-bold">Promedio de Notas:</span> La calificación promedio ponderada de todas las evaluaciones que has rendido y aprobado.
                        <br />• <span className="font-bold">Insignias Ganadas:</span> Diplomas e íconos de honor que se otorgan automáticamente cuando apruebas un curso con una calificación excelente.
                      </p>
                    </li>

                    <li className="p-3 bg-slate-50 border border-slate-300">
                      <strong className="text-slate-900 uppercase block mb-1">🏷 Pestañas de Filtro (Cursos):</strong>
                      <p className="text-slate-600">
                        En la parte superior de tu catálogo de temas, encontrarás tres botones de filtro interactivos:
                        <br />• <span className="font-bold">Pendientes:</span> Cursos que aún no has comenzado o en los que has reprobado la evaluación final y necesitas volver a intentar. ¡Empieza por aquí!
                        <br />• <span className="font-bold">Aprobados:</span> Cursos que ya completaste con éxito, logrando una nota igual o superior al 80%. Puedes abrirlos para repasar el material siempre que lo desees.
                        <br />• <span className="font-bold">Todos:</span> Muestra la totalidad de cursos cargados en el sistema para tu departamento sin importar su estado.
                      </p>
                    </li>

                    <li className="p-3 bg-slate-50 border border-slate-300">
                      <strong className="text-slate-900 uppercase block mb-1">🔔 Alerta de Mensajes Nuevos (Globo Rojo):</strong>
                      <p className="text-slate-600">
                        En la esquina superior derecha del Aula, verás un ícono con una campana o burbuja de chat. Si el supervisor académico te envía una respuesta a una duda o publica una instrucción administrativa, este ícono encenderá un globo de notificación rojo brillante para avisarte de inmediato.
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {manualRoleView === 'user' && activeSection === 'materials' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-900 text-sky-400 border border-slate-900 uppercase tracking-widest">
                    ESTUDIANTE: PASO A PASO 3
                  </span>
                  <h3 className="text-2xl font-serif font-extrabold uppercase text-slate-900 mt-2.5">Cómo estudiar: Lectura y Visualización Obligatoria de Materiales</h3>
                  <p className="text-slate-600 mt-2 leading-relaxed">
                    Para asegurar que el personal asimila correctamente los conocimientos antes de someterse a evaluación, la plataforma posee un sistema de verificación estricto. **No podrás rendir el examen hasta que el sistema marque todas las lecturas como completadas**. Sigue estas pautas para cada formato:
                  </p>
                </div>

                <div className="space-y-4 font-mono text-xs text-slate-700">
                  <div className="p-4 border-2 border-slate-900 bg-white space-y-3 shadow-[3px_3px_0px_0px_rgba(2,132,199,1)]">
                    <h4 className="font-mono font-bold text-sm uppercase text-slate-950 flex items-center gap-1.5 border-b-2 border-slate-900 pb-1.5">
                      <Laptop className="h-4 w-4 text-sky-600" /> 1. Presentaciones de Diapositivas (Carrusel de Slides)
                    </h4>
                    <p className="text-slate-600 leading-relaxed">
                      Este material contiene textos resumidos e imágenes explicativas clave:
                      <br />• <span className="font-bold">Cómo navegar:</span> Usa los botones de flecha <span className="font-bold">"Siguiente" (➔)</span> y <span className="font-bold">"Anterior" (⮨)</span> para avanzar y retroceder a tu propio ritmo.
                      <br />• <span className="font-bold">Regla de validación:</span> El sistema audita que pases por **absolutamente todas las diapositivas**. Si te saltas diapositivas o no llegas al final de la presentación, el botón de examen seguirá bloqueado mostrando el mensaje: <code className="bg-rose-50 text-rose-700 border border-rose-200 px-1 font-bold">"Revisa todas las diapositivas primero"</code>.
                    </p>
                  </div>

                  <div className="p-4 border-2 border-slate-900 bg-white space-y-3 shadow-[3px_3px_0px_0px_rgba(16,185,129,1)]">
                    <h4 className="font-mono font-bold text-sm uppercase text-slate-950 flex items-center gap-1.5 border-b-2 border-slate-900 pb-1.5">
                      <Play className="h-4 w-4 text-emerald-600" /> 2. Videos de YouTube y Videos Educativos
                    </h4>
                    <p className="text-slate-600 leading-relaxed">
                      El contenido audiovisual ilustra maniobras industriales o médicas complejas:
                      <br />• <span className="font-bold">Cómo funciona:</span> Haz clic en el botón de reproducción del video.
                      <br />• <span className="font-bold">Regla del temporizador inteligente:</span> El sistema tiene un contador de segundos que exige que permanezcas mirando el material un tiempo mínimo proporcional a su duración real.
                      <br />• <span className="font-bold">¡Cuidado!</span> Si intentas adelantar el video de manera artificial o cambias de pestaña, el temporizador de validación se detendrá. Debes visualizarlo con atención durante el tiempo sugerido para que la lectura cuente como completada.
                    </p>
                  </div>

                  <div className="p-4 border-2 border-slate-900 bg-white space-y-3 shadow-[3px_3px_0px_0px_rgba(59,130,246,1)]">
                    <h4 className="font-mono font-bold text-sm uppercase text-slate-950 flex items-center gap-1.5 border-b-2 border-slate-900 pb-1.5">
                      <FileText className="h-4 w-4 text-blue-600" /> 3. Guías Clínicas y Operativas en PDF
                    </h4>
                    <p className="text-slate-600 leading-relaxed">
                      Estos documentos detallan normativas técnicas oficiales para tu labor:
                      <br />• <span className="font-bold">Cómo leerlos:</span> El visor interactivo de PDF te permite leer el archivo directamente en pantalla.
                      <br />• <span className="font-bold">Regla de lectura obligatoria:</span> Debes desplazar la barra de scroll (desplazamiento vertical) de manera consciente **hasta la última línea de la última página**. Al detectar que finalizaste el scroll total, el sistema guardará el registro exitoso de lectura de PDF.
                      <br />• <span className="font-bold">Función de descarga:</span> Cuentas con un botón de descarga para guardar una copia local del PDF en tu celular o computadora y consultarla sin internet cuando gustes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {manualRoleView === 'user' && activeSection === 'exams' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-900 text-sky-400 border border-slate-900 uppercase tracking-widest">
                    ESTUDIANTE: PASO A PASO 4
                  </span>
                  <h3 className="text-2xl font-serif font-extrabold uppercase text-slate-900 mt-2.5">Cómo rendir Evaluaciones y Exámenes Interactivos</h3>
                  <p className="text-slate-600 mt-2 leading-relaxed">
                    Al cumplir con la revisión teórica total de las lecturas obligatorias, se activará el botón brillante **"Rendir Evaluación"**. Al hacer clic, se cargará el simulador de examen con las siguientes reglas detalladas:
                  </p>
                </div>

                <div className="border-2 border-slate-900 bg-slate-50 p-4 space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-slate-300 pb-2">
                    <span className="text-xs font-mono font-bold uppercase text-slate-700">MUESTRA DE EVALUACIÓN</span>
                    <span className="px-2 py-0.5 bg-rose-600 text-white font-mono text-[9px] font-bold">⏱ TIEMPO: 09:45 MINUTOS RESTANTES</span>
                  </div>
                  <div className="bg-white border border-slate-300 p-4 font-mono text-xs space-y-3">
                    <p className="font-bold text-slate-900">¿El RCP de emergencia básico en adultos requiere compresiones de al menos 5 cm de profundidad?</p>
                    <div className="space-y-2 pt-2">
                      <div className="p-2.5 bg-sky-50 border-2 border-sky-500 text-sky-950 font-bold flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-4 border-sky-500 flex items-center justify-center bg-white" />
                        Verdadero (Tu Respuesta Seleccionada)
                      </div>
                      <div className="p-2.5 bg-white border border-slate-300 text-slate-600 flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border border-slate-300 bg-white" />
                        Falso
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs text-slate-700">
                  <h4 className="font-bold text-slate-950 uppercase border-b-2 border-slate-900 pb-1 text-sm">Funcionamiento detallado de las evaluaciones:</h4>
                  <ul className="list-decimal pl-5 space-y-3 leading-relaxed">
                    <li>
                      <strong>Examen Diagnóstico Inicial vs. Examen Final:</strong>
                      <br />• <span className="font-bold">Test de Diagnóstico:</span> Es una prueba breve previa que se realiza **antes de leer el material**. No tiene validez para tu promedio final y sirve para registrar cuánto conocías sobre el tema de antemano.
                      <br />• <span className="font-bold">Examen Evaluativo:</span> Es la prueba definitiva post-lectura. Esta evaluación sí cuenta para tu récord oficial y requiere un mínimo de <span className="font-bold">80% de aciertos</span> para ser aprobada.
                    </li>
                    <li>
                      <strong>Cuenta Regresiva en Tiempo Real:</strong>
                      <br />En la esquina superior derecha verás un cronómetro que descuenta los minutos y segundos disponibles (generalmente 10 o 15 minutos). Si el reloj llega a <code className="bg-rose-50 text-rose-700 border px-1 rounded font-bold">00:00</code> antes de que presiones enviar, el sistema recopilará automáticamente tus opciones seleccionadas hasta ese momento y entregará tu prueba para no anularla.
                    </li>
                    <li>
                      <strong>Retroalimentación Didáctica Inmediata:</strong>
                      <br />Al entregar tu evaluación, la plataforma te dirá inmediatamente tu calificación. Adicionalmente, verás el examen resuelto: en cada respuesta incorrecta que hayas tenido, el sistema te mostrará de color rojo tu error, marcará la opción correcta en verde y habilitará un cuadro informativo titulado <span className="font-bold text-indigo-700">"Explicación Didáctica"</span> para enseñarte las razones técnicas y médicas detrás de la respuesta correcta.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {manualRoleView === 'user' && activeSection === 'messages' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-900 text-sky-400 border border-slate-900 uppercase tracking-widest">
                    ESTUDIANTE: PASO A PASO 5
                  </span>
                  <h3 className="text-2xl font-serif font-extrabold uppercase text-slate-900 mt-2.5">¿Cómo usar el Buzón de Soporte y Chat Académico?</h3>
                  <p className="text-slate-600 mt-2 leading-relaxed">
                    ¿Te ha surgido alguna duda sobre la materia de estudio, los videos, las leyes operativas, o has tenido algún contratiempo con una evaluación? Tu Aula Virtual posee un canal de mensajería directo para escribirte con los tutores de Fundametz:
                  </p>
                </div>

                <div className="border-2 border-slate-900 rounded-none overflow-hidden bg-slate-200 p-4">
                  <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-slate-300 font-mono text-[10px] text-slate-600">
                    <Mail className="h-3.5 w-3.5 text-sky-600" /> <strong>VISTA DE PANTALLA:</strong> Panel de Soporte y Envío de Inquietudes
                  </div>
                  <div className="bg-white border border-slate-950 p-4 font-mono text-xs space-y-4">
                    <div className="space-y-2 max-h-[150px] overflow-y-auto p-2 bg-slate-50 border border-slate-200">
                      <div className="bg-sky-100 p-2 border-l-2 border-sky-600 max-w-[85%]">
                        <p className="text-[9px] font-bold text-sky-900">COLABORADOR (Tú)</p>
                        <p className="text-[10px] mt-0.5">Estimado tutor, ¿cuántos intentos tengo permitidos si llego a reprobar el test de RCP?</p>
                      </div>
                      <div className="bg-slate-100 p-2 border-l-2 border-slate-800 max-w-[85%] ml-auto text-right">
                        <p className="text-[9px] font-bold text-slate-900">SOPORTE ACADÉMICO FUNDAMETZ</p>
                        <p className="text-[10px] mt-0.5">Hola. El sistema te permite rendir el test hasta aprobarlo. Si necesitas un reseteo de tus lecturas previas, avísanos por esta vía.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs text-slate-700">
                  <h4 className="font-bold text-slate-950 uppercase border-b-2 border-slate-900 pb-1 text-sm">Instrucciones para redactar y leer tus respuestas:</h4>
                  <ul className="list-decimal pl-5 space-y-2.5 leading-relaxed">
                    <li>
                      <strong>Abrir la Mensajería:</strong> Pulsa sobre el ícono de la burbuja de chat flotante o la campana del menú principal para desplegar la ventana de soporte.
                    </li>
                    <li>
                      <strong>Elegir el Tema del Curso:</strong> Selecciona de la lista desplegable el curso específico sobre el cual tienes tu consulta (ej. "RCP Básico" o "Higiene en Planta"). Esto ayuda a los supervisores a entender el contexto de tu duda más rápido.
                    </li>
                    <li>
                      <strong>Redactar y Enviar:</strong> Escribe tu duda en el campo de texto con total claridad y educación, luego presiona el botón <span className="font-bold">"Enviar" (➔)</span>. El mensaje se guardará de forma segura en la base de datos de Supabase.
                    </li>
                    <li>
                      <strong>Revisar Respuestas:</strong> Cuando el equipo de directores responda tu pregunta, recibirás una alerta visual en la barra superior mediante un indicador rojo. Al abrir el chat, verás las respuestas nuevas de tus tutores organizadas cronológicamente para que no pierdas ningún detalle.
                    </li>
                  </ul>
                </div>
              </div>
            )}


            {/* ====== SUPERVISOR SECTIONS ON SCREEN ====== */}
            {manualRoleView === 'admin' && activeSection === 'admin_dashboard' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-500 text-slate-950 border border-slate-950 uppercase tracking-widest animate-pulse">
                    SUPERVISOR: GUÍA DE CONTROL 1
                  </span>
                  <h3 className="text-2xl font-serif font-extrabold uppercase text-slate-900 mt-2.5">Dashboard del Administrador: Métricas y Análisis de Desempeño</h3>
                  <p className="text-slate-600 mt-2 leading-relaxed">
                    Al ingresar con tus credenciales directivas (<code className="bg-slate-200 px-1 rounded text-slate-900">admin</code> y contraseña <code className="bg-slate-200 px-1 rounded text-slate-900">2026</code>), el sistema te conducirá a la **Consola de Supervisión**. Esta primera pestaña te brinda un análisis estadístico avanzado del avance académico de la organización:
                  </p>
                </div>

                {/* GRAPH/METRIC MOCKUP */}
                <div className="border-2 border-slate-900 rounded-none overflow-hidden bg-slate-200 p-4">
                  <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-slate-300 font-mono text-[10px] text-slate-600">
                    <Activity className="h-3.5 w-3.5 text-amber-600" /> <strong>MOCKUP DE INTERFAZ:</strong> Cuadro de Control Académico y Distribución por Departamento
                  </div>
                  <div className="bg-white border-2 border-slate-900 p-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                      <div className="p-2 border border-slate-300 bg-amber-50">
                        <div className="text-[8px] font-mono font-bold text-slate-500">PROMEDIO GLOBAL</div>
                        <div className="text-sm font-mono font-extrabold text-amber-600">8.2 / 10 pts</div>
                      </div>
                      <div className="p-2 border border-slate-300 bg-sky-50">
                        <div className="text-[8px] font-mono font-bold text-slate-500">ALUMNOS ACTIVOS</div>
                        <div className="text-sm font-mono font-extrabold text-sky-600">45 Colaboradores</div>
                      </div>
                      <div className="p-2 border border-slate-300 bg-emerald-50">
                        <div className="text-[8px] font-mono font-bold text-slate-500">CURSOS ACTIVOS</div>
                        <div className="text-sm font-mono font-extrabold text-emerald-600">12 Publicados</div>
                      </div>
                      <div className="p-2 border border-slate-300 bg-slate-100">
                        <div className="text-[8px] font-mono font-bold text-slate-500">APROBACIÓN TOTAL</div>
                        <div className="text-sm font-mono font-extrabold text-slate-800">87.5% Tasa</div>
                      </div>
                    </div>
                    
                    <div className="p-3 border border-slate-300 bg-slate-50 space-y-2">
                      <p className="text-[9px] font-mono font-bold text-slate-700 uppercase">CALIFICACIONES PROMEDIO POR DEPARTAMENTO CORPORATIVO</p>
                      <div className="space-y-1 text-[9px] font-mono">
                        <div className="flex justify-between"><span>MEDICINA / SOPORTE:</span> <span className="font-bold">92.5 pt</span></div>
                        <div className="w-full bg-slate-200 h-2 border border-slate-300 rounded-none"><div className="bg-amber-500 h-full w-[92%]" /></div>
                        
                        <div className="flex justify-between mt-2"><span>PLANTA DE PELLET / PIROLISIS:</span> <span className="font-bold">78.4 pt</span></div>
                        <div className="w-full bg-slate-200 h-2 border border-slate-300 rounded-none"><div className="bg-sky-500 h-full w-[78%]" /></div>
                        
                        <div className="flex justify-between mt-2"><span>CALIDAD / CONTROL INDUSTRIAL:</span> <span className="font-bold">84.1 pt</span></div>
                        <div className="w-full bg-slate-200 h-2 border border-slate-300 rounded-none"><div className="bg-emerald-500 h-full w-[84%]" /></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 font-mono text-xs text-slate-700">
                  <h4 className="font-bold text-slate-950 uppercase border-b-2 border-slate-900 pb-1 text-sm">Explicación detallada de los datos estadísticos disponibles:</h4>
                  
                  <ul className="space-y-3 list-none pl-0">
                    <li className="p-3 bg-slate-50 border border-slate-300">
                      <strong className="text-slate-900 uppercase block mb-1">📈 Bloques de Indicadores Clave (KPIs):</strong>
                      <p className="text-slate-600">
                        Te otorgan un diagnóstico inmediato del estado de la academia:
                        <br />• <span className="font-bold">Promedio Global de Notas:</span> Suma y promedia las notas de todos los exámenes aprobados en el sistema. Te ayuda a auditar si el nivel del contenido es muy complejo o asimilable.
                        <br />• <span className="font-bold">Alumnos Activos:</span> Número total de colaboradores que han ingresado al Aula y cuentan con progreso de estudio registrado.
                        <br />• <span className="font-bold">Cursos Publicados:</span> Cantidad total de temas cargados que los alumnos pueden estudiar.
                        <br />• <span className="font-bold">Tasa de Aprobación:</span> Qué proporción de colaboradores logró aprobar las evaluaciones con 80 puntos o más.
                      </p>
                    </li>

                    <li className="p-3 bg-slate-50 border border-slate-300">
                      <strong className="text-slate-900 uppercase block mb-1">📊 Gráfico de Rendimiento por Departamento:</strong>
                      <p className="text-slate-600">
                        Gráfico interactivo animado que organiza el promedio de notas de los alumnos agrupados por su respectivo departamento laboral de Fundametz. Permite detectar al instante si el departamento de "Planta Pellet" o "Logística", por ejemplo, posee un rendimiento bajo para tomar medidas de apoyo pedagógico.
                      </p>
                    </li>

                    <li className="p-3 bg-slate-50 border border-slate-300">
                      <strong className="text-slate-900 uppercase block mb-1">📥 Exportador de Reportes de Calificaciones:</strong>
                      <p className="text-slate-600">
                        En la parte superior, dispones del botón de exportación masiva. Al pulsarlo, el sistema extraerá toda la base de datos de calificaciones en tiempo real de Supabase y te generará una descarga automática de reporte con nombres de colaboradores, cédulas, departamentos, cursos estudiados y notas obtenidas. Ideal para auditorías internas de calidad.
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {manualRoleView === 'admin' && activeSection === 'admin_courses' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-500 text-slate-950 border border-slate-950 uppercase tracking-widest">
                    SUPERVISOR: GUÍA DE CONTROL 2
                  </span>
                  <h3 className="text-2xl font-serif font-extrabold uppercase text-slate-900 mt-2.5">Gestión de Contenidos: Crear y Modificar Cursos</h3>
                  <p className="text-slate-600 mt-2 leading-relaxed">
                    Como supervisor, eres el encargado de alimentar la currícula de la organización. A través del botón **"Crear Nuevo Curso"**, se abrirá una ventana interactiva donde puedes cargar los materiales de estudio paso a paso:
                  </p>
                </div>

                {/* FORM MOCKUP */}
                <div className="border-2 border-slate-900 bg-slate-100 p-4 space-y-3">
                  <p className="text-[9px] font-mono font-bold text-slate-600 uppercase">FORMULARIO DEL CREADOR DE CAPACITACIONES (VISTA SIMPLIFICADA)</p>
                  <div className="bg-white border border-slate-400 p-4 space-y-3 text-xs font-mono text-slate-700">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] font-bold mb-1 uppercase">Nombre del Tema / Curso</label>
                        <div className="p-2 bg-slate-50 border border-slate-300 text-[10px] text-slate-500 select-none">
                          Pirolisis e Higiene en Planta Industrial
                        </div>
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold mb-1 uppercase">Área Operativa Destinataria</label>
                        <div className="p-2 bg-slate-50 border border-slate-300 text-[10px] text-slate-500 select-none">
                          PIROLISIS / PELLET
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 items-center pt-1">
                      <label className="flex items-center gap-1.5 text-[9px] text-slate-600">
                        <input type="checkbox" checked readOnly className="h-3.5 w-3.5" />
                        Examen Diagnóstico Inicial Obligatorio
                      </label>
                      <label className="flex items-center gap-1.5 text-[9px] text-slate-600">
                        <input type="checkbox" checked readOnly className="h-3.5 w-3.5" />
                        Validación de Lectura Obligatoria
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 font-mono text-xs text-slate-700">
                  <h4 className="font-bold text-slate-950 uppercase border-b-2 border-slate-900 pb-1 text-sm">Pasos detallados para configurar y publicar un curso:</h4>
                  
                  <ol className="list-decimal pl-5 space-y-3 leading-relaxed">
                    <li>
                      <strong>Paso 1: Identificación y Target del Curso:</strong>
                      <br />• <span className="font-bold">Título:</span> Escribe un nombre claro e instructivo (ej. "Manejo Seguro de Autoclaves").
                      <br />• <span className="font-bold">Descripción:</span> Explica brevemente qué aprenderá el alumno con este material.
                      <br />• <span className="font-bold">Área Corporativa (Target Area):</span> Selecciona el departamento específico de Fundametz que está obligado a realizar el curso. Si deseas que sea de acceso global para todo el personal de la empresa, selecciona la opción "TODAS las áreas" o déjala vacía.
                    </li>
                    <li>
                      <strong>Paso 2: Reglas de Avance (Casillas de Verificación):</strong>
                      <br />• <span className="font-bold">Check "Examen Diagnóstico Inicial":</span> Si lo activas, el alumno tendrá que contestar de manera obligatoria un breve test exploratorio previo. Útil para medir el nivel de entrada del personal.
                      <br />• <span className="font-bold">Check "Es de Lectura Obligatoria":</span> Activa el bloqueo inteligente del sistema. Los alumnos no podrán presionar el botón "Rendir Evaluación" hasta que hayan interactuado con cada diapositiva, visto el video durante el tiempo programado y hecho scroll total al PDF adjunto.
                    </li>
                    <li>
                      <strong>Paso 3: Cargar Materiales Interactivos:</strong>
                      <br />• <span className="font-bold">Presentación de Diapositivas:</span> Añade tantos cuadros (slides) de texto e ilustraciones como necesites. Los alumnos los navegarán en forma de carrusel.
                      <br />• <span className="font-bold">Video Educativo:</span> Ingresa un enlace web válido de YouTube. Configura el tiempo de visualización mínimo obligatorio en minutos o segundos.
                      <br />• <span className="font-bold">Documento PDF:</span> Enlaza el documento de guía técnica que el alumno podrá estudiar en pantalla o descargar.
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {manualRoleView === 'admin' && activeSection === 'admin_questions' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-500 text-slate-950 border border-slate-950 uppercase tracking-widest">
                    SUPERVISOR: GUÍA DE CONTROL 3
                  </span>
                  <h3 className="text-2xl font-serif font-extrabold uppercase text-slate-900 mt-2.5">Banco de Reactivos: Configuración de Exámenes</h3>
                  <p className="text-slate-600 mt-2 leading-relaxed">
                    Usted puede crear las preguntas asociadas a las evaluaciones, definir puntajes por reactivo, y programar tiempos máximos para combatir la suplantación o fraude académico.
                  </p>
                </div>

                <div className="space-y-3 font-mono text-xs text-slate-700">
                  <h4 className="font-bold text-slate-950 uppercase border-b-2 border-slate-900 pb-1 text-sm">Paso a paso para crear un examen de alta seguridad:</h4>
                  <ul className="list-decimal pl-5 space-y-3 leading-relaxed">
                    <li>
                      <strong>Paso 1: Seleccionar el Curso de Destino:</strong>
                      <br />Elige de la lista el curso específico al que deseas incorporar la evaluación (ej. "Higiene y Sanitización").
                    </li>
                    <li>
                      <strong>Paso 2: Estructurar las Preguntas (Reactivos):</strong>
                      <br />Haz clic en "Añadir Pregunta" para cargar un nuevo enunciado. Define el tipo de pregunta:
                      <br />• <span className="font-bold">Opción Múltiple:</span> Permite ingresar hasta 4 alternativas posibles de respuesta. Recuerda tildar la casilla de verificación a la derecha de la alternativa que representa la respuesta correcta en el mundo real.
                      <br />• <span className="font-bold">Verdadero o Falso:</span> Ingresa el enunciado de tu aseveración y selecciona el botón de radio correspondiente para indicarle al sistema cuál de los dos estados representa la respuesta correcta.
                    </li>
                    <li>
                      <strong>Paso 3: Definir Parámetros Técnicos de Seguridad:</strong>
                      <br />• <span className="font-bold">Tiempo Límite del Examen:</span> Define los minutos que tiene el estudiante para contestar la evaluación (se aconseja configurar 10 minutos). Esto evita la suplantación y la consulta de apuntes externos en exceso.
                      <br />• <span className="font-bold">Barajado Aleatorio:</span> Al marcar esta casilla, el orden de las preguntas y sus opciones cambiará de manera aleatoria para cada colaborador, dificultando el intercambio de claves correctas entre alumnos.
                      <br />• <span className="font-bold">Nota de Aprobación Mínima:</span> Configura el porcentaje mínimo exigido para aprobar (por defecto establecido en 80%).
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {manualRoleView === 'admin' && activeSection === 'admin_tracking' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-500 text-slate-950 border border-slate-950 uppercase tracking-widest animate-pulse">
                    SUPERVISOR: GUÍA DE CONTROL 4
                  </span>
                  <h3 className="text-2xl font-serif font-extrabold uppercase text-slate-900 mt-2.5">Seguimiento Exhaustivo de Alumnos (Auditoría Académica Continua)</h3>
                  <p className="text-slate-600 mt-2 leading-relaxed">
                    Para certificar de forma fidedigna que los colaboradores de Fundametz leen los manuales y miran los videos educativos en lugar de saltearse el contenido, la plataforma dispone de un motor de logs de auditoría en la pestaña **"Usuarios"**:
                  </p>
                </div>

                {/* TRACKING PREVIEW */}
                <div className="border-2 border-slate-900 bg-slate-100 p-4 space-y-2">
                  <p className="text-[9px] font-mono font-bold text-slate-600 uppercase">EJEMPLO DE LOG DE SEGUIMIENTO RECOPILADO EN LA NUBE (DETALLE DE AUDITORÍA)</p>
                  <div className="bg-white border border-slate-400 p-3 font-mono text-[9px] space-y-1.5 text-slate-700">
                    <div className="flex justify-between border-b pb-1 font-bold text-slate-900 text-[10px] uppercase">
                      <span>COLABORADOR EN EVALUACIÓN: Juan Pérez</span>
                      <span>CÉDULA: 123456789</span>
                    </div>
                    <div>• Diapositiva N° 1 leída a las: <span className="text-slate-900 font-bold">14:22:05 - 08/07/2026</span></div>
                    <div>• Diapositiva N° 2 leída a las: <span className="text-slate-900 font-bold">14:23:40 - 08/07/2026</span></div>
                    <div>• Video clínico de YouTube reproducido durante: <span className="text-emerald-600 font-bold">320 segundos (Visualización Completa Certificada)</span></div>
                    <div>• Scroll del archivo de soporte PDF finalizado a las: <span className="text-slate-900 font-bold">14:28:15 - 08/07/2026</span></div>
                    <div>• Examen de Evaluación: <span className="text-emerald-600 font-extrabold">APROBADO (9.0 de 10 pts) - Duración: 215 segundos</span></div>
                  </div>
                </div>

                <div className="space-y-4 font-mono text-xs text-slate-700">
                  <h4 className="font-bold text-slate-950 uppercase border-b-2 border-slate-900 pb-1 text-sm">Cómo supervisar y auditar de forma efectiva:</h4>
                  
                  <ul className="space-y-3 list-none pl-0">
                    <li className="p-3 bg-slate-50 border border-slate-300">
                      <strong className="text-slate-900 uppercase block mb-1">🔍 Buscar a un Estudiante:</strong>
                      <p className="text-slate-600">
                        Introduce el nombre o número de cédula del colaborador en el buscador de la pestaña de usuarios. De inmediato el sistema filtrará la grilla mostrando su ficha académica.
                      </p>
                    </li>

                    <li className="p-3 bg-slate-50 border border-slate-300">
                      <strong className="text-slate-900 uppercase block mb-1">📝 Examinar Logs de Lectura (Marcas de Tiempo):</strong>
                      <p className="text-slate-600">
                        Haz clic sobre la fila del estudiante para expandir su historial. Observarás las marcas de tiempo exactas (horas, minutos y segundos) registradas cada vez que el alumno completó una lectura. Esto te permite confrontar al colaborador con datos irrefutables si alega no haber tenido tiempo de estudiar.
                      </p>
                    </li>

                    <li className="p-3 bg-slate-50 border border-slate-300">
                      <strong className="text-slate-900 uppercase block mb-1">🔄 Resetear Progreso e Intentos de Examen:</strong>
                      <p className="text-slate-600">
                        Si un estudiante reprueba constantemente, tiene problemas con su servicio de internet a mitad de un examen o requiere re-estudiar los materiales teóricos, dispones de un botón especial de color rojo llamado <span className="font-bold">"Resetear Progreso"</span>. Al presionarlo, se borrará su progreso anterior para ese curso en la base de datos de Supabase, habilitando al colaborador a repasar las diapositivas y rendir la prueba desde cero.
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {manualRoleView === 'admin' && activeSection === 'admin_messages' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-500 text-slate-950 border border-slate-950 uppercase tracking-widest">
                    SUPERVISOR: GUÍA DE CONTROL 5
                  </span>
                  <h3 className="text-2xl font-serif font-extrabold uppercase text-slate-900 mt-2.5">Centro de Soporte Académico y Respuestas de Mensajería</h3>
                  <p className="text-slate-600 mt-2 leading-relaxed">
                    La pestaña **"Mensajes"** unifica la correspondencia académica de todos los alumnos de la organización. Te permite brindar soporte asincrónico instantáneo para evacuar dudas pedagógicas y operativas:
                  </p>
                </div>

                <div className="space-y-4 font-mono text-xs text-slate-700">
                  <h4 className="font-bold text-slate-950 uppercase border-b-2 border-slate-900 pb-1 text-sm">Cómo gestionar las consultas del personal:</h4>
                  
                  <ol className="list-decimal pl-5 space-y-3 leading-relaxed">
                    <li>
                      <strong>Identificar Consultas Nuevas (Indicador Rojo):</strong>
                      <br />En tu barra lateral de chat verás el listado de alumnos ordenados de forma descendente según la fecha de su último mensaje. Las conversaciones que poseen consultas sin responder encenderán un círculo rojo vibrante para captar tu atención pedagógica de forma prioritaria.
                    </li>
                    <li>
                      <strong>Revisar Contexto del Mensaje:</strong>
                      <br />Haz clic sobre el nombre del colaborador para abrir la conversación. En la cabecera del chat, el sistema te indicará con precisión sobre qué curso específico de la currícula el alumno está manifestando su inquietud (evitando rodeos y agilizando la respuesta).
                    </li>
                    <li>
                      <strong>Redactar y Enviar la Respuesta:</strong>
                      <br />Escribe tus explicaciones en el campo inferior de respuesta y presiona el botón <span className="font-bold">"Enviar Respuesta"</span>. De inmediato, se enviará la respuesta con cifrado seguro a Supabase y se alertará al estudiante en su panel personal.
                    </li>
                  </ol>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* MANUAL FOOTER */}
        <div className="bg-slate-200 border-t-4 border-slate-900 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <Smartphone className="h-4 w-4" />
            <span>Nivel de Vista del Manual Actualizado en Tiempo Real (v2.6.4).</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={downloadManualPDF}
              className="w-full sm:w-auto px-5 py-2 bg-sky-500 hover:bg-sky-600 text-slate-900 font-mono font-bold text-xs uppercase tracking-wider border-2 border-slate-950 transition-all duration-150 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-none active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="h-4 w-4" />
              Descargar PDF {manualRoleView === 'admin' ? 'Admin' : 'Estudiante'}
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider border-2 border-slate-950 transition-all duration-150 shadow-[3px_3px_0px_0px_rgba(2,132,199,1)] hover:shadow-none active:translate-y-0.5 cursor-pointer"
            >
              Entendido y Cerrar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
