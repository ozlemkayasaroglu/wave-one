import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { T } from "@/lib/theme";
import { register, login } from "@/lib/api";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { plan } = useLocalSearchParams<{ plan?: string }>();

  const [mode, setMode] = useState<"login" | "register">(
    plan ? "register" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result =
        mode === "register"
          ? await register(email.trim(), password, plan || "trial")
          : await login(email.trim(), password);

      await SecureStore.setItemAsync("waveone_auth", result.user.plan);
      await SecureStore.setItemAsync("waveone_token", result.token);
      await SecureStore.setItemAsync("waveone_user", JSON.stringify(result.user));
      if (mode === "register") {
        await SecureStore.setItemAsync("waveone_plan_started_at", Date.now().toString());
      }
      router.replace("/");
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: T.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>
            WAVE<Text style={styles.logoAccent}>:ONE</Text>
          </Text>
          <Text style={styles.tagline}>PROFESSIONAL BRIEFING</Text>
        </View>

        <View style={styles.divider} />

        {/* Toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              mode === "register" && styles.toggleBtnActive,
            ]}
            onPress={() => {
              setMode("register");
              setError("");
            }}
          >
            <Text
              style={[
                styles.toggleText,
                mode === "register" && styles.toggleTextActive,
              ]}
            >
              Üye Ol
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              mode === "login" && styles.toggleBtnActive,
            ]}
            onPress={() => {
              setMode("login");
              setError("");
            }}
          >
            <Text
              style={[
                styles.toggleText,
                mode === "login" && styles.toggleTextActive,
              ]}
            >
              Giriş Yap
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plan badge */}
        {mode === "register" && plan && plan !== "trial" && (
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>
              {plan === "monthly" ? "₺99/ay" : "₺790/yıl"} planı seçildi
            </Text>
          </View>
        )}
        {mode === "register" && (!plan || plan === "trial") && (
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>7 günlük ücretsiz deneme</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={[styles.input, !!error && styles.inputError]}
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError("");
            }}
            placeholder="ornek@email.com"
            placeholderTextColor={T.textDim}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>ŞİFRE</Text>
          <TextInput
            style={[styles.input, !!error && styles.inputError]}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError("");
            }}
            placeholder={mode === "register" ? "En az 6 karakter" : "Şifreniz"}
            placeholderTextColor={T.textDim}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[
              styles.btn,
              (!email.trim() || !password.trim() || loading) &&
                styles.btnDisabled,
            ]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={!email.trim() || !password.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color={T.bg} size="small" />
            ) : (
              <Text style={styles.btnText}>
                {mode === "register" ? "Hesap Oluştur →" : "Giriş Yap →"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <Text style={styles.hint}>
          {mode === "register"
            ? "Zaten hesabın var mı? Yukarıdan giriş yap."
            : "Hesabın yok mu? Yukarıdan üye ol."}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 32,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    color: T.textPrimary,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 4,
    fontFamily: "monospace",
  },
  logoAccent: {
    color: T.accent,
  },
  tagline: {
    color: T.textDim,
    fontSize: 9,
    letterSpacing: 3,
    fontFamily: "monospace",
    marginTop: 6,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: T.border,
    marginVertical: 28,
  },
  toggle: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 4,
    marginBottom: 20,
    overflow: "hidden",
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: T.accent,
  },
  toggleText: {
    color: T.textDim,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },
  toggleTextActive: {
    color: T.bg,
  },
  planBadge: {
    borderWidth: 1,
    borderColor: T.accent,
    borderRadius: 2,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  planBadgeText: {
    color: T.accent,
    fontSize: 11,
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },
  form: {
    gap: 4,
  },
  label: {
    color: T.textDim,
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: "monospace",
    marginBottom: 6,
  },
  input: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: T.textPrimary,
    fontSize: 15,
  },
  inputError: {
    borderColor: T.error,
  },
  error: {
    color: T.error,
    fontSize: 12,
    fontFamily: "monospace",
    marginTop: 4,
  },
  btn: {
    backgroundColor: T.accent,
    borderRadius: 4,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    color: T.bg,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  hint: {
    color: T.textDim,
    fontSize: 12,
    textAlign: "center",
    fontFamily: "monospace",
    lineHeight: 18,
  },
});
