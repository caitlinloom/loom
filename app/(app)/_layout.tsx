import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { C, F } from '@/constants/design';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={[s.tabLabel, focused && s.tabLabelFocused]}>{label}</Text>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle:             s.tabBar,
        tabBarActiveTintColor:   C.text,
        tabBarInactiveTintColor: C.text3,
        tabBarShowLabel:         false,
      }}
    >
      <Tabs.Screen
        name="browse"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Discover" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Messages" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  tabBar: {
    backgroundColor: C.bg,
    borderTopWidth:  1,
    borderTopColor:  C.border,
    height:          Platform.OS === 'ios' ? 82 : 60,
    paddingBottom:   Platform.OS === 'ios' ? 28 : 8,
    paddingTop:      8,
  },
  tabLabel: {
    fontFamily:    F.sans,
    fontSize:      11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color:         C.text3,
  },
  tabLabelFocused: {
    color:      C.text,
    fontWeight: '500',
  },
});
