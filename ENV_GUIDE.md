# Environment Configuration Guide

This project uses environment files to manage different deployment environments. Here's how it works:

## 📁 Environment Files

| File | Purpose | Source Control |
|------|---------|----------------|
| `.env` | Current active environment | ❌ Ignored (auto-generated) |
| `.env.local` | Local development settings | ✅ Committed (safe) |
| `.env.production` | Production settings | ❌ Ignored (contains secrets) |
| `.env.backup` | Backup copy | ❌ Ignored |

## 🔄 Quick Environment Switching

### Check Current Environment
```bash
npm run env:status
```

### Switch to Local Development
```bash
npm run env:local
```
- Uses local Supabase instance
- Safe for development and testing
- No risk to production data

### Switch to Production
```bash
npm run env:prod
```
- Uses production Supabase instance
- ⚠️ **CAUTION**: Working with live data
- Only use for deployments and production operations

## 🏗️ Environment Details

### Local Development (`.env.local`)
```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```
- **Database**: Local Supabase container
- **Port**: 54321 (API), 54322 (PostgreSQL)
- **Credentials**: Default postgres/postgres

### Production (`.env.production`)
```bash
VITE_SUPABASE_URL=https://pxosfkpgsqkkfhtfkdog.supabase.co
DATABASE_URL=postgresql://postgres.pxo...@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```
- **Database**: Production Supabase instance
- **Host**: AWS US-West-1
- **Credentials**: Production service account

## 🚀 Common Workflows

### Starting Development
```bash
# 1. Check current environment
npm run env:status

# 2. Switch to local if needed
npm run env:local

# 3. Start local Supabase
supabase start

# 4. Start development server
npm run dev
```

### Deploying to Production
```bash
# 1. Switch to production environment
npm run env:prod

# 2. Run migrations (if needed)
supabase db push

# 3. Load data (if needed)
npm run yaml:load

# 4. Build and deploy
npm run build
```

### Loading Data

#### To Local Database
```bash
npm run env:local
npm run yaml:load
```

#### To Production Database
```bash
npm run env:prod
npm run yaml:load  # ⚠️ CAUTION: This affects production!
```

## 🔒 Security Best Practices

1. **Never commit `.env.production`** - Contains production secrets
2. **Always check environment** before running operations
3. **Use `npm run env:status`** frequently
4. **Keep local/production credentials separate**
5. **Backup production data** before major changes

## 🐛 Troubleshooting

### Wrong Environment
```bash
# Check what environment you're in
npm run env:status

# Switch to correct environment
npm run env:local  # or npm run env:prod
```

### Missing Environment File
```bash
# Copy from the template
cp .env.local .env           # For local development
cp .env.production .env      # For production (if file exists)
```

### Database Connection Issues
```bash
# Local: Make sure Supabase is running
supabase status
supabase start

# Production: Check environment and credentials
npm run env:status
```

## 📝 Environment Variables Reference

### Required for All Environments
- `VITE_SUPABASE_URL` - Supabase API URL
- `VITE_SUPABASE_ANON_KEY` - Public anon key
- `SERVICE_ROLE` - Admin service role key
- `DATABASE_URL` - Full PostgreSQL connection string

### Database Connection Variables
- `user` - Database username
- `password` - Database password  
- `host` - Database host
- `port` - Database port
- `dbname` - Database name

### Optional Variables
- `pg_password` - Convenience password variable
- `DIRECT_URL` - Direct database connection (bypasses pooler)

## 🔧 Manual Environment Setup

If the automated switching doesn't work:

### Create Local Environment
```bash
cat > .env << 'EOF'
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
EOF
```

### Create Production Environment
Ask your team lead for the production `.env.production` file with real credentials.

---

💡 **Pro Tip**: Always run `npm run env:status` before running any database operations to make sure you're in the right environment!