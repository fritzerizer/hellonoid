#!/bin/bash
# Hellonoid News Pipeline - Cron script
# Runs 2x/day: 09:00 and 16:00

cd /Users/julia/apps/hellonoid

# Load environment
export BRAVE_API_KEY=$(cat ~/.secrets/brave-api-key)
export NODE_ENV=production

# Run with timeout and logging
timeout 300 npx tsx scripts/fetch-news.ts >> logs/news-$(date +%Y-%m).log 2>&1

# Report status to kanban if error
if [ $? -ne 0 ]; then
    curl -s -X POST "http://192.168.12.94:3338/api/tasks/173/comments" \
        -H "Content-Type: application/json" \
        -d '{"author":"Julia","text":"⚠️ News pipeline failed at '$(date)'"}'
fi