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
  KeyboardAvoidingView,
  Platform,
  Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const RequestDetailScreen = ({ route, navigation }) => {
  const { requestId } = route.params;
  const { user } = useAuth(); // Auth context eklendi
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequestDetail();
  }, []);

  const handleRedirect = async () => {
    Alert.prompt(
      'Kurumsal Ekspertize Yönlendir',
      'Yönlendirmek istediğiniz şube veya merkez adını giriniz:',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Yönlendir',
          onPress: async (location) => {
            if (!location) {
              Alert.alert('Hata', 'Yönlendirilecek yer bilgisi zorunludur.');
              return;
            }
            try {
              await apiClient.put(`/requests/${requestId}/redirect`, {
                redirectedTo: location,
                redirectReason: 'Mobil uzman tarafından kurumsal şubeye yönlendirildi.'
              });
              Alert.alert('Başarılı', 'Talep kurumsal ekspertize yönlendirildi.', [
                { text: 'Tamam', onPress: () => fetchRequestDetail() }
              ]);
            } catch (error) {
              Alert.alert('Hata', 'Yönlendirme işlemi başarısız oldu.');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleDownloadPDF = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const url = `${apiClient.defaults.baseURL}/requests/${requestId}/pdf?token=${token}`;
      Linking.openURL(url).catch(err => {
        Alert.alert('Hata', 'PDF indirilemedi.');
      });
    } catch (error) {
      Alert.alert('Hata', 'Yetkilendirme hatası.');
    }
  };

  const fetchRequestDetail = async () => {
    try {
      const response = await apiClient.get(`/requests/${requestId}`);
      setRequest(response.data);
    } catch (error) {
      console.error('Fetch detail error', error);
      Alert.alert('Hata', 'Talep detayları alınamadı.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSendQuote = async () => {
    if (!price) {
      Alert.alert('Hata', 'Lütfen teklif fiyatınızı girin.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/quotes', {
        requestId,
        price: parseFloat(price),
        message
      });
      Alert.alert('Başarılı', 'Teklifiniz başarıyla gönderildi.', [
        { text: 'Tamam', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Quote error', error);
      Alert.alert('Hata', error.response?.data?.error || 'Teklif gönderilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptQuote = async (quoteId) => {
    Alert.alert(
      'Teklifi Kabul Et',
      'Bu uzman ile eşleşmeyi onaylıyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Onayla', 
          onPress: async () => {
            try {
              await apiClient.put(`/quotes/${quoteId}/accept`);
              Alert.alert('Başarılı', 'Teklif kabul edildi. Uzman ile iletişime geçebilirsiniz.', [
                { text: 'Tamam', onPress: () => fetchRequestDetail() }
              ]);
            } catch (error) {
              Alert.alert('Hata', 'Teklif kabul edilirken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };

  const openWhatsApp = (phone) => {
    const formattedPhone = phone.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${formattedPhone}&text=Merhaba, Mobil Expertiz uygulaması üzerinden ekspertiz talebim için yazıyorum.`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Hata', 'WhatsApp cihazınızda yüklü değil.');
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  const isOwner = user?.id === request?.userId;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>← Geri</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Talep Detayı</Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.title}>{request.title}</Text>
            <View style={styles.infoRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{request.location}</Text>
              </View>
              <Text style={styles.dateText}>{new Date(request.createdAt).toLocaleDateString('tr-TR')}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Araç Bilgisi</Text>
              <Text style={styles.sectionContent}>{request.vehicleInfo || 'Belirtilmedi'}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Açıklama</Text>
              <Text style={styles.sectionContent}>{request.description}</Text>
            </View>

            {user?.role === 'ADMIN' && (
              <View style={styles.adminSection}>
                <Text style={styles.sectionTitle}>Yönetici Bilgi Paneli</Text>
                
                <View style={styles.adminInfoBox}>
                  <Text style={styles.adminInfoLabel}>Müşteri Bilgileri:</Text>
                  <Text style={styles.adminInfoText}>{request.user?.name || 'Bilinmiyor'}</Text>
                  <Text style={styles.adminInfoSubText}>📞 {request.user?.phone || 'Telefon yok'}</Text>
                  <Text style={styles.adminInfoSubText}>✉️ {request.user?.email || 'Email yok'}</Text>
                  <Text style={styles.adminInfoSubText}>🆔 TC: {request.user?.tcNo || 'Belirtilmedi'}</Text>
                </View>

                {request.selectedExpert ? (
                  <View style={styles.adminInfoBox}>
                    <Text style={styles.adminInfoLabel}>Atanan Uzman:</Text>
                    <Text style={styles.adminInfoText}>{request.selectedExpert.name}</Text>
                    <Text style={styles.adminInfoSubText}>📞 {request.selectedExpert.phone || 'Telefon yok'}</Text>
                    <Text style={styles.adminInfoSubText}>✉️ {request.selectedExpert.email || 'Email yok'}</Text>
                    <Text style={styles.adminInfoSubText}>🆔 TC: {request.selectedExpert.tcNo || 'Belirtilmedi'}</Text>
                  </View>
                ) : (
                  <View style={styles.adminInfoBox}>
                    <Text style={styles.adminInfoLabel}>Uzman:</Text>
                    <Text style={styles.adminInfoStatus}>Henüz bir uzman atanmadı.</Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.smallPdfButton}
                  onPress={handleDownloadPDF}
                >
                  <Text style={styles.smallPdfButtonText}>📄 Detayları PDF Olarak İndir</Text>
                </TouchableOpacity>
              </View>
            )}

            {user?.role === 'EXPERT' && (
              <TouchableOpacity 
                style={styles.smallPdfButton}
                onPress={handleDownloadPDF}
              >
                <Text style={styles.smallPdfButtonText}>📄 Detayları PDF Olarak İndir</Text>
              </TouchableOpacity>
            )}
          </View>

          {(isOwner || user?.role === 'ADMIN') && (request.status === 'PENDING' || request.status === 'QUOTED') && (
            <View style={styles.quotesSection}>
              <Text style={styles.sectionTitle}>Gelen Teklifler ({request.quotes?.length || 0})</Text>
              {request.quotes && request.quotes.length > 0 ? (
                request.quotes.map((quote) => (
                  <View key={quote.id} style={styles.quoteCard}>
                    <View style={styles.quoteHeader}>
                      <Text style={styles.expertName}>{quote.expert?.name}</Text>
                      <Text style={styles.quotePrice}>{quote.price} ₺</Text>
                    </View>
                    {quote.message ? (
                      <View style={styles.messageBox}>
                        <Text style={styles.messageLabel}>Uzman Notu:</Text>
                        <Text style={styles.quoteMessage}>{quote.message}</Text>
                      </View>
                    ) : null}
                    {isOwner && (
                      <TouchableOpacity 
                        style={styles.acceptButton}
                        onPress={() => handleAcceptQuote(quote.id)}
                      >
                        <Text style={styles.acceptButtonText}>Kabul Et</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.noQuotesText}>Henüz teklif gelmedi.</Text>
              )}
            </View>
          )}

          {isOwner && request.status === 'ACCEPTED' && (
            <View style={styles.assignedCard}>
              <Text style={styles.assignedTitle}>Anlaşılan Uzman</Text>
              <Text style={styles.expertNameLarge}>{request.selectedExpert?.name}</Text>
              <Text style={styles.expertPhone}>📞 {request.selectedExpert?.phone || 'Telefon belirtilmedi'}</Text>
              
              {request.selectedExpert?.phone && (
                <TouchableOpacity 
                  style={styles.whatsappButton}
                  onPress={() => openWhatsApp(request.selectedExpert.phone)}
                >
                  <Text style={styles.whatsappButtonText}>💬 WhatsApp'tan Yaz</Text>
                </TouchableOpacity>
              )}
            {request.isRedirected && (
          <View style={[styles.infoCard, { borderLeftColor: '#8b5cf6' }]}>
            <Text style={styles.cardTitle}>➡️ Yönlendirme Bilgisi</Text>
            <Text style={styles.cardText}><Text style={styles.bold}>Yönlendirilen Yer:</Text> {request.redirectedTo}</Text>
            {request.redirectReason && (
              <Text style={styles.cardText}><Text style={styles.bold}>Neden:</Text> {request.redirectReason}</Text>
            )}
          </View>
        )}
            </View>
          )}

          {user?.role === 'EXPERT' && (request.status === 'ACCEPTED' || request.status === 'COMPLETED' || request.status === 'REDIRECTED') && request.selectedExpertId === user?.id && (
          <View style={styles.assignedCard}>
            <Text style={styles.assignedTitle}>Müşteri Bilgileri</Text>
            <Text style={styles.expertNameLarge}>{request.user?.name}</Text>
            <Text style={styles.expertPhone}>📞 {request.user?.phone || 'Telefon belirtilmedi'}</Text>
            
            {request.user?.phone && request.user?.phone !== 'Gizli' && (
              <TouchableOpacity 
                style={styles.whatsappButton}
                onPress={() => openWhatsApp(request.user.phone)}
              >
                <Text style={styles.whatsappButtonText}>💬 WhatsApp'tan Yaz</Text>
              </TouchableOpacity>
            )}

            {request.status === 'ACCEPTED' && (
              <View style={{ marginTop: 12 }}>
                <TouchableOpacity 
                  style={styles.prepareReportButton}
                  onPress={() => navigation.navigate('ReportCreate', { requestId: request.id, requestTitle: request.title })}
                >
                  <Text style={styles.prepareReportButtonText}>📝 Ekspertiz Raporunu Hazırla</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.redirectButton, { marginTop: 10 }]}
                  onPress={() => navigation.navigate('ReportCreate', { requestId: request.id, requestTitle: request.title })}
                >
                  <Text style={styles.redirectButtonText}>🔄 Kurumsal/Dış Ekspertize Yönlendir</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

          {(request.status === 'COMPLETED' || request.status === 'REDIRECTED') && (
            <View style={{ marginBottom: 24 }}>
              <TouchableOpacity 
                style={styles.viewReportButton}
                onPress={() => navigation.navigate('ReportView', { requestId: request.id })}
              >
                <Text style={styles.viewReportButtonText}>📄 Ekspertiz Raporunu Görüntüle</Text>
              </TouchableOpacity>

              {isOwner && !request.review && (
                <TouchableOpacity 
                  style={styles.reviewButton}
                  onPress={() => navigation.navigate('ReviewCreate', { 
                    requestId: request.id, 
                    expertName: request.selectedExpert?.name 
                  })}
                >
                  <Text style={styles.reviewButtonText}>⭐ Hizmeti Değerlendir</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {user?.role === 'EXPERT' && request.status === 'PENDING' && (
            <View style={styles.quoteForm}>
              <Text style={styles.formTitle}>Teklif Ver</Text>
              
              <Text style={styles.label}>Hizmet Bedeli (₺)</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: 1500"
                placeholderTextColor="#999"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Mesajınız (Opsiyonel)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Kullanıcıya iletmek istediğiniz not..."
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
                multiline
              />

              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleSendQuote}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Teklifi Gönder</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: 24,
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
  detailCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    backgroundColor: '#0369a1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#64748b',
    fontSize: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  sectionContent: {
    fontSize: 16,
    color: '#e2e8f0',
    lineHeight: 24,
  },
  quoteForm: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#e2e8f0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quotesSection: {
    marginTop: 8,
    marginBottom: 32,
  },
  quoteCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expertName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quotePrice: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quoteMessage: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 16,
  },
  acceptButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noQuotesText: {
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  assignedCard: {
    backgroundColor: '#064e3b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#059669',
  },
  assignedTitle: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  expertNameLarge: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  expertPhone: {
    color: '#34d399',
    fontSize: 16,
    marginBottom: 16,
  },
  whatsappButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  whatsappButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  prepareReportButton: {
    backgroundColor: '#0284c7',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  prepareReportButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewReportButton: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  viewReportButtonText: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  reviewButton: {
    backgroundColor: '#eab308',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  reviewButtonText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  redirectButton: {
    backgroundColor: '#334155',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  redirectButtonText: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  redirectedNotice: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  redirectedTitle: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  redirectedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  redirectedReason: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  smallPdfButton: {
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38bdf8',
    alignItems: 'center',
  },
  smallPdfButtonText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  adminSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  adminInfoBox: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  adminInfoLabel: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  adminInfoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminInfoSubText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 2,
  },
  adminInfoStatus: {
    color: '#64748b',
    fontSize: 14,
    fontStyle: 'italic',
  },
  messageBox: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  messageLabel: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});

export default RequestDetailScreen;
