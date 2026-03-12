#!/bin/bash
# =====================================================
# MINDOTE DATABASE RESTORE SCRIPT
# =====================================================
#
# Script này restore database từ backup file
#
# Cách sử dụng:
# ./scripts/restore-database.sh backups/mindote_backup_20241201_020000.sql.gz
#
# ⚠️ WARNING: Script này sẽ XÓA toàn bộ data hiện tại!
# =====================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_FILE="$1"

# Load environment variables
if [ -f "${PROJECT_ROOT}/.env" ]; then
    export $(cat "${PROJECT_ROOT}/.env" | grep -v '^#' | xargs)
elif [ -f "${PROJECT_ROOT}/.env.local" ]; then
    export $(cat "${PROJECT_ROOT}/.env.local" | grep -v '^#' | xargs)
fi

# Check arguments
if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Please specify a backup file${NC}"
    echo "Usage: $0 <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh "${PROJECT_ROOT}/backups"/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    # Try with project root prefix
    BACKUP_FILE="${PROJECT_ROOT}/${BACKUP_FILE}"
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}Error: Backup file not found: $1${NC}"
        exit 1
    fi
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ] && [ -z "$DIRECT_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL or DIRECT_URL not set${NC}"
    exit 1
fi

# Use DIRECT_URL if available
DB_URL="${DIRECT_URL:-$DATABASE_URL}"

echo -e "${YELLOW}========================================${NC}"
echo -e "${RED}⚠️  DATABASE RESTORE WARNING${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "${RED}This will REPLACE ALL DATA in your database!${NC}"
echo -e "Backup file: ${BACKUP_FILE}"
echo ""
read -p "Are you SURE you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Restore cancelled.${NC}"
    exit 0
fi

echo -e "\n${GREEN}Starting restore...${NC}"

# Create temp file for decompressed backup
TEMP_FILE=$(mktemp)

# Decompress backup
echo -e "${GREEN}[1/2] Decompressing backup...${NC}"
gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"

# Restore database
echo -e "${GREEN}[2/2] Restoring database...${NC}"
psql "$DB_URL" < "$TEMP_FILE"

# Clean up
rm -f "$TEMP_FILE"

echo -e "\n${YELLOW}========================================${NC}"
echo -e "${GREEN}RESTORE COMPLETE!${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify your data in Supabase Dashboard"
echo "2. Test your application"
echo "3. Run: npx prisma generate (if schema changed)"
