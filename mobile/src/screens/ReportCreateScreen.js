import React, { useState } from 'react';
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
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../api/client';

const ReportCreateScreen = ({ route, navigation }) => {
  const { requestId, requestTitle } = route.params;
  const [content, setContent] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // New state for vehicle parts
  const [vehicleParts, setVehicleParts] = useState({});
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectedTo, setRedirectedTo] = useState('');
  const [redirectReason, setRedirectReason] = useState('');

  const VEHICLE_PARTS_LIST = [
    'Ön Kaput', 'Tavan', 'Bagaj Kapağı', 
    'Sol Ön Çamurluk', 'Sol Ön Kapı', 'Sol Arka Kapı', 'Sol Arka Çamurluk',
    'Sağ Ön Çamurluk', 'Sağ Ön Kapı', 'Sağ Arka Kapı', 'Sağ Arka Çamurluk',
    'Ön Tampon', 'Arka Tampon'
  ];

  const PART_STATUSES = ['Orijinal', 'Değişen', 'Boyalı', 'Lokal Boyalı'];

  const handlePartStatusSelect = (partName, status) => {
    setVehicleParts(prev => ({
      ...prev,
      [partName]: {
        ...prev[partName],
        status: prev[partName]?.status === status ? null : status
      }
    }));
  };

  const pickPartImage = async (partName) => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled) {
      setVehicleParts(prev => ({
        ...prev,
        [partName]: {
          ...prev[partName],
          image: result.assets[0]
        }
      }));
    }
  };

  const removePartImage = (partName) => {
    setVehicleParts(prev => ({
      ...prev,
      [partName]: {
        ...prev[partName],
        image: null
      }
    }));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, ...result.assets]);
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const uploadAllImages = async () => {
    const urlsMap = { general: [], parts: {} };
    
    // 1. Upload General Images
    if (images.length > 0) {
      const formData = new FormData();
      images.forEach((img, index) => {
        const fileType = img.uri.split('.').pop();
        formData.append('images', {
          uri: Platform.OS === 'ios' ? img.uri.replace('file://', '') : img.uri,
          name: `general_${index}.${fileType}`,
          type: `image/${fileType}`,
        });
      });
      
      try {
        const response = await apiClient.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        urlsMap.general = response.data.urls;
      } catch (e) { console.error('General upload error', e); }
    }

    // 2. Upload Part Specific Images
    for (const part of Object.keys(vehicleParts)) {
      const partData = vehicleParts[part];
      if (partData.image) {
        const formData = new FormData();
        const fileType = partData.image.uri.split('.').pop();
        formData.append('images', {
          uri: Platform.OS === 'ios' ? partData.image.uri.replace('file://', '') : partData.image.uri,
          name: `part_${part.replace(/\s/g, '_')}.${fileType}`,
          type: `image/${fileType}`,
        });

        try {
          const response = await apiClient.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          urlsMap.parts[part] = response.data.urls[0];
        } catch (e) { console.error(`Part upload error: ${part}`, e); }
      }
    }

    return urlsMap;
  };

  const handleSubmit = async () => {
    if (!content.trim() && !isRedirecting) {
      Alert.alert('Hata', 'Lütfen rapor içeriğini doldurun veya yönlendirme yapın.');
      return;
    }

    if (isRedirecting && !redirectedTo.trim()) {
      Alert.alert('Hata', 'Lütfen yönlendirilecek yeri belirtin.');
      return;
    }

    setSubmitting(true);
    try {
      const { general: uploadedGeneralUrls, parts: uploadedPartUrls } = await uploadAllImages();
      
      const allLinks = [];
      if (documentUrl) allLinks.push(documentUrl);
      uploadedGeneralUrls.forEach(url => allLinks.push(url));
      
      const documentUrlString = allLinks.join(', ');

      const finalVehicleParts = {};
      Object.keys(vehicleParts).forEach(part => {
        finalVehicleParts[part] = {
          status: vehicleParts[part].status,
          imageUrl: uploadedPartUrls[part] || null
        };
      });

      // Create Report First (Always create report, even if redirected)
      await apiClient.post('/reports', {
        requestId,
        content: isRedirecting ? `[YÖNLENDİRİLDİ] ${content}` : content,
        documentUrls: documentUrlString || null,
        vehicleParts: Object.keys(finalVehicleParts).length > 0 ? finalVehicleParts : null
      });

      // If redirecting, update the request status and details
      if (isRedirecting) {
          await apiClient.put(`/requests/${requestId}/redirect`, {
              redirectedTo,
              redirectReason: redirectReason || 'Detaylı ekspertiz gerekliliği.'
          });
      }
      
      Alert.alert('Başarılı', isRedirecting ? 'İşlem başarıyla yönlendirildi.' : 'Ekspertiz raporu başarıyla sisteme yüklendi ve işlem tamamlandı.', [
        { text: 'Tamam', onPress: () => navigation.navigate('Home') }
      ]);
    } catch (error) {
      console.error('Report creation error', error);
      Alert.alert('Hata', error.message || 'Rapor gönderilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

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
            <Text style={styles.headerTitle}>Rapor Hazırla</Text>
            <TouchableOpacity 
              onPress={handleSubmit} 
              style={[styles.headerSaveButton, submitting && { opacity: 0.5 }]}
              disabled={submitting}
            >
              <Text style={styles.headerSaveText}>KAYDET</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sourceInfo}>
            <Text style={styles.sourceLabel}>İlgili Talep:</Text>
            <Text style={styles.sourceTitle}>{requestTitle}</Text>
            {route.params?.plate && (
              <View style={styles.sourceDetailRow}>
                <Text style={styles.sourceDetailLabel}>Plaka: </Text>
                <Text style={styles.sourceDetailValue}>{route.params.plate}</Text>
              </View>
            )}
            {route.params?.chassisNumber && (
              <View style={styles.sourceDetailRow}>
                <Text style={styles.sourceDetailLabel}>Şase No: </Text>
                <Text style={styles.sourceDetailValue}>{route.params.chassisNumber}</Text>
              </View>
            )}
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Ekspertiz Raporu İçeriği</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Aracın motor, kaporta, şase ve diğer aksamları hakkındaki detaylı görüşlerinizi buraya yazın..."
              placeholderTextColor="#999"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
            />

            <Text style={styles.label}>Araç Parça Durumları (Orijinal / Değişen Seçimi)</Text>
            <View style={styles.partsContainer}>
              {VEHICLE_PARTS_LIST.map((part) => (
                <View key={part} style={styles.partRow}>
                  <View style={styles.partHeaderRow}>
                    <Text style={styles.partName}>{part}</Text>
                    {vehicleParts[part]?.image ? (
                      <View style={styles.partImageThumbContainer}>
                        <Image source={{ uri: vehicleParts[part].image.uri }} style={styles.partImageThumb} />
                        <TouchableOpacity style={styles.removePartImageIcon} onPress={() => removePartImage(part)}>
                          <Text style={styles.removePartImageText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.addPartImageButton} onPress={() => pickPartImage(part)}>
                        <Text style={styles.addPartImageButtonText}>📷 Fotoğraf Ekle</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.partStatusGroup}>
                    {PART_STATUSES.map(status => {
                      const isSelected = vehicleParts[part]?.status === status;
                      
                      // Assign colors based on status
                      let activeColor = '#38bdf8'; // Orijinal (Default Blue)
                      if (status === 'Değişen') activeColor = '#ef4444'; // Red
                      if (status === 'Boyalı') activeColor = '#f59e0b'; // Amber
                      if (status === 'Lokal Boyalı') activeColor = '#eab308'; // Yellow
                      
                      return (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.statusButton,
                            isSelected && { backgroundColor: activeColor, borderColor: activeColor },
                            (status === 'Orijinal' || status === 'Değişen') && styles.prominentButton
                          ]}
                          onPress={() => handlePartStatusSelect(part, status)}
                        >
                          <Text style={[
                            styles.statusButtonText,
                            isSelected && styles.statusButtonTextActive,
                            (status === 'Orijinal' || status === 'Değişen') && styles.prominentButtonText
                          ]}>
                            {status}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.redirectSection}>
              <View style={styles.redirectHeader}>
                <Text style={styles.label}>Detaylı Ekspertiz Yönlendirmesi</Text>
                <TouchableOpacity 
                  style={[styles.toggleButton, isRedirecting && styles.toggleButtonActive]}
                  onPress={() => setIsRedirecting(!isRedirecting)}
                >
                  <View style={[styles.toggleDot, isRedirecting && styles.toggleDotActive]} />
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>Daha detaylı bakım veya kurumsal ekspertiz gerekiyorsa aktif edin.</Text>
              
              {isRedirecting && (
                <View style={styles.redirectForm}>
                  <Text style={styles.subLabel}>Yönlendirilecek Firma / Şube</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: X Kurumsal Ekspertiz, Merkez Şube"
                    placeholderTextColor="#999"
                    value={redirectedTo}
                    onChangeText={setRedirectedTo}
                  />
                  <Text style={styles.subLabel}>Yönlendirme Nedeni (Opsiyonel)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: Motor detaylı analiz, şase kontrolü vb."
                    placeholderTextColor="#999"
                    value={redirectReason}
                    onChangeText={setRedirectReason}
                  />
                </View>
              )}
            </View>

            <Text style={styles.label}>Fotoğraflar</Text>
            <View style={styles.imageGallery}>
              {images.map((img, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: img.uri }} style={styles.previewImage} />
                  <TouchableOpacity 
                    style={styles.removeIcon} 
                    onPress={() => removeImage(index)}
                  >
                    <Text style={styles.removeIconText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                <Text style={styles.addImageText}>+</Text>
                <Text style={styles.addImageSubtext}>Ekle</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Ek Döküman Bağlantıları (Opsiyonel)</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Google Drive veya Dropbox linki"
              placeholderTextColor="#999"
              value={documentUrl}
              onChangeText={setDocumentUrl}
            />

            <TouchableOpacity 
              style={[styles.submitButton, submitting && styles.disabledButton, isRedirecting && styles.redirectSubmitButton]} 
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isRedirecting ? 'Yönlendir ve Raporu Kaydet' : 'Ekspertiz Raporunu Kaydet ve Gönder'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
    flex: 1,
  },
  headerSaveButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerSaveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  sourceInfo: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#38bdf8',
  },
  sourceLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  sourceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  sourceDetailRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  sourceDetailLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  sourceDetailValue: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: 'bold',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  partsContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  partRow: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 16,
  },
  partHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  partName: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addPartImageButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  addPartImageButtonText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  partImageThumbContainer: {
    width: 60,
    height: 45,
    borderRadius: 6,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  partImageThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  removePartImageIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePartImageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  partStatusGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  statusButtonText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  imageGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    marginRight: 12,
    marginBottom: 12,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  removeIconText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  addImageText: {
    color: '#38bdf8',
    fontSize: 24,
    fontWeight: 'bold',
  },
  addImageSubtext: {
    color: '#38bdf8',
    fontSize: 10,
  },
  prominentButton: {
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  prominentButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  redirectSection: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  redirectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  helperText: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 16,
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#334155',
    padding: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#38bdf8',
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleDotActive: {
    transform: [{ translateX: 22 }],
  },
  redirectForm: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16,
  },
  subLabel: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  redirectSubmitButton: {
    backgroundColor: '#8b5cf6', // Different color for redirect
  },
});

export default ReportCreateScreen;
