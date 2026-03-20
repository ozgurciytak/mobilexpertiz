import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Linking,
  Image,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { Platform } from 'react-native';
import apiClient from '../api/client';

const ReportViewScreen = ({ route, navigation }) => {
  const { requestId } = route.params;
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    preparePdfUrl();
  }, []);

  const preparePdfUrl = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      // Add a timestamp to the URL to prevent caching on tablets/mobile devices
      const timestamp = new Date().getTime();
      const url = `${apiClient.defaults.baseURL}/reports/request/${requestId}/pdf?token=${token}&t=${timestamp}`;
      setPdfUrl(url);
    } catch (error) {
      console.error('Fetch PDF URL error', error);
      Alert.alert('Hata', 'PDF URL hazırlanamadı.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rapor Önizleme</Text>
      </View>

      <View style={styles.webViewContainer}>
        {pdfUrl ? (
          Platform.OS === 'web' ? (
            <iframe 
              src={pdfUrl} 
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="PDF Report"
            />
          ) : (
            <WebView
              source={{ uri: pdfUrl }}
              style={styles.webView}
              originWhitelist={['*']}
              scalesPageToFit={true}
              mixedContentMode="always"
              startInLoadingState={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              renderLoading={() => (
                <ActivityIndicator color="#38bdf8" style={styles.loader} />
              )}
            />
          )
        ) : (
          <Text style={styles.errorText}>Rapor yüklenemedi.</Text>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.downloadFloatingButton}
        onPress={() => Linking.openURL(pdfUrl)}
      >
        <Text style={styles.downloadFloatingText}>⬇️ İndir</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    marginRight: 16,
  },
  backText: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -10,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  downloadFloatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  downloadFloatingText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ReportViewScreen;
