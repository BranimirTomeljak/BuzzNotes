import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../theme';
import LanguageSelector from '../components/LanguageSelector';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

export default function AuthScreen() {
  const { t } = useTranslation();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      Toast.show({ type: 'error', text1: t('auth.fillAllFields'), visibilityTime: 1500 });
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Toast.show({ type: 'error', text1: t('auth.passwordMismatch'), visibilityTime: 1500 });
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: err?.message || 'Unknown error',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [email, password, confirmPassword, isLogin, signIn, signUp, t]);

  const handleGoogle = useCallback(async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: err?.message || 'Unknown error',
        visibilityTime: 3000,
      });
    }
  }, [signInWithGoogle, t]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.languageRow}>
            <LanguageSelector />
          </View>

          <View style={styles.header}>
            <Text style={styles.logo}>🐝</Text>
            <Text style={styles.title}>BuzzNotes</Text>
            <Text style={styles.subtitle}>
              {isLogin ? t('auth.login') : t('auth.register')}
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder={t('auth.email')}
              placeholderTextColor={colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder={t('auth.password')}
              placeholderTextColor={colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {!isLogin && (
              <TextInput
                style={styles.input}
                placeholder={t('auth.confirmPassword')}
                placeholderTextColor={colors.textLight}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            )}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.submitText}>
                {loading
                  ? t('common.loading')
                  : isLogin
                  ? t('auth.loginButton')
                  : t('auth.registerButton')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogle}
              activeOpacity={0.7}
            >
              <Text style={styles.googleText}>{t('auth.googleButton')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setIsLogin(!isLogin);
                setConfirmPassword('');
              }}
              style={styles.switchButton}
            >
              <Text style={styles.switchText}>
                {isLogin ? t('auth.switchToRegister') : t('auth.switchToLogin')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  languageRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    fontSize: 72,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.lg,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    fontSize: 18,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    ...typography.button,
    color: colors.white,
  },
  googleButton: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleText: {
    ...typography.button,
    color: colors.text,
  },
  switchButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  switchText: {
    ...typography.bodySmall,
    color: colors.primary,
  },
});
