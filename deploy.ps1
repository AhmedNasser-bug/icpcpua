Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "ICPC PUA - Production Deployment Pipeline" -ForegroundColor Cyan
Write-Host "Targets: Vercel (Frontend) + Firebase Spark ($0)" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Run full verification test suite
Write-Host "`n1. Running pre-flight verification test suite..." -ForegroundColor Yellow
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Pre-flight tests failed. Aborting deployment." -ForegroundColor Red
    exit 1
}

# 2. Run production build
Write-Host "`n2. Executing Vite production build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Production build failed. Aborting deployment." -ForegroundColor Red
    exit 1
}

# 3. Deploy Firestore Rules & Indexes to Firebase 'icpc-pua'
Write-Host "`n3. Deploying Cloud Firestore Rules & Indexes to project 'icpc-pua'..." -ForegroundColor Yellow
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project icpc-pua

# 4. Deploy to Vercel
Write-Host "`n4. Deploying to Vercel production..." -ForegroundColor Yellow
npx vercel --prod

Write-Host "`n Deployment pipeline completed!" -ForegroundColor Green
