import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const SupportDetailScreen = ({ route, navigation }) => {
  const { ticketId } = route.params;
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scrollViewRef = useRef();

  useEffect(() => {
    fetchDetail();
  }, []);

  const fetchDetail = async () => {
    if (!ticketId) {
        Alert.alert('Hata', 'Destek talebi ID bulunamadı.');
        navigation.goBack();
        return;
    }
    try {
      const response = await apiClient.get(`/support/${ticketId}`);
      setRequest(response.data);
    } catch (error) {
      console.error('Fetch support detail error', error);
      Alert.alert('Hata', 'Destek talebi detayları alınamadı.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      await apiClient.post(`/support/${ticketId}/messages`, { message });
      setMessage('');
      fetchDetail();
    } catch (error) {
      console.error('Send message error', error);
      Alert.alert('Hata', 'Mesaj gönderilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseRequest = async () => {
    Alert.alert(
      'Talebi Kapat',
      'Bu destek talebini kapatmak istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kapat',
          onPress: async () => {
            try {
              await apiClient.put(`/support/${ticketId}/status`, { status: 'CLOSED' });
              fetchDetail();
            } catch (error) {
              Alert.alert('Hata', 'Talep kapatılamadı.');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      
      {/* FIXED STICKY HEADER */}
      <View style={styles.stickyHeader}>
          <View style={styles.headerTopRow}>
              <View style={styles.profileSection}>
                  <View style={[styles.avatarBox, { borderColor: user?.role === 'ADMIN' ? '#ef4444' : '#38bdf8' }]}>
                      <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
                  </View>
                  <View style={styles.welcomeBox}>
                      <Text style={styles.welcomeText}>Destek Hattı,</Text>
                      <Text style={styles.userName}>{request?.user?.name || user?.name}</Text>
                  </View>
              </View>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>← Geri</Text>
              </TouchableOpacity>
          </View>
          <View style={styles.headerTitleRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                <Text style={styles.headerTitle} numberOfLines={1}>{request?.subject || 'Destek Talebi'}</Text>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: request?.status === 'CLOSED' ? '#ef444422' : (request?.status === 'IN_PROGRESS' ? '#f59e0b22' : '#22c55e22'), borderColor: request?.status === 'CLOSED' ? '#ef4444' : (request?.status === 'IN_PROGRESS' ? '#f59e0b' : '#22c55e'), borderWidth: 1 }
                ]}>
                  <Text style={[styles.statusText, { color: request?.status === 'CLOSED' ? '#ef4444' : (request?.status === 'IN_PROGRESS' ? '#f59e0b' : '#22c55e') }]}>
                    {request?.status === 'CLOSED' ? 'KAPANDI' : (request?.status === 'IN_PROGRESS' ? 'İŞLEMDE' : 'AÇIK')}
                  </Text>
                </View>
              </View>
          </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={{ paddingBottom: 30 }}
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
        >
          {request?.messages?.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageWrapper,
                  isMe ? styles.myMessageWrapper : styles.theirMessageWrapper
                ]}
              >
                {!isMe && <Text style={styles.senderName}>{msg.sender?.name} ({msg.sender?.role === 'ADMIN' ? 'Destek Ekibi' : 'Kullanıcı'})</Text>}
                <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
                  <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                    {msg.message}
                  </Text>
                </View>
                <Text style={styles.timeText}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {request?.status !== 'CLOSED' && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Mesajınızı yazın..."
              placeholderTextColor="#94a3b8"
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={submitting || !message.trim()}
            >
              {submitting ? (
                <ActivityIndicator color="#0f172a" size="small" />
              ) : (
                <Text style={styles.sendButtonText}>Gönder</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {user?.role === 'ADMIN' && request?.status !== 'CLOSED' && (
          <TouchableOpacity onPress={handleCloseRequest} style={styles.adminCloseBar}>
            <Text style={styles.adminCloseText}>Talebi Kalıcı Olarak Kapat</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
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
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, color: '#38bdf8', fontWeight: 'bold', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  messagesContainer: { flex: 1, padding: 16 },
  messageWrapper: { marginBottom: 16, maxWidth: '85%' },
  myMessageWrapper: { alignSelf: 'flex-end' },
  theirMessageWrapper: { alignSelf: 'flex-start' },
  senderName: { color: '#94a3b8', fontSize: 11, marginBottom: 4, marginLeft: 4 },
  messageBubble: { padding: 14, borderRadius: 20 },
  myBubble: { backgroundColor: '#38bdf8', borderTopRightRadius: 4 },
  theirBubble: { backgroundColor: '#1e293b', borderTopLeftRadius: 4, borderWidth: 1, borderColor: '#334155' },
  messageText: { fontSize: 15, lineHeight: 22 },
  myMessageText: { color: '#0f172a' },
  theirMessageText: { color: '#e2e8f0' },
  timeText: { color: '#64748b', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  inputContainer: { flexDirection: 'row', padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, backgroundColor: '#1e293b', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#0f172a', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 12, color: '#fff', fontSize: 15, maxHeight: 120, borderWidth: 1, borderColor: '#334155' },
  sendButton: { backgroundColor: '#38bdf8', height: 50, paddingHorizontal: 20, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  sendButtonDisabled: { backgroundColor: '#334155' },
  sendButtonText: { color: '#0f172a', fontWeight: 'bold' },
  adminCloseBar: { backgroundColor: '#7f1d1d', padding: 12, alignItems: 'center' },
  adminCloseText: { color: '#fca5a5', fontWeight: 'bold', fontSize: 12 }
});

export default SupportDetailScreen;
