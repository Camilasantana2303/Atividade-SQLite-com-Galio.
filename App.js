import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Block, Button, Input, Text, Toast } from 'galio-framework';
import Constants from 'expo-constants';
import * as SQLite from 'expo-sqlite';

// Abertura do banco de dados SQLite
function openDatabase() {
  const db = SQLite.openDatabase('db.db');
  return db;
}

const db = openDatabase();

export default function App() {
  const [text, setText] = useState('');
  const [forceUpdate, forceUpdateId] = useForceUpdate();
  const [successMessage, setSuccessMessage] = useState(null);

  // Criar a tabela "items" no banco de dados
  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        'create table if not exists items' +
          '(id integer primary key not null, done int, value text);'
      );
    });
  }, []);

  // Função para adicionar um novo item à lista
  const add = (text) => {
    if (!text.trim()) {
      return;
    }

    db.transaction(
      (tx) => {
        tx.executeSql('insert into items (done, value) values (0, ?)', [text]);
      },
      null,
      () => {
        forceUpdate();
        setSuccessMessage('Item adicionado com sucesso!');
        setText('');
        setTimeout(() => setSuccessMessage(null), 3000); // Remover a mensagem após 3 segundos
      }
    );
  };

  return (
    <Block safe flex style={styles.container}>
      <Text h3 style={styles.heading}>Armazenamento Interno - SQLite</Text>

      <Block flex center>
        <Input
          placeholder="O que você precisa fazer?"
          value={text}
          onChangeText={(value) => setText(value)}
          style={styles.input}
        />
        <Button
          round
          color="info"
          style={styles.botao}
          onPress={() => add(text)}
        >
          Gravar
        </Button>

        <ScrollView style={styles.listArea}>
          <Items
            key={`forceupdate-todo-${forceUpdateId}`}
            done={false}
            onPressItem={(id) =>
              db.transaction(
                (tx) => {
                  tx.executeSql(`update items set done = 1 where id = ?;`, [id]);
                },
                null,
                forceUpdate
              )
            }
          />
          <Items
            done
            key={`forceupdate-done-${forceUpdateId}`}
            onPressItem={(id) =>
              db.transaction(
                (tx) => {
                  tx.executeSql(`delete from items where id = ?;`, [id]);
                },
                null,
                forceUpdate
              )
            }
          />
        </ScrollView>

        {successMessage && (
          <Toast color="success" positionIndicator="top" style={styles.toast}>
            <Text>{successMessage}</Text>
          </Toast>
        )}
      </Block>
    </Block>
  );
}

// Componente de itens
function Items({ done: doneHeading, onPressItem }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        'select * from items where done = ?;',
        [doneHeading ? 1 : 0],
        (_, { rows: { _array } }) => setItems(_array)
      );
    });
  }, []);

  const heading = doneHeading ? 'Completa' : 'Pendente';

  return (
    <Block style={styles.sectionContainer}>
      <Text h4 style={styles.sectionHeading}>{heading}</Text>
      {items.map(({ id, done, value }) => (
        <Button
          key={id}
          color={done ? '#1c9963' : '#4630eb'}
          style={styles.itemButton}
          onPress={() => onPressItem && onPressItem(id)}
        >
          {value}
        </Button>
      ))}
    </Block>
  );
}

// Hook para forçar a atualização do componente
function useForceUpdate() {
  const [value, setValue] = useState(0);
  return [() => setValue(value + 1), value];
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingTop: Constants.statusBarHeight,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flex: 1,
  },
  heading: {
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  botao: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  listArea: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeading: {
    marginBottom: 8,
  },
  itemButton: {
    marginBottom: 8,
  },
  toast: {
    marginBottom: 16,
  },
});
