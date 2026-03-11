import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { db } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { C, F, Sp } from '@/constants/design';

interface ConvItem {
  matchId:     string;
  partnerId:   string;
  partnerName: string;
  partnerPhoto: string;
  compat:      number;
  lastMessage: string | null;
  lastAt:      string | null;
  unread:      boolean;
}

export default function ChatListScreen() {
  const { user }           = useAuth();
  const router             = useRouter();
  const [convs, setConvs]  = useState<ConvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!user) return;

    // Fetch all matches involving current user
    const { data: matchRows } = await db.matches()
      .select('id, user_a, user_b, created_at')
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!matchRows?.length) { setConvs([]); return; }

    const partnerIds = matchRows.map(m =>
      m.user_a === user.id ? m.user_b : m.user_a,
    );
    const matchIds   = matchRows.map(m => m.id);

    // Fetch partner profiles + photos + last messages in parallel
    const [
      { data: profiles },
      { data: photos },
      { data: scores },
      { data: messages },
    ] = await Promise.all([
      db.profiles().select('id, name').in('id', partnerIds),
      db.photos().select('user_id, url, position')
        .in('user_id', partnerIds)
        .eq('position', 0),
      db.compatibility_scores()
        .select('user_b, overall')
        .eq('user_a', user.id)
        .in('user_b', partnerIds),
      db.messages()
        .select('match_id, content, created_at, sender_id, read_at')
        .in('match_id', matchIds)
        .order('created_at', { ascending: false }),
    ]);

    const profileMap: Record<string, string> = {};
    (profiles ?? []).forEach(p => { profileMap[p.id] = p.name ?? ''; });

    const photoMap: Record<string, string> = {};
    (photos ?? []).forEach(p => { photoMap[p.user_id] = p.url; });

    const scoreMap: Record<string, number> = {};
    (scores ?? []).forEach(s => { scoreMap[s.user_b] = s.overall; });

    // Group messages by match
    const msgMap: Record<string, any> = {};
    (messages ?? []).forEach(m => {
      if (!msgMap[m.match_id]) msgMap[m.match_id] = m;
    });

    const items: ConvItem[] = matchRows.map(m => {
      const pid  = m.user_a === user.id ? m.user_b : m.user_a;
      const last = msgMap[m.id];
      return {
        matchId:      m.id,
        partnerId:    pid,
        partnerName:  profileMap[pid] ?? '',
        partnerPhoto: photoMap[pid] ?? '',
        compat:       scoreMap[pid] ?? 0,
        lastMessage:  last?.content ?? null,
        lastAt:       last?.created_at ?? m.created_at,
        unread:       !!last && last.sender_id !== user.id && !last.read_at,
      };
    });

    setConvs(items);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000)     return 'now';
    if (diff < 3600000)   return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000)  return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <View style={s.header}>
        <Text style={s.heading}>Messages</Text>
      </View>

      {!loading && convs.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>
            Your matches will appear here once someone likes you back.
          </Text>
        </View>
      ) : (
        <FlatList
          data={convs}
          keyExtractor={c => c.matchId}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.text} />
          }
          renderItem={({ item: c }) => (
            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/(app)/chat/[id]',
                params: { id: c.partnerId, matchId: c.matchId },
              })}
              activeOpacity={0.8}
              style={s.row}
            >
              {c.partnerPhoto ? (
                <Image source={{ uri: c.partnerPhoto }} style={s.avatar} />
              ) : (
                <View style={[s.avatar, s.avatarPlaceholder]}>
                  <Text style={s.avatarInitial}>{c.partnerName[0]}</Text>
                </View>
              )}
              <View style={s.info}>
                <View style={s.nameRow}>
                  <Text style={[s.name, c.unread && s.nameBold]}>
                    {c.partnerName}
                  </Text>
                  {c.lastAt && (
                    <Text style={s.time}>{relativeTime(c.lastAt)}</Text>
                  )}
                </View>
                <Text style={[s.preview, c.unread && s.previewBold]} numberOfLines={1}>
                  {c.lastMessage ?? `${c.compat}% compatible — say hello`}
                </Text>
              </View>
              {c.unread && <View style={s.unreadDot} />}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: C.bg,
    paddingTop:      Platform.OS === 'ios' ? 56 : 36,
  },
  header: {
    paddingHorizontal: Sp.lg,
    paddingBottom:     Sp.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  heading: {
    fontFamily: F.serif,
    fontSize:   26,
    color:      C.text,
  },
  list: {
    paddingBottom: Sp.xl,
  },
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               14,
    paddingHorizontal: Sp.lg,
    paddingVertical:   14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  avatar: {
    width:        52,
    height:       52,
    borderRadius: 26,
    resizeMode:   'cover',
  },
  avatarPlaceholder: {
    backgroundColor: C.subtle,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarInitial: {
    fontFamily: F.serif,
    fontSize:   20,
    color:      C.text2,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'baseline',
    marginBottom:   3,
  },
  name: {
    fontFamily: F.serif,
    fontSize:   15,
    color:      C.text,
  },
  nameBold: {
    fontWeight: '700',
  },
  time: {
    fontFamily: F.mono,
    fontSize:   11,
    color:      C.text3,
  },
  preview: {
    fontFamily: F.sans,
    fontSize:   13,
    color:      C.text3,
    lineHeight: 18,
  },
  previewBold: {
    color:      C.text2,
    fontWeight: '500',
  },
  unreadDot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: C.text,
  },
  empty: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: Sp.xl,
  },
  emptyText: {
    fontFamily:  F.serifI,
    fontSize:    15,
    color:       C.text3,
    textAlign:   'center',
    lineHeight:  22,
  },
});
