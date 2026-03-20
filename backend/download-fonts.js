const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, 'src', 'assets', 'fonts');

if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

const run = async () => {
  try {
    console.log('Downloading fonts...');
    await downloadFile('https://github.com/google/fonts/raw/main/ofl/roboto/Roboto-Regular.ttf', path.join(fontsDir, 'Roboto-Regular.ttf'));
    await downloadFile('https://github.com/google/fonts/raw/main/ofl/roboto/Roboto-Bold.ttf', path.join(fontsDir, 'Roboto-Bold.ttf'));
    console.log('Fonts downloaded successfully.');
  } catch (error) {
    console.error('Error downloading fonts:', error);
  }
};

run();
