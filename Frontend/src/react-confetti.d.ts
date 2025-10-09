declare module 'react-confetti' {
    import { Component } from 'react';
    
    interface ConfettiProps {
      width: number;
      height: number;
      recycle?: boolean;
      numberOfPieces?: number;
      gravity?: number;
      wind?: number;
      tweenDuration?: number;
      initialVelocityX?: number;
      initialVelocityY?: number;
      colors?: string[];
      opacity?: number;
      className?: string;
    }
    
    export default class Confetti extends Component<ConfettiProps> {}
  }