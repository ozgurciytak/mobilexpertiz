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

const AvailableRequestsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async () => {
    try {
      const response = await apiClient.get('/requests/pool');
      setRequests(response.data);
    } catch (error) {
      console.error('Fetch pool error', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.requestCard}
      onPress={() => navigation.navigate('RequestDetail', { requestId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.requestTitle}>{item.title}</Text>
        <Text style={styles.locationText}>{item.location}</Text>
      </View>
      <Text style={styles.vehicleText}>{item.vehicleInfo || 'Araç bilgisi belirtilmedi'}</Text>
      <Text style={styles.descriptionText} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString('tr-TR')}
        </Text>
        <Text style={styles.quoteCount}>
          {item.quotes?.length || 0} Teklif
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
                  <View style={[styles.avatarBox, { borderColor: '#38bdf8' }]}>
                      <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
                  </View>
                  <View style={styles.welcomeBox}>
                      <Text style={styles.welcomeText}>Bulunan İlanlar,</Text>
                      <Text style={styles.userName}>{user?.name}</Text>
                  </View>
              </View>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>← Geri</Text>
              </TouchableOpacity>
          </View>
          <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Talep Havuzu</Text>
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
              <Text style={styles.emptyText}>Henüz yeni bir talep bulunmuyor.</Text>
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '600',
  },
  vehicleText: {
    fontSize: 14,
    color: '#e2e8f0',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
  },
  quoteCount: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
  },
});

export default AvailableRequestsScreen;
