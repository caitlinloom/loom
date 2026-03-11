import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { db } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { C, F, Sp } from '@/constants/design';
import { Ring } from '@/components/Ring';
import { Btn } from '@/components/Btn';
import type { UserCard } from '@/types';

const { width: SW } = Dimensions.get('window');
const PHOTO_H       = SW * (4 / 3);

export default function UserDetailScreen() {
  const { id }       = useLocalSearchParams<{ id: string }>();
  const { user }     = useAuth();
  const router       = useRouter();

  const [card,      setCard]      = useState<UserCard | null>(null);
  const [photoIdx,  setPhotoIdx]  = useState(0);
  const [isLiked,   setIsLiked]   = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [matchId,   setMatchId]   = useState<string | null>(null);
  const [acting,    setActing]    = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    loadCard();
    checkInteraction();
  }, [id, user]);

  const loadCard = async () => {
    const [{ data: profile }, { data: photos }, { data: sc }] = await Promise.all([
      db.profiles()
        .select('id, name, birth_date, gender, orientation, religion, monogamy, bio, location_name, location_lat, location_lng')
        .eq('id', id)
        .single(),
      db.photos()
        .select('url, position')
        .eq('user_id', id)
        .order('position'),
      db.compatibility_scores()
        .select('*')
        .eq('user_a', user!.id)
        .eq('user_b', id)
        .maybeSingle(),
    ]);

    if (!profile) return;

    const { data: me } = await db.profiles()
      .select('location_lat, location_lng')
      .eq('id', user!.id)
      .single();

    const age  = profile.birth_date
      ? Math.floor((Date.now() - new Date(profile.birth_date).getTime()) / 31557600000)
      : 0;
    const dist = (me && profile.location_lat && profile.location_lng)
      ? haversine(me.location_lat, me.location_lng, profile.location_lat, profile.location_lng)
      : 0;

    setCard({
      id:             profile.id,
      name:           profile.name ?? '',
      age,
      bio:            profile.bio ?? '',
      gender:         profile.gender,
      orientation:    profile.orientation,
      religion:       profile.religion,
      monogamy:       profile.monogamy,
      location_name:  profile.location_name ?? '',
      distance_miles: Math.round(dist),
      photos:         (photos ?? []).map(p => p.url),
      compat: {
        overall:       sc?.overall           ?? 0,
        values:        sc?.cat_values        ?? 0,
        communication: sc?.cat_communication ?? 0,
        lifestyle:     sc?.cat_lifestyle     ?? 0,
        finances:      sc?.cat_finances      ?? 0,
        intimacy:      sc?.cat_intimacy      ?? 0,
        family:        sc?.cat_family        ?? 0,
        growth:        sc?.cat_growth        ?? 0,
        dealbreakers:  sc?.cat_dealbreakers  ?? 0,
      },
    });
  };

  const checkInteraction = async () => {
    const { data: interaction } = await db.interactions()
      .select('action')
      .eq('from_user', user!.id)
      .eq('to_user', id)
      .maybeSingle();
    if (interaction?.action === 'like') setIsLiked(true);

    const { data: match } = await db.matches()
      .select('id')
      .or(`and(user_a.eq.${user!.id},user_b.eq.${id}),and(user_a.eq.${id},user_b.eq.${user!.id})`)
      .maybeSingle();
    if (match) {
      setIsMatched(true);
      setMatchId(match.id);
    }
  };

  const handleLike = async () => {
    if (!user || !card || acting) return;
    setActing(true);

    // Record like
    await db.interactions().upsert({
      from_user: user.id,
      to_user:   card.id,
      action:    'like',
      created_at: new Date().toISOString(),
    }, { onConflict: 'from_user,to_user' });

    // Check if they already liked us → create match
    const { data: theirLike } = await db.interactions()
      .select('id')
      .eq('from_user', card.id)
      .eq('to_user', user.id)
      .eq('action', 'like')
      .maybeSingle();

    if (theirLike) {
      const { data: match } = await db.matches().insert({
        user_a: user.id,
        user_b: card.id,
        created_at: new Date().toISOString(),
      }).select('id').single();
      setIsMatched(true);
      setMatchId(match?.id ?? null);
    } else {
      setIsLiked(true);
    }

    setActing(false);
  };

  const handlePass = async () => {
    if (!user || !card || acting) return;
    setActing(true);

    await db.interactions().upsert({
      from_user: user.id,
      to_user:   card.id,
      action:    'pass',
      created_at: new Date().toISOString(),
    }, { onConflict: 'from_user,to_user' });

    router.back();
  };

  const handleChat = () => {
    if (!card || !matchId) return;
    router.push({
      pathname: '/(app)/chat/[id]',
      params: { id: card.id, matchId },
    });
  };

  if (!card) return null;

  const catEntries = Object.entries(card.compat)
    .filter(([k]) => k !== 'overall')
    .sort((a, b) => (b[1] as number) - (a[1] as number));

  const compatLabel =
    card.compat.overall >= 85 ? 'Exceptionally strong' :
    card.compat.overall >= 75 ? 'Strong match' :
    'Good compatibility';

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.content} bounces>

        {/* Photo viewer */}
        <View style={[s.photoWrap, { height: PHOTO_H }]}>
          <Image
            source={{ uri: card.photos[photoIdx] }}
            style={s.photo}
          />
          {/* Left / right tap zones */}
          <View style={s.photoTapRow}>
            <TouchableOpacity
              style={s.photoTapZone}
              onPress={() => setPhotoIdx(i => Math.max(0, i - 1))}
            />
            <TouchableOpacity
              style={s.photoTapZone}
              onPress={() => setPhotoIdx(i => Math.min(card.photos.length - 1, i + 1))}
            />
          </View>
          {/* Progress dots */}
          <View style={s.photoDots}>
            {card.photos.map((_, i) => (
              <View
                key={i}
                style={[s.photoDot, i === photoIdx && s.photoDotActive]}
              />
            ))}
          </View>
          {/* Gradient overlay + name */}
          <View style={s.photoGradient} />
          <View style={s.photoInfo}>
            <Text style={s.photoName}>{card.name}, {card.age}</Text>
            <Text style={s.photoLoc}>{card.location_name} · {card.distance_miles} mi</Text>
          </View>
          {/* Back button */}
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Thumbnail strip */}
        <View style={s.thumbRow}>
          {card.photos.map((uri, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setPhotoIdx(i)}
              style={[s.thumb, i === photoIdx && s.thumbActive]}
            >
              <Image source={{ uri }} style={s.thumbImg} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Compatibility score */}
        <View style={s.compatRow}>
          <Ring score={card.compat.overall} size={80} />
          <View style={s.compatText}>
            <Text style={s.compatLabel}>Compatibility</Text>
            <Text style={s.compatDesc}>{compatLabel}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Bio + chips */}
        <View style={s.section}>
          {card.bio ? (
            <Text style={s.bio}>"{card.bio}"</Text>
          ) : null}
          <View style={s.chips}>
            {[card.gender, card.orientation, card.religion, card.monogamy].map((v, i) => (
              <View key={i} style={s.chip}>
                <Text style={s.chipText}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.divider} />

        {/* Dimension breakdown */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Compatibility by dimension</Text>
          {catEntries.map(([cat, score]) => (
            <View key={cat} style={s.dimRow}>
              <View style={s.dimLabelRow}>
                <Text style={s.dimCat}>{cat}</Text>
                <Text style={s.dimScore}>{score}%</Text>
              </View>
              <View style={s.dimTrack}>
                <View style={[s.dimFill, { width: `${score}%` }]} />
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Fixed action bar */}
      <View style={s.actionBar}>
        {isMatched ? (
          <Btn primary onPress={handleChat} style={s.actionFull}>
            You matched — start chatting
          </Btn>
        ) : isLiked ? (
          <View style={s.pendingWrap}>
            <Text style={s.pendingText}>Like sent. Waiting for their response.</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity onPress={handlePass} disabled={acting} style={s.passBtn}>
              <Text style={s.passIcon}>✕</Text>
              <Text style={s.passLabel}>Pass</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLike} disabled={acting} style={s.likeBtn}>
              <Text style={s.likeIcon}>♥</Text>
              <Text style={s.likeLabel}>Like</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R    = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const s = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: C.bg,
  },
  content: {
    paddingBottom: 100,
  },
  photoWrap: {
    position: 'relative',
    width:    '100%',
  },
  photo: {
    width:      '100%',
    height:     '100%',
    resizeMode: 'cover',
  },
  photoTapRow: {
    position:      'absolute',
    top:           0,
    left:          0,
    right:         0,
    bottom:        0,
    flexDirection: 'row',
  },
  photoTapZone: {
    flex: 1,
  },
  photoDots: {
    position:      'absolute',
    top:           Platform.OS === 'ios' ? 56 : 36,
    left:          12,
    right:         12,
    flexDirection: 'row',
    gap:           3,
  },
  photoDot: {
    flex:            1,
    height:          2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  photoDotActive: {
    backgroundColor: 'white',
  },
  photoGradient: {
    position:   'absolute',
    bottom:     0,
    left:       0,
    right:      0,
    height:     '45%',
    // React Native gradient requires LinearGradient; approximating with a solid fade
    backgroundColor: 'rgba(0,0,0,0)',
  },
  photoInfo: {
    position: 'absolute',
    bottom:   20,
    left:     20,
  },
  photoName: {
    fontFamily: F.serif,
    fontSize:   28,
    color:      'white',
    lineHeight: 34,
  },
  photoLoc: {
    fontFamily: F.sans,
    fontSize:   13,
    color:      'rgba(255,255,255,0.75)',
    marginTop:  4,
  },
  backBtn: {
    position:        'absolute',
    top:             Platform.OS === 'ios' ? 56 : 36,
    left:            16,
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  backArrow: {
    fontFamily: F.sans,
    fontSize:   18,
    color:      C.text,
    lineHeight: 20,
  },
  thumbRow: {
    flexDirection:     'row',
    gap:               3,
    paddingHorizontal: Sp.lg,
    marginTop:         4,
    marginBottom:      Sp.lg,
  },
  thumb: {
    flex:          1,
    aspectRatio:   1,
    overflow:      'hidden',
    opacity:       0.5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  thumbActive: {
    opacity:           1,
    borderBottomColor: C.text,
  },
  thumbImg: {
    width:      '100%',
    height:     '100%',
    resizeMode: 'cover',
  },
  compatRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Sp.lg,
    paddingHorizontal: Sp.lg,
    marginBottom:      Sp.lg,
  },
  compatText: {},
  compatLabel: {
    fontFamily:    F.sans,
    fontSize:      11,
    color:         C.text3,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom:  4,
  },
  compatDesc: {
    fontFamily: F.serif,
    fontSize:   18,
    color:      C.text,
  },
  divider: {
    height:          1,
    backgroundColor: C.border,
    marginHorizontal: Sp.lg,
    marginBottom:    Sp.lg,
  },
  section: {
    paddingHorizontal: Sp.lg,
    marginBottom:      Sp.lg,
  },
  bio: {
    fontFamily:   F.serifI,
    fontSize:     15,
    color:        C.text2,
    lineHeight:   23,
    marginBottom: Sp.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           6,
  },
  chip: {
    paddingVertical:   5,
    paddingHorizontal: 12,
    borderWidth:       1,
    borderColor:       C.border,
  },
  chipText: {
    fontFamily: F.sans,
    fontSize:   11,
    color:      C.text2,
  },
  sectionLabel: {
    fontFamily:    F.sans,
    fontSize:      11,
    color:         C.text3,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom:  Sp.md,
  },
  dimRow: {
    marginBottom: 12,
  },
  dimLabelRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   5,
  },
  dimCat: {
    fontFamily: F.sans,
    fontSize:   13,
    color:      C.text,
  },
  dimScore: {
    fontFamily: F.mono,
    fontSize:   13,
    color:      C.text2,
  },
  dimTrack: {
    height:          3,
    backgroundColor: C.subtle,
    overflow:        'hidden',
  },
  dimFill: {
    height:          '100%',
    backgroundColor: C.text,
  },
  actionBar: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    flexDirection:     'row',
    gap:               8,
    paddingHorizontal: Sp.lg,
    paddingTop:        Sp.md,
    paddingBottom:     Platform.OS === 'ios' ? 40 : Sp.lg,
    backgroundColor:   C.bg,
    borderTopWidth:    1,
    borderTopColor:    C.border,
  },
  passBtn: {
    flex:           1,
    paddingVertical: 14,
    borderWidth:    1,
    borderColor:    C.border,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
  },
  passIcon: {
    fontFamily: F.sans,
    fontSize:   14,
    color:      C.text2,
  },
  passLabel: {
    fontFamily: F.sans,
    fontSize:   13,
    color:      C.text2,
  },
  likeBtn: {
    flex:           2,
    paddingVertical: 14,
    backgroundColor: C.text,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
  },
  likeIcon: {
    fontFamily: F.sans,
    fontSize:   14,
    color:      C.inv,
  },
  likeLabel: {
    fontFamily: F.sans,
    fontSize:   13,
    color:      C.inv,
    fontWeight: '500',
  },
  actionFull: {
    flex: 1,
  },
  pendingWrap: {
    flex:           1,
    alignItems:     'center',
    paddingVertical: 16,
  },
  pendingText: {
    fontFamily:  F.serifI,
    fontSize:    14,
    color:       C.text3,
  },
});
