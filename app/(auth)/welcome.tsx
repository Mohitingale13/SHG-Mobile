import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "@/contexts/LanguageContext";
import Colors from "@/constants/colors";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage } = useLanguage();

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

        <View style={{ flex: 1, justifyContent: "center" }}>
          <View style={styles.centerContent}>
            <View style={styles.logoCircle}>
              <Ionicons name="people" size={50} color="#fff" />
            </View>
            <Text style={styles.title}>{t("welcome_to_shg") || "Welcome to\nSHG Records"}</Text>
            <Text style={styles.subtitle}>
              {t("manage_shg_securely") || "Manage your Self Help Group easily and securely."}
            </Text>
          </View>

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => router.push("/(auth)/login")}
            >
              <Text style={styles.primaryBtnText}>{t("login")}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => router.push("/(auth)/register")}
            >
              <Text style={styles.secondaryBtnText}>{t("register_new_group") || "Register New Group"}</Text>
            </Pressable>
          </View>
        </View>
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
    paddingTop: 16,
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
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 32,
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  footer: {
    gap: 16,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  secondaryBtn: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  secondaryBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.light.primary,
  },
});
