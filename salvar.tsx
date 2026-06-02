import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const IP = '192.168.4.222';

export default function Salvar() {
  const [materia, setMateria]   = useState('');
  const [topico, setTopico]     = useState('');
  const [horas, setHoras]       = useState('');
  const [minutos, setMinutos]   = useState('');
  const [fotoUri, setFotoUri]   = useState<string | null>(null);

  const abrirCamera = async () => {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão negada', 'Permita o acesso à câmera nas configurações.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setFotoUri(result.assets[0].uri);
    }
  };

  const removerFoto = () => {
    Alert.alert('Remover foto', 'Deseja remover a foto?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => setFotoUri(null) },
    ]);
  };

  const salvarEstudo = async () => {
    if (!materia || !topico) {
      Alert.alert('Aviso', 'Preencha a matéria e o tópico!');
      return;
    }

    const h = parseInt(horas || '0');
    const m = parseInt(minutos || '0');
    const tempo_minutos = h * 60 + m;

    try {
      const formData = new FormData();
      formData.append('materia', materia);
      formData.append('topico', topico);
      formData.append('tempo_minutos', String(tempo_minutos));

      if (fotoUri) {
        const nomeArquivo = fotoUri.split('/').pop() ?? 'foto.jpg';
        formData.append('foto', { uri: fotoUri, name: nomeArquivo, type: 'image/jpeg' } as never);
      }

      const response = await fetch(`http://${IP}/app_teste/salvar.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.status === 'sucesso') {
        await AsyncStorage.setItem('ultimo_estudo', JSON.stringify({ materia, topico, tempo_minutos }));
        Alert.alert('Sucesso', 'Plano de estudo salvo!');
        setMateria('');
        setTopico('');
        setHoras('');
        setMinutos('');
        setFotoUri(null);
      } else {
        Alert.alert('Erro', 'Falha ao salvar no banco de dados.');
      }
    } catch {
      await AsyncStorage.setItem('estudo_offline', JSON.stringify({ materia, topico, tempo_minutos }));
      Alert.alert('Offline', 'Estudo salvo localmente (offline).');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.titulo}>Novo Estudo</Text>

      <Text style={styles.label}>Matéria</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Programação Mobile"
        placeholderTextColor="#aaa"
        value={materia}
        onChangeText={setMateria}
      />

      <Text style={styles.label}>Tópico</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Integração com API"
        placeholderTextColor="#aaa"
        value={topico}
        onChangeText={setTopico}
      />

      <Text style={styles.label}>Tempo de estudo</Text>
      <View style={styles.tempoRow}>
        <View style={styles.tempoCampo}>
          <TextInput
            style={styles.inputTempo}
            placeholder="0"
            placeholderTextColor="#aaa"
            value={horas}
            onChangeText={setHoras}
            keyboardType="numeric"
            maxLength={2}
          />
          <Text style={styles.tempoLabel}>horas</Text>
        </View>
        <Text style={styles.tempoDivisor}>:</Text>
        <View style={styles.tempoCampo}>
          <TextInput
            style={styles.inputTempo}
            placeholder="00"
            placeholderTextColor="#aaa"
            value={minutos}
            onChangeText={setMinutos}
            keyboardType="numeric"
            maxLength={2}
          />
          <Text style={styles.tempoLabel}>minutos</Text>
        </View>
      </View>

      <Text style={styles.label}>Foto do material (opcional)</Text>
      {fotoUri ? (
        <TouchableOpacity onPress={removerFoto}>
          <Image source={{ uri: fotoUri }} style={styles.preview} />
          <Text style={styles.trocarFoto}>Toque para remover a foto</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.botaoCamera} onPress={abrirCamera}>
          <Text style={styles.iconeCamera}>📷</Text>
          <Text style={styles.textoBotaoCamera}>Abrir câmera</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.botao} onPress={salvarEstudo}>
        <Text style={styles.textoBotao}>Salvar Estudo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { padding: 24, paddingBottom: 40 },
  titulo:           { fontSize: 22, fontWeight: 'bold', color: '#1976d2', marginBottom: 24, textAlign: 'center' },
  label:            { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  input:            { borderWidth: 2, borderColor: '#1976d2', borderRadius: 10, padding: 13, fontSize: 16, color: '#111', backgroundColor: '#fff', marginBottom: 18 },
  tempoRow:         { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  tempoCampo:       { alignItems: 'center', flex: 1 },
  inputTempo:       { borderWidth: 2, borderColor: '#1976d2', borderRadius: 10, padding: 13, fontSize: 22, color: '#111', backgroundColor: '#fff', textAlign: 'center', width: '80%' },
  tempoLabel:       { fontSize: 13, color: '#666', marginTop: 4 },
  tempoDivisor:     { fontSize: 28, fontWeight: 'bold', color: '#1976d2', marginHorizontal: 8, marginBottom: 20 },
  botaoCamera:      { borderWidth: 2, borderColor: '#1976d2', borderRadius: 10, borderStyle: 'dashed', padding: 24, alignItems: 'center', marginBottom: 24, backgroundColor: '#f0f7ff' },
  iconeCamera:      { fontSize: 36, marginBottom: 6 },
  textoBotaoCamera: { color: '#1976d2', fontWeight: 'bold', fontSize: 15 },
  preview:          { width: '100%', height: 200, borderRadius: 10, marginBottom: 6, resizeMode: 'cover' },
  trocarFoto:       { textAlign: 'center', color: '#e53935', fontSize: 13, marginBottom: 20 },
  botao:            { backgroundColor: '#1976d2', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  textoBotao:       { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
