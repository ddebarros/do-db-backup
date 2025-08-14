# DigitalOcean PostgreSQL Database Backup Tool

A Node.js script to automatically backup PostgreSQL databases hosted on DigitalOcean and upload the backups to DigitalOcean Spaces.

## Features

- 🔄 Automated PostgreSQL database backups using `pg_dump`
- ☁️ Direct upload to DigitalOcean Spaces
- 🧪 Database connection testing
- 📋 List and manage existing backups
- 🎯 Configurable backup naming and organization
- 🧹 Automatic local file cleanup
- 📊 Detailed logging and progress indicators

## Prerequisites

- Node.js 14+ installed
- `pg_dump` command-line tool available in PATH
- DigitalOcean PostgreSQL database
- DigitalOcean Spaces bucket
- Spaces API keys with appropriate permissions

## Installation

1. Clone or download this repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment configuration:

   ```bash
   cp env.example .env
   ```

4. Edit `.env` with your actual configuration values

## Configuration

Create a `.env` file with the following variables:

### Database Configuration

```env
DB_HOST=your-db-host.digitaloceanspaces.com
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_SSL=true
```

### DigitalOcean Spaces Configuration

```env
SPACES_ACCESS_KEY_ID=your_spaces_access_key
SPACES_SECRET_ACCESS_KEY=your_spaces_secret_key
SPACES_BUCKET_NAME=your_bucket_name
SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
SPACES_REGION=nyc3
```

### Backup Configuration

```env
BACKUP_PREFIX=postgres-backups
```

## Usage

### Basic Commands

```bash
# Create a backup (default action)
npm start
# or
npm run backup
# or
node backup.js

# Test database connection
node backup.js test

# List existing backups
node backup.js list

# Test connection and create backup
node backup.js backup-with-test

# Wait for specified time
node backup.js wait              # Wait 5 minutes with 5s updates (default)
node backup.js wait 10           # Wait 10 minutes with 5s updates
node backup.js wait 5 10         # Wait 5 minutes with 10s updates
```

### Command Line Options

```bash
# Show help
node backup.js --help

# Show version
node backup.js --version
```

## How It Works

1. **Connection Test**: The script first tests the database connection
2. **Database Dump**: Uses `pg_dump` to create a SQL backup file
3. **Upload to Spaces**: Uploads the backup file to your DigitalOcean Spaces bucket
4. **Cleanup**: Removes the local backup file to save disk space
5. **Logging**: Provides detailed progress information throughout the process

## Backup File Naming

Backups are automatically named with timestamps:

- Format: `backup_YYYY-MM-DD_HH-mm-ss.sql`
- Example: `backup_2024-01-15_14-30-25.sql`

## Spaces Organization

Backups are organized in your Spaces bucket under the configured prefix:

```
your-bucket/
└── postgres-backups/
    ├── backup_2024-01-15_14-30-25.sql
    ├── backup_2024-01-16_09-15-10.sql
    └── ...
```

## Error Handling

The script includes comprehensive error handling:

- Database connection failures
- `pg_dump` execution errors
- Spaces upload failures
- Automatic cleanup on errors
- Detailed error messages for troubleshooting

## Security Considerations

- Store sensitive credentials in `.env` file (never commit to version control)
- Use Spaces API keys with minimal required permissions
- Consider using environment-specific `.env` files for different deployments
- Regularly rotate API keys and database passwords

## Automation

### Cron Job Example

Add to your crontab for daily backups at 2 AM:

```bash
0 2 * * * cd /path/to/do-db-backup && /usr/bin/node backup.js >> /var/log/db-backup.log 2>&1
```

### Docker Usage

```dockerfile
FROM node:16-alpine

RUN apk add --no-cache postgresql-client

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
CMD ["node", "backup.js"]
```

## Troubleshooting

### Common Issues

1. **pg_dump not found**

   - Install PostgreSQL client tools
   - Ensure `pg_dump` is in your PATH

2. **Database connection failed**

   - Verify database credentials
   - Check firewall rules and network access
   - Ensure SSL configuration is correct

3. **Spaces upload failed**

   - Verify Spaces API keys
   - Check bucket permissions
   - Ensure bucket exists and is accessible

4. **Permission denied**
   - Check file permissions
   - Ensure write access to current directory

### Debug Mode

For detailed debugging, you can modify the script to add more verbose logging or run with additional environment variables.

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve this tool.

## License

MIT License - see LICENSE file for details.

## Support

For issues related to:

- **This script**: Create an issue in this repository
- **DigitalOcean services**: Contact DigitalOcean support
- **PostgreSQL**: Refer to PostgreSQL documentation
