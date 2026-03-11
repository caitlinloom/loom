import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase, db } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { C, F, Sp } from '@/constants/design';

interface Msg {
  id:         string;
  match_id:   string;
  sender_id:  string;
  content:    string;
  created_at: string;
}

export default function ChatRoomScreen() {
  const { id: partnerId, matchId } = useLocalSearchParams<{ id: string; matchId: string }>();
  const { user }                   = useAuth();
  const router                     = useRouter();

  const [messages,      setMessages]      = useState<Msg[]>([]);
  const [partnerName,   setPartnerName]   = useState('');
  const [partnerPhoto,  setPartnerPhoto]  = useState('');
  const [compat,        setCompat]        = useState(0);
  const [input,         setInput]         = useState('');
  const [sending,       setSending]       = useState(false);
  const listRef                           = useRef<FlatList>(null);

  // ── Load initial messages + partner info ──────────────────────────────────
  useEffect(() => {
    if (!user || !matchId || !partnerId) return;

    Promise.all([
      db.messages()
        .select('*')
        .eq('match_id', matchId)
        .order('created_at'),
      db.profiles()
        .select('name')
        .eq('id', partnerId)
        .single(),
      db.photos()
        .select('url')
        .eq('user_id', partnerId)
        .eq('position', 0)
        .maybeSingle(),
      db.compatibility_scores()
        .select('overall')
        .eq('user_a', user.id)
        .eq('user_b', partnerId)
        .maybeSingle(),
    ]).then(([{ data: msgs }, { data: partner }, { data: photo }, { data: sc }]) => {
      setMessages((msgs as Msg[]) ?? []);
      setPartnerName(partner?.name ?? '');
      setPartnerPhoto(photo?.url ?? '');
      setCompat(sc?.overall ?? 0);
    });

    // Mark received messages as read
    db.messages()
      .update({ read_at: new Date().toISOString() })
      .eq('match_id', matchId)
      .neq('sender_id', user.id)
      .is('read_at', null)
      .then(() => {});
  }, [user, matchId, partnerId]);

  // ── Supabase Realtime subscription ───────────────────────────────────────
  useEffect(() => {
    if (!matchId) return;

    const channel = supabase
      .channel(`room:${matchId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `match_id=eq.${matchId}`,
        },
        payload => {
          const newMsg = payload.new as Msg;
          setMessages(prev => {
            // Avoid duplicates (our own sends are added optimistically)
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Mark as read if from partner
          if (newMsg.sender_id !== user?.id) {
            db.messages()
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMsg.id)
              .then(() => {});
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId, user?.id]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !user || !matchId || sending) return;

    setInput('');
    setSending(true);

    const tempMsg: Msg = {
      id:         `tmp-${Date.now()}`,
      match_id:   matchId,
      sender_id:  user.id,
      content:    text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    const { data, error } = await db.messages()
      .insert({
        match_id:   matchId,
        sender_id:  user.id,
        content:    text,
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (data) {
      // Replace temp with real row
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? (data as Msg) : m));
    }

    setSending(false);
  }, [input, user, matchId, sending]);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        {partnerPhoto ? (
          <Image source={{ uri: partnerPhoto }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, s.avatarPlaceholder]}>
            <Text style={s.avatarInitial}>{partnerName[0]}</Text>
          </View>
        )}
        <View style={s.headerInfo}>
          <Text style={s.headerName}>{partnerName}</Text>
          {compat > 0 && (
            <Text style={s.headerCompat}>{compat}% compatible</Text>
          )}
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={s.msgList}
        ListHeaderComponent={
          messages.length === 0 ? (
            <View style={s.matchedBanner}>
              <Text style={s.matchedTitle}>You matched with {partnerName}</Text>
              <Text style={s.matchedSub}>
                You already know what matters to each other. Say something real.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item: m, index }) => {
          const isMe   = m.sender_id === user?.id;
          const prev   = messages[index - 1];
          const showTs = !prev ||
            new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() > 120000;
          return (
            <>
              {showTs && (
                <Text style={s.timestamp}>{formatTime(m.created_at)}</Text>
              )}
              <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
                <Text style={[s.bubbleText, isMe ? s.bubbleTextMe : s.bubbleTextThem]}>
                  {m.content}
                </Text>
              </View>
            </>
          );
        }}
      />

      {/* Input row */}
      <View style={s.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Write a message…"
          placeholderTextColor={C.text3}
          multiline
          maxLength={2000}
          onSubmitEditing={send}
          blurOnSubmit={false}
          style={s.input}
          selectionColor={C.text}
        />
        <TouchableOpacity
          onPress={send}
          disabled={!input.trim() || sending}
          style={[s.sendBtn, (!input.trim() || sending) && s.sendBtnDisabled]}
        >
          <Text style={s.sendLabel}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    paddingHorizontal: Sp.lg,
    paddingTop:        Platform.OS === 'ios' ? 56 : 36,
    paddingBottom:     12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor:   C.bg,
  },
  back: {
    marginRight: 4,
  },
  backArrow: {
    fontFamily: F.sans,
    fontSize:   20,
    color:      C.text,
  },
  avatar: {
    width:        40,
    height:       40,
    borderRadius: 20,
    resizeMode:   'cover',
  },
  avatarPlaceholder: {
    backgroundColor: C.subtle,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarInitial: {
    fontFamily: F.serif,
    fontSize:   17,
    color:      C.text2,
  },
  headerInfo: {},
  headerName: {
    fontFamily: F.serif,
    fontSize:   15,
    color:      C.text,
  },
  headerCompat: {
    fontFamily: F.sans,
    fontSize:   11,
    color:      C.text3,
    marginTop:  1,
  },
  msgList: {
    paddingHorizontal: Sp.lg,
    paddingVertical:   Sp.md,
    gap:               6,
  },
  matchedBanner: {
    alignItems:        'center',
    paddingVertical:   Sp.xl,
    paddingHorizontal: Sp.xl,
  },
  matchedTitle: {
    fontFamily:   F.serif,
    fontSize:     18,
    color:        C.text,
    textAlign:    'center',
    marginBottom: 8,
  },
  matchedSub: {
    fontFamily:  F.serifI,
    fontSize:    13,
    color:       C.text3,
    textAlign:   'center',
    lineHeight:  20,
    maxWidth:    280,
  },
  timestamp: {
    fontFamily: F.mono,
    fontSize:   10,
    color:      C.text3,
    textAlign:  'center',
    marginVertical: 10,
  },
  bubble: {
    maxWidth:     '78%',
    paddingVertical:   10,
    paddingHorizontal: 14,
    marginBottom:      2,
  },
  bubbleMe: {
    alignSelf:       'flex-end',
    backgroundColor: C.text,
  },
  bubbleThem: {
    alignSelf:       'flex-start',
    backgroundColor: C.subtle,
  },
  bubbleText: {
    fontFamily:  F.serifI,
    fontSize:    14,
    lineHeight:  21,
  },
  bubbleTextMe: {
    color: C.inv,
  },
  bubbleTextThem: {
    color: C.text,
  },
  inputRow: {
    flexDirection:     'row',
    gap:               8,
    paddingHorizontal: Sp.lg,
    paddingVertical:   12,
    paddingBottom:     Platform.OS === 'ios' ? 34 : 12,
    borderTopWidth:    1,
    borderTopColor:    C.border,
    backgroundColor:   C.bg,
    alignItems:        'flex-end',
  },
  input: {
    flex:              1,
    paddingVertical:   10,
    paddingHorizontal: 14,
    borderWidth:       1,
    borderColor:       C.border,
    fontSize:          14,
    fontFamily:        F.sans,
    color:             C.text,
    maxHeight:         120,
  },
  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical:   10,
    backgroundColor:   C.text,
    alignItems:        'center',
    justifyContent:    'center',
    height:            44,
  },
  sendBtnDisabled: {
    backgroundColor: C.subtle,
  },
  sendLabel: {
    fontFamily:    F.sans,
    fontSize:      12,
    color:         C.inv,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
