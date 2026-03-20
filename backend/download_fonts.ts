import https from 'https';
import fs from 'fs';
import path from 'path';

const download = (url: string, dest: string) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function main() {
  const fontsDir = path.resolve(__dirname, 'src/assets/fonts');
  if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir, { recursive: true });
  
  await download('https://github.com/google/fonts/raw/main/apache/roboto/static/Roboto-Regular.ttf', path.join(fontsDir, 'Roboto-Regular.ttf'));
  await download('https://github.com/google/fonts/raw/main/apache/roboto/static/Roboto-Bold.ttf', path.join(fontsDir, 'Roboto-Bold.ttf'));
  console.log('Fonts downloaded successfully');
}

main();
