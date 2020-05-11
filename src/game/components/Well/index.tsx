import React from 'react';
import './index.css';
import { Row, Cells } from '../../figures';

export const cellInFire = 9;

const WellCell = React.memo(({ color }: { color: number }) => {
  const className = color === cellInFire ? 'fire' : `cell cell${color}`;
  return <span className={className} />;
});

const WellRow = React.memo(({ row }: { row: Row }) =>
  <div className='row'>
    {row.map( (c, idx) => <WellCell key={idx} color={c} /> )}
  </div>
);

export const Well = React.memo(({ cells, paused }: { cells: Cells, paused: boolean }) =>
  <div className={'well-border' + (paused ? ' paused' : '')}>
    <div className='well'>
      {cells.map( (r, idx) => <WellRow key={idx} row={r} /> )}
    </div>
  </div>
);
