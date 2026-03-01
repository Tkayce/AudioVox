declare module '@react-native-community/slider' {
  import { Component } from 'react';
    import { ViewStyle } from 'react-native';

  interface SliderProps {
    value: number;
    onValueChange: (value: number) => void;
    minimumValue?: number;
    maximumValue?: number;
    minimumTrackTintColor?: string;
    maximumTrackTintColor?: string;
    thumbStyle?: ViewStyle;
    trackStyle?: ViewStyle;
    thumbTintColor?: string; // color for the thumb on supported platforms
    disabled?: boolean;
    step?: number;
  }

  export default class Slider extends Component<SliderProps> {}
}