import React, { useRef } from 'react'
import { Pressable, PressableProps, Animated } from 'react-native'

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode
}

export default function PressableScale({ children, style, ...rest }: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current

  return (
    <Pressable
      onPressIn={() => Animated.timing(scale, { toValue: 0.94, duration: 80, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }).start()}
      style={style}
      {...rest}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </Pressable>
  )
}
