import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, Image, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const IP = '192.168.4.222';

type Estudo = {
  id: number;
  materia: string;
  topico: string;
  tempo_minutos: number;
  foto?: string;
  criado_em?: string;
};

function formatarTempo(segundos: number): string {
  if (segundos <= 0) return '00:00:00';
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatarTempoCurto(minutos: number): string {
  if (!minutos || minutos === 0) return '';
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

export default function Listar() {
  const [estudos, setEstudos]           = useState<Estudo[]>([]);
  const [ativoId, setAtivoId]           = useState<number | null>(null);
  const [restante, setRestante]         = useState(0);
  const [modalExcluir, setModalExcluir]       = useState(false);
  const [selecionados, setSelecionados]       = useState<number[]>([]);
  const [estudoDetalhe, setEstudoDetalhe]     = useState<Estudo | null>(null);
  const intervaloRef                    = useRef<ReturnType<typeof setInterval> | null>(null);
  const segundosPausadoRef              = useRef<Record<number, number>>({});

  const buscarEstudos = async () => {
    try {
      const response = await fetch(`http://${IP}/app_teste/listar.php`);
      const data = await response.json();
      setEstudos(data);
    } catch {
      const offlineData = await AsyncStorage.getItem('estudo_offline');
      if (offlineData) {
        const estudo = JSON.parse(offlineData);
        setEstudos([{ id: 999, materia: estudo.materia, topico: estudo.topico + ' (Offline)', tempo_minutos: estudo.tempo_minutos ?? 0 }]);
      }
    }
  };

  useEffect(() => { buscarEstudos(); }, []);
  useEffect(() => {
    return () => { if (intervaloRef.current) clearInterval(intervaloRef.current); };
  }, []);

  const iniciarTimer = (estudo: Estudo) => {
    if (!estudo.tempo_minutos || estudo.tempo_minutos === 0) {
      Alert.alert('Aviso', 'Este estudo não tem tempo definido.');
      return;
    }
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    const totalSegundos = segundosPausadoRef.current[estudo.id] ?? Number(estudo.tempo_minutos) * 60;
    setAtivoId(estudo.id);
    setRestante(totalSegundos);

    intervaloRef.current = setInterval(() => {
      setRestante(prev => {
        if (prev <= 1) {
          clearInterval(intervaloRef.current!);
          setAtivoId(null);
          Notifications.scheduleNotificationAsync({
            content: { title: '✅ Tempo concluído!', body: `Tempo de estudo de "${estudo.materia}" finalizado!` },
            trigger: null,
          });
          Alert.alert('Concluído!', `Tempo de estudo de "${estudo.materia}" finalizado!`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pausarTimer = async () => {
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    intervaloRef.current = null;
    if (ativoId !== null) segundosPausadoRef.current[ativoId] = restante;
    const minutosRestantes = Math.ceil(restante / 60);
    setEstudos(prev => prev.map(e => e.id === ativoId ? { ...e, tempo_minutos: minutosRestantes } : e));
    const idAtual = ativoId;
    setAtivoId(null);
    try {
      await fetch(`http://${IP}/app_teste/atualizar_tempo.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idAtual, tempo_minutos: minutosRestantes }),
      });
    } catch { }
  };

  const toggleSelecionar = (id: number) => {
    setSelecionados(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const confirmarExclusao = () => {
    if (selecionados.length === 0) {
      Alert.alert('Aviso', 'Selecione ao menos um estudo para excluir.');
      return;
    }
    Alert.alert(
      'Confirmar exclusão',
      `Deseja excluir ${selecionados.length} estudo(s) selecionado(s)?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: executarExclusao },
      ]
    );
  };

  const executarExclusao = async () => {
    try {
      const response = await fetch(`http://${IP}/app_teste/excluir.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selecionados }),
      });
      const data = await response.json();
      if (data.status === 'sucesso') {
        setEstudos(prev => prev.filter(e => !selecionados.includes(e.id)));
        setSelecionados([]);
        setModalExcluir(false);
        Alert.alert('Excluído!', `${data.excluidos} estudo(s) removido(s).`);
      } else {
        Alert.alert('Erro', data.mensagem || 'Erro ao excluir.');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Minha Trilha</Text>

      <View style={styles.botoesTopo}>
        <TouchableOpacity style={styles.botaoAtualizar} onPress={buscarEstudos}>
          <Text style={styles.textoBotaoAtualizar}>🔄 Atualizar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botaoExcluir} onPress={() => { setSelecionados([]); setModalExcluir(true); }}>
          <Text style={styles.textoBotaoExcluir}>🗑 Excluir</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={estudos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const tempoCurto = formatarTempoCurto(Number(item.tempo_minutos));
          const esteAtivo  = ativoId === item.id;
          return (
            <TouchableOpacity
              style={[styles.card, esteAtivo && styles.cardAtivo]}
              onPress={() => setEstudoDetalhe(item)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTopo}>
                <Text style={styles.materia}>{item.materia}</Text>
                {tempoCurto !== '' && (
                  <View style={[styles.tempoBadge, esteAtivo && styles.tempoBadgeAtivo]}>
                    <Text style={[styles.tempoTexto, esteAtivo && styles.tempoTextoAtivo]}>
                      ⏱ {esteAtivo ? formatarTempo(restante) : tempoCurto}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.topico}>{item.topico}</Text>
              {Number(item.tempo_minutos) > 0 && (
                <View style={styles.botoesTimer}>
                  {!esteAtivo ? (
                    <TouchableOpacity style={styles.botaoIniciar} onPress={(e) => { e.stopPropagation?.(); iniciarTimer(item); }}>
                      <Text style={styles.textoBotao}>▶ Iniciar</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.botaoPausar} onPress={(e) => { e.stopPropagation?.(); pausarTimer(); }}>
                      <Text style={styles.textoBotao}>⏸ Pausar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.vazio}>Nenhum estudo cadastrado.</Text>}
      />

      {/* Modal de detalhes */}
      <Modal visible={!!estudoDetalhe} animationType="slide" transparent>
        <View style={styles.modalFundo}>
          <View style={styles.modalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.detalheMateria}>{estudoDetalhe?.materia}</Text>

              <View style={styles.detalheRow}>
                <Text style={styles.detalheLabel}>📖 Tópico</Text>
                <Text style={styles.detalheValor}>{estudoDetalhe?.topico}</Text>
              </View>

              {!!estudoDetalhe?.tempo_minutos && Number(estudoDetalhe.tempo_minutos) > 0 && (
                <View style={styles.detalheRow}>
                  <Text style={styles.detalheLabel}>⏱ Tempo</Text>
                  <Text style={styles.detalheValor}>{formatarTempoCurto(Number(estudoDetalhe.tempo_minutos))}</Text>
                </View>
              )}

              {estudoDetalhe?.criado_em && (
                <View style={styles.detalheRow}>
                  <Text style={styles.detalheLabel}>📅 Salvo em</Text>
                  <Text style={styles.detalheValor}>{new Date(estudoDetalhe.criado_em).toLocaleDateString('pt-BR')}</Text>
                </View>
              )}

              {estudoDetalhe?.foto && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.detalheLabel}>📷 Foto</Text>
                  <Image
                    source={{ uri: `http://${IP}/app_teste/${estudoDetalhe.foto}` }}
                    style={styles.detalheImagem}
                    resizeMode="contain"
                  />
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.botaoFechar} onPress={() => setEstudoDetalhe(null)}>
              <Text style={styles.textoFechar}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de exclusão */}
      <Modal visible={modalExcluir} animationType="slide" transparent>
        <View style={styles.modalFundo}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitulo}>🗑 Selecione para excluir</Text>

            <FlatList
              data={estudos}
              keyExtractor={(item) => item.id.toString()}
              style={{ maxHeight: 350 }}
              renderItem={({ item }) => {
                const marcado = selecionados.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[styles.itemSelecao, marcado && styles.itemSelecionado]}
                    onPress={() => toggleSelecionar(item.id)}
                  >
                    <View style={[styles.checkbox, marcado && styles.checkboxMarcado]}>
                      {marcado && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemMateria}>{item.materia}</Text>
                      <Text style={styles.itemTopico}>{item.topico}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

            <View style={styles.botoesModal}>
              <TouchableOpacity style={styles.botaoCancelarModal} onPress={() => setModalExcluir(false)}>
                <Text style={styles.textoCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoConfirmar} onPress={confirmarExclusao}>
                <Text style={styles.textoConfirmar}>Excluir ({selecionados.length})</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:           { padding: 20, flex: 1 },
  titulo:              { fontSize: 22, fontWeight: 'bold', color: '#1976d2', marginBottom: 12, textAlign: 'center' },
  botoesTopo:          { flexDirection: 'row', gap: 10, marginBottom: 10 },
  botaoAtualizar:      { flex: 1, backgroundColor: '#e3f2fd', padding: 10, borderRadius: 8, alignItems: 'center' },
  textoBotaoAtualizar: { color: '#1976d2', fontWeight: 'bold', fontSize: 15 },
  botaoExcluir:        { flex: 1, backgroundColor: '#ffebee', padding: 10, borderRadius: 8, alignItems: 'center' },
  textoBotaoExcluir:   { color: '#c62828', fontWeight: 'bold', fontSize: 15 },
  card:                { marginTop: 12, padding: 15, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, backgroundColor: '#fff', elevation: 1 },
  cardAtivo:           { borderColor: '#1976d2', borderWidth: 2, backgroundColor: '#f0f7ff' },
  cardTopo:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  materia:             { fontSize: 17, fontWeight: 'bold', color: '#333', flex: 1 },
  tempoBadge:          { backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  tempoBadgeAtivo:     { backgroundColor: '#1976d2' },
  tempoTexto:          { fontSize: 13, color: '#2e7d32', fontWeight: 'bold' },
  tempoTextoAtivo:     { color: '#fff', fontSize: 15 },
  topico:              { fontSize: 15, color: '#666', marginBottom: 10 },
  botoesTimer:         { flexDirection: 'row', justifyContent: 'flex-end' },
  botaoIniciar:        { backgroundColor: '#1976d2', paddingVertical: 7, paddingHorizontal: 18, borderRadius: 8 },
  botaoPausar:         { backgroundColor: '#e53935', paddingVertical: 7, paddingHorizontal: 18, borderRadius: 8 },
  textoBotao:          { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  vazio:               { marginTop: 40, textAlign: 'center', color: '#999', fontSize: 15 },
  modalFundo:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:            { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitulo:         { fontSize: 18, fontWeight: 'bold', color: '#c62828', marginBottom: 16 },
  itemSelecao:         { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 8, backgroundColor: '#f9f9f9', gap: 12 },
  itemSelecionado:     { backgroundColor: '#ffebee', borderWidth: 1, borderColor: '#ef9a9a' },
  checkbox:            { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  checkboxMarcado:     { backgroundColor: '#c62828', borderColor: '#c62828' },
  checkmark:           { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  itemMateria:         { fontWeight: 'bold', fontSize: 15, color: '#333' },
  itemTopico:          { fontSize: 13, color: '#666' },
  botoesModal:         { flexDirection: 'row', gap: 12, marginTop: 16 },
  botaoCancelarModal:  { flex: 1, padding: 14, borderRadius: 10, borderWidth: 2, borderColor: '#ccc', alignItems: 'center' },
  textoCancelar:       { color: '#666', fontWeight: 'bold', fontSize: 15 },
  botaoConfirmar:      { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#c62828', alignItems: 'center' },
  textoConfirmar:      { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  detalheMateria:      { fontSize: 22, fontWeight: 'bold', color: '#1976d2', marginBottom: 16 },
  detalheRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  detalheLabel:        { fontSize: 14, color: '#888', flex: 1 },
  detalheValor:        { fontSize: 15, color: '#333', fontWeight: '600', flex: 2, textAlign: 'right' },
  detalheImagem:       { width: '100%', height: 220, borderRadius: 10, marginTop: 10 },
  botaoFechar:         { backgroundColor: '#1976d2', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  textoFechar:         { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
