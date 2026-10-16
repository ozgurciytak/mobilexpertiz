import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/client';

const ForgotPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState(1); // 1: E-posta iste, 2: Kod ve Yeni Şifre
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen kayıtlı e-posta adresinizi giriniz.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/forgot-password', { email: email.trim() });
      Alert.alert('Bilgi', response.data.message || 'Sıfırlama kodu gönderildi.');
      if (response.data.devCode) {
        // Geliştirme ortamında kolaylık için
        setCode(response.data.devCode);
      }
      setStep(2);
    } catch (error) {
      console.error('Forgot password error', error);
      Alert.alert('Hata', error.response?.data?.error || 'Kod gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim() || !newPassword || !confirmPassword) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurunuz.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Hata', 'Yeni şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreleriniz birbiriyle uyuşmuyor.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/reset-password', {
        email: email.trim(),
        code: code.trim(),
        newPassword
      });
      Alert.alert('Başarılı', response.data.message || 'Şifreniz başarıyla güncellendi.', [
        { text: 'Giriş Yap', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      console.error('Reset password error', error);
      Alert.alert('Hata', error.response?.data?.error || 'Şifre güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
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
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Şifremi Unuttum</Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Hesabınıza ait e-posta adresinizi girerek 6 haneli sıfırlama kodunuzu alın.'
              : 'Gelen 6 haneli doğrulama kodunu ve yeni şifrenizi belirleyin.'}
          </Text>
        </View>

        <View style={styles.form}>
          {step === 1 ? (
            <>
              <Text style={styles.label}>E-Posta Adresi</Text>
              <TextInput
                style={styles.input}
                placeholder="ornek@email.com"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.7 }]}
                onPress={handleSendCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#0f172a" />
                ) : (
                  <Text style={styles.buttonText}>Doğrulama Kodu Gönder</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>6 Haneli Doğrulama Kodu</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="123456"
                placeholderTextColor="#64748b"
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
                maxLength={6}
              />

              <Text style={styles.label}>Yeni Şifre</Text>
              <TextInput
                style={styles.input}
                placeholder="En az 6 karakter"
                placeholderTextColor="#64748b"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />

              <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
              <TextInput
                style={styles.input}
                placeholder="Yeni şifrenizi doğrulayın"
                placeholderTextColor="#64748b"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.7 }]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#0f172a" />
                ) : (
                  <Text style={styles.buttonText}>Şifreyi Güncelle</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backStepButton}
                onPress={() => setStep(1)}
              >
                <Text style={styles.backStepText}>← Farklı bir e-posta ile dene</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>
              Giriş Ekranına Geri Dön
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
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  form: {
    backgroundColor: '#1e293b',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  label: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
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
  codeInput: {
    letterSpacing: 8,
    fontSize: 22,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  button: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backStepButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  backStepText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#38bdf8',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
