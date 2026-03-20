import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator, 
  Alert, 
  RefreshControl, 
  TextInput, 
  Linking, 
  ScrollView,
  Image 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const AdminDashboardScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { initialTab } = route.params;
  const [tab, setTab] = useState(initialTab); 
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [expertUsers, setExpertUsers] = useState([]);
  const [normalUsers, setNormalUsers] = useState([]);
  const [expertiseRequests, setExpertiseRequests] = useState([]);
  const [supportRequests, setSupportRequests] = useState([]);
  const [vehicleResults, setVehicleResults] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState({
      subscription_fee: '1500',
      bank_iban: '',
      bank_title: 'Mobil Expertiz Ltd. Şti.'
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING': return 'Bekliyor';
      case 'QUOTED': return 'Teklif Verildi';
      case 'ACCEPTED': return 'İşleniyor';
      case 'ASSIGNED': return 'Atandı';
      case 'COMPLETED': return 'Tamamlandı';
      case 'CANCELLED': return 'İptal Edildi';
      case 'REDIRECTED': return 'Yönlendirildi';
      case 'APPROVED': return 'Onaylandı';
      case 'REJECTED': return 'Reddedildi';
      case 'OPEN': return 'Açık / İşlemde';
      case 'CLOSED': return 'Kapalı / Çözüldü';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#eab308';
      case 'QUOTED': return '#0ea5e9';
      case 'ACCEPTED': return '#38bdf8';
      case 'COMPLETED': return '#22c55e';
      case 'APPROVED': return '#22c55e';
      case 'OPEN': return '#38bdf8';
      case 'CANCELLED': return '#ef4444';
      case 'REJECTED': return '#ef4444';
      case 'CLOSED': return '#64748b';
      default: return '#94a3b8';
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'EXPERTS') {
        const response = await apiClient.get('/users?role=EXPERT');
        setExpertUsers(response.data);
      } else if (tab === 'USERS') {
        const response = await apiClient.get('/users?role=USER');
        setNormalUsers(response.data);
      } else if (tab === 'SUPPORT') {
        const response = await apiClient.get('/support');
        setSupportRequests(response.data);
      } else if (tab === 'REQUESTS') {
        const response = await apiClient.get(`/admin/records?q=${searchQuery}`);
        setExpertiseRequests(response.data.requests);
      } else if (tab === 'VEHICLE_SEARCH') {
        if (vehicleSearchQuery) {
            const response = await apiClient.get(`/admin/vehicles/search?q=${vehicleSearchQuery}`);
            setVehicleResults(response.data);
        }
      } else if (tab === 'PAYMENTS') {
        const response = await apiClient.get('/admin/payments');
        setPayments(response.data);
      } else if (tab === 'SETTINGS') {
        const response = await apiClient.get('/admin/settings');
        const settingsMap = response.data.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
        setSettings(prev => ({ ...prev, ...settingsMap }));
      }
    } catch (error) {
      console.error('Admin Fetch error', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const approvePayment = (paymentId) => {
      Alert.alert('Ödeme Onayı', 'Bu havaleyi onaylayıp uzmanlık süresini 30 gün uzatmak istiyor musunuz?', [
          { text: 'Vazgeç' },
          { text: 'Onayla', onPress: async () => {
              try {
                  await apiClient.put(`/admin/payments/${paymentId}/approve`, { status: 'APPROVED' });
                  fetchData();
                  Alert.alert('Başarılı', 'Ödeme onaylandı ve süre uzatıldı.');
              } catch (e) { Alert.alert('Hata', 'İşlem yapılamadı.'); }
          }}
      ]);
  };

  const updateSetting = async (key, value) => {
      try {
          await apiClient.put('/admin/settings', { key, value });
          Alert.alert('Başarılı', 'Ayar güncellendi.');
          fetchData();
      } catch (e) { Alert.alert('Hata', 'Güncellenemedi.'); }
  };

  const renderPaymentItem = ({ item }) => {
    if (!item) return null;
    return (
        <View style={styles.recordCard}>
            <View style={{ flex: 1 }}>
                <Text style={styles.recordTitle}>{item.user?.name}</Text>
                <Text style={styles.recordSubText}>{item.amount} TL | {item.method === 'CARD' ? 'Kredi Kartı' : 'Havale'}</Text>
                <Text style={styles.recordSubText}>{item.notes}</Text>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '22', borderColor: getStatusColor(item.status), borderWidth: 1, marginTop: 8 }]}>
                    <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>{getStatusLabel(item.status)}</Text>
                </View>
            </View>
            {item.status === 'PENDING' && item.method === 'TRANSFER' && (
                <TouchableOpacity style={styles.approveBtn} onPress={() => approvePayment(item.id)}>
                    <Text style={styles.approveBtnText}>ONAYLA</Text>
                </TouchableOpacity>
            )}
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.dateText}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('tr-TR') : ''}</Text>
            </View>
        </View>
    );
  };

  const renderSupportItem = ({ item }) => {
    if (!item) return null;
    return (
        <TouchableOpacity style={styles.recordCard} onPress={() => navigation.navigate('SupportDetail', { ticketId: item.id })}>
          <View style={{ flex: 1 }}>
            <Text style={styles.recordTitle}>{item.subject || 'Konu Yok'}</Text>
            <Text style={styles.recordSubText}>{item.user?.name || 'Anonim'} | {item.user?.email || '-'}</Text>
            <Text style={[styles.recordSubText, { color: '#e2e8f0', marginTop: 4 }]} numberOfLines={1}>{item.message || ''}</Text>
            <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '22', borderColor: getStatusColor(item.status), borderWidth: 1 }]}>
                    <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>{getStatusLabel(item.status)}</Text>
                </View>
            </View>
          </View>
          <Text style={styles.dateText}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('tr-TR') : ''}</Text>
        </TouchableOpacity>
    );
  };

  const renderRequestItem = ({ item }) => {
    if (!item) return null;
    return (
        <TouchableOpacity style={styles.recordCard} onPress={() => navigation.navigate('RequestDetail', { requestId: item.id })}>
          <View style={{ flex: 1 }}>
            <Text style={styles.recordTitle}>{item.title || 'Başlıksız'}</Text>
            <Text style={styles.recordSubText}>{item.plate || '-'} | {item.user?.name || 'Anonim'}</Text>
            <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '22', borderColor: getStatusColor(item.status), borderWidth: 1 }]}>
                    <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>{getStatusLabel(item.status)}</Text>
                </View>
                {item.report && (
                    <TouchableOpacity 
                        style={[styles.badge, { backgroundColor: '#8b5cf6', marginLeft: 8 }]}
                        onPress={() => navigation.navigate('ReportView', { requestId: item.id })}
                    >
                        <Text style={styles.badgeText}>Rapor Gözat</Text>
                    </TouchableOpacity>
                )}
            </View>
          </View>
          <Text style={styles.dateText}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('tr-TR') : ''}</Text>
        </TouchableOpacity>
    );
  };

  const renderUserItem = ({ item }) => {
    if (!item) return null;
    return (
        <View style={styles.recordCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.recordTitle}>{item.name || 'İsimsiz'}</Text>
            <Text style={styles.recordSubText}>{item.email || '-'}</Text>
            <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: item.role === 'EXPERT' ? '#8b5cf622' : '#94a3b822', borderColor: item.role === 'EXPERT' ? '#8b5cf6' : '#94a3b8', borderWidth: 1 }]}>
                    <Text style={[styles.badgeText, { color: item.role === 'EXPERT' ? '#8b5cf6' : '#94a3b8' }]}>{item.role === 'EXPERT' ? 'Uzman' : 'Üye'}</Text>
                </View>
                {item.isBlocked && (
                    <View style={[styles.badge, { backgroundColor: '#ef444422', borderColor: '#ef4444', borderWidth: 1, marginLeft: 8 }]}>
                        <Text style={[styles.badgeText, { color: '#ef4444' }]}>ENGELLİ</Text>
                    </View>
                )}
                {item.role === 'EXPERT' && !item.isApproved && (
                    <View style={[styles.badge, { backgroundColor: '#f59e0b22', borderColor: '#f59e0b', borderWidth: 1, marginLeft: 8 }]}>
                        <Text style={[styles.badgeText, { color: '#f59e0b' }]}>ONAY BEKLİYOR</Text>
                    </View>
                )}
            </View>
    
            <View style={styles.adminActionRow}>
                {item.role === 'EXPERT' && !item.isApproved && (
                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]}
                        onPress={() => {
                            Alert.alert('Onay', 'Bu uzmanı onaylamak istiyor musunuz?', [
                                { text: 'Vazgeç' },
                                { text: 'Onayla', onPress: async () => {
                                    await apiClient.put(`/admin/users/${item.id}/edit`, { isApproved: true });
                                    fetchData();
                                }}
                            ]);
                        }}
                    >
                        <Text style={styles.actionBtnText}>HESABI ONAYLA</Text>
                    </TouchableOpacity>
                )}
    
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: item.isBlocked ? '#22c55e' : '#ef4444' }]}
                    onPress={() => {
                        Alert.alert('Blok İşlemi', item.isBlocked ? 'Engeli kaldırmak istiyor musunuz?' : 'Kullanıcıyı engellemek istiyor musunuz?', [
                            { text: 'Vazgeç' },
                            { text: 'Evet', onPress: async () => {
                                await apiClient.put(`/admin/users/${item.id}/block`, { isBlocked: !item.isBlocked });
                                fetchData();
                            }}
                        ]);
                    }}
                >
                    <Text style={styles.actionBtnText}>{item.isBlocked ? 'ENGELİ KALDIR' : 'ENGELLE'}</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      
      {/* FIXED HEADER WITH TITLE */}
      <View style={styles.stickyHeader}>
          <View style={styles.headerTopRow}>
              <View style={styles.profileSection}>
                  <View style={styles.avatarBox}>
                      <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
                  </View>
                  <View style={styles.welcomeBox}>
                      <Text style={styles.welcomeText}>Yönetici Paneli,</Text>
                      <Text style={styles.userName}>{user?.name}</Text>
                  </View>
              </View>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>← Geri</Text>
              </TouchableOpacity>
          </View>

          <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>
                  {tab === 'EXPERTS' ? 'Uzman Yönetimi' :
                   tab === 'USERS' ? 'Üye Listesi' :
                   tab === 'REQUESTS' ? 'Tüm Talepler' :
                   tab === 'SUPPORT' ? 'Destek Masası' :
                   tab === 'PAYMENTS' ? 'Ödeme & Havale' :
                   tab === 'SETTINGS' ? 'Sistem Ayarları' : 'Araç Sorgulama'}
              </Text>
          </View>
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'SETTINGS' ? (
            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                <View style={styles.settingGroup}>
                    <Text style={styles.settingLabel}>Abonelik Ücreti (TL)</Text>
                    <TextInput 
                        style={styles.settingInput} 
                        value={settings.subscription_fee} 
                        onChangeText={(v) => setSettings({...settings, subscription_fee: v})}
                        keyboardType="numeric"
                    />
                    <TouchableOpacity style={styles.settingSaveBtn} onPress={() => updateSetting('subscription_fee', settings.subscription_fee)}>
                        <Text style={styles.settingSaveBtnText}>Güncelle</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.settingGroup}>
                    <Text style={styles.settingLabel}>Banka Havale Unvanı</Text>
                    <TextInput 
                        style={styles.settingInput} 
                        value={settings.bank_title} 
                        onChangeText={(v) => setSettings({...settings, bank_title: v})}
                    />
                    <TouchableOpacity style={styles.settingSaveBtn} onPress={() => updateSetting('bank_title', settings.bank_title)}>
                        <Text style={styles.settingSaveBtnText}>Güncelle</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.settingGroup}>
                    <Text style={styles.settingLabel}>IBAN Adresi</Text>
                    <TextInput 
                        style={styles.settingInput} 
                        value={settings.bank_iban} 
                        onChangeText={(v) => setSettings({...settings, bank_iban: v})}
                    />
                    <TouchableOpacity style={styles.settingSaveBtn} onPress={() => updateSetting('bank_iban', settings.bank_iban)}>
                        <Text style={styles.settingSaveBtnText}>Güncelle</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        ) : (
            <>
                {(tab === 'REQUESTS' || tab === 'VEHICLE_SEARCH') && (
                    <View style={styles.searchSection}>
                        <TextInput 
                            style={styles.searchInput}
                            placeholder="Plaka / Şase No / İsim..."
                            placeholderTextColor="#94a3b8"
                            value={tab === 'VEHICLE_SEARCH' ? vehicleSearchQuery : searchQuery}
                            onChangeText={tab === 'VEHICLE_SEARCH' ? setVehicleSearchQuery : setSearchQuery}
                        />
                        <TouchableOpacity style={styles.searchActionBtn} onPress={fetchData}>
                            <Text style={styles.searchActionBtnText}>ARA</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {loading ? <ActivityIndicator size="large" color="#38bdf8" style={{ marginTop: 50 }} /> : (
                    <FlatList
                        data={
                            tab === 'EXPERTS' ? expertUsers : 
                            tab === 'USERS' ? normalUsers : 
                            tab === 'REQUESTS' ? expertiseRequests : 
                            tab === 'SUPPORT' ? supportRequests : 
                            tab === 'PAYMENTS' ? payments : vehicleResults
                        }
                        keyExtractor={(item, index) => (item?.id ? item.id.toString() : index.toString())}
                        renderItem={
                            tab === 'PAYMENTS' ? renderPaymentItem : 
                            (tab === 'SUPPORT' ? renderSupportItem : 
                            (tab === 'REQUESTS' || tab === 'VEHICLE_SEARCH' ? renderRequestItem : renderUserItem))
                        }
                        contentContainerStyle={styles.listContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
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
    borderColor: '#8b5cf6', 
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
  listContent: { padding: 20 },
  recordCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#38bdf8', flexDirection: 'row', alignItems: 'center' },
  recordTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  recordSubText: { color: '#94a3b8', fontSize: 13 },
  badgeRow: { flexDirection: 'row', marginTop: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText: { fontWeight: 'bold', fontSize: 11 },
  dateText: { color: '#475569', fontSize: 10 },
  approveBtn: { backgroundColor: '#22c55e', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10 },
  approveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  searchSection: { flexDirection: 'row', padding: 20, gap: 10 },
  searchInput: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 16, color: '#fff', borderWidth: 1, borderColor: '#334155' },
  searchActionBtn: { backgroundColor: '#38bdf8', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  searchActionBtnText: { color: '#0f172a', fontWeight: 'bold' },
  settingGroup: { backgroundColor: '#1e293b', padding: 20, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  settingLabel: { color: '#94a3b8', fontSize: 13, marginBottom: 10, fontWeight: 'bold' },
  settingInput: { backgroundColor: '#0f172a', padding: 15, borderRadius: 12, color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  settingSaveBtn: { backgroundColor: '#38bdf8', padding: 15, borderRadius: 12, alignItems: 'center' },
  settingSaveBtnText: { color: '#0f172a', fontWeight: 'bold' },
  adminActionRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  actionBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', elevation: 4 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 11 }
});

export default AdminDashboardScreen;
