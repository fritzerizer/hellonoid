-- Skapa profiles-tabell för användarhantering
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktivera Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Användare kan läsa sin egen profil
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- Policy: Admins kan läsa alla profiler
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policy: Användare kan uppdatera sin egen profil (utom role)
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Förhindra att användare ändrar sin egen roll
  (OLD.role = NEW.role OR auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ))
);

-- Function: Automatiskt skapa profil när användare registrerar sig
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'member');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Kör funktionen när ny användare skapas
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Kommentar: Migration för användarhantering och admin-system
COMMENT ON TABLE profiles IS 'Användarprofiler för admin-system och rollhantering';