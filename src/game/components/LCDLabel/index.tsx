import React from 'react';
import './index.css';

const digitsCount = 5;

const LCDDigit = ({ v }: { v: string }) => <div className={`lcd-digit lcd-digit-${v}`} />;

export const LCDLabel = React.memo( ({ counter, paused }: { counter: number, paused: boolean }) =>
  <div className={'lcd-outer-border' + (paused ? ' paused' : '')}>
    <div className="lcd-border">
      {counter.toString().padStart(digitsCount).split('').map(
        (d, i) => <LCDDigit key={i} v={d} />)}
    </div>
  </div>
);