import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Platform,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "@/contexts/LanguageContext";
import Colors from "@/constants/colors";
import SHGDatePicker from "@/components/SHGDatePicker";

export default function FormationDateScreen() {
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage } = useLanguage();
  const [formationDate, setFormationDate] = useState("");

  const handleContinue = () => {
    if (!formationDate) return;
    
    const today = new Date();
    const selected = new Date(formationDate);
    const isCurrentMonth = selected.getMonth() === today.getMonth() && selected.getFullYear() === today.getFullYear();

    if (isCurrentMonth) {
      router.replace("/shg-settings" as any);
    } else {
      router.push("/(auth)/existing-shg-setup" as any);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

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
            <View style={[styles.progressFill, { width: "100%" }]} />
          </View>
          <Text style={styles.progressText}>4/4</Text>
        </View>

        <View style={styles.main}>
          <Text style={styles.title}>{t("when_was_your_group_formed") || "When was your group formed?"}</Text>
          <Text style={styles.subtitle}>
            {t("select_exact_date_shg_started") || "Select the exact date your SHG started its operations."}
          </Text>

          <Text style={styles.inputLabel}>{t("formation_date") || "Formation Date"}</Text>
          <SHGDatePicker
            mode="date"
            value={formationDate}
            onSelect={setFormationDate}
            placeholder={t("select_date") || "DD/MM/YYYY"}
            maximumDate={todayStr}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.continueBtn,
            (!formationDate || pressed) && { opacity: 0.85 },
            !formationDate && { backgroundColor: Colors.light.textMuted },
          ]}
          onPress={handleContinue}
          disabled={!formationDate}
        >
          <Text style={styles.continueBtnText}>{t("continue") || "Continue"}</Text>
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
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 16,
    marginBottom: 24,
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
  inputLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  continueBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  continueBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
});
