import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';

type Props = {
  onLogin: () => void;
  onIrCadastro: () => void;
};

export default function Login({ onLogin, onIrCadastro }: Props) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const fazerLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Aviso', 'Preencha e-mail e senha.');
      return;
    }

    setCarregando(true);
    try {
      const response = await fetch('http://192.168.4.223/app_teste/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      const data = await response.json();

      if (data.status === 'sucesso') {
        onLogin();
      } else {
        Alert.alert('Erro', data.mensagem || 'E-mail ou senha incorretos.');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Organizador de Estudos</Text>
      <Text style={styles.subtitulo}>Faça login para continuar</Text>

      <View style={styles.campoContainer}>
        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="seu@email.com"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.campoContainer}>
        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite sua senha"
          placeholderTextColor="#aaa"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.botaoLogin} onPress={fazerLogin} disabled={carregando}>
        {carregando ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBotao}>Entrar</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={onIrCadastro}>
        <Text style={styles.linkCadastro}>Não tem conta? <Text style={styles.linkDestaque}>Cadastre-se</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#fff' },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#1976d2', textAlign: 'center', marginBottom: 6 },
  subtitulo: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 30 },
  campoContainer: { marginBottom: 18 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  input: {
    borderWidth: 2, borderColor: '#1976d2', borderRadius: 10,
    padding: 14, fontSize: 16, color: '#111', backgroundColor: '#fff',
  },
  botaoLogin: {
    backgroundColor: '#1976d2', padding: 14, borderRadius: 8,
    alignItems: 'center', marginBottom: 20,
  },
  textoBotao: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkCadastro: { textAlign: 'center', color: '#666', fontSize: 15 },
  linkDestaque: { color: '#1976d2', fontWeight: 'bold' },
});
