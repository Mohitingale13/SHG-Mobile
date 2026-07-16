import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "@/contexts/LanguageContext";
import Colors from "@/constants/colors";

export default function VerifyGroupScreen() {
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage } = useLanguage();
  const { role, uniqueGroupCode, groupName } = useLocalSearchParams<{ role: string; uniqueGroupCode: string; groupName: string }>();

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
            <View style={[styles.progressFill, { width: "50%" }]} />
          </View>
          <Text style={styles.progressText}>2/4</Text>
        </View>

        <View style={styles.main}>
          <Text style={styles.title}>{t("verify_group_details") || "Verify Group Details"}</Text>
          <Text style={styles.subtitle}>
            {t("is_this_your_group") || "Is this your group?"}
          </Text>

          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("group_name") || "Group Name:"}</Text>
              <Text style={styles.detailValue}>{groupName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("activation_code") || "Activation Code:"}</Text>
              <Text style={styles.detailValue}>{uniqueGroupCode}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.yesBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push({
              pathname: "/(auth)/create-account" as any,
              params: { role, uniqueGroupCode },
            })}
          >
            <Text style={styles.yesBtnText}>{t("yes_this_is_mine") || "Yes, This is Mine"}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.noBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.noBtnText}>{t("no_wrong_group") || "No, wrong group"}</Text>
          </Pressable>
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
  detailsCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 20,
    gap: 12,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  detailValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 4,
  },
  footer: {
    gap: 16,
  },
  yesBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  yesBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  noBtn: {
    paddingVertical: 16,
    alignItems: "center",
  },
  noBtnText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
});
