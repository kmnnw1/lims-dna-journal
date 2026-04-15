# Database Schema Documentation

## Overview
The Lab Journal uses SQLite as the database with Prisma ORM for type-safe database access. The schema is designed to track laboratory specimens, PCR attempts, sequencing results, and audit logs.

## Models

### User
Represents system users with authentication and authorization.

**Fields:**
- `id`: UUID primary key
- `username`: Unique username for login
- `password`: Hashed password
- `role`: User role (default: "EDITOR")
- `createdAt`: Account creation timestamp

### Specimen
Core entity representing biological specimens in the lab.

**Fields:**
- `id`: UUID primary key
- `taxon`: Taxonomic classification
- `locality`: Collection location
- `collector`: Person who collected the specimen
- `collectedAt`: Collection date and time
- `collectNotes`: Additional collection notes
- `extrLab`: Extraction laboratory
- `extrOperator`: Extraction operator
- `extrMethod`: Extraction method used
- `extrDateRaw`: Raw extraction date string
- `extrDate`: Parsed extraction date
- `dnaMeter`: DNA measurement instrument
- `measDate`: DNA measurement date
- `measOperator`: Measurement operator
- `dnaConcentration`: DNA concentration value
- `dnaProfile`: DNA profile information
- `measComm`: Measurement comments
- `imageUrl`: URL to specimen image
- `itsStatus`: ITS sequencing status
- `itsGb`: ITS GenBank accession
- `ssuStatus`: SSU sequencing status
- `ssuGb`: SSU GenBank accession
- `lsuStatus`: LSU sequencing status
- `lsuGb`: LSU GenBank accession
- `mcm7Status`: MCM7 sequencing status
- `mcm7Gb`: MCM7 GenBank accession
- `notes`: General notes
- `importOrigin`: Source of import data
- `importRow`: Row number in import file
- `importNotes`: Import-related notes
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

**Relationships:**
- `attempts`: One-to-many with PcrAttempt

### PcrAttempt
Represents individual PCR amplification attempts.

**Fields:**
- `id`: UUID primary key
- `specimenId`: Foreign key to Specimen
- `date`: Attempt date (default: now)
- `marker`: Genetic marker targeted
- `forwardPrimer`: Forward primer sequence
- `reversePrimer`: Reverse primer sequence
- `dnaMatrix`: DNA matrix used
- `volume`: Reaction volume
- `polymerase`: DNA polymerase used
- `cycler`: PCR machine used
- `cycles`: Number of cycles
- `annealingTemp`: Annealing temperature
- `extensionTime`: Extension time
- `result`: PCR result (SUCCESS, FAILED, etc.)
- `resultNotes`: Additional result notes
- `createdAt`: Record creation timestamp

**Relationships:**
- `specimen`: Many-to-one with Specimen



### AuditLog
Tracks all changes and actions in the system for compliance and debugging.

**Fields:**
- `id`: UUID primary key
- `userId`: User who performed the action
- `action`: Action type (CREATE_SPECIMEN, UPDATE_SPECIMEN, etc.)
- `resourceType`: Type of resource affected (SPECIMEN, PCR_ATTEMPT, etc.)
- `resourceId`: ID of the affected resource
- `details`: JSON string with action details
- `changes`: JSON string with before/after values
- `ipAddress`: IP address of the request
- `userAgent`: User agent string
- `timestamp`: Action timestamp

**Indexes:**
- `userId` for user activity queries
- `timestamp` for chronological queries
- `resourceType, resourceId` for resource-specific audit trails

## Relationships Diagram

```
User (1) ────► AuditLog (many)

Specimen (1) ────► PcrAttempt (many)
```

## Data Flow

1. **Specimen Collection**: Specimen records are created with collection and extraction data
2. **PCR Attempts**: Multiple PCR attempts can be made per specimen
3. **Audit Trail**: All changes are logged in AuditLog for compliance

## Key Design Decisions

- **UUID Primary Keys**: Ensures global uniqueness and prevents enumeration attacks
- **Cascading Deletes**: Deleting a specimen automatically removes related PCR attempts
- **Flexible Status Fields**: Status fields (itsStatus, ssuStatus, etc.) allow tracking progress through sequencing pipeline
- **Import Tracking**: Fields like `importOrigin` and `importRow` help trace data provenance
- **Comprehensive Auditing**: All actions are logged with detailed change tracking

## Migration Strategy

Database migrations are handled by Prisma. To create a new migration:

```bash
npx prisma migrate dev --name <migration-name>
```

To apply migrations in production:

```bash
npx prisma migrate deploy
```