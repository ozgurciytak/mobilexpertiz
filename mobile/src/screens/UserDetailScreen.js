import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

const UserDetailScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDetail();
  }, []);

  const fetchUserDetail = async () => {
    try {
      // We don't have a direct admin/user/:id route yet, but we can use the records route with a filter or add a specific one.
      // For now, let's assume we use a specific admin route for user details.
      const response = await apiClient.get(`/admin/records?q=${userId}`); // This is a bit hacky, let's ideally have a better endpoint
      // Adjusting to find the specific user from the results for now as a fallback
      const foundUser = response.data.users.find(u => u.id === userId);
      if (foundUser) {
        setUser(foundUser);
      } else {
        Alert.alert('Hata', 'Kullanıcı bulunamadı.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Fetch user detail error', error);
      Alert.alert('Hata', 'Kullanıcı bilgileri alınamadı.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const url = `${apiClient.defaults.baseURL}/admin/users/${userId}/pdf?token=${token}`;
      Linking.openURL(url).catch(err => {
        Alert.alert('Hata', 'PDF indirilemedi.');
      });
    } catch (error) {
      Alert.alert('Hata', 'Yetkilendirme hatası.');
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kullanıcı Detayı</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user.name.substring(0, 1).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userRole}>{user.role}</Text>
          
          {user.isBlocked && (
            <View style={styles.blockedBadge}>
              <Text style={styles.blockedText}>ENGELLİ</Text>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>E-posta</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Telefon</Text>
            <Text style={styles.infoValue}>{user.phone || 'Belirtilmedi'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>TC Kimlik No</Text>
            <Text style={styles.infoValue}>{user.tcNo || 'Belirtilmedi'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kayıt Tarihi</Text>
            <Text style={styles.infoValue}>{new Date(user.createdAt).toLocaleDateString('tr-TR')}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.pdfButton}
          onPress={handleDownloadPDF}
        >
          <Text style={styles.pdfButtonText}>📄 Dosyayı PDF Olarak İndir</Text>
        </TouchableOpacity>
      </ScrollView>
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
    marginBottom: 32,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 12,
  },
  blockedBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  blockedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  infoLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pdfButton: {
    backgroundColor: '#0284c7',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  pdfButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UserDetailScreen;
