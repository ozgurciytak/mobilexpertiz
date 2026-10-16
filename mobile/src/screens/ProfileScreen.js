import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Alert,
  Platform,
  Image
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { validateTcKimlikNo } from '../utils/tcKimlik';

const ProfileScreen = ({ navigation }) => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [tcNo, setTcNo] = useState('');
  const [email, setEmail] = useState('');
  
  // Tax fields for EXPERTs
  const [taxOffice, setTaxOffice] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/users/profile');
      const data = response.data;
      setName(data.name || '');
      setPhone(data.phone || '');
      setCity(data.city || '');
      setTcNo(data.tcNo || '');
      setEmail(data.email || '');
      setTaxOffice(data.taxOffice || '');
      setTaxNumber(data.taxNumber || '');
      setCompanyName(data.companyName || '');
    } catch (error) {
      console.error('Fetch profile error', error);
      Alert.alert('Hata', 'Profil bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabımı Kalıcı Olarak Sil',
      'Hesabınızı ve tüm verilerinizi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { 
          text: 'Evet, Sil', 
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await apiClient.delete('/users/profile');
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('user');
              setUser(null);
              Alert.alert('Başarılı', 'Hesabınız kalıcı olarak silindi.');
            } catch (error) {
              console.error('Delete profile error', error);
              Alert.alert('Hata', 'Hesap silinirken bir hata oluştu.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Ad Soyad alanı boş bırakılamaz.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Hata', 'Telefon alanı boş bırakılamaz.');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Hata', 'Şehir/İl alanı boş bırakılamaz.');
      return;
    }

    if (user?.role === 'EXPERT') {
      if (!taxOffice.trim() || !taxNumber.trim() || !companyName.trim()) {
        Alert.alert('Hata', 'Lütfen kurumsal bilgilerinizi eksiksiz doldurun.');
        return;
      }
    } else {
      if (!tcNo.trim()) {
        Alert.alert('Hata', 'TC Kimlik Numarası boş bırakılamaz.');
        return;
      }
      if (!validateTcKimlikNo(tcNo)) {
        Alert.alert('Geçersiz T.C. Kimlik No', 'Lütfen 11 haneli T.C. Kimlik Numaranızı doğru girdiğinizden emin olun.');
        return;
      }
    }

    // Password change validation
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır.');
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert('Hata', 'Yeni şifreler uyuşmuyor.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const updateData = {
        name,
        phone,
        city,
        tcNo: user?.role === 'EXPERT' ? null : tcNo,
        taxOffice: user?.role === 'EXPERT' ? taxOffice : null,
        taxNumber: user?.role === 'EXPERT' ? taxNumber : null,
        companyName: user?.role === 'EXPERT' ? companyName : null,
      };

      if (newPassword) {
        updateData.password = newPassword;
      }

      const response = await apiClient.put('/users/profile', updateData);
      
      // Update local storage and auth context
      const updatedUser = {
        ...user,
        name: response.data.user.name,
        phone: response.data.user.phone,
        city: response.data.user.city,
        tcNo: response.data.user.tcNo,
        taxOffice: response.data.user.taxOffice,
        taxNumber: response.data.user.taxNumber,
        companyName: response.data.user.companyName,
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Reset password fields
      setNewPassword('');
      setConfirmPassword('');

      Alert.alert('Başarılı', 'Profil bilgileriniz başarıyla güncellendi.');
    } catch (error) {
      console.error('Update profile error', error);
      Alert.alert('Hata', error.response?.data?.error || 'Profil güncellenirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
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
      <StatusBar hidden={true} />
      
      {/* FIXED STICKY HEADER */}
      <View style={styles.stickyHeader}>
          <View style={styles.headerTopRow}>
              <View style={styles.profileSection}>
                  <View style={[styles.avatarBox, { borderColor: user?.role === 'EXPERT' ? '#38bdf8' : '#6366f1' }]}>
                      <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
                  </View>
                  <View style={styles.welcomeBox}>
                      <Text style={styles.welcomeText}>Hesap Bilgileri,</Text>
                      <Text style={styles.userName}>{user?.name}</Text>
                  </View>
              </View>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>← Geri</Text>
              </TouchableOpacity>
          </View>
          <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Hesabım</Text>
          </View>
      </View>

      <KeyboardAwareScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === 'ios' ? 80 : 120}
      >
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
            
            <Text style={styles.label}>E-Posta Adresi (Değiştirilemez)</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={email}
              editable={false}
            />

            <Text style={styles.label}>Ad Soyad</Text>
            <TextInput
              style={styles.input}
              placeholder="Ad Soyad giriniz"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Telefon Numarası</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: 05551234567"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={styles.label}>Şehir / İl</Text>
            <TextInput
              style={styles.input}
              placeholder="Şehir giriniz (Örn: İstanbul)"
              placeholderTextColor="#64748b"
              value={city}
              onChangeText={setCity}
            />

            {user?.role === 'USER' ? (
              <>
                <Text style={styles.label}>TC Kimlik Numarası</Text>
                <TextInput
                  style={styles.input}
                  placeholder="TC Kimlik No (11 Hane)"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  maxLength={11}
                  value={tcNo}
                  onChangeText={setTcNo}
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>Vergi Dairesi</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Bağlı olduğunuz vergi dairesi"
                  placeholderTextColor="#64748b"
                  value={taxOffice}
                  onChangeText={setTaxOffice}
                />
                
                <Text style={styles.label}>Vergi Numarası</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Vergi numaranız"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={taxNumber}
                  onChangeText={setTaxNumber}
                />

                <Text style={styles.label}>Firma Ünvanı</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Resmi firma ünvanınız"
                  placeholderTextColor="#64748b"
                  value={companyName}
                  onChangeText={setCompanyName}
                />
              </>
            )}
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Şifre Değiştir</Text>
            <Text style={styles.helperText}>Şifrenizi değiştirmek istemiyorsanız bu alanı boş bırakabilirsiniz.</Text>

            <Text style={styles.label}>Yeni Şifre</Text>
            <TextInput
              style={styles.input}
              placeholder="Yeni şifreniz"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
            <TextInput
              style={styles.input}
              placeholder="Yeni şifrenizi doğrulayın"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, submitting && { opacity: 0.7 }]}
            onPress={handleUpdateProfile}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.deleteButton, submitting && { opacity: 0.7 }]}
            onPress={handleDeleteAccount}
            disabled={submitting}
          >
            <Text style={styles.deleteButtonText}>Hesabımı Kalıcı Olarak Sil</Text>
          </TouchableOpacity>
      </KeyboardAwareScrollView>
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
  stickyHeader: { 
    backgroundColor: '#0f172a', 
    paddingHorizontal: 24, 
    paddingVertical: 15, 
    paddingTop: 45, 
    borderBottomWidth: 1, 
    borderBottomColor: '#1e293b',
    zIndex: 10 
  },
  headerTopRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 15
  },
  profileSection: { flexDirection: 'row', alignItems: 'center' },
  avatarBox: { 
    width: 60, 
    height: 60, 
    borderRadius: 15, 
    backgroundColor: '#1e293b', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    elevation: 8, 
    overflow: 'hidden' 
  },
  logoImage: { width: '85%', height: '85%' },
  welcomeBox: { marginLeft: 16 },
  welcomeText: { color: '#94a3b8', fontSize: 13 },
  userName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  backBtn: { padding: 10 },
  backBtnText: { color: '#38bdf8', fontWeight: 'bold', fontSize: 15 },
  headerTitleRow: { marginTop: 5 },
  headerTitle: { fontSize: 22, color: '#38bdf8', fontWeight: 'bold' },
  scrollContent: {
    padding: 20,
    paddingBottom: 100
  },
  formCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 8,
  },
  helperText: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 16,
    fontStyle: 'italic'
  },
  label: {
    fontSize: 14,
    color: '#e2e8f0',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  disabledInput: {
    opacity: 0.5,
    backgroundColor: '#1e293b',
  },
  saveButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
