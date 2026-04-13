# Development Setup Guide

## Prerequisites

- **Node.js 20 or newer** - [Download from nodejs.org](https://nodejs.org/en/download)
- **Git** - For cloning the repository
- **Optional: Docker** - For containerized deployment

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url> lab-journal
cd lab-journal
```

### 2. Install Dependencies

Run the automated installation script:

```bash
# For Windows, Linux, and macOS:
node scripts/install-all.mjs
```

This script will:
- Install all npm dependencies
- Create `.env` with a cryptographic key
- Generate Prisma client
- Apply database schema
- Start the development server at `http://localhost:3000`

### 3. First Login

If the database is empty, use these default credentials:
- **Username**: `admin`
- **Password**: `admin`

The system will automatically create the main administrator account.

### 4. Environment Configuration

The installation script creates a basic `.env` file. For production or advanced setup, configure these variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
NEXTAUTH_SECRET="your-secure-random-string-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: External Services
# Add any external API keys or service URLs here
```

Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

## Docker Deployment

For production environments, use Docker for consistent deployment.

### 1. Prepare Environment

```bash
cp .env.example .env
# Edit .env with production values
```

### 2. Build and Run

```bash
docker compose up -d --build
```

The application will be available at the configured `NEXTAUTH_URL`.

## Database Management

### Initial Setup
The installation script handles initial database setup. To manually set up:

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma db push

# Optional: Seed with sample data
npx prisma db seed
```

### Backup Database
Create a hot backup of the SQLite database:

```bash
npm run backup
```

Backups are stored in the `backups/` directory.

## Data Import/Export

### Excel Import
1. Place your `data.xlsx` file in the `./docs/sample-data/` directory
2. Log in as an `ADMIN` user
3. Go to Administration section
4. Click "Import" - the current database will be cleared and Excel data imported

### CSV Export
Export current database snapshot to CSV through the UI or API.

## Testing

### Unit Tests
```bash
npm run test:unit
```

### E2E Tests
```bash
npm run test:e2e
```

### All Tests
```bash
npm test
```

## Development Scripts

Available npm scripts in `package.json`:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run backup` - Create database backup
- `npm run logs:collect` - Collect diagnostic logs
- `npm run ota:check` - Check for over-the-air updates

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   # Kill process on port 3000
   npx kill-port 3000
   ```

2. **Database connection issues**
   - Ensure `dev.db` file exists in project root
   - Check `DATABASE_URL` in `.env`

3. **Build failures**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   ```

### Diagnostic Tools

- `npm run logs:collect` - Creates diagnostic bundle in `support/` directory
- Check `support/logs-<timestamp>/` for detailed error information
- Review browser console and server logs for debugging

## Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed project organization.

## Contributing

1. Follow the coding conventions in [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Run tests before committing
3. Use conventional commit messages
4. Update documentation for significant changes