-- ============================================================================
-- SCHEMAS Y TABLAS PARA LA INTEGRACIÓN CON SUPABASE (ACTUALIZADO CON LLAVES TEXT)
-- Plataforma: Aula Virtual Fundametz
-- ============================================================================

-- Eliminar disparadores y funciones antiguas si existen
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Eliminar tablas existentes para recrearlas limpiamente
DROP TABLE IF EXISTS public.user_assignments CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.course_reviews CASCADE;
DROP TABLE IF EXISTS public.user_progress CASCADE;
DROP TABLE IF EXISTS public.quiz_attempts CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.topics CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. TABLA: PROFILES (Perfiles de usuario)
-- Tipo de llave primaria cambiado a TEXT para soportar IDs del frontend como 'admin-1' o 'usr-1715493012000'
CREATE TABLE public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    area TEXT CHECK (area IN (
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
    )),
    password_hash TEXT NOT NULL, -- Columna crítica requerida para la verificación de contraseñas
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABLA: TOPICS (Temas o cursos de capacitación)
CREATE TABLE public.topics (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    min_score_to_pass INTEGER NOT NULL DEFAULT 70 CHECK (min_score_to_pass BETWEEN 0 AND 100),
    max_attempts INTEGER NOT NULL DEFAULT 3,
    time_limit_minutes INTEGER NOT NULL DEFAULT 0,
    randomize_questions BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    due_date DATE,
    target_areas TEXT[] DEFAULT '{}', -- Áreas designadas para este tema
    has_initial_quiz BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABLA: MATERIALS (Materiales didácticos por tema con soporte para Storage)
CREATE TABLE public.materials (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('document', 'video', 'interactive', 'pdf', 'pptx')),
    content TEXT NOT NULL, -- Contenido didáctico o instrucciones en formato Markdown
    url TEXT, -- URL externa (ej: YouTube o Vimeo)
    
    -- ===== CAMPOS DE ALMACENAMIENTO DE ARCHIVOS (SUPABASE STORAGE) =====
    file_path TEXT,      -- Ruta del archivo en el bucket (ej: "materials/course-123/introduccion.pptx")
    file_url TEXT,       -- Enlace público directo generado por Supabase Storage
    file_size INTEGER,   -- Tamaño del archivo en bytes
    file_name TEXT,      -- Nombre original del archivo cargado (ej: "Guía de Seguridad.pptx")
    
    estimated_minutes INTEGER NOT NULL DEFAULT 5 CHECK (estimated_minutes > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLA: QUESTIONS (Preguntas de evaluaciones para diagnóstico o examen final)
CREATE TABLE public.questions (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options TEXT[] NOT NULL, -- Array con los textos de las opciones (ej: ARRAY['A', 'B'])
    correct_option_index INTEGER NOT NULL CHECK (correct_option_index >= 0),
    type TEXT NOT NULL DEFAULT 'final' CHECK (type IN ('initial', 'final')),
    format TEXT NOT NULL DEFAULT 'multiple' CHECK (format IN ('multiple', 'true_false')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABLA: QUIZ_ATTEMPTS (Historial de intentos de exámenes realizados por colaboradores)
CREATE TABLE public.quiz_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    topic_title TEXT NOT NULL,
    score NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0.00 AND 100.00), -- Porcentaje de puntaje
    answers JSONB NOT NULL DEFAULT '{}'::jsonb, -- Relación pregunta_id -> índice_respuesta_seleccionada
    passed BOOLEAN NOT NULL,
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 0),
    attempt_number INTEGER NOT NULL CHECK (attempt_number >= 1),
    type TEXT NOT NULL DEFAULT 'final' CHECK (type IN ('initial', 'final')),
    taken_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABLA: USER_PROGRESS (Seguimiento del progreso detallado en cada tema)
CREATE TABLE public.user_progress (
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    completed_material_ids TEXT[] DEFAULT '{}', -- Materiales leídos o vistos (IDs tipo TEXT)
    quiz_status TEXT NOT NULL DEFAULT 'not_started' CHECK (quiz_status IN ('not_started', 'failed', 'passed')),
    highest_score NUMERIC(5,2),
    attempts_count INTEGER NOT NULL DEFAULT 0,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    initial_quiz_completed BOOLEAN NOT NULL DEFAULT false,
    initial_quiz_score NUMERIC(5,2),
    PRIMARY KEY (user_id, topic_id)
);

-- 7. TABLA: COURSE_REVIEWS (Comentarios de retroalimentación)
CREATE TABLE public.course_reviews (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    satisfaction_rating INTEGER, -- 0-3 satisfaction
    clarity_rating INTEGER      -- 0-3 clarity
);

-- 8. TABLA: MESSAGES (Mensajería interna del buzón, automáticos o manuales)
CREATE TABLE public.messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    recipient_id TEXT NOT NULL, -- ID del usuario específico o el comodín 'ALL'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('automatic_progress', 'automatic_due_date', 'manual')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    topic_id TEXT REFERENCES public.topics(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. TABLA: USER_ASSIGNMENTS (Opcional: Entregables de archivos subidos por el colaborador)
CREATE TABLE public.user_assignments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,   -- Ruta en el bucket "submissions"
    file_url TEXT NOT NULL,    -- URL pública del entregable
    file_name TEXT NOT NULL,   -- Nombre original
    file_size INTEGER,         -- Tamaño en bytes
    comments TEXT,             -- Comentarios adicionales
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- SEGURIDAD DE NIVEL DE FILA (ROW LEVEL SECURITY - RLS)
-- ============================================================================

-- Activar RLS en todas las tablas creadas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assignments ENABLE ROW LEVEL SECURITY;

-- Crear políticas universales de acceso total para permitir lectura/escritura 
-- tanto a clientes anónimos con API Key (anon) como autenticados.
CREATE POLICY "Permitir todo a anon y authenticated" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a anon y authenticated" ON public.topics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a anon y authenticated" ON public.materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a anon y authenticated" ON public.questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a anon y authenticated" ON public.quiz_attempts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a anon y authenticated" ON public.user_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a anon y authenticated" ON public.course_reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a anon y authenticated" ON public.messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a anon y authenticated" ON public.user_assignments FOR ALL USING (true) WITH CHECK (true);


-- ============================================================================
-- GUÍA DE ALMACENAMIENTO DE ARCHIVOS (SUPABASE STORAGE)
-- ============================================================================
-- Para habilitar la carga de archivos en Supabase, ejecute las siguientes
-- instrucciones en el SQL Editor de Supabase o configure los Buckets en la sección "Storage" de su panel:
--
-- 1. Cree un bucket público llamado 'materials' para diapositivas (.pptx), PDFs, etc.
-- 2. Cree un bucket privado o público llamado 'submissions' para entregables de colaboradores.
-- 
-- Políticas de seguridad para el Bucket 'materials':
-- Configure acceso de lectura público (SELECT), y de escritura (INSERT, UPDATE) para todos.
--
-- Políticas de seguridad para el Bucket 'submissions':
-- Configure acceso de inserción (INSERT) y lectura (SELECT) público o para todos.
-- ============================================================================
