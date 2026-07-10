import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';
import { apiGet, apiPost, apiPatch } from '@/lib/api';

export default function HistoricalWorkspace() {
  const insets = useSafeAreaInsets();
  const { group, isPresident } = useAuth();
  const { t } = useLanguage();
  const [months, setMonths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchMonths();
  }, []);

  const fetchMonths = async () => {
    try {
      const data = await apiGet(`/api/groups/${group?.groupId}/migration-months`);
      setMonths(data as any[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMonth = async () => {
    Alert.prompt("New Month", "Enter YYYY-MM (e.g. 2024-01)", async (text) => {
      if (!text || !/^\d{4}-\d{2}$/.test(text)) {
        Alert.alert("Error", "Invalid format. Use YYYY-MM");
        return;
      }
      try {
        setProcessing("add");
        await apiPost(`/api/groups/${group?.groupId}/migration-months`, { monthYear: text });
        await fetchMonths();
      } catch(e) {
        Alert.alert("Error", "Failed to add month");
      } finally {
        setProcessing(null);
      }
    });
  };

  const handleFinalize = async (monthId: string) => {
    Alert.alert("Confirm", "Are you sure you want to finalize this month? This will post all verified drafts to the live ledger.", [
      { text: "Cancel", style: "cancel" },
      { text: "Finalize", onPress: async () => {
        try {
          setProcessing(monthId);
          await apiPost(`/api/groups/${group?.groupId}/migration-months/${monthId}/finalize`, {});
          Alert.alert("Success", "Month Finalized successfully.");
          await fetchMonths();
        } catch(e) {
          Alert.alert("Error", "Failed to finalize month");
        } finally {
          setProcessing(null);
        }
      }}
    ]);
  };

  const handleVerify = async (monthId: string) => {
    try {
      setProcessing(monthId);
      await apiPatch(`/api/groups/${group?.groupId}/migration-months/${monthId}/status`, {
        status: "verified",
        verifiedBy: group?.groupId
      });
      await fetchMonths();
    } catch(e) {
      Alert.alert("Error", "Failed to verify");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.title}>{t("migration.historical_workspace")}</Text>
        <Pressable onPress={handleAddMonth} style={styles.addBtn}>
          {processing === "add" ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="add" size={20} color="#fff" />}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.light.primary} /></View>
      ) : (
        <ScrollView style={styles.content}>
          {months.length === 0 && (
             <View style={styles.emptyState}>
               <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
               <Text style={styles.emptyText}>No historical months added yet.</Text>
             </View>
          )}

          {months.map((m: any) => (
            <View key={m.id} style={styles.monthCard}>
              <View style={styles.monthHeader}>
                <Text style={styles.monthName}>{m.monthYear}</Text>
                <View style={[styles.badge, m.status === "completed" ? styles.badgeGreen : m.status === "verified" ? styles.badgeBlue : styles.badgeYellow]}>
                  <Text style={[styles.badgeText, m.status === "completed" ? styles.badgeTextGreen : m.status === "verified" ? styles.badgeTextBlue : styles.badgeTextYellow]}>{m.status.toUpperCase()}</Text>
                </View>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>—</Text>
                  <Text style={styles.statLabel}>Drafts</Text>
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable style={styles.actionBtn} onPress={() => {}}>
                  <Ionicons name="create-outline" size={16} color="#0f172a" />
                  <Text style={styles.actionBtnText}>Edit Drafts</Text>
                </Pressable>

                {m.status === "open" && (
                  <Pressable style={[styles.actionBtn, {backgroundColor: '#e0f2fe', borderColor: '#bae6fd'}]} onPress={() => handleVerify(m.id)}>
                    {processing === m.id ? <ActivityIndicator size="small" color="#0369a1" /> : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#0369a1" />
                        <Text style={[styles.actionBtnText, {color: '#0369a1'}]}>Verify</Text>
                      </>
                    )}
                  </Pressable>
                )}

                {m.status === "verified" && (
                  <Pressable style={[styles.actionBtn, {backgroundColor: '#10b981', borderColor: '#059669'}]} onPress={() => handleFinalize(m.id)}>
                    {processing === m.id ? <ActivityIndicator size="small" color="#fff" /> : (
                      <>
                        <Ionicons name="lock-closed-outline" size={16} color="#fff" />
                        <Text style={[styles.actionBtnText, {color: '#fff'}]}>Finalize</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { flex: 1, fontSize: 18, fontWeight: '700', marginLeft: 15, color: '#0f172a' },
  addBtn: { backgroundColor: Colors.light.primary, padding: 8, borderRadius: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 20 },
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: 15, color: '#64748b' },
  monthCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  monthName: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  badgeYellow: { backgroundColor: '#fef9c3' },
  badgeTextYellow: { color: '#ca8a04' },
  badgeBlue: { backgroundColor: '#e0f2fe' },
  badgeTextBlue: { color: '#0369a1' },
  badgeGreen: { backgroundColor: '#dcfce7' },
  badgeTextGreen: { color: '#15803d' },
  statsRow: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#f8fafc', borderRadius: 8, padding: 10 },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', gap: 6 },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#0f172a' }
});
