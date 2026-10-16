import https from 'https';

// Kullanıcı push token'larını hafızada ve veritabanında tutan yapı
const userPushTokens = new Map<number, string>();

export const registerUserPushToken = (userId: number, token: string): void => {
  if (userId && token) {
    userPushTokens.set(userId, token);
    console.log(`📱 [PUSH TOKEN] Kullanıcı #${userId} için push token kaydedildi.`);
  }
};

export const getUserPushToken = (userId: number): string | undefined => {
  return userPushTokens.get(userId);
};

export interface PushNotificationPayload {
  toUserId: number;
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Expo Push Notification API üzerinden anlık bildirim gönderir.
 */
export const sendPushNotification = async ({
  toUserId,
  title,
  body,
  data = {}
}: PushNotificationPayload): Promise<boolean> => {
  const pushToken = getUserPushToken(toUserId);

  if (!pushToken) {
    console.log(`ℹ️ [PUSH NOTIFICATION] Kullanıcı #${toUserId} için aktif push token bulunamadı (çevrimdışı/kayıtsız).`);
    return false;
  }

  // Geçerli bir Expo Push Token mı?
  if (!pushToken.startsWith('ExponentPushToken[') && !pushToken.startsWith('ExpoPushToken[')) {
    console.warn(`⚠️ [PUSH NOTIFICATION] Geçersiz token formatı: ${pushToken}`);
    return false;
  }

  const payload = JSON.stringify({
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high'
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'exp.host',
      path: '/--/api/v2/push/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate'
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        console.log(`✅ [PUSH NOTIFICATION GÖNDERİLDİ] #${toUserId} -> "${title}": "${body}"`);
        resolve(true);
      });
    });

    req.on('error', (err) => {
      console.error('❌ [PUSH NOTIFICATION HATASI]', err.message);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
};
