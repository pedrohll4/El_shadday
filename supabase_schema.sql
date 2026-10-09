-- ==============================================================================
-- SCHEMA SUPABASE: RESTAURANTE & BUFFET EL SHADDAY (DADOS 100% REAIS)
-- ==============================================================================
-- Execute este script no SQL Editor do seu projeto Supabase (https://supabase.com/dashboard)
-- Cria todas as tabelas com os dados reais de Ariquemes - RO e habilita o Realtime.
-- ==============================================================================

-- 1. TABELA DE PEDIDOS (KDS Cozinha & Delivery)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    delivery_address JSONB,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) DEFAULT 0,
    delivery_fee NUMERIC(10, 2) DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_method TEXT,
    change_for NUMERIC(10, 2),
    status TEXT NOT NULL DEFAULT 'RECEBIDO', -- 'RECEBIDO', 'EM_PREPARO', 'PRONTO', 'EM_ENTREGA', 'CONCLUIDO', 'CANCELADO'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);

-- 2. TABELA DE ORÇAMENTOS RECEBIDOS (Buffet El Shadday)
CREATE TABLE IF NOT EXISTS public.buffet_quotes (
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    event_type TEXT NOT NULL,
    guests_count INTEGER NOT NULL DEFAULT 1,
    event_date DATE,
    event_time TEXT,
    selected_items JSONB NOT NULL DEFAULT '{}'::jsonb,
    meat_selection JSONB DEFAULT '[]'::jsonb,
    estimated_price NUMERIC(10, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDENTE', -- 'PENDENTE', 'EM_CONTATO', 'CONFIRMADO', 'RECUSADO'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.buffet_quotes (created_at DESC);

-- 3. TABELA DA GALERIA DINÂMICA DE FOTOS (Carrossel & Álbum)
CREATE TABLE IF NOT EXISTS public.buffet_gallery (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    category TEXT NOT NULL DEFAULT 'churrasco',
    tag TEXT DEFAULT 'Buffet El Shadday',
    type TEXT DEFAULT 'image', -- 'image' ou 'video'
    thumbnail TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.buffet_gallery ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'image';
ALTER TABLE public.buffet_gallery ADD COLUMN IF NOT EXISTS thumbnail TEXT;

CREATE INDEX IF NOT EXISTS idx_gallery_category ON public.buffet_gallery (category);

-- 3.1 LIMPAR FOTOS FAKES/PADRÃO PARA DEIXAR A GALERIA LIVRE PARA AS FOTOS REAIS DO BUFFET
DELETE FROM public.buffet_gallery WHERE id LIKE 'gal_%' OR url LIKE '%unsplash.com%';
UPDATE public.company_settings SET buffet_gallery = '[]'::jsonb WHERE id = 'el_shadday_config' AND buffet_gallery::text LIKE '%unsplash.com%';

-- 4. TABELA DE CONFIGURAÇÕES GERAIS DA EMPRESA (COM DADOS REAIS DE ARIQUEMES - RO)
CREATE TABLE IF NOT EXISTS public.company_settings (
    id TEXT PRIMARY KEY DEFAULT 'el_shadday_config',
    name TEXT NOT NULL DEFAULT 'El Shadday Serviços de Buffet',
    short_name TEXT DEFAULT 'El Shadday',
    tagline TEXT DEFAULT 'Seu evento merece uma experiência inesquecível.',
    subtitle TEXT DEFAULT 'Buffet personalizado para casamentos, formaturas, aniversários e eventos corporativos.',
    experience_years TEXT DEFAULT 'Mais de 15 anos',
    phone TEXT NOT NULL DEFAULT '5569992228682',
    phone_display TEXT DEFAULT '(69) 99222-8682',
    address TEXT DEFAULT 'Rua Maceió, 2333 - Setor 03, Ariquemes - RO',
    city TEXT DEFAULT 'Ariquemes - RO',
    instagram TEXT DEFAULT '@elshadday_buffet',
    instagram_url TEXT DEFAULT 'https://instagram.com',
    logo_url TEXT DEFAULT 'https://assets.olaclick.app/companies/logos/67bb7c61-2505-4b36-a16c-6a4979bb3651.png',
    banner_url TEXT DEFAULT 'https://assets.olaclick.app/companies/backgrounds/dfd052f1-d436-49bb-a996-f2f05ce0d456.webp',
    pix_key TEXT DEFAULT '69992228682',
    pix_name TEXT DEFAULT 'El Shadday Delivery',
    banner_incluso TEXT DEFAULT 'JÁ INCLUSO GARÇONS, PRATARIA, TAÇAS, RECHAUDS E TALHERES',
    delivery_active BOOLEAN DEFAULT false,
    buffet_active BOOLEAN DEFAULT true,
    menu_products JSONB DEFAULT '[]'::jsonb,
    promo_settings JSONB DEFAULT '{}'::jsonb,
    pizza_flavors JSONB DEFAULT '[]'::jsonb,
    buffet_gallery JSONB DEFAULT '[]'::jsonb,
    card_machine_notice TEXT DEFAULT '⚠️ Pagamentos no cartão (débito ou crédito) possuem taxa da maquininha cobrada pela operadora. Consulte as condições na entrega.',
    card_machine_notice_active BOOLEAN DEFAULT true,
    card_machine_settings JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Garantir colunas se a tabela já existir no Supabase
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS menu_products JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS promo_settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS pizza_flavors JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS buffet_gallery JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS card_machine_notice TEXT DEFAULT '⚠️ Pagamentos no cartão (débito ou crédito) possuem taxa da maquininha cobrada pela operadora. Consulte as condições na entrega.';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS card_machine_notice_active BOOLEAN DEFAULT true;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS card_machine_settings JSONB DEFAULT '{}'::jsonb;

-- Inserir / Atualizar com os dados reais exatos
INSERT INTO public.company_settings (
    id, 
    name, 
    short_name,
    tagline, 
    subtitle,
    experience_years,
    phone, 
    phone_display, 
    address, 
    city,
    instagram, 
    instagram_url,
    logo_url, 
    banner_url, 
    pix_key,
    pix_name,
    banner_incluso,
    delivery_active,
    buffet_active
)
VALUES (
    'el_shadday_config',
    'El Shadday Serviços de Buffet',
    'El Shadday',
    'Seu evento merece uma experiência inesquecível.',
    'Buffet personalizado para casamentos, formaturas, aniversários e eventos corporativos.',
    'Mais de 15 anos',
    '5569992228682',
    '(69) 99222-8682',
    'Rua Maceió, 2333 - Setor 03, Ariquemes - RO',
    'Ariquemes - RO',
    '@elshadday_buffet',
    'https://instagram.com',
    'https://assets.olaclick.app/companies/logos/67bb7c61-2505-4b36-a16c-6a4979bb3651.png',
    'https://assets.olaclick.app/companies/backgrounds/dfd052f1-d436-49bb-a996-f2f05ce0d456.webp',
    '69992228682',
    'El Shadday Delivery',
    'JÁ INCLUSO GARÇONS, PRATARIA, TAÇAS, RECHAUDS E TALHERES',
    false,
    true
)
ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    phone_display = EXCLUDED.phone_display,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    instagram = EXCLUDED.instagram,
    logo_url = EXCLUDED.logo_url,
    banner_url = EXCLUDED.banner_url,
    pix_key = EXCLUDED.pix_key,
    pix_name = EXCLUDED.pix_name,
    banner_incluso = EXCLUDED.banner_incluso;

-- 5. SEGURANÇA E POLÍTICAS RLS (Row Level Security)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buffet_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buffet_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acesso público a pedidos' AND tablename = 'orders') THEN
    CREATE POLICY "Acesso público a pedidos" ON public.orders FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acesso público a orçamentos' AND tablename = 'buffet_quotes') THEN
    CREATE POLICY "Acesso público a orçamentos" ON public.buffet_quotes FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acesso público à galeria' AND tablename = 'buffet_gallery') THEN
    CREATE POLICY "Acesso público à galeria" ON public.buffet_gallery FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acesso público a configurações' AND tablename = 'company_settings') THEN
    CREATE POLICY "Acesso público a configurações" ON public.company_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 6. HABILITAR SINCRONIZAÇÃO EM TEMPO REAL (REALTIME PARA COZINHA E PAINEL)
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.buffet_quotes REPLICA IDENTITY FULL;
ALTER TABLE public.buffet_gallery REPLICA IDENTITY FULL;
ALTER TABLE public.company_settings REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'buffet_quotes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.buffet_quotes;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'buffet_gallery'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.buffet_gallery;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'company_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.company_settings;
  END IF;
END $$;

-- 7. CRIAR BUCKET PÚBLICO PARA FOTOS E VÍDEOS (SUPABASE STORAGE)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acesso público a arquivos da galeria' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Acesso público a arquivos da galeria" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Upload público de arquivos da galeria' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Upload público de arquivos da galeria" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Update público de arquivos da galeria' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Update público de arquivos da galeria" ON storage.objects FOR UPDATE USING (bucket_id = 'gallery');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Delete público de arquivos da galeria' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Delete público de arquivos da galeria" ON storage.objects FOR DELETE USING (bucket_id = 'gallery');
  END IF;
END $$;

