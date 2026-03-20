import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const RequestCreateScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [location, setLocation] = useState('');
  const [plate, setPlate] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !description || !location) {
      Alert.alert('Hata', 'Lütfen başlık, açıklama ve konum alanlarını doldurun.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/requests', {
        title,
        description,
        vehicleInfo,
        location,
        plate,
        chassisNumber
      });
      setLoading(false);
      Alert.alert('Başarılı', 'Ekspertiz talebiniz başarıyla oluşturuldu.', [
        { text: 'Tamam', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      setLoading(false);
      console.error('Request creation error', error);
      Alert.alert('Hata', error.response?.data?.error || 'Talep oluşturulurken bir hata oluştu.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      
      {/* FIXED STICKY HEADER */}
      <View style={styles.stickyHeader}>
          <View style={styles.headerTopRow}>
              <View style={styles.profileSection}>
                  <View style={[styles.avatarBox, { borderColor: '#6366f1' }]}>
                      <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
                  </View>
                  <View style={styles.welcomeBox}>
                      <Text style={styles.welcomeText}>Yeni Giriş,</Text>
                      <Text style={styles.userName}>{user?.name}</Text>
                  </View>
              </View>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>← Geri</Text>
              </TouchableOpacity>
          </View>
          <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Talep Oluştur</Text>
          </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <Text style={styles.label}>Talep Başlığı</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: 2022 Model BMW 3.20i Kontrol"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Araç Bilgileri (Marka/Model)</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Mercedes C200 AMG"
              placeholderTextColor="#999"
              value={vehicleInfo}
              onChangeText={setVehicleInfo}
            />

            <Text style={styles.label}>Konum (İl/İlçe)</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: İstanbul / Beşiktaş"
              placeholderTextColor="#999"
              value={location}
              onChangeText={setLocation}
            />

            <View style={styles.row}>
              <View style={[styles.field, { marginRight: 8 }]}>
                <Text style={styles.label}>Araç Plakası</Text>
                <TextInput
                  style={styles.input}
                  placeholder="34 ABC 123"
                  placeholderTextColor="#999"
                  value={plate}
                  onChangeText={setPlate}
                  autoCapitalize="characters"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Şase No (Opsiyonel)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VIN (17 Hane)"
                  placeholderTextColor="#999"
                  value={chassisNumber}
                  onChangeText={setChassisNumber}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <Text style={styles.label}>Açıklama / Özel Notlar</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ekspertizden beklentilerinizi yazın..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Talebi Yayınla</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#38bdf8',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  submitButtonText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  field: {
    flex: 1,
  },
});

export default RequestCreateScreen;
