import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Image, Dimensions, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user, logout, setUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const renderMenuCard = (title, icon, color, onPress, fullWidth = false) => (
    <TouchableOpacity 
      style={[styles.menuCard, fullWidth && styles.fullMenuCard, { borderLeftColor: color }]} 
      onPress={onPress}
    >
      <View style={[styles.cardIconBox, { backgroundColor: color + '20' }]}>
        <Text style={styles.cardIcon}>{icon}</Text>
      </View>
      <View style={styles.cardTextBox}>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.cardArrow}>→</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      
      {/* FULLY STICKY HEADER (STAYS AT TOP) */}
      <View style={styles.stickyHeader}>
          <View style={styles.headerTopRow}>
              <View style={styles.profileSection}>
                  <View style={[styles.avatarBox, { borderColor: user?.role === 'ADMIN' ? '#8b5cf6' : (user?.role === 'EXPERT' ? '#38bdf8' : '#6366f1') }]}>
                      <Image 
                          source={require('../../assets/logo.png')} 
                          style={styles.logoImage}
                          resizeMode="contain"
                      />
                  </View>
                  <View style={styles.welcomeBox}>
                      <Text style={styles.welcomeText}>Hoş Geldin,</Text>
                      <Text style={styles.userName}>{user?.name}</Text>
                  </View>
              </View>
              <TouchableOpacity onPress={logout} style={styles.logoutBtnSmall}>
                  <Text style={styles.logoutBtnText}>Çıkış</Text>
              </TouchableOpacity>
          </View>
          
          <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>
                  {user?.role === 'ADMIN' ? 'Yönetim Masası' : 
                   user?.role === 'EXPERT' ? 'Ekspertiz Operasyon Merkezi' : 
                   'Araç Hizmet Portalı'}
              </Text>
          </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Dynamic Status (Expert Only) */}
        {user?.role === 'EXPERT' && (
          <View style={[styles.statusBanner, { backgroundColor: user.subscriptionActive ? '#065f46' : '#7f1d1d' }]}>
            <View style={{ flex: 1 }}>
                <Text style={styles.statusBannerText}>
                    {user.subscriptionActive ? '✨ Aboneliğiniz Aktif' : '⚠️ Aboneliğiniz Pasif'}
                </Text>
                {user.subscriptionEndDate && (
                    <Text style={styles.statusBannerSubText}>Bitiş: {new Date(user.subscriptionEndDate).toLocaleDateString('tr-TR')}</Text>
                )}
            </View>
            {!user.subscriptionActive && (
                <TouchableOpacity style={styles.bannerActionBtn} onPress={() => navigation.navigate('Subscription')}>
                    <Text style={styles.bannerAction}>Uzat →</Text>
                </TouchableOpacity>
            )}
          </View>
        )}

        {/* --- ROLE BASED ACTION GRIDS --- */}

        {user?.role === 'USER' && (
          <View style={styles.menuGrid}>
            <Text style={styles.sectionTitle}>Hizmetler</Text>
            {renderMenuCard('Yeni Ekspertiz Talebi', '🚗', '#38bdf8', () => navigation.navigate('RequestCreate'), true)}
            {renderMenuCard('Taleplerimi Takip Et', '📋', '#22c55e', () => navigation.navigate('UserRequests'))}
            {renderMenuCard('Rapor Doğrula (QR SCAN)', '🔍', '#f59e0b', () => navigation.navigate('QRScan'))}
          </View>
        )}

        {user?.role === 'EXPERT' && (
          <View style={styles.menuGrid}>
            <Text style={styles.sectionTitle}>İnceleme Merkezi</Text>
            {renderMenuCard('Talep Havuzuna Gözat', '🔍', '#38bdf8', () => navigation.navigate('AvailableRequests'), true)}
            {renderMenuCard('Aktif İşlerim', '💼', '#22c55e', () => navigation.navigate('UserRequests'))}
            {renderMenuCard('Rapor Doğrula (QR SCAN)', '📱', '#f59e0b', () => navigation.navigate('QRScan'))}
            {renderMenuCard('Abonelik İşlemleri', '💳', '#8b5cf6', () => navigation.navigate('Subscription'), true)}
          </View>
        )}

        {/* FULL ADMIN LANDING ON HOME SCREEN */}
        {user?.role === 'ADMIN' && (
          <View style={styles.menuGrid}>
            <Text style={styles.sectionTitle}>Hizmet Yönetimi</Text>
            <View style={styles.adminGridInner}>
                <TouchableOpacity style={[styles.adminBento, { borderLeftColor: '#38bdf8' }]} onPress={() => navigation.navigate('AdminDashboard', { initialTab: 'EXPERTS' })}>
                    <Text style={styles.bentoIcon}>👤</Text>
                    <Text style={styles.bentoText}>Uzman Yönetimi</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.adminBento, { borderLeftColor: '#22c55e' }]} onPress={() => navigation.navigate('AdminDashboard', { initialTab: 'USERS' })}>
                    <Text style={styles.bentoIcon}>👥</Text>
                    <Text style={styles.bentoText}>Üye İşlemleri</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.adminBento, { borderLeftColor: '#f59e0b' }]} onPress={() => navigation.navigate('AdminDashboard', { initialTab: 'REQUESTS' })}>
                    <Text style={styles.bentoIcon}>📋</Text>
                    <Text style={styles.bentoText}>Talepler & Raporlar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.adminBento, { borderLeftColor: '#8b5cf6' }]} onPress={() => navigation.navigate('AdminDashboard', { initialTab: 'VEHICLE_SEARCH' })}>
                    <Text style={styles.bentoIcon}>🔍</Text>
                    <Text style={styles.bentoText}>Araç Sorgulama</Text>
                </TouchableOpacity>
            </View>
            
            <View style={styles.adminGridInner}>
                <TouchableOpacity style={[styles.adminBento, { borderLeftColor: '#ef4444' }]} onPress={() => navigation.navigate('AdminDashboard', { initialTab: 'SUPPORT' })}>
                    <Text style={styles.bentoIcon}>🎧</Text>
                    <Text style={styles.bentoText}>Destek Talepleri</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.adminBento, { borderLeftColor: '#10b981' }]} onPress={() => navigation.navigate('AdminDashboard', { initialTab: 'PAYMENTS' })}>
                    <Text style={styles.bentoIcon}>💰</Text>
                    <Text style={styles.bentoText}>Ödeme & Havale</Text>
                </TouchableOpacity>
            </View>
 
            <View style={styles.adminGridInner}>
                <TouchableOpacity style={[styles.adminBento, { borderLeftColor: '#f43f5e' }]} onPress={() => navigation.navigate('AdminDashboard', { initialTab: 'SETTINGS' })}>
                    <Text style={styles.bentoIcon}>⚙️</Text>
                    <Text style={styles.bentoText}>Sistem Ayarları</Text>
                </TouchableOpacity>
            </View>

            {renderMenuCard('Sistem Raporunu Dışarı Aktar', '📊', '#64748b', async () => {
                try {
                    const token = await AsyncStorage.getItem('userToken');
                    const url = `${apiClient.defaults.baseURL}/admin/records/export?token=${token}`;
                    Linking.openURL(url);
                } catch (e) { Alert.alert('Hata', 'Rapor hazırlanamadı.'); }
            }, true)}
            {renderMenuCard('Rapor Doğrula (QR SCAN)', '🔍', '#f59e0b', () => navigation.navigate('QRScan'), true)}
          </View>
        )}

        {/* Global Support Link */}
        <View style={styles.bottomSection}>
            <Text style={styles.sectionTitle}>Kurumsal Yardım</Text>
            <TouchableOpacity style={styles.supportBtn} onPress={() => navigation.navigate('Support')}>
                <Text style={styles.supportBtnIcon}>🎧</Text>
                <Text style={styles.supportBtnText}>Canlı Destek & Teknik Yardım</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.logoutFooter} onPress={logout}>
                <Text style={styles.logoutFooterText}>Güvenli Çıkış Yap</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 60 },
  stickyHeader: { 
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingTop: 45,
    paddingBottom: 15,
    paddingHorizontal: 24,
    zIndex: 10,
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
    shadowColor: '#38bdf8',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden'
  },
  logoImage: { width: '85%', height: '85%' },
  welcomeBox: { marginLeft: 16 },
  welcomeText: { color: '#94a3b8', fontSize: 13 },
  userName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  logoutBtnSmall: { padding: 8 },
  logoutBtnText: { color: '#ef4444', fontWeight: 'bold' },
  headerTitleRow: { marginTop: 5 },
  headerTitle: { fontSize: 22, color: '#38bdf8', fontWeight: 'bold' },
  statusBanner: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20
  },
  statusBannerText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  statusBannerSubText: { color: '#e2e8f0', fontSize: 12, marginTop: 4 },
  bannerActionBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  bannerAction: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  sectionTitle: { color: '#64748b', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 },
  menuGrid: { marginBottom: 32 },
  menuCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderLeftWidth: 6,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4
  },
  fullMenuCard: { paddingVertical: 22 },
  cardIconBox: { 
    width: 45, 
    height: 45, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 16
  },
  cardIcon: { fontSize: 22 },
  cardTextBox: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cardArrow: { color: '#475569', fontSize: 18 },
  adminGridInner: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12, 
    marginBottom: 12 
  },
  adminBento: { 
    flex: 1, 
    backgroundColor: '#1e293b', 
    borderRadius: 20, 
    padding: 16, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2
  },
  bentoIcon: { fontSize: 28, marginBottom: 8 },
  bentoText: { color: '#fff', fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
  supportBtn: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  supportBtnIcon: { fontSize: 20, marginRight: 12 },
  supportBtnText: { color: '#38bdf8', fontWeight: 'bold', fontSize: 14 },
  bottomSection: { marginTop: 10 },
  logoutFooter: { marginTop: 30, padding: 16, alignItems: 'center' },
  logoutFooterText: { color: '#475569', fontSize: 13, fontWeight: 'bold' }
});

export default HomeScreen;
