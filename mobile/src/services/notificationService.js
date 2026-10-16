import apiClient from '../api/client';
import { Platform } from 'react-native';

/**
 * Cihazın Expo Push Token'ını alıp sunucuya kaydeder.
 */
export const registerForPushNotificationsAsync = async () => {
  try {
    let Notifications;
    try {
      Notifications = require('expo-notifications');
    } catch (e) {
      // expo-notifications yüklü değilse uygulamayı kilitlemeden çık
      return;
    }

    if (!Notifications || !Notifications.getPermissionsAsync) {
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#38bdf8',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Bildirim izni verilmedi.');
      return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    if (tokenData && tokenData.data) {
      await apiClient.post('/users/push-token', { token: tokenData.data });
      console.log('Push token sunucuya iletildi:', tokenData.data);
    }
  } catch (error) {
    console.log('Push notification notice:', error.message);
  }
};
