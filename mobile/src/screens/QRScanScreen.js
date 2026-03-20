import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

const QRScanScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    // Permission loader
    return <View style={styles.container}><Text style={styles.text}>Kamera izni okunuyor...</Text></View>;
  }

  if (!permission.granted) {
    // If permission not granted, show request button
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.text}>Kamera erişimi gerekiyor.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    
    try {
        // Parse verification link: http://.../verify-report/123
        if (data.includes('verify-report')) {
            const parts = data.split('/');
            const reportId = parts[parts.length - 1];
            
            // Navigate to report view
            navigation.navigate('ReportView', { requestId: reportId, isVerification: true });
        } else {
            Alert.alert('Geçersiz QR', 'Bu QR kodu bir Mobil Expertiz raporuna ait görünmüyor.', [
                { text: 'Tamam', onPress: () => setScanned(false) }
            ]);
        }
    } catch (e) {
        Alert.alert('Hata', 'QR kod okunamadı.');
        setScanned(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Text style={styles.backText}>← Vazgeç</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Rapor Doğrula</Text>
        </View>

        <View style={styles.scannerContainer}>
            <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
                style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.overlay}>
                <View style={styles.unfocusedContainer}></View>
                <View style={styles.focusedContainer}>
                    <View style={styles.cornerTopLeft} />
                    <View style={styles.cornerTopRight} />
                    <View style={styles.cornerBottomLeft} />
                    <View style={styles.cornerBottomRight} />
                </View>
                <View style={styles.unfocusedContainer}></View>
            </View>
        </View>

        <View style={styles.footer}>
            <Text style={styles.footerText}>Raporun sağ üst köşesindeki QR kodu okutun</Text>
            {scanned && (
                <TouchableOpacity style={styles.button} onPress={() => setScanned(false)}>
                    <Text style={styles.buttonText}>Tekrar Tara</Text>
                </TouchableOpacity>
            )}
        </View>
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
    padding: 20
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  backButton: {
    marginRight: 15,
  },
  backText: {
    color: '#38bdf8',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: '100%',
  },
  focusedContainer: {
    width: 250,
    height: 250,
    backgroundColor: 'transparent',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#38bdf8',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#38bdf8',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#38bdf8',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#38bdf8',
  },
  footer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  footerText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});

export default QRScanScreen;
