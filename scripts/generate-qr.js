const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

async function generateChallengeQR() {
  const targetUrl = 'https://icpcpua.org/claim?code=CAMPUS_BOOTH_DAY1&points=10';
  const outputPath = path.join(__dirname, '..', 'public', 'qr_campus_challenge_10pts.png');

  await QRCode.toFile(outputPath, targetUrl, {
    errorCorrectionLevel: 'H',
    type: 'png',
    quality: 1,
    margin: 2,
    color: {
      dark: '#0F0F0F',
      light: '#FFFFFF',
    },
    width: 600,
  });

  console.log('Successfully generated high-resolution QR code at:', outputPath);
}

generateChallengeQR().catch(console.error);
