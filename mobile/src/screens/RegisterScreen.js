import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tcNo, setTcNo] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER'); // 'USER' or 'EXPERT'
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !tcNo || !phone || !password || !city) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (tcNo.length !== 11) {
      Alert.alert('Hata', 'TC Kimlik Numarası 11 haneli olmalıdır.');
      return;
    }

    setLoading(true);
    const result = await register(email, password, name, phone, tcNo, city, role);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Kayıt Hatası', result.error);
    }
    // AuthContext directs to Home via user state update if success
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>Aramıza Katılın</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Ad Soyad</Text>
            <TextInput
              style={styles.input}
              placeholder="Adınızı ve soyadınızı girin"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={styles.input}
              placeholder="E-posta adresinizi girin"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>T.C. Kimlik No</Text>
            <TextInput
              style={styles.input}
              placeholder="11 haneli TC kimlik numaranızı girin"
              placeholderTextColor="#999"
              value={tcNo}
              onChangeText={setTcNo}
              keyboardType="number-pad"
              maxLength={11}
            />

            <Text style={styles.label}>Bulunduğunuz İl</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: İstanbul"
              placeholderTextColor="#999"
              value={city}
              onChangeText={setCity}
            />

            <Text style={styles.label}>Telefon</Text>
            <TextInput
              style={styles.input}
              placeholder="05XX XXX XX XX"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Şifre</Text>
            <TextInput
              style={styles.input}
              placeholder="Güçlü bir şifre belirleyin"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Text style={styles.label}>Hesap Türü</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'USER' && styles.roleButtonActive]}
                onPress={() => setRole('USER')}
              >
                <Text style={[styles.roleButtonText, role === 'USER' && styles.roleButtonTextActive]}>Kullanıcı</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'EXPERT' && styles.roleButtonActive]}
                onPress={() => setRole('EXPERT')}
              >
                <Text style={[styles.roleButtonText, role === 'EXPERT' && styles.roleButtonTextActive]}>Uzman</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Hesap Oluştur</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginText}>
                Zaten hesabınız var mı? <Text style={styles.loginLinkText}>Giriş Yap</Text>
              </Text>
            </TouchableOpacity>
          </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
    alignItems: 'center',
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  form: {
    width: '100%',
    maxWidth: 500,
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleButtonActive: {
    backgroundColor: '#0369a1',
    borderColor: '#38bdf8',
  },
  roleButtonText: {
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  registerButton: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  loginLinkText: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
