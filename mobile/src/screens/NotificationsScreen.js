import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';

const NotificationsScreen = ({ navigation }) => {
  // Simüle edilmiş bildirim verileri
  const [notifications] = useState([
    {
      id: '1',
      title: 'Yeni Teklif!',
      message: 'Aracınız için Ahmet Uzman tarafından yeni bir teklif verildi.',
      time: '10 dk önce',
      type: 'QUOTE',
      unread: true,
    },
    {
      id: '2',
      title: 'Uzman Atandı',
      message: 'Ekspertiz talebiniz Mehmet Uzman tarafından kabul edildi.',
      time: '1 saat önce',
      type: 'ASSIGNED',
      unread: false,
    },
    {
      id: '3',
      title: 'Rapor Hazır',
      message: 'Toyota Corolla ekspertiz raporunuz hazır. İnceleyebilirsiniz.',
      time: '3 saat önce',
      type: 'REPORT',
      unread: false,
    },
    {
      id: '4',
      title: 'Hoş Geldiniz',
      message: 'Mobil Expertiz ailesine hoş geldiniz! İlk talebinizi hemen oluşturun.',
      time: '1 gün önce',
      type: 'INFO',
      unread: false,
    }
  ]);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[styles.notificationCard, item.unread && styles.unreadCard]}>
      <View style={styles.iconContainer}>
        <Text style={styles.typeIcon}>
          {item.type === 'QUOTE' ? '💰' : 
           item.type === 'REPORT' ? '📄' : 
           item.type === 'ASSIGNED' ? '🤝' : '🔔'}
        </Text>
      </View>
      <View style={styles.textContainer}>
        <View style={styles.row}>
          <Text style={styles.notifTitle}>{item.title}</Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
        <Text style={styles.messageText}>{item.message}</Text>
      </View>
      {item.unread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bildirimler</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Henüz bildiriminiz yok.</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  backText: {
    color: '#38bdf8',
    fontSize: 16,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContent: {
    padding: 24,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  unreadCard: {
    borderColor: '#38bdf8',
    backgroundColor: '#1e293b',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  typeIcon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  timeText: {
    fontSize: 12,
    color: '#64748b',
  },
  messageText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38bdf8',
    marginLeft: 8,
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});

export default NotificationsScreen;
