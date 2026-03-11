import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase, db } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { C, F, Sp } from '@/constants/design';
import { Ring } from '@/components/Ring';
import type { UserCard } from '@/types';

type TabKey = 'discover' | 'liked' | 'matches';

export default function BrowseScreen() {
  const { user } = useAuth();
  const router   = useRouter();

  const [tab,          setTab]          = useState<TabKey>('discover');
  const [discover,     setDiscover]     = useState<UserCard[]>([]);
  const [liked,        setLiked]        = useState<UserCard[]>([]);
  const [matchedUsers, setMatchedUsers] = useState<UserCard[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  const load = useCallback(async () => {
    if (!user) return;

    // ── Fetch discover pool ──────────────────────────────────────────────────
    // 1. Get compatibility scores ≥ 70 for this user
    const { data: scores } = await db.compatibility_scores()
      .select('user_b, overall, cat_values, cat_communication, cat_lifestyle, cat_finances, cat_intimacy, cat_family, cat_growth, cat_dealbreakers')
      .eq('user_a', user.id)
      .gte('overall', 70)
      .order('overall', { ascending: false });

    // 2. IDs user already liked or passed
    const { data: interactions } = await db.interactions()
      .select('to_user, action')
      .eq('from_user', user.id);
    const actedOn = new Set((interactions ?? []).map(i => i.to_user));

    // 3. IDs in confirmed matches
    const { data: matchRows } = await db.matches()
      .select('user_a, user_b')
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
    const matchedIds = new Set(
      (matchRows ?? []).map(m => m.user_a === user.id ? m.user_b : m.user_a),
    );

    const eligibleIds = (scores ?? [])
      .map(s => s.user_b)
      .filter(id => !actedOn.has(id) && !matchedIds.has(id));

    // 4. Fetch profiles + photos for eligible users
    const cards = await buildCards(eligibleIds, scores ?? [], user.id);
    setDiscover(cards);

    // ── Fetch liked (pending) ────────────────────────────────────────────────
    const pendingIds = (interactions ?? [])
      .filter(i => i.action === 'like')
      .map(i => i.to_user)
      .filter(id => !matchedIds.has(id));
    const likedCards = await buildCards(pendingIds, scores ?? [], user.id);
    setLiked(likedCards);

    // ── Fetch matches ────────────────────────────────────────────────────────
    const matchedCards = await buildCards([...matchedIds], scores ?? [], user.id);
    setMatchedUsers(matchedCards);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openProfile = (card: UserCard) => {
    router.push({ pathname: '/(app)/browse/[id]', params: { id: card.id } });
  };

  const openChat = (card: UserCard) => {
    // Find match id
    db.matches()
      .select('id')
      .or(`user_a.eq.${user?.id},user_b.eq.${user?.id}`)
      .then(({ data }) => {
        const match = data?.find(m =>
          (m as any).user_a === card.id || (m as any).user_b === card.id,
        );
        if (match) {
          router.push({
            pathname: '/(app)/chat/[id]',
            params: { id: card.id, matchId: (match as any).id },
          });
        }
      });
  };

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'discover', label: 'Discover', count: discover.length },
    { key: 'liked',    label: 'Liked',    count: liked.length },
    { key: 'matches',  label: 'Matches',  count: matchedUsers.length },
  ];

  const activeData =
    tab === 'discover' ? discover :
    tab === 'liked'    ? liked    :
    matchedUsers;

  return (
    <View style={s.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.wordmark}>Loom</Text>
        <TouchableOpacity onPress={() => router.push('/(onboarding)/questions')}>
          <Text style={s.headerLink}>Questions</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {tabs.map(t => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[s.tab, tab === t.key && s.tabActive]}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>
              {t.label}
              {t.count > 0 && (
                <Text style={s.tabCount}> ({t.count})</Text>
              )}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feed */}
      {tab === 'discover' ? (
        <DiscoverGrid
          data={discover}
          loading={loading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onPress={openProfile}
        />
      ) : tab === 'liked' ? (
        <PendingList
          data={liked}
          loading={loading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          label="Waiting for their response."
          emptyText="People you've liked will appear here."
          onPress={openProfile}
        />
      ) : (
        <PendingList
          data={matchedUsers}
          loading={loading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          label="Matched"
          emptyText="When someone you like likes you back, you'll appear here and can start chatting."
          onPress={openChat}
          showArrow
        />
      )}
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DiscoverGrid({
  data, loading, refreshing, onRefresh, onPress,
}: {
  data: UserCard[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onPress: (c: UserCard) => void;
}) {
  if (!loading && data.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyText}>No matches found at your compatibility threshold. Try adjusting your preferences in Settings.</Text>
      </View>
    );
  }
  return (
    <FlatList
      data={data}
      numColumns={2}
      keyExtractor={c => c.id}
      columnWrapperStyle={s.gridRow}
      contentContainerStyle={s.gridContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.text} />
      }
      renderItem={({ item: card }) => (
        <TouchableOpacity
          onPress={() => onPress(card)}
          activeOpacity={0.85}
          style={s.card}
        >
          <View style={s.cardPhoto}>
            <Image source={{ uri: card.photos[0] }} style={s.cardImage} />
            {/* Score badge */}
            <View style={s.badge}>
              <Text style={s.badgeText}>{card.compat.overall}</Text>
            </View>
            {/* Name overlay */}
            <View style={s.cardOverlay} />
            <View style={s.cardFooter}>
              <Text style={s.cardName} numberOfLines={1}>
                {card.name}, {card.age}
              </Text>
            </View>
          </View>
          <Text style={s.cardLoc} numberOfLines={1}>
            {card.location_name} · {card.distance_miles} mi
          </Text>
          <Text style={s.cardBio} numberOfLines={2}>{card.bio}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

function PendingList({
  data, loading, refreshing, onRefresh, emptyText, label, onPress, showArrow,
}: {
  data: UserCard[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  emptyText: string;
  label: string;
  onPress: (c: UserCard) => void;
  showArrow?: boolean;
}) {
  if (!loading && data.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyTextItal}>{emptyText}</Text>
      </View>
    );
  }
  return (
    <FlatList
      data={data}
      keyExtractor={c => c.id}
      contentContainerStyle={s.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.text} />
      }
      renderItem={({ item: card }) => (
        <TouchableOpacity
          onPress={() => onPress(card)}
          activeOpacity={0.8}
          style={s.listRow}
        >
          <Image source={{ uri: card.photos[0] }} style={s.listAvatar} />
          <View style={s.listInfo}>
            <Text style={s.listName}>{card.name}, {card.age}</Text>
            <Text style={s.listMeta}>
              {label} · {card.compat.overall}% compatible
            </Text>
          </View>
          {showArrow && <Text style={s.listArrow}>›</Text>}
        </TouchableOpacity>
      )}
    />
  );
}

// ── Data helpers ──────────────────────────────────────────────────────────────

async function buildCards(
  userIds: string[],
  scores: any[],
  currentUserId: string,
): Promise<UserCard[]> {
  if (userIds.length === 0) return [];

  const [{ data: profiles }, { data: photos }] = await Promise.all([
    db.profiles()
      .select('id, name, birth_date, gender, orientation, religion, monogamy, bio, location_name, location_lat, location_lng')
      .in('id', userIds),
    db.photos()
      .select('user_id, url, position')
      .in('user_id', userIds)
      .order('position'),
  ]);

  // Fetch current user's location for distance calc
  const { data: me } = await db.profiles()
    .select('location_lat, location_lng')
    .eq('id', currentUserId)
    .single();

  const photoMap: Record<string, string[]> = {};
  (photos ?? []).forEach(p => {
    if (!photoMap[p.user_id]) photoMap[p.user_id] = [];
    photoMap[p.user_id][p.position] = p.url;
  });

  return (profiles ?? []).map(p => {
    const sc = scores.find(s => s.user_b === p.id);
    const age = p.birth_date
      ? Math.floor((Date.now() - new Date(p.birth_date).getTime()) / 31557600000)
      : 0;
    const dist = (me && p.location_lat && p.location_lng)
      ? haversine(me.location_lat, me.location_lng, p.location_lat, p.location_lng)
      : 0;

    return {
      id:             p.id,
      name:           p.name ?? '',
      age,
      bio:            p.bio ?? '',
      gender:         p.gender,
      orientation:    p.orientation,
      religion:       p.religion,
      monogamy:       p.monogamy,
      location_name:  p.location_name ?? '',
      distance_miles: Math.round(dist),
      photos:         (photoMap[p.id] ?? []).filter(Boolean),
      compat: {
        overall:       sc?.overall        ?? 0,
        values:        sc?.cat_values     ?? 0,
        communication: sc?.cat_communication ?? 0,
        lifestyle:     sc?.cat_lifestyle  ?? 0,
        finances:      sc?.cat_finances   ?? 0,
        intimacy:      sc?.cat_intimacy   ?? 0,
        family:        sc?.cat_family     ?? 0,
        growth:        sc?.cat_growth     ?? 0,
        dealbreakers:  sc?.cat_dealbreakers ?? 0,
      },
    } as UserCard;
  }).sort((a, b) => b.compat.overall - a.compat.overall);
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: C.bg,
    paddingTop:      Platform.OS === 'ios' ? 56 : 36,
  },
  header: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: Sp.lg,
    marginBottom:      Sp.md,
  },
  wordmark: {
    fontFamily:    F.serif,
    fontSize:      26,
    color:         C.text,
    letterSpacing: -0.5,
  },
  headerLink: {
    fontFamily:    F.sans,
    fontSize:      11,
    color:         C.text3,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tabRow: {
    flexDirection:     'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom:      Sp.md,
  },
  tab: {
    flex:             1,
    paddingVertical:  12,
    alignItems:       'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom:     -1,
  },
  tabActive: {
    borderBottomColor: C.text,
  },
  tabText: {
    fontFamily:    F.sans,
    fontSize:      12,
    color:         C.text3,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color:      C.text,
    fontWeight: '500',
  },
  tabCount: {
    fontFamily: F.mono,
    fontSize:   12,
  },
  // Grid
  gridContent: {
    paddingHorizontal: Sp.lg,
    paddingBottom:     Sp.xl,
  },
  gridRow: {
    gap:          Sp.md,
    marginBottom: Sp.md,
  },
  card: {
    flex: 1,
  },
  cardPhoto: {
    aspectRatio: 3 / 4,
    overflow:    'hidden',
    marginBottom: 8,
    position:    'relative',
  },
  cardImage: {
    width:      '100%',
    height:     '100%',
    resizeMode: 'cover',
  },
  badge: {
    position:        'absolute',
    top:             8,
    right:           8,
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  badgeText: {
    fontFamily: F.serif,
    fontSize:   14,
    color:      C.text,
  },
  cardOverlay: {
    position:   'absolute',
    bottom:     0,
    left:       0,
    right:      0,
    height:     '50%',
    background: 'transparent',
  },
  cardFooter: {
    position: 'absolute',
    bottom:   10,
    left:     10,
    right:    10,
  },
  cardName: {
    fontFamily: F.serif,
    fontSize:   16,
    color:      'white',
  },
  cardLoc: {
    fontFamily: F.sans,
    fontSize:   11,
    color:      C.text3,
  },
  cardBio: {
    fontFamily:  F.serifI,
    fontSize:    12,
    color:       C.text2,
    lineHeight:  18,
    marginTop:   3,
  },
  // List
  listContent: {
    paddingHorizontal: Sp.lg,
    paddingBottom:     Sp.xl,
  },
  listRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               14,
    paddingVertical:   12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  listAvatar: {
    width:        54,
    height:       54,
    borderRadius: 27,
    resizeMode:   'cover',
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontFamily: F.serif,
    fontSize:   15,
    color:      C.text,
  },
  listMeta: {
    fontFamily: F.sans,
    fontSize:   12,
    color:      C.text3,
    marginTop:  2,
  },
  listArrow: {
    fontFamily: F.sans,
    fontSize:   20,
    color:      C.text3,
  },
  // Empty
  empty: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: Sp.xl,
  },
  emptyText: {
    fontFamily: F.sans,
    fontSize:   13,
    color:      C.text3,
    textAlign:  'center',
    lineHeight: 20,
  },
  emptyTextItal: {
    fontFamily:  F.serifI,
    fontSize:    15,
    color:       C.text3,
    textAlign:   'center',
    lineHeight:  22,
  },
});
