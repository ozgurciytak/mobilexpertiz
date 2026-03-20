import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Image 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const UserRequestsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyRequests = async () => {
    try {
      const response = await apiClient.get('/requests/my');
      setRequests(response.data);
    } catch (error) {
      console.error('Fetch my requests error', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyRequests();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#eab308'; // Yellow
      case 'QUOTED': return '#0ea5e9'; // Blue
      case 'ACCEPTED': return '#38bdf8'; // Sky Blue
      case 'ASSIGNED': return '#38bdf8'; // Sky Blue
      case 'COMPLETED': return '#22c55e'; // Green
      case 'CANCELLED': return '#ef4444'; // Red
      case 'REDIRECTED': return '#8b5cf6'; // Purple
      default: return '#94a3b8';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING': return 'Bekliyor';
      case 'QUOTED': return 'Teklif Verildi';
      case 'ACCEPTED': return 'Onaylandı / İşlemde';
      case 'ASSIGNED': return 'Atandı';
      case 'COMPLETED': return 'Tamamlandı';
      case 'CANCELLED': return 'İptal Edildi';
      case 'REDIRECTED': return 'Yönlendirildi';
      default: return status;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.requestCard}
      onPress={() => navigation.navigate('RequestDetail', { requestId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.requestTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '22', borderColor: getStatusColor(item.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.vehicleText}>{item.vehicleInfo || 'Araç bilgisi yok'}</Text>
      
      <View style={styles.cardFooter}>
        <Text style={styles.locationText}>📍 {item.location}</Text>
        <Text style={styles.quoteCount}>
          {item.status === 'REDIRECTED' 
            ? `➡️ ${item.redirectedTo}` 
            : (item.status === 'PENDING' ? `${item.quotes?.length || 0} Teklif` : (item.selectedExpert ? 'Uzman Atandı' : 'Süreçte'))
          }
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      
      {/* FIXED STICKY HEADER */}
      <View style={styles.stickyHeader}>
          <View style={styles.headerTopRow}>
              <View style={styles.profileSection}>
                  <View style={[styles.avatarBox, { borderColor: '#22c55e' }]}>
                      <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
                  </View>
                  <View style={styles.welcomeBox}>
                      <Text style={styles.welcomeText}>Süreç Verileri,</Text>
                      <Text style={styles.userName}>{user?.name}</Text>
                  </View>
              </View>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>← Geri</Text>
              </TouchableOpacity>
          </View>
          <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Taleplerim</Text>
          </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Henüz bir talep bulunmuyor.</Text>
              <TouchableOpacity 
                style={styles.createNowButton}
                onPress={() => navigation.navigate('RequestCreate')}
              >
                <Text style={styles.createNowText}>Hemen Oluştur</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
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
  listContent: {
    padding: 20,
    paddingBottom: 40
  },
  requestCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  vehicleText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#e2e8f0',
  },
  quoteCount: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    marginBottom: 20,
  },
  createNowButton: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: '#38bdf8',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8
  },
  createNowText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 16
  }
});

export default UserRequestsScreen;
