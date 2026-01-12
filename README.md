# Notes App - Supabase Auth + CRUD

A simple note-taking application demonstrating Supabase authentication and Row Level Security (RLS).

## Features

- ✅ Email/password authentication (signup & login)
- ✅ Secure CRUD operations on notes (Create, Read, Update, Delete)
- ✅ Users can only view/edit their own notes
- ✅ Row Level Security (RLS) enforced at database level
- ✅ Note editing functionality

## Architecture Decisions

### 1. Row Level Security (RLS)
**Decision**: Enabled RLS on the `notes` table with four separate policies.

**Rationale**: 
- RLS provides database-level security that cannot be bypassed by client code
- Even if someone gets the API keys, they cannot access other users' data
- Policies are checked on every database operation automatically

### 2. Policy Structure
Created four separate policies instead of one combined policy:
- **SELECT**: Users can view their own notes (`auth.uid() = user_id`)
- **INSERT**: Users can create notes with their own user_id
- **UPDATE**: Users can modify their own notes
- **DELETE**: Users can delete their own notes

**Rationale**: Separate policies are more maintainable and follow the principle of least privilege.

### 3. Foreign Key with CASCADE DELETE
```sql
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
```

**Rationale**: When a user account is deleted from Supabase Auth, all their notes are automatically removed, preventing orphaned data.

### 4. UUID Primary Keys
Used UUID instead of auto-incrementing integers.

**Rationale**: 
- UUIDs are globally unique and don't expose record count
- Better for distributed systems and security
- Supabase default pattern

### 5. Timestamps
Added `created_at` and `updated_at` with automatic trigger.

**Rationale**: 
- Audit trail for when notes are created/modified
- Useful for sorting and displaying
- `updated_at` trigger ensures it's always accurate

### 6. Client-Side Framework Choice
Used vanilla JavaScript with Supabase JS client instead of React/Vue.

**Rationale**: 
- Simplicity - no build tools required
- Easy to understand for demonstration
- Shows core Supabase concepts clearly
- Can be easily migrated to any framework

### 7. No Email Confirmation (Development)
Disabled email confirmation for testing.

**Rationale**: 
- Speeds up development and testing
- Real production apps should enable this
- Can use fake emails for testing

### 8. Index on user_id
```sql
CREATE INDEX notes_user_id_idx ON notes(user_id);
```

**Rationale**: 
- Speeds up queries filtering by user_id
- Most common query pattern in this app
- Small performance overhead on writes, significant benefit on reads

## Database Schema

```sql
notes
├── id (UUID, PRIMARY KEY)
├── title (TEXT, NOT NULL)
├── content (TEXT)
├── user_id (UUID, FOREIGN KEY → auth.users)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

## Security Model

### Authentication Flow
1. User signs up → Supabase creates entry in `auth.users`
2. User logs in → Supabase returns JWT token
3. Token is automatically included in all subsequent requests
4. `auth.uid()` function extracts user ID from token

### RLS Policy Enforcement
Every database query automatically:
1. Checks if user is authenticated
2. Verifies user_id matches auth.uid()
3. Only returns/modifies matching rows

**Example**: 
```sql
SELECT * FROM notes;
-- Automatically becomes:
SELECT * FROM notes WHERE user_id = auth.uid();
```

**Expected Behavior**:
- Users can only see their own notes
- Users can't modify/delete other users' notes
- Users can't access notes table without being logged in

## File Structure

```
project/
├── index.html          # Main HTML page
├── app.js              # JavaScript application logic
├── app.css             # Stylesheet
├── config.js           # Supabase configuration
├── schema.sql          # Database schema + RLS policies
└── README.md          # Documentation
```


## API Endpoints (via Supabase)

All operations go through Supabase client:

- `supabase.auth.signUp()` - Create account
- `supabase.auth.signInWithPassword()` - Login
- `supabase.auth.signOut()` - Logout
- `supabase.from('notes').select()` - Read notes
- `supabase.from('notes').insert()` - Create note
- `supabase.from('notes').update()` - Update note
- `supabase.from('notes').delete()` - Delete note
