import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { db } from '@/lib/supabase';
import { C, F, Sp } from '@/constants/design';
import { QS, CATS } from '@/constants/questions';
import { Progress } from '@/components/Progress';
import { ScaleInput } from '@/components/ScaleInput';
import { ChoiceInput } from '@/components/ChoiceInput';
import { Btn } from '@/components/Btn';

export default function QuestionsScreen() {
  const { user, refreshProfile }         = useAuth();
  const { saveAnswer, triggerCompatCalc } = useProfile();
  const router                           = useRouter();

  // answers: { [questionId]: answerIndex }
  const [answers,  setAnswers]  = useState<Record<number, number>>({});
  const [qIdx,     setQIdx]     = useState(0);
  const [saving,   setSaving]   = useState(false);
  const opacity                 = useRef(new Animated.Value(1)).current;

  // Resolve visible questions (conditional logic identical to prototype)
  const activeQs = useMemo(() => QS.filter(q => {
    if (!q.cond) return true;
    const dep = answers[q.cond.q];
    if (dep === undefined) return true;
    return q.cond.a.includes(dep);
  }), [answers]);

  const currentQ      = activeQs[qIdx] ?? activeQs[0];
  const answeredCount = activeQs.filter(q => answers[q.id] !== undefined).length;
  const allAnswered   = answeredCount === activeQs.length;

  const currentCatIdx = CATS.indexOf(currentQ.cat as typeof CATS[number]);

  // Animate question transition
  const animateOut = (cb: () => void) => {
    Animated.timing(opacity, { toValue: 0, duration: 140, useNativeDriver: true })
      .start(() => { cb(); Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start(); });
  };

  const answer = useCallback((v: number) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: v }));
    // Persist immediately (fire & forget — we'll bulk-confirm on finish)
    if (user) saveAnswer(user.id, currentQ.id, v).catch(() => {});
  }, [currentQ.id, user, saveAnswer]);

  const goNext = () => {
    if (qIdx < activeQs.length - 1) {
      animateOut(() => setQIdx(i => i + 1));
    }
  };

  const goPrev = () => {
    if (qIdx > 0) {
      animateOut(() => setQIdx(i => i - 1));
    }
  };

  const jumpCat = (cat: string) => {
    const idx = activeQs.findIndex(q => q.cat === cat);
    if (idx >= 0) animateOut(() => setQIdx(idx));
  };

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Mark onboarding complete
      await db.profiles()
        .update({ onboarding_step: 4, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      // Trigger server-side compatibility calculation
      await triggerCompatCalc(user.id);
      await refreshProfile();
      router.replace('/(app)/browse');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.container}>
      <StatusBar style="dark" />

      {/* Fixed top: progress + category tabs */}
      <View style={s.topBar}>
        <View style={s.progressWrap}>
          <Progress
            current={answeredCount}
            total={activeQs.length}
            label="Step 3 of 4 — Compatibility questions"
          />
        </View>

        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.tabScroll}
          contentContainerStyle={s.tabRow}
        >
          {CATS.map((cat, ci) => {
            const catQs = activeQs.filter(q => q.cat === cat);
            const done  = catQs.filter(q => answers[q.id] !== undefined).length;
            const isCur = currentQ.cat === cat;
            return (
              <TouchableOpacity key={cat} onPress={() => jumpCat(cat)} style={s.tab}>
                <Text style={[s.tabText, isCur && s.tabTextActive]}>
                  {cat}
                </Text>
                <Text style={s.tabCount}>{done}/{catQs.length}</Text>
                {isCur && <View style={s.tabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Scrollable question card */}
      <ScrollView
        contentContainerStyle={s.questionContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity }}>
          {/* Meta row */}
          <View style={s.metaRow}>
            <Text style={s.metaCat}>{currentQ.cat}</Text>
            <Text style={s.metaDot}>·</Text>
            <Text style={s.metaId}>Q{currentQ.id}</Text>
            {currentQ.w >= 2 && (
              <>
                <Text style={s.metaDot}>·</Text>
                <Text style={s.metaWeight}>high weight</Text>
              </>
            )}
          </View>

          {/* Question */}
          <Text style={s.qText}>{currentQ.q}</Text>

          {/* Input */}
          <View style={s.inputWrap}>
            {currentQ.type === 'choice' && currentQ.opts ? (
              <ChoiceInput
                options={currentQ.opts}
                value={answers[currentQ.id]}
                onChange={answer}
              />
            ) : (
              <ScaleInput
                value={answers[currentQ.id]}
                onChange={answer}
                min={currentQ.min ?? ''}
                max={currentQ.max ?? ''}
              />
            )}
          </View>
        </Animated.View>

        {/* Bottom padding so content clears the nav bar */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed bottom navigation */}
      <View style={s.navBar}>
        <TouchableOpacity
          onPress={goPrev}
          disabled={qIdx === 0}
          style={[s.navBtn, s.navBtnBack, qIdx === 0 && s.navBtnDisabled]}
        >
          <Text style={[s.navArrow, qIdx === 0 && s.navArrowDisabled]}>←</Text>
        </TouchableOpacity>

        {allAnswered ? (
          <Btn primary onPress={finish} loading={saving} style={s.navMain}>
            View your matches
          </Btn>
        ) : (
          <TouchableOpacity
            onPress={goNext}
            disabled={qIdx >= activeQs.length - 1}
            style={[
              s.navMain,
              s.navBtnNext,
              answers[currentQ.id] !== undefined ? s.navBtnReady : s.navBtnWaiting,
            ]}
          >
            <Text style={[
              s.navNextLabel,
              answers[currentQ.id] !== undefined ? s.navNextLabelReady : s.navNextLabelWaiting,
            ]}>
              Next
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: C.bg,
  },
  topBar: {
    backgroundColor: C.bg,
    paddingTop:      Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  progressWrap: {
    paddingHorizontal: Sp.lg,
  },
  tabScroll: {
    marginTop: Sp.xs,
  },
  tabRow: {
    paddingHorizontal: Sp.lg,
    gap:               0,
  },
  tab: {
    paddingHorizontal: 10,
    paddingBottom:     12,
    alignItems:        'center',
    position:          'relative',
    marginBottom:      -1,
  },
  tabText: {
    fontFamily:    F.sans,
    fontSize:      10,
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
    fontSize:   9,
    color:      C.text3,
    marginTop:  2,
  },
  tabUnderline: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    height:          2,
    backgroundColor: C.text,
  },
  questionContent: {
    paddingHorizontal: Sp.lg,
    paddingTop:        Sp.xl,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    marginBottom:  Sp.md,
    flexWrap:      'wrap',
  },
  metaCat: {
    fontFamily:    F.sans,
    fontSize:      11,
    color:         C.text3,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  metaDot: {
    fontFamily: F.sans,
    fontSize:   11,
    color:      C.text3,
  },
  metaId: {
    fontFamily: F.mono,
    fontSize:   11,
    color:      C.text3,
  },
  metaWeight: {
    fontFamily: F.serifI,
    fontSize:   11,
    color:      C.text3,
  },
  qText: {
    fontFamily:   F.serif,
    fontSize:     22,
    color:        C.text,
    lineHeight:   32,
    marginBottom: Sp.xl,
  },
  inputWrap: {
    marginBottom: Sp.xl,
  },
  navBar: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    flexDirection:     'row',
    gap:               8,
    paddingHorizontal: Sp.lg,
    paddingTop:        Sp.lg,
    paddingBottom:     Platform.OS === 'ios' ? 40 : Sp.lg,
    backgroundColor:   C.bg,
    borderTopWidth:    1,
    borderTopColor:    C.border,
  },
  navBtn: {
    width:           48,
    height:          48,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     C.border,
  },
  navBtnBack: {},
  navBtnDisabled: {
    opacity: 0.3,
  },
  navArrow: {
    fontFamily: F.sans,
    fontSize:   18,
    color:      C.text,
  },
  navArrowDisabled: {
    color: C.text3,
  },
  navMain: {
    flex:            1,
    height:          48,
    alignItems:      'center',
    justifyContent:  'center',
  },
  navBtnNext: {
    borderWidth: 0,
  },
  navBtnReady: {
    backgroundColor: C.text,
  },
  navBtnWaiting: {
    backgroundColor: C.subtle,
  },
  navNextLabel: {
    fontFamily:    F.sans,
    fontSize:      13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  navNextLabelReady: {
    color:      C.inv,
    fontWeight: '500',
  },
  navNextLabelWaiting: {
    color: C.text3,
  },
});
