import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, Modal, ScrollView, Switch, ActivityIndicator,
  KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const IP = '192.168.4.223';

type Anotacao = { id: number; data: string; texto: string; notificar: number };
type MarkedDates = Record<string, { marked: boolean; dotColor: string; selected?: boolean; selectedColor?: string }>;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function pedirPermissaoNotificacao() {
  if (!Device.isDevice) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('estudos', {
      name: 'Lembretes de estudo',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1976d2',
    });
  }

  const perms = await Notifications.requestPermissionsAsync();
  return (perms as unknown as { granted: boolean }).granted === true;
}

async function agendarNotificacao(data: string, texto: string): Promise<string | null> {
  const permitido = await pedirPermissaoNotificacao();
  if (!permitido) return null;

  const [ano, mes, dia] = data.split('-').map(Number);
  const dataEvento = new Date(ano, mes - 1, dia, 8, 0, 0);
  const umDiaAntes = new Date(dataEvento.getTime() - 24 * 60 * 60 * 1000);
  const agora = new Date();
  const dezSegundosDepois = new Date(agora.getTime() + 10 * 1000);
  const dataNotificacao = umDiaAntes > agora ? umDiaAntes : dezSegundosDepois;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Lembrete de estudo amanhã!',
      body: texto.length > 60 ? texto.substring(0, 60) + '...' : texto,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: dataNotificacao,
      channelId: 'estudos',
    },
  });
}

export default function Calendario() {
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [anotacoes, setAnotacoes]             = useState<Record<string, Anotacao>>({});
  const [marcados, setMarcados]               = useState<MarkedDates>({});
  const [modalVisivel, setModalVisivel]       = useState(false);
  const [textoAtual, setTextoAtual]           = useState('');
  const [notificar, setNotificar]             = useState(true);
  const [salvando, setSalvando]               = useState(false);

  const carregarAnotacoes = useCallback(async () => {
    try {
      const response = await fetch(`http://${IP}/app_teste/anotacoes_listar.php`);
      const data: Anotacao[] = await response.json();

      const mapa: Record<string, Anotacao> = {};
      const marks: MarkedDates = {};
      data.forEach(a => {
        mapa[a.data] = a;
        marks[a.data] = { marked: true, dotColor: '#1976d2' };
      });
      setAnotacoes(mapa);
      setMarcados(marks);
    } catch {
      // offline, sem anotaÃ§Ãµes
    }
  }, []);

  useEffect(() => {
    carregarAnotacoes();
  }, [carregarAnotacoes]);

  const abrirDia = (day: DateData) => {
    const data = day.dateString;
    setDataSelecionada(data);
    setTextoAtual(anotacoes[data]?.texto ?? '');
    setNotificar(anotacoes[data]?.notificar !== 0);
    setMarcados(prev => ({
      ...prev,
      [data]: { ...(prev[data] ?? {}), marked: prev[data]?.marked ?? false, dotColor: '#1976d2', selected: true, selectedColor: '#1976d2' },
    }));
    setModalVisivel(true);
  };

  const salvarAnotacao = async () => {
    if (!textoAtual.trim()) {
      Alert.alert('Aviso', 'Escreva uma anotação antes de salvar.');
      return;
    }

    setSalvando(true);
    try {
      const response = await fetch(`http://${IP}/app_teste/anotacoes_salvar.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataSelecionada, texto: textoAtual, notificar: notificar ? 1 : 0 }),
      });
      const result = await response.json();

      if (result.status === 'sucesso') {
        const notificacaoId = notificar ? await agendarNotificacao(dataSelecionada, textoAtual) : null;
        await carregarAnotacoes();
        setModalVisivel(false);
        Alert.alert(
          'Salvo!',
          notificar && notificacaoId
            ? 'Anotação salva e notificação agendada.'
            : 'Anotação salva.'
        );
      } else {
        Alert.alert('Erro', result.mensagem || 'Erro ao salvar.');
      }
    } catch {
      Alert.alert('Erro', 'NÃ£o foi possÃ­vel conectar ao servidor.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Calendário de Estudos</Text>

      <Calendar
        onDayPress={abrirDia}
        markedDates={marcados}
        enableSwipeMonths
        theme={{
          todayTextColor: '#1976d2',
          selectedDayBackgroundColor: '#1976d2',
          arrowColor: '#1976d2',
          dotColor: '#1976d2',
          textDayFontSize: 15,
          textMonthFontSize: 16,
          textMonthFontWeight: 'bold',
        }}
      />

      <Text style={styles.dica}>Toque em uma data para adicionar uma anotação</Text>

      <Modal visible={modalVisivel} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalFundo}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.modalBox}>
                  <Text style={styles.modalTitulo}> {dataSelecionada}</Text>

                  <ScrollView keyboardShouldPersistTaps="handled">
                    <Text style={styles.label}>Anotacão</Text>
                    <TextInput
                      style={styles.textarea}
                      placeholder="Ex: Revisar capi­tulo 3 de Programação Mobile..."
                      placeholderTextColor="#aaa"
                      value={textoAtual}
                      onChangeText={setTextoAtual}
                      multiline
                      numberOfLines={5}
                      textAlignVertical="top"
                      blurOnSubmit
                    />

                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>🔔 Notificar 1 dia antes</Text>
                      <Switch
                        value={notificar}
                        onValueChange={setNotificar}
                        trackColor={{ true: '#1976d2' }}
                      />
                    </View>
                  </ScrollView>

                  <View style={styles.botoesModal}>
                    <TouchableOpacity style={styles.botaoCancelar} onPress={() => { Keyboard.dismiss(); setModalVisivel(false); }}>
                      <Text style={styles.textoCancelar}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.botaoSalvar} onPress={salvarAnotacao} disabled={salvando}>
                      {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoSalvar}>Salvar</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#fff' },
  titulo:        { fontSize: 20, fontWeight: 'bold', color: '#1976d2', textAlign: 'center', paddingTop: 16, paddingBottom: 8 },
  dica:          { textAlign: 'center', color: '#999', fontSize: 13, marginTop: 10 },
  modalFundo:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:      { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%' },
  modalTitulo:   { fontSize: 18, fontWeight: 'bold', color: '#1976d2', marginBottom: 16 },
  label:         { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  textarea:      { borderWidth: 2, borderColor: '#1976d2', borderRadius: 10, padding: 12, fontSize: 15, color: '#111', backgroundColor: '#f9f9f9', minHeight: 120, marginBottom: 16 },
  switchRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  switchLabel:   { fontSize: 15, color: '#333' },
  botoesModal:   { flexDirection: 'row', gap: 12 },
  botaoCancelar: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 2, borderColor: '#ccc', alignItems: 'center' },
  textoCancelar: { color: '#666', fontWeight: 'bold', fontSize: 15 },
  botaoSalvar:   { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#1976d2', alignItems: 'center' },
  textoSalvar:   { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
