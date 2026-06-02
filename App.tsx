import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

import Login from './login';
import Cadastro from './cadastro';
import Salvar from './salvar';
import Listar from './listar';
import Calendario from './calendario';

type Tela = 'login' | 'cadastro' | 'listar' | 'salvar' | 'calendario';

export default function App() {
  const [tela, setTela] = useState<Tela>('login');

  const renderTela = () => {
    if (tela === 'login') {
      return (
        <Login
          onLogin={() => setTela('listar')}
          onIrCadastro={() => setTela('cadastro')}
        />
      );
    }

    if (tela === 'cadastro') {
      return (
        <Cadastro
          onCadastrado={() => setTela('listar')}
          onVoltar={() => setTela('login')}
        />
      );
    }

    return (
      <>
        <View style={styles.content}>
          {tela === 'salvar' ? <Salvar /> : tela === 'calendario' ? <Calendario /> : <Listar />}
        </View>
        <View style={styles.menu}>
          <TouchableOpacity
            style={[styles.botao, tela === 'listar' && styles.botaoAtivo]}
            onPress={() => setTela('listar')}
          >
            <Text style={styles.textoBotao}>📚 Trilha</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.botao, tela === 'salvar' && styles.botaoAtivo]}
            onPress={() => setTela('salvar')}
          >
            <Text style={styles.textoBotao}>➕ Estudo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.botao, tela === 'calendario' && styles.botaoAtivo]}
            onPress={() => setTela('calendario')}
          >
            <Text style={styles.textoBotao}>📅 Agenda</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botao} onPress={() => setTela('login')}>
            <Text style={styles.textoBotao}>🚪 Sair</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {renderTela()}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, paddingTop: 20 },
  menu: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: 15,
    paddingBottom: 25,
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
  botao: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  botaoAtivo: { backgroundColor: '#e3f2fd' },
  textoBotao: { fontSize: 14, fontWeight: 'bold', color: '#1976d2' },
});
