-- Migration pour créer les tables de coaching
-- Date: 2025-01-29
-- Description: Création des tables coaches, sessions, reviews et availabilities

-- Table des coaches
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

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_coaches_specialties ON coaches USING gin(specialties);
CREATE INDEX IF NOT EXISTS idx_coaches_email ON coaches(email);
CREATE INDEX IF NOT EXISTS idx_sessions_coach_id ON sessions("coachId");
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_reviews_coach_id ON reviews("coachId");
CREATE INDEX IF NOT EXISTS idx_availabilities_coach_id ON availabilities("coachId");
CREATE INDEX IF NOT EXISTS idx_availabilities_date ON availabilities(date);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();