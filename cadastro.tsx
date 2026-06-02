import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';

type Props = {
  onCadastrado: () => void;
  onVoltar: () => void;
};

export default function Cadastro({ onCadastrado, onVoltar }: Props) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const fazerCadastro = async () => {
    if (!nome || !email || !senha || !confirmarSenha) {
      Alert.alert('Aviso', 'Preencha todos os campos.');
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Aviso', 'As senhas não coincidem.');
      return;
    }
    if (senha.length < 6) {
      Alert.alert('Aviso', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setCarregando(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('http://192.168.4.222/app_teste/cadastro.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const texto = await response.text();
      let data: { status: string; mensagem?: string };
      try {
        data = JSON.parse(texto);
      } catch {
        Alert.alert('Erro do servidor', texto || 'Resposta inválida do servidor.');
        return;
      }

      if (data.status === 'sucesso') {
        Alert.alert('Sucesso', 'Conta criada com sucesso!', [
          { text: 'OK', onPress: onCadastrado },
        ]);
      } else {
        Alert.alert('Erro', data.mensagem || 'Erro ao cadastrar.');
      }
    } catch (erro: unknown) {
      clearTimeout(timeout);
      const isAbort = erro instanceof Error && erro.name === 'AbortError';
      Alert.alert('Erro', isAbort
        ? 'Tempo esgotado. Verifique se o servidor está ligado.'
        : 'Não foi possível conectar ao servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.titulo}>Criar Conta</Text>
      <Text style={styles.subtitulo}>Preencha os dados abaixo</Text>

      <View style={styles.campoContainer}>
        <Text style={styles.label}>Nome completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Seu nome"
          placeholderTextColor="#aaa"
          value={nome}
          onChangeText={setNome}
          autoCapitalize="words"
        />
      </View>

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
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor="#aaa"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />
      </View>

      <View style={styles.campoContainer}>
        <Text style={styles.label}>Confirmar senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Repita a senha"
          placeholderTextColor="#aaa"
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.botaoCadastro} onPress={fazerCadastro} disabled={carregando}>
        {carregando ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBotao}>Cadastrar</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={onVoltar}>
        <Text style={styles.linkVoltar}>Já tem conta? <Text style={styles.linkDestaque}>Fazer login</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 30, backgroundColor: '#fff' },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#1976d2', textAlign: 'center', marginBottom: 6 },
  subtitulo: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 30 },
  campoContainer: { marginBottom: 18 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  input: {
    borderWidth: 2, borderColor: '#43a047', borderRadius: 10,
    padding: 14, fontSize: 16, color: '#111', backgroundColor: '#fff',
  },
  botaoCadastro: {
    backgroundColor: '#43a047', padding: 14, borderRadius: 8,
    alignItems: 'center', marginBottom: 20,
  },
  textoBotao: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkVoltar: { textAlign: 'center', color: '#666', fontSize: 15 },
  linkDestaque: { color: '#1976d2', fontWeight: 'bold' },
});
