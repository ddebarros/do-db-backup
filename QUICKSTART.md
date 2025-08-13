# 🚀 Quick Start Guide

Get your DigitalOcean PostgreSQL backup script running in 5 minutes!

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment

```bash
# Copy the example environment file
cp env.example .env

# Edit with your actual values
nano .env  # or use your preferred editor
```

**Required values to set in `.env`:**

- `DB_HOST` - Your DigitalOcean PostgreSQL host
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `SPACES_ACCESS_KEY_ID` - Your Spaces API key
- `SPACES_SECRET_ACCESS_KEY` - Your Spaces secret key
- `SPACES_BUCKET_NAME` - Your Spaces bucket name

## 3. Test Your Setup

```bash
# Validate configuration
./backup.sh install

# Test database connection
./backup.sh test
```

## 4. Create Your First Backup

```bash
# Create a backup
./backup.sh backup

# Or test connection first, then backup
./backup.sh backup-with-test
```

## 5. List Existing Backups

```bash
./backup.sh list
```

## 🎯 That's It!

Your backup script is now ready to use. You can:

- **Run manually**: `./backup.sh backup`
- **Set up automation**: See `cron-example.txt` for cron job examples
- **Get help**: `./backup.sh help`

## 🔧 Troubleshooting

If you encounter issues:

1. **Check configuration**: `node validate-config.js`
2. **Verify prerequisites**: Ensure `pg_dump` is installed
3. **Test connection**: `./backup.sh test`
4. **Check logs**: Look for error messages in the output

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Set up automated backups using cron jobs
- Configure backup retention policies
- Monitor backup success/failure

---

**Need help?** Check the [README.md](README.md) or run `./backup.sh help`
