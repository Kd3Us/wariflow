-- Base de données de développement pour le coaching
-- Création des tables avec données de test

-- Table des coachs
CREATE TABLE IF NOT EXISTS coaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    avatar VARCHAR,
    specialties TEXT[] DEFAULT '{}',
    rating DECIMAL(2,1) DEFAULT 0,
    "reviewsCount" INTEGER DEFAULT 0,
    "hourlyRate" DECIMAL(6,2) NOT NULL,
    bio TEXT NOT NULL,
    experience INTEGER NOT NULL,
    certifications TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    timezone VARCHAR NOT NULL,
    "isOnline" BOOLEAN DEFAULT false,
    "responseTime" VARCHAR NOT NULL,
    "nextAvailableSlot" TIMESTAMP,
    "totalSessions" INTEGER DEFAULT 0,
    "successRate" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "coachId" UUID NOT NULL,
    "userId" VARCHAR NOT NULL,
    date TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL,
    status VARCHAR CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
    topic VARCHAR NOT NULL,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_session_coach FOREIGN KEY ("coachId") REFERENCES coaches(id) ON DELETE CASCADE
);

-- Table de l'historique des sessions
CREATE TABLE IF NOT EXISTS session_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID,
    coach_id UUID REFERENCES coaches(id),
    user_id VARCHAR NOT NULL,
    coach_name VARCHAR NOT NULL,
    date TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL,
    topic VARCHAR NOT NULL,
    notes TEXT,
    objectives TEXT[],
    outcomes TEXT[],
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    next_steps TEXT[],
    tags TEXT[],
    status VARCHAR DEFAULT 'completed',
    progress JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des feedbacks détaillés
CREATE TABLE IF NOT EXISTS detailed_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_history_id UUID REFERENCES session_histories(id),
    user_id VARCHAR NOT NULL,
    coach_id UUID REFERENCES coaches(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    categories JSONB,
    positive_aspects TEXT[],
    improvement_areas TEXT[],
    would_recommend BOOLEAN DEFAULT true,
    coach_response TEXT,
    coach_response_date TIMESTAMP,
    is_public BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des documents de session
CREATE TABLE IF NOT EXISTS session_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_history_id UUID REFERENCES session_histories(id),
    name VARCHAR NOT NULL,
    original_name VARCHAR NOT NULL,
    url VARCHAR NOT NULL,
    mime_type VARCHAR,
    size_bytes BIGINT,
    type VARCHAR,
    uploaded_by VARCHAR NOT NULL,
    description TEXT,
    tags TEXT[],
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des avis
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "coachId" UUID NOT NULL,
    "userId" VARCHAR NOT NULL,
    "userName" VARCHAR NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    "sessionTopic" VARCHAR NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_coach FOREIGN KEY ("coachId") REFERENCES coaches(id) ON DELETE CASCADE
);

-- Table des disponibilités
CREATE TABLE IF NOT EXISTS availabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "coachId" UUID NOT NULL,
    date DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "isBooked" BOOLEAN DEFAULT false,
    price DECIMAL(6,2) NOT NULL,
    CONSTRAINT fk_availability_coach FOREIGN KEY ("coachId") REFERENCES coaches(id) ON DELETE CASCADE
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_coaches_specialties ON coaches USING gin(specialties);
CREATE INDEX IF NOT EXISTS idx_coaches_email ON coaches(email);
CREATE INDEX IF NOT EXISTS idx_sessions_coach_id ON sessions("coachId");
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_session_histories_user_id ON session_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_session_histories_coach_id ON session_histories(coach_id);
CREATE INDEX IF NOT EXISTS idx_reviews_coach_id ON reviews("coachId");
CREATE INDEX IF NOT EXISTS idx_availabilities_coach_id ON availabilities("coachId");

-- Fonction de mise à jour automatique des timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour les timestamps
CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DONNÉES DE TEST
INSERT INTO coaches (name, email, "hourlyRate", bio, experience, specialties, languages, timezone, "responseTime") VALUES
('Sarah Martin', 'sarah.martin@dev.local', 75.00, 'Expert en leadership et développement managérial avec plus de 8 ans d''expérience.', 8, ARRAY['Leadership', 'Management', 'Communication'], ARRAY['Français', 'Anglais'], 'Europe/Paris', '< 24h'),
('Thomas Dubois', 'thomas.dubois@dev.local', 65.00, 'Spécialiste en transition de carrière et développement professionnel.', 5, ARRAY['Carrière', 'Transition', 'Développement personnel'], ARRAY['Français', 'Anglais'], 'Europe/Paris', '< 48h'),
('Marie Leclerc', 'marie.leclerc@dev.local', 85.00, 'Coach en entrepreneuriat et innovation, accompagne les startups et entrepreneurs.', 10, ARRAY['Entrepreneuriat', 'Innovation', 'Stratégie'], ARRAY['Français', 'Anglais', 'Espagnol'], 'Europe/Paris', '< 12h');

-- Quelques sessions d'exemple
INSERT INTO session_histories (session_id, coach_id, user_id, coach_name, date, duration, topic, notes, rating, feedback, status) VALUES
((SELECT id FROM coaches WHERE name = 'Sarah Martin'), (SELECT id FROM coaches WHERE name = 'Sarah Martin'), 'user-dev-123', 'Sarah Martin', NOW() - INTERVAL '7 days', 60, 'Leadership & Management', 'Excellente session sur les techniques de leadership moderne', 5, 'Session très enrichissante, beaucoup d''exemples concrets.', 'completed'),
((SELECT id FROM coaches WHERE name = 'Thomas Dubois'), (SELECT id FROM coaches WHERE name = 'Thomas Dubois'), 'user-dev-123', 'Thomas Dubois', NOW() - INTERVAL '3 days', 45, 'Transition de carrière', 'Discussion sur les opportunités dans le tech', 4, 'Très utile pour clarifier mes objectifs professionnels.', 'completed');

-- Messages de confirmation
SELECT 'Base de données de développement coaching initialisée avec succès !' as message;