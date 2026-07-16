import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "@/contexts/LanguageContext";
import Colors from "@/constants/colors";
import { apiGet } from "@/lib/api";

export default function ActivationScreen() {
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage } = useLanguage();
  const { role } = useLocalSearchParams<{ role: string }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) return;
    
    setLoading(true);
    try {
      const res = await apiGet<{ name: string; uniqueGroupCode: string }>(`/api/groups/verify/${code.trim()}`);
      router.push({
        pathname: "/(auth)/verify-group" as any,
        params: { role, uniqueGroupCode: res.uniqueGroupCode, groupName: res.name },
      });
    } catch (e: any) {
      if (Platform.OS === "web") {
        window.alert(t("error_invalid_code") || "Invalid or expired activation code.");
      } else {
        Alert.alert(t("error"), t("error_invalid_code") || "Invalid or expired activation code.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: Platform.OS === "web" ? Math.max(insets.top, 20) : 0,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
            <Text style={styles.backText}>{t("back") || "Back"}</Text>
          </Pressable>

          <Pressable
            style={styles.langToggle}
            onPress={() => setLanguage(language === "en" ? "mr" : "en")}
          >
            <Ionicons name="language" size={18} color={Colors.light.primary} />
            <Text style={styles.langText}>{language === "en" ? "मराठी" : "English"}</Text>
          </Pressable>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "25%" }]} />
          </View>
          <Text style={styles.progressText}>1/4</Text>
        </View>

        <View style={styles.main}>
          <Text style={styles.title}>{t("enter_activation_code") || "Enter Activation Code"}</Text>
          <Text style={styles.subtitle}>
            {t("ask_ngo_admin_for_code") || "Ask your NGO/Admin for this code."}
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons name="key-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t("activation_code_placeholder") || "e.g., SHG-1234"}
              placeholderTextColor={Colors.light.textMuted}
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.verifyBtn,
            (!code.trim() || loading || pressed) && { opacity: 0.85 },
            !code.trim() && { backgroundColor: Colors.light.textMuted },
          ]}
          onPress={handleVerify}
          disabled={!code.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyBtnText}>{t("verify_code") || "Verify Code"}</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    marginBottom: 24,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: Colors.light.text,
  },
  langToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  langText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.primary,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.light.primary,
  },
  progressText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  main: {
    flex: 1,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: Colors.light.text,
    paddingVertical: 16,
  },
  verifyBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  verifyBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
});
