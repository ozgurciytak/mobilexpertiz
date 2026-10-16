import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';

import { validateTcKimlikNo } from '../utils/tcKimlik';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tcNo, setTcNo] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER'); // 'USER' or 'EXPERT'
  const [taxOffice, setTaxOffice] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !city) {
      Alert.alert('Hata', 'Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    if (role === 'USER') {
      if (!tcNo || !validateTcKimlikNo(tcNo)) {
        Alert.alert('Geçersiz T.C. Kimlik No', 'Lütfen 11 haneli T.C. Kimlik Numaranızı doğru girdiğinizden emin olun.');
        return;
      }
    } else if (role === 'EXPERT') {
      if (!taxOffice || !taxNumber || !companyName) {
        Alert.alert('Hata', 'Lütfen kurumsal bilgilerinizi eksiksiz doldurun.');
        return;
      }
    }

    if (!isAgreed) {
      Alert.alert('Hata', 'Lütfen kayıt sözleşmesini onaylayın.');
      return;
    }

    setLoading(true);
    const result = await register(email, password, name, phone, tcNo, city, role, taxOffice, taxNumber, companyName);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Kayıt Hatası', result.error);
    }
    // AuthContext directs to Home via user state update if success
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === 'ios' ? 80 : 120}
      >
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

            {role === 'USER' ? (
              <>
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
              </>
            ) : (
              <>
                <Text style={styles.label}>Vergi Dairesi</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Bağlı olduğunuz vergi dairesi"
                  placeholderTextColor="#999"
                  value={taxOffice}
                  onChangeText={setTaxOffice}
                />
                
                <Text style={styles.label}>Vergi Numarası</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10 haneli vergi numaranızı girin"
                  placeholderTextColor="#999"
                  value={taxNumber}
                  onChangeText={setTaxNumber}
                  keyboardType="number-pad"
                />

                <Text style={styles.label}>Firma Ünvanı</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Resmi firma ünvanınız"
                  placeholderTextColor="#999"
                  value={companyName}
                  onChangeText={setCompanyName}
                />
              </>
            )}

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
                onPress={() => {
                  setRole('USER');
                  setIsAgreed(false);
                }}
              >
                <Text style={[styles.roleButtonText, role === 'USER' && styles.roleButtonTextActive]}>Kullanıcı</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'EXPERT' && styles.roleButtonActive]}
                onPress={() => {
                  setRole('EXPERT');
                  setIsAgreed(false);
                }}
              >
                <Text style={[styles.roleButtonText, role === 'EXPERT' && styles.roleButtonTextActive]}>Uzman</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.checkboxContainer} onPress={() => setIsAgreed(!isAgreed)}>
              <View style={[styles.checkbox, isAgreed && styles.checkboxChecked]}>
                {isAgreed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                {role === 'EXPERT' 
                  ? 'Ekspertiz Sözleşmesi: Yaptığım raporların doğruluğunu kabul ediyorum ve bu raporlardan kendimin sorumlu olduğunu onaylıyorum.' 
                  : 'Girdiğim bilgilerin doğruluğunu kabul ediyorum ve sorumluluğun bende olduğunu onaylıyorum.'}
              </Text>
            </TouchableOpacity>

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
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    flexGrow: 1,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#38bdf8',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#0369a1',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#e2e8f0',
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
});

export default RegisterScreen;
