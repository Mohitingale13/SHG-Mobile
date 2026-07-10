// @ts-nocheck
import { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Keyboard,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Colors from "@/constants/colors";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, checkActivationStatus, activateAccount } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  
  const [step, setStep] = useState<"phone" | "password" | "activate">("phone");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNextPhone = async () => {
    if (phone.trim().length !== 10) {
      Keyboard.dismiss();
      Alert.alert(t("error"), t("validation.phone_10_digits") || "Please enter a valid 10-digit mobile number");
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    const status = await checkActivationStatus(phone.trim());
    setLoading(false);
    
    if (status === "not_found") {
      Alert.alert(t("error"), t("auth.account_not_found"));
      return;
    } else if (status === "pending_activation") {
      setStep("activate");
    } else {
      setStep("password");
    }
  };

  const handleLogin = async () => {
    if (!password.trim()) {
      Keyboard.dismiss();
      Alert.alert(t("error"), t("validation.fill_all_fields"));
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const result = await login(phone.trim(), password);
    setLoading(false);
    
    if (result.success) {
      if (result.role === "super_admin") {
        router.replace("/(super-admin)" as any);
      } else {
        router.replace("/(main)");
      }
    } else {
      Keyboard.dismiss();
      Alert.alert(t("error"), t(result.error || "error"));
    }
  };

  const handleActivate = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Keyboard.dismiss();
      Alert.alert(t("error"), t("validation.fill_all_fields"));
      return;
    }
    if (password !== confirmPassword) {
      Keyboard.dismiss();
      Alert.alert(t("error"), t("auth.passwords_not_match"));
      return;
    }
    if (password.length < 6) {
      Keyboard.dismiss();
      Alert.alert(t("error"), t("auth.password_too_short"));
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const result = await activateAccount(phone.trim(), password);
    setLoading(false);
    
    if (result.success) {
      router.replace("/(main)");
    } else {
      Keyboard.dismiss();
      Alert.alert(t("error"), result.error || "Failed to activate account");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: (Platform.OS === "web" ? Math.max(insets.top, 20) : insets.top) + 40, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          style={styles.langToggle}
          onPress={() => setLanguage(t("auto.mr"))}
        >
          <Ionicons name="language" size={18} color={Colors.light.primary} />
          <Text style={styles.langText}>{t("auto.empty")}</Text>
        </Pressable>

        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="people" size={40} color="#fff" />
          </View>
          <Text style={styles.title}>{t("appName")}</Text>
          <Text style={styles.subtitle}>
            {t("auto.self_help_group_record_platform")}
          </Text>
        </View>

        <View style={styles.form}>
          {step === "phone" && (
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t("phone")}
                  placeholderTextColor={Colors.light.textMuted}
                  value={phone}
                  onChangeText={(text) => setPhone(text.replace(/\D/g, "").slice(0, 10))}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  maxLength={10}
                />
              </View>

              <Pressable
                style={({ pressed }) => [styles.loginBtn, { opacity: pressed ? 0.85 : 1 }]}
                onPress={handleNextPhone}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>{t("common.next") || "Next"}</Text>}
              </Pressable>
            </>
          )}

          {step === "password" && (
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder={t("password")}
                  placeholderTextColor={Colors.light.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoFocus
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.light.textSecondary} />
                </Pressable>
              </View>

              <Pressable
                style={({ pressed }) => [styles.loginBtn, { opacity: pressed ? 0.85 : 1 }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>{t("login")}</Text>}
              </Pressable>
              <Pressable onPress={() => setStep("phone")} style={{ alignItems: "center", marginTop: 10 }}>
                <Text style={{ color: Colors.light.primary, fontWeight: "600" }}>{t("auth.change_mobile")}</Text>
              </Pressable>
            </>
          )}
          
          {step === "activate" && (
            <>
              <Text style={{ textAlign: "center", marginBottom: 15, color: "#0369a1", fontWeight: "600", fontSize: 16 }}>
                {t("auth.welcome_activate")}
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder={t("auth.create_password")}
                  placeholderTextColor={Colors.light.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoFocus
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.light.textSecondary} />
                </Pressable>
              </View>
              
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder={t("auth.confirm_password")}
                  placeholderTextColor={Colors.light.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>

              <Pressable
                style={({ pressed }) => [styles.loginBtn, { opacity: pressed ? 0.85 : 1 }]}
                onPress={handleActivate}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>{t("auth.activate_account")}</Text>}
              </Pressable>
              <Pressable onPress={() => setStep("phone")} style={{ alignItems: "center", marginTop: 10 }}>
                <Text style={{ color: Colors.light.primary, fontWeight: "600" }}>{t("auth.back")}</Text>
              </Pressable>
            </>
          )}
        </View>

        {step === "phone" && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("dontHaveAccount")}</Text>
            <Pressable onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.footerLink}>{t("register")}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  langToggle: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
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
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  form: {
    gap: 14,
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
    fontSize: 15,
    color: Colors.light.text,
    paddingVertical: 16,
  },
  eyeBtn: {
    padding: 8,
  },
  loginBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  loginBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 32,
  },
  footerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  footerLink: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.primary,
  },
});
