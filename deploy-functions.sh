#!/bin/bash

# Deploy Functions Script
# This script builds and deploys Firebase Cloud Functions

set -e  # Exit on error

echo "🔨 Building Cloud Functions..."
cd functions
npm run build
cd ..

echo "🚀 Deploying to Firebase..."
firebase deploy --only functions

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Check the Firebase Console for your deployed functions"
echo "  2. Test with a job that has source='startup'"
echo "  3. View logs with: firebase functions:log"
