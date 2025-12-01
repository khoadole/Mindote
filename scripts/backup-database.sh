#!/bin/bash
# =====================================================
# MINDOTE DATABASE BACKUP SCRIPT
# =====================================================
#
# Script này backup database Supabase hàng ngày
# và upload lên cloud storage (optional)
#
# Cách setup:
# 1. chmod +x scripts/backup-database.sh
# 2. Tạo file .env với DATABASE_URL
# 3. Chạy: ./scripts/backup-database.sh
#
# Setup cron job (chạy hàng ngày lúc 2:00 AM):
# crontab -e
# 0 2 * * * /path/to/mindote/scripts/backup-database.sh >> /var/log/mindote-backup.log 2>&1
#
# =====================================================

set -e  # Exit on error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="mindote_backup_${DATE}.sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"
RETENTION_DAYS=7

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f "${PROJECT_ROOT}/.env" ]; then
    export $(cat "${PROJECT_ROOT}/.env" | grep -v '^#' | xargs)
elif [ -f "${PROJECT_ROOT}/.env.local" ]; then
    export $(cat "${PROJECT_ROOT}/.env.local" | grep -v '^#' | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ] && [ -z "$DIRECT_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL or DIRECT_URL not set${NC}"
    echo "Please set DATABASE_URL in your .env file"
    exit 1
fi

# Use DIRECT_URL if available (bypasses connection pooling)
DB_URL="${DIRECT_URL:-$DATABASE_URL}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}MINDOTE DATABASE BACKUP${NC}"
echo -e "${YELLOW}Date: $(date)${NC}"
echo -e "${YELLOW}========================================${NC}"

# Step 1: Create backup
echo -e "\n${GREEN}[1/4] Creating database backup...${NC}"

pg_dump "$DB_URL" \
    --format=plain \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    > "${BACKUP_DIR}/${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}${NC}"
else
    echo -e "${RED}✗ Backup failed!${NC}"
    exit 1
fi

# Step 2: Compress backup
echo -e "\n${GREEN}[2/4] Compressing backup...${NC}"

gzip -f "${BACKUP_DIR}/${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE_GZ}" | cut -f1)
    echo -e "${GREEN}✓ Compressed: ${BACKUP_FILE_GZ} (${BACKUP_SIZE})${NC}"
else
    echo -e "${RED}✗ Compression failed!${NC}"
    exit 1
fi

# Step 3: Upload to cloud storage (optional)
echo -e "\n${GREEN}[3/4] Uploading to cloud storage...${NC}"

# Uncomment and configure one of these options:

# Option A: Upload to AWS S3
# if command -v aws &> /dev/null && [ -n "$AWS_S3_BUCKET" ]; then
#     aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE_GZ}" "s3://${AWS_S3_BUCKET}/backups/"
#     echo -e "${GREEN}✓ Uploaded to S3: s3://${AWS_S3_BUCKET}/backups/${BACKUP_FILE_GZ}${NC}"
# fi

# Option B: Upload to Google Cloud Storage
# if command -v gsutil &> /dev/null && [ -n "$GCS_BUCKET" ]; then
#     gsutil cp "${BACKUP_DIR}/${BACKUP_FILE_GZ}" "gs://${GCS_BUCKET}/backups/"
#     echo -e "${GREEN}✓ Uploaded to GCS: gs://${GCS_BUCKET}/backups/${BACKUP_FILE_GZ}${NC}"
# fi

# Option C: Upload to Backblaze B2
# if command -v b2 &> /dev/null && [ -n "$B2_BUCKET" ]; then
#     b2 upload-file "$B2_BUCKET" "${BACKUP_DIR}/${BACKUP_FILE_GZ}" "backups/${BACKUP_FILE_GZ}"
#     echo -e "${GREEN}✓ Uploaded to B2: ${BACKUP_FILE_GZ}${NC}"
# fi

echo -e "${YELLOW}⚠ Cloud upload skipped (configure in script)${NC}"

# Step 4: Clean up old backups
echo -e "\n${GREEN}[4/4] Cleaning up old backups (>${RETENTION_DAYS} days)...${NC}"

OLD_BACKUPS=$(find "$BACKUP_DIR" -name "mindote_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -type f)

if [ -n "$OLD_BACKUPS" ]; then
    echo "$OLD_BACKUPS" | while read file; do
        rm -f "$file"
        echo -e "${GREEN}✓ Deleted: $(basename $file)${NC}"
    done
else
    echo -e "${GREEN}✓ No old backups to clean${NC}"
fi

# Summary
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${GREEN}BACKUP COMPLETE!${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "File: ${BACKUP_DIR}/${BACKUP_FILE_GZ}"
echo -e "Size: ${BACKUP_SIZE}"
echo -e "Retention: ${RETENTION_DAYS} days"

# List current backups
echo -e "\n${YELLOW}Current backups:${NC}"
ls -lh "${BACKUP_DIR}"/*.sql.gz 2>/dev/null || echo "No backups found"

echo -e "\n${GREEN}Done!${NC}"
