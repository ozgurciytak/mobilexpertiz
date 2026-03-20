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
  Platform
} from 'react-native';
import apiClient from '../api/client';

const ReviewCreateScreen = ({ route, navigation }) => {
  const { requestId, expertName } = route.params;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await apiClient.post('/reviews', {
        requestId,
        rating,
        comment
      });
      
      Alert.alert('Teşekkürler', 'Değerlendirmeniz başarıyla iletildi.', [
        { 
          text: 'Tamam', 
          onPress: () => navigation.navigate('Home') 
        }
      ]);
    } catch (error) {
      console.error('Review creation error', error);
      Alert.alert('Hata', error.response?.data?.error || 'Değerlendirme gönderilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity 
            key={star} 
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Text style={[styles.starIcon, { color: star <= rating ? '#eab308' : '#334155' }]}>
              {star <= rating ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
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
            <Text style={styles.headerTitle}>Hizmeti Puanla</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.expertBrief}>Uzman:</Text>
            <Text style={styles.expertName}>{expertName}</Text>
          </View>

          <View style={styles.ratingSection}>
            <Text style={styles.label}>Puanınız</Text>
            {renderStars()}
            <Text style={styles.ratingDesc}>
              {rating === 5 ? 'Mükemmel' : 
               rating === 4 ? 'Çok İyi' : 
               rating === 3 ? 'Orta' : 
               rating === 2 ? 'Kötü' : 'Çok Kötü'}
            </Text>
          </View>

          <View style={styles.commentSection}>
            <Text style={styles.label}>Yorumunuz (Opsiyonel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Hizmet kalitesi hakkında ne düşünüyorsunuz?"
              placeholderTextColor="#999"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Değerlendirmeyi Gönder</Text>
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
    marginBottom: 32,
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
  infoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  expertBrief: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 4,
  },
  expertName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: '#1e293b',
    padding: 24,
    borderRadius: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 16,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  starIcon: {
    fontSize: 40,
  },
  ratingDesc: {
    color: '#eab308',
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentSection: {
    width: '100%',
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    height: 120,
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
});

export default ReviewCreateScreen;
