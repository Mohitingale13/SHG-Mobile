// @ts-nocheck
import { useState } from "react";
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth, MembershipOption } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Colors from "@/constants/colors";

export default function SelectSHGScreen() {
  const insets = useSafeAreaInsets();
  const { availableGroups, selectMembership, getPendingCredentials } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelect = async (item: MembershipOption) => {
    if (!item.membershipId) return;
    const creds = getPendingCredentials();
    if (!creds) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(item.membershipId);
    const result = await selectMembership(creds.phone, creds.password, item.membershipId);
    setLoading(null);
    if (result.success) {
      router.replace("/(main)");
    } else {
      const msg = t(result.error || "error");
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert(t("error"), msg);
    }
  };

  if (!availableGroups || availableGroups.length === 0) {
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
    >
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="people" size={36} color="#fff" />
        </View>
        <Text style={styles.title}>{t("auto.select_your_shg") || "Select Your SHG"}</Text>
        <Text style={styles.subtitle}>
          {t("auto.choose_which_shg_to_open") || "Choose which SHG you would like to open"}
        </Text>
      </View>

      <View style={styles.list}>
        {availableGroups.map((item) => (
          <GroupCard
            key={item.membershipId || item.groupId}
            item={item}
            isLoading={loading === item.membershipId}
            onPress={() => handleSelect(item)}
          />
        ))}
      </View>

      <Text style={styles.hint}>
        {t("auto.last_opened_shg_remembered") || "Your last opened SHG will be remembered automatically."}
      </Text>
    </ScrollView>
  );
}

function GroupCard({ item, isLoading, onPress }: { item: MembershipOption; isLoading: boolean; onPress: () => void }) {
  const roleColor =
    item.role === "president"
      ? Colors.light.primary
      : item.role === "treasurer"
      ? "#7C3AED"
      : Colors.light.secondary;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
      onPress={onPress}
      disabled={isLoading}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.roleIcon, { backgroundColor: roleColor + "18" }]}>
          <Ionicons name="people-circle-outline" size={28} color={roleColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.groupName} numberOfLines={1}>{item.groupName}</Text>
          {item.village ? <Text style={styles.village}>{item.village}</Text> : null}
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.roleBadge, { backgroundColor: roleColor + "18" }]}>
          <Text style={[styles.roleText, { color: roleColor }]}>{item.role}</Text>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginLeft: 10 }} />
        ) : (
          <Ionicons name="chevron-forward" size={20} color={Colors.light.textMuted} style={{ marginLeft: 8 }} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingHorizontal: 24, flexGrow: 1 },
  header: { alignItems: "center", marginBottom: 32 },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.light.primary,
    justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  title: {
    fontFamily: "Poppins_700Bold", fontSize: 22,
    color: Colors.light.text, textAlign: "center", marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular", fontSize: 14,
    color: Colors.light.textSecondary, textAlign: "center",
  },
  list: { gap: 12 },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.light.border,
    padding: 16, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  roleIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  groupName: {
    fontFamily: "Poppins_600SemiBold", fontSize: 15, color: Colors.light.text,
  },
  village: {
    fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.light.textSecondary,
  },
  cardRight: { flexDirection: "row", alignItems: "center" },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, textTransform: "capitalize" },
  hint: {
    fontFamily: "Poppins_400Regular", fontSize: 12,
    color: Colors.light.textMuted, textAlign: "center", marginTop: 24,
  },
});
