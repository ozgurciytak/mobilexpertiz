import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, ScrollView, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const SubscriptionScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fee, setFee] = useState('0');
  const [bankInfo, setBankInfo] = useState({ title: '', iban: '' });
  const [paymentMethod, setPaymentMethod] = useState('CARD'); // CARD or TRANSFER
  
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  // Card Info States
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const fetchStatusAndSettings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/payments/status');
      setSubscriptionStatus(response.data.status);
      setFee(response.data.settings?.subscription_fee || '1500');
      setBankInfo({
          title: response.data.settings?.bank_title || 'Banka Unvanı Belirtilmemiş',
          iban: response.data.settings?.bank_iban || 'IBAN Belirtilmemiş'
      });
    } catch (error) {
      console.error('Fetch subscription status error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndSettings();
  }, []);

  const handlePay = async () => {
    if (paymentMethod === 'CARD') {
        if (!cardNumber || !expiry || !cvc || !cardHolder) {
            Alert.alert('Eksik Bilgi', 'Lütfen tüm kart bilgilerini doldurunuz.');
            return;
        }
    }

    setSubmitting(true);
    try {
      await apiClient.post('/payments/initiate', {
          method: paymentMethod,
          amount: fee,
          notes: paymentMethod === 'TRANSFER' ? 'Havale Bildirimi' : `Kredi Kartı Ödemesi (${cardHolder})`
      });
      
      if (paymentMethod === 'CARD') {
          Alert.alert('Başarılı', 'Ödemeniz alındı ve aboneliğiniz 30 gün uzatıldı. Keyifli kullanımlar!');
      } else {
          Alert.alert('Bildirim Alındı', 'Havale bildiriminiz Admin onayına gönderildi. Kontrol sonrası süreniz uzatılacaktır.');
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Hata', 'Ödeme işlemi başarısız oldu. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#38bdf8" /></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      
      {/* FIXED STICKY HEADER TO MATCH APP DESIGN */}
      <View style={styles.stickyHeader}>
          <View style={styles.headerTopRow}>
              <View style={styles.profileSection}>
                  <View style={styles.avatarBox}>
                      <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
                  </View>
                  <View style={styles.welcomeBox}>
                      <Text style={styles.welcomeText}>Uzman Paneli,</Text>
                      <Text style={styles.userName}>{user?.name}</Text>
                  </View>
              </View>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>← Geri</Text>
              </TouchableOpacity>
          </View>

          <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Abonelik Yönetimi</Text>
          </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* CURRENT STATUS CARD */}
            <View style={[styles.statusCard, { borderLeftColor: subscriptionStatus?.subscriptionActive ? '#22c55e' : '#ef4444' }]}>
                <Text style={styles.statusLabel}>Mevcut Durum</Text>
                <Text style={styles.statusText}>{subscriptionStatus?.subscriptionActive ? '✨ AKTİF' : '⚠️ PASİF'}</Text>
                {subscriptionStatus?.subscriptionEndDate && (
                    <Text style={styles.dateText}>Bitiş: {new Date(subscriptionStatus.subscriptionEndDate).toLocaleDateString('tr-TR')}</Text>
                )}
            </View>

            <Text style={styles.sectionTitle}>ABONELİK PAKETİ</Text>
            <View style={styles.packageCard}>
                <View>
                    <Text style={styles.packageName}>30 Günlük Uzman Üyeliği</Text>
                    <Text style={styles.packageSubText}>Tüm ekspertiz araçlarına tam erişim</Text>
                </View>
                <Text style={styles.packagePrice}>{fee} TL</Text>
            </View>

            <Text style={styles.sectionTitle}>ÖDEME YÖNTEMİ SEÇİN</Text>
            <View style={styles.methodRow}>
                <TouchableOpacity 
                    style={[styles.methodBtn, paymentMethod === 'CARD' && styles.activeMethod]} 
                    onPress={() => setPaymentMethod('CARD')}
                >
                    <Text style={styles.methodIcon}>💳</Text>
                    <Text style={[styles.methodText, paymentMethod === 'CARD' && styles.activeMethodText]}>Kredi Kartı</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.methodBtn, paymentMethod === 'TRANSFER' && styles.activeMethod]} 
                    onPress={() => setPaymentMethod('TRANSFER')}
                >
                    <Text style={styles.methodIcon}>🏦</Text>
                    <Text style={[styles.methodText, paymentMethod === 'TRANSFER' && styles.activeMethodText]}>Havale / EFT</Text>
                </TouchableOpacity>
            </View>

            {paymentMethod === 'TRANSFER' ? (
                <View style={styles.bankBox}>
                    <Text style={styles.bankLabel}>Banka Havale Bilgileri</Text>
                    <View style={styles.bankInfoField}>
                        <Text style={styles.bankValTitle}>{bankInfo.title}</Text>
                        <Text style={styles.bankValIban}>{bankInfo.iban}</Text>
                    </View>
                </View>
            ) : (
                <View style={styles.cardBox}>
                    <Text style={styles.bankLabel}>Kart Bilgilerini Giriniz</Text>
                    <TextInput style={styles.cardInput} placeholder="Kart Üzerindeki İsim" placeholderTextColor="#475569" value={cardHolder} onChangeText={setCardHolder} />
                    <TextInput style={styles.cardInput} placeholder="Kart Numarası (16 Hane)" placeholderTextColor="#475569" keyboardType="numeric" maxLength={16} value={cardNumber} onChangeText={setCardNumber} />
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TextInput style={[styles.cardInput, { flex: 1 }]} placeholder="AA/YY" placeholderTextColor="#475569" maxLength={5} value={expiry} onChangeText={setExpiry} />
                        <TextInput style={[styles.cardInput, { flex: 1 }]} placeholder="CVC" placeholderTextColor="#475569" keyboardType="numeric" maxLength={3} secureTextEntry value={cvc} onChangeText={setCvc} />
                    </View>
                </View>
            )}

            <TouchableOpacity style={styles.payBtn} onPress={handlePay} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#0f172a" /> : (
                    <Text style={styles.payBtnText}>
                        {paymentMethod === 'CARD' ? 'Güvenli Ödeme Yap' : 'Havaleyi Yaptım, Bildir'}
                    </Text>
                )}
            </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
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
    borderColor: '#38bdf8', 
    elevation: 8, 
    overflow: 'hidden' 
  },
  logoImage: { width: '85%', height: '85%' },
  welcomeBox: { marginLeft: 16 },
  welcomeText: { color: '#94a3b8', fontSize: 13 },
  userName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  backBtn: { padding: 10 },
  backBtnText: { color: '#38bdf8', fontWeight: 'bold' },
  headerTitleRow: { marginTop: 5 },
  headerTitle: { fontSize: 22, color: '#38bdf8', fontWeight: 'bold' },
  content: { padding: 24 },
  statusCard: { backgroundColor: '#1e293b', padding: 20, borderRadius: 20, borderLeftWidth: 6, marginBottom: 25, elevation: 8 },
  statusLabel: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  statusText: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginVertical: 4 },
  dateText: { color: '#64748b', fontSize: 13 },
  sectionTitle: { color: '#64748b', fontSize: 11, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  packageCard: { backgroundColor: '#1e293b', padding: 20, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, borderWidth: 1, borderColor: '#334155' },
  packageName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  packageSubText: { color: '#64748b', fontSize: 12, marginTop: 2 },
  packagePrice: { color: '#38bdf8', fontSize: 22, fontWeight: 'bold' },
  methodRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  methodBtn: { flex: 1, backgroundColor: '#1e293b', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  activeMethod: { borderColor: '#38bdf8', backgroundColor: '#38bdf810' },
  methodIcon: { fontSize: 24, marginBottom: 6 },
  methodText: { color: '#94a3b8', fontWeight: 'bold', fontSize: 13 },
  activeMethodText: { color: '#38bdf8' },
  bankBox: { backgroundColor: '#1e293b', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#334155', marginBottom: 30 },
  bankLabel: { color: '#64748b', fontSize: 12, marginBottom: 15, textAlign: 'center', fontWeight: 'bold' },
  bankInfoField: { alignItems: 'center' },
  bankValTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  bankValIban: { color: '#38bdf8', fontSize: 18, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  cardBox: { backgroundColor: '#1e293b', padding: 20, borderRadius: 20, marginBottom: 30, borderWidth: 1, borderColor: '#334155' },
  cardInput: { backgroundColor: '#0f172a', padding: 15, borderRadius: 12, color: '#fff', fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1e293b' },
  payBtn: { backgroundColor: '#38bdf8', padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#38bdf8', shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  payBtnText: { color: '#0f172a', fontSize: 16, fontWeight: 'bold' }
});

export default SubscriptionScreen;
