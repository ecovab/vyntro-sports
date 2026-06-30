import { SafeAreaView, StyleSheet, Text } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Vyntro Sports</Text>
      <Text style={styles.subtitle}>Main Event loads here.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0f", padding: 24 },
  title: { color: "#f5f5f7", fontSize: 28, fontWeight: "700" },
  subtitle: { color: "rgba(245,245,247,0.6)", marginTop: 8 },
});
