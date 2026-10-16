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
  Linking,
  TextInput,
  Platform
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

const UserDetailScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tcNo, setTcNo] = useState('');
  const [city, setCity] = useState('');
  const [taxOffice, setTaxOffice] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchUserDetail();
  }, []);

  const fetchUserDetail = async () => {
    try {
      // We don't have a direct admin/user/:id route yet, but we can use the records route with a filter or add a specific one.
      // For now, let's assume we use a specific admin route for user details.
      const response = await apiClient.get(`/admin/records?q=${userId}`);
      const foundUser = response.data.users.find(u => u.id === userId);
      if (foundUser) {
        setUser(foundUser);
        // Populate edit fields
        setName(foundUser.name || '');
        setEmail(foundUser.email || '');
        setPhone(foundUser.phone || '');
        setTcNo(foundUser.tcNo || '');
        setCity(foundUser.city || '');
        setTaxOffice(foundUser.taxOffice || '');
        setTaxNumber(foundUser.taxNumber || '');
        setCompanyName(foundUser.companyName || '');
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

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        name,
        email,
        phone,
        city,
        tcNo: tcNo || undefined,
        taxOffice: taxOffice || undefined,
        taxNumber: taxNumber || undefined,
        companyName: companyName || undefined,
      };
      if (password) {
        payload.password = password;
      }
      
      const response = await apiClient.put(`/admin/users/${userId}`, payload);
      setUser(response.data.user);
      setIsEditing(false);
      setPassword('');
      Alert.alert('Başarılı', 'Kullanıcı bilgileri güncellendi.');
    } catch (error) {
      console.error('Save user error', error);
      Alert.alert('Hata', 'Kullanıcı güncellenirken bir hata oluştu.');
    } finally {
      setSaving(false);
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
      <KeyboardAwareScrollView 
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === 'ios' ? 80 : 120}
      >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>← Geri</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Kullanıcı Detayı</Text>
            <TouchableOpacity 
              style={styles.editToggleBtn} 
              onPress={() => setIsEditing(!isEditing)}
            >
              <Text style={styles.editToggleText}>{isEditing ? 'İptal' : 'Düzenle'}</Text>
            </TouchableOpacity>
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
            <Text style={styles.infoLabel}>İsim</Text>
            {isEditing ? (
              <TextInput style={styles.input} value={name} onChangeText={setName} />
            ) : (
              <Text style={styles.infoValue}>{user.name}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>E-posta</Text>
            {isEditing ? (
              <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
            ) : (
              <Text style={styles.infoValue}>{user.email}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Telefon</Text>
            {isEditing ? (
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            ) : (
              <Text style={styles.infoValue}>{user.phone || 'Belirtilmedi'}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Şehir</Text>
            {isEditing ? (
              <TextInput style={styles.input} value={city} onChangeText={setCity} />
            ) : (
              <Text style={styles.infoValue}>{user.city || 'Belirtilmedi'}</Text>
            )}
          </View>

          {user.role === 'USER' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>TC Kimlik No</Text>
              {isEditing ? (
                <TextInput style={styles.input} value={tcNo} onChangeText={setTcNo} keyboardType="number-pad" maxLength={11} />
              ) : (
                <Text style={styles.infoValue}>{user.tcNo || 'Belirtilmedi'}</Text>
              )}
            </View>
          )}

          {user.role === 'EXPERT' && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Vergi Dairesi</Text>
                {isEditing ? (
                  <TextInput style={styles.input} value={taxOffice} onChangeText={setTaxOffice} />
                ) : (
                  <Text style={styles.infoValue}>{user.taxOffice || 'Belirtilmedi'}</Text>
                )}
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Vergi Numarası</Text>
                {isEditing ? (
                  <TextInput style={styles.input} value={taxNumber} onChangeText={setTaxNumber} keyboardType="number-pad" />
                ) : (
                  <Text style={styles.infoValue}>{user.taxNumber || 'Belirtilmedi'}</Text>
                )}
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Firma Ünvanı</Text>
                {isEditing ? (
                  <TextInput style={styles.input} value={companyName} onChangeText={setCompanyName} />
                ) : (
                  <Text style={styles.infoValue}>{user.companyName || 'Belirtilmedi'}</Text>
                )}
              </View>
            </>
          )}

          {isEditing && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Yeni Şifre</Text>
              <TextInput 
                style={styles.input} 
                value={password} 
                onChangeText={setPassword} 
                placeholder="Yeni şifre belirleyin" 
                placeholderTextColor="#64748b"
                secureTextEntry 
              />
            </View>
          )}

          {!isEditing && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kayıt Tarihi</Text>
              <Text style={styles.infoValue}>{new Date(user.createdAt).toLocaleDateString('tr-TR')}</Text>
            </View>
          )}
        </View>

        {isEditing ? (
          <TouchableOpacity 
            style={[styles.saveButton, saving && {opacity: 0.7}]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.pdfButtonText}>Değişiklikleri Kaydet</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.pdfButton}
            onPress={handleDownloadPDF}
          >
            <Text style={styles.pdfButtonText}>📄 Dosyayı PDF Olarak İndir</Text>
          </TouchableOpacity>
        )}
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
  editToggleBtn: {
    marginLeft: 'auto',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  editToggleText: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  input: {
    flex: 2,
    backgroundColor: '#0f172a',
    color: '#fff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    textAlign: 'right'
  },
  saveButton: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  }
});

export default UserDetailScreen;
