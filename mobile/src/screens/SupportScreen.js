import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  FlatList,
  SafeAreaView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { Ionicons } from '@expo/vector-icons';

const SupportScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await apiClient.get('/support');
      setRequests(response.data);
    } catch (error) {
      console.error('Fetch support requests error', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!subject || !message) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/support', {
        subject,
        message
      });
      Alert.alert('Başarılı', 'Destek talebiniz oluşturuldu.', [
        { text: 'Tamam', onPress: () => {
          setShowForm(false);
          setSubject('');
          setMessage('');
          fetchRequests();
        }}
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Destek talebi oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRequestItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('SupportDetail', { ticketId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardSubject}>{item.subject}</Text>
        <View style={[styles.badge, { backgroundColor: item.status === 'CLOSED' ? '#991b1b' : '#065f46' }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString('tr-TR')}</Text>
        <Text style={styles.msgCount}>{item._count?.messages || 0} Mesaj</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.title}>Destek Merkezi</Text>
      </View>

      {showForm ? (
        <ScrollView style={styles.form}>
          <Text style={styles.formTitle}>Yeni Destek Talebi</Text>
          <Text style={styles.label}>Konu</Text>
          <TextInput
            style={styles.input}
            placeholder="Talebinizin konusu"
            placeholderTextColor="#64748b"
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.label}>Mesajınız</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Detaylı açıklama yazınız..."
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
          />

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowForm(false)}>
              <Text style={styles.cancelButtonText}>Vazgeç</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.submitButton, submitting && styles.disabledButton]} 
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.submitButtonText}>Gönder</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderRequestItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Henüz bir destek talebiniz yok.</Text>
            }
          />
          {user?.role !== 'ADMIN' && (
            <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)}>
              <Text style={styles.fabText}>+ Yeni Talep</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#1e293b' },
  title: { color: '#f8fafc', fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  list: { padding: 20 },
  card: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardSubject: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardDate: { color: '#94a3b8', fontSize: 12 },
  msgCount: { color: '#38bdf8', fontSize: 12, fontWeight: 'bold' },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 100, fontSize: 16 },
  form: { padding: 20 },
  formTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  label: { color: '#94a3b8', marginBottom: 8, fontSize: 14 },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 15,
    color: '#f8fafc',
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  textArea: { minHeight: 120 },
  formActions: { flexDirection: 'row', gap: 10 },
  cancelButton: { flex: 1, padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  cancelButtonText: { color: '#94a3b8', fontWeight: 'bold' },
  submitButton: { flex: 2, backgroundColor: '#38bdf8', padding: 15, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: '#0f172a', fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#38bdf8', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, elevation: 5 },
  fabText: { color: '#0f172a', fontWeight: 'bold' },
  disabledButton: { opacity: 0.6 }
});

export default SupportScreen;
