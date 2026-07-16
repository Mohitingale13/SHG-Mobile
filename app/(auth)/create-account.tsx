import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useState } from "react";
import { useLocalSearchParams as useLocalSearchParamsExpo } from "expo-router";
import { router as expoRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";

export default function CreateAccountScreen() {
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage } = useLanguage();
  const { registerPresident, registerMember } = useAuth();
  const { role, uniqueGroupCode } = useLocalSearchParamsExpo<{ role: string; uniqueGroupCode: string }>();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
    Keyboard.dismiss();
    
    if (!name.trim() || !phone.trim() || !village.trim() || !password.trim() || !confirmPassword.trim()) {
      const msg = t("validation.fill_all_fields") || "Please fill all fields";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert(t("error"), msg);
      return;
    }
    if (phone.trim().length !== 10) {
      const msg = t("validation.phone_10_digits") || "Phone number must be 10 digits";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert(t("error"), msg);
      return;
    }
    if (password !== confirmPassword) {
      const msg = t("validation.passwords_do_not_match") || "Passwords do not match";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert(t("error"), msg);
      return;
    }
    if (password.length < 6) {
      const msg = t("validation.password_min_6") || "Password must be at least 6 characters";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert(t("error"), msg);
      return;
    }

    setLoading(true);

    // Existing API strictly requires "village" string
    const registrationData = {
      name: name.trim(),
      phone: phone.trim(),
      password,
      uniqueGroupCode: uniqueGroupCode || "",
      village: village.trim(),
    };

    let result;
    if (role === "president") {
      result = await registerPresident(registrationData);
    } else {
      result = await registerMember(registrationData);
    }

    setLoading(false);

    if (result.success) {
      if (role === "president") {
        expoRouter.push("/(auth)/formation-date" as any);
      } else {
        expoRouter.replace("/(main)");
      }
    } else {
      const errorMsg = t(result.error || "error");
      Platform.OS === "web" ? window.alert(errorMsg) : Alert.alert(t("error"), errorMsg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: (Platform.OS === "web" ? 0 : insets.top) + 16, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable onPress={() => expoRouter.back()} style={styles.backBtn}>
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
            <View style={[styles.progressFill, { width: "75%" }]} />
          </View>
          <Text style={styles.progressText}>3/4</Text>
        </View>

        <Text style={styles.title}>{t("create_your_account") || "Create Your Account"}</Text>

        <View style={styles.form}>
          <Text style={styles.inputLabel}>{t("full_name") || "Full Name"}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t("enter_your_name") || "Enter your name"}
              placeholderTextColor={Colors.light.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.inputLabel}>{t("phone") || "Mobile Number"}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t("10_digit_number") || "10 digit number"}
              placeholderTextColor={Colors.light.textMuted}
              value={phone}
              onChangeText={(text) => setPhone(text.replace(/\D/g, "").slice(0, 10))}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>

          <Text style={styles.inputLabel}>{t("village") || "Village Name"}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="home-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t("enter_your_village") || "Enter your village"}
              placeholderTextColor={Colors.light.textMuted}
              value={village}
              onChangeText={setVillage}
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.inputLabel}>{t("password") || "Password"}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="********"
              placeholderTextColor={Colors.light.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.light.textSecondary} />
            </Pressable>
          </View>

          <Text style={styles.inputLabel}>{t("confirm_password") || "Confirm Password"}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="********"
              placeholderTextColor={Colors.light.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.createBtn,
              { opacity: pressed || loading ? 0.85 : 1 },
            ]}
            onPress={handleCreateAccount}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createBtnText}>{t("create_account") || "Create Account"}</Text>
            )}
          </Pressable>
        </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    marginBottom: 24,
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
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: Colors.light.text,
    marginBottom: 24,
  },
  form: {
    gap: 12,
  },
  inputLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: -4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: Colors.light.text,
    paddingVertical: 14,
    ...Platform.select({ web: { outlineStyle: "none" } as any, default: {} }),
  },
  eyeBtn: {
    padding: 8,
  },
  createBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  createBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
});
