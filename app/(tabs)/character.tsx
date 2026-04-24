import { useEffect, useState, useCallback } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, getCountFromServer } from '@firebase/firestore';
import { getCharacterRank, getLevelProgress, CharacterRank } from '../../src/data/character';
import { RANK_TITLE_KEY, RANK_FLAVOR_KEY } from '../../src/i18n/strings';

type Profile = { nickname: string; character: string };

export default function Character() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recipeCount, setRecipeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      const load = async () => {
        try {
          const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
          if (profileSnap.exists()) setProfile(profileSnap.data() as Profile);
          const countSnap = await getCountFromServer(
            query(collection(db, 'recipes'), where('userId', '==', user.uid))
          );
          setRecipeCount(countSnap.data().count);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [user])
  );

  const rank: CharacterRank = getCharacterRank(recipeCount);
  const progress = getLevelProgress(recipeCount, rank);
  const progressPct = Math.round(progress * 100);

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: '#16213e' }} color="#e2b96f" />;

  return (
    <View style={charStyles.container}>
      <Text style={charStyles.title}>{t('character_title')}</Text>

      <View style={charStyles.card}>
        <Text style={charStyles.emoji}>{rank.emoji}</Text>
        <Text style={charStyles.nickname}>{profile?.nickname ?? '...'}</Text>
        <Text style={charStyles.rankTitle}>
          {RANK_TITLE_KEY[rank.title] ? t(RANK_TITLE_KEY[rank.title] as any) : rank.title}
        </Text>
        <Text style={charStyles.level}>LV.{rank.level}</Text>

        <View style={charStyles.xpTrack}>
          <View style={[charStyles.xpFill, { width: `${progressPct}%` as any }]} />
        </View>
        <Text style={charStyles.xpLabel}>{recipeCount} {t('home_recipes')}</Text>

        {rank.nextTitle && (
          <Text style={charStyles.flavorText}>
            {RANK_FLAVOR_KEY[rank.title] ? t(RANK_FLAVOR_KEY[rank.title] as any) : rank.flavorText}
          </Text>
        )}
      </View>
    </View>
  );
}

const charStyles = {
  container: { flex: 1, backgroundColor: '#16213e', padding: 24, paddingTop: 60 } as const,
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 16, marginBottom: 32 } as const,
  card: { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', padding: 24, alignItems: 'center' as const },
  emoji: { fontSize: 64, marginBottom: 16 } as const,
  nickname: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 12, marginBottom: 12, textAlign: 'center' as const } as const,
  rankTitle: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 9, marginBottom: 4 } as const,
  level: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 9, marginBottom: 20 } as const,
  xpTrack: { width: '100%' as const, height: 6, backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', marginBottom: 8 },
  xpFill: { height: '100%' as const, backgroundColor: '#e2b96f' },
  xpLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7, marginBottom: 16 } as const,
  flavorText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7, textAlign: 'center' as const, lineHeight: 14 } as const,
};
