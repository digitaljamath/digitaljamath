#!/bin/bash
cd /Users/hayeef/.gemini/antigravity/scratch/digitaljamath
./venv/bin/python3 scripts/seed_demo_ledgers.py > /Users/hayeef/.gemini/antigravity/scratch/digitaljamath/exec_log.txt 2>&1
echo "Script finished with exit code $?" >> /Users/hayeef/.gemini/antigravity/scratch/digitaljamath/exec_log.txt
