#!/usr/bin/env bash
set -e

echo "================================================="
echo "ICPC PUA - Production Deployment Pipeline"
echo "Targets: Vercel (Frontend) + Firebase Spark ($0)"
echo "================================================="

echo -e "\n1. Running pre-flight verification test suite..."
npm test

echo -e "\n2. Executing Vite production build..."
npm run build

echo -e "\n3. Deploying Cloud Firestore Rules & Indexes to project 'icpc-pua'..."
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project icpc-pua

echo -e "\n4. Deploying to Vercel production..."
npx vercel --prod

echo -e "\nDeployment pipeline completed successfully!"
