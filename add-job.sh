#!/bin/bash

# Simple script to add a test job via Firebase CLI
# This will trigger the push notification

echo "📝 Adding test job to Firestore..."

# Using Firebase Firestore CLI to add document
# Note: You may need to do this via the console or a Cloud Function

cat << 'EOF'

To add the test job, you have 2 options:

OPTION 1 - Via Firebase Console (30 seconds):
1. Open: https://console.firebase.google.com/project/internaly-io/firestore/databases/-default-/data/~2Fjobs
2. Click "Add document"
3. Use Auto-ID
4. Copy/paste these fields:

source: startup
title: Software Engineering Intern - Test
company: Test Startup
location: San Francisco, CA
remote: false
sponsors_visa: false
job_type: Internship
description: Test notification job
requirements: CS student
salary: $50k
url: https://example.com
posted_date: 2025-12-23
via: test
benefits: []
responsibilities: []
thumbnail:

OPTION 2 - Import JSON (if you have firebase-tools with data import):

Run:
  firebase firestore:write jobs/test-job-$(date +%s) test-job.json

But option 1 is faster! Just click and paste.

EOF
