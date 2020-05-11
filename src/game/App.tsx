import React, { useReducer, useRef, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import { Figure, getRandomFigure, Cells, Row } from './figures';
import { Well, cellInFire } from './components/Well';
import { LCDLabel } from './components/LCDLabel';
import { Button } from './components/Button/Button';
import leftArrow from  './image/left.png';
import rightArrow from  './image/right.png';
import downArrow from  './image/down.png';
import rotateArrow from  './image/rotate.png';
import playBtn from  './image/play.png';
import stopBtn from  './image/stop.png';
import pauseBtn from  './image/pause.png';
import forwardBtn from  './image/forward.png';
import { getLocString, Lang } from './stringResources';

const createRow = (w: number, c = 0): Row => Array(w).fill(c);
const createWell = (w: number, h: number, c = 0): Cells => Array(h).fill(createRow(w, c));

const w = 10;
const h = 20;
const closedTile = 8;

const closedWell = createWell(w, h, closedTile);
const emptyWell = createWell(w, h);

const previewW = 4;
const previewH = 4;

const closedPreviewWell = createWell(previewW, previewH, closedTile);
const emptyPreviewWell = createWell(previewW, previewH);

const rowInFire = createRow(w, cellInFire);

const maxPoint = 99999;
const pointsPerLevel = 4000;
const burnRowsPoints = [1, 4, 16, 64];
const minLevel = 0;
const maxLevel = 9;
const defLevel = 5;
const levelDelay = 100;
const initialDelay = 120;

type GameStage = 'READY' | 'INPROGRESS' | 'PAUSED' | 'INANIMATION' | 'DROPPING' | 'FINALBURN';

type GAME_START       = { type: 'GAME_START' };
type GAME_STOP        = { type: 'GAME_STOP' };
type GAME_PAUSE       = { type: 'GAME_PAUSE' };
type GAME_RESUME      = { type: 'GAME_RESUME' };
type GAME_MOVE        = { type: 'GAME_MOVE', dx: number, dy: number, turn: boolean };
type GAME_DROP       =  { type: 'GAME_DROP' };
type GAME_ENDANIMATION= { type: 'GAME_ENDANIMATION' };
type GAME_BURNROWS    = { type: 'GAME_BURNROWS' };
type GAME_INC_LEVEL   = { type: 'GAME_INC_LEVEL' };
type GAME_DEC_LEVEL   = { type: 'GAME_DEC_LEVEL' };
type GAME_SCORE_SENT  = { type: 'GAME_SCORE_SENT' };

type Action =
  GAME_START       |
  GAME_STOP        |
  GAME_PAUSE       |
  GAME_RESUME      |
  GAME_MOVE        |
  GAME_DROP        |
  GAME_ENDANIMATION|
  GAME_BURNROWS    |
  GAME_INC_LEVEL   |
  GAME_DEC_LEVEL   |
  GAME_SCORE_SENT;

interface IState {
  stage: GameStage;
  prevStage: GameStage;
  cells: Cells;
  prevCells: Cells;
  figure?: Figure;
  fullRows: number[];
  previewCells: Cells;
  nextFigure?: Figure;
  gameStarted?: Date;
  gameEnded?: Date;
  points: number;
  level: number;
  lines: number;
  figures: number;
  sendScore?: boolean;
};

const defaultState = {
  stage: 'READY',
  prevStage: 'READY',
  cells: closedWell,
  prevCells: closedWell,
  fullRows: [],
  previewCells: closedPreviewWell,
  points: 0,
  level: defLevel,
  lines: 0,
  figures: 0
} as IState;

const reducer = (state: IState, action: Action): IState => {
  const { cells, prevCells, fullRows, points, lines, figure, nextFigure, figures, level, stage, prevStage } = state;

  const checkStage = (required: GameStage[]) => {
    if (!required.find( r => r === stage)) {
      throw new Error(`Invalid game state. Required: ${required}, stage: ${stage}, prev: ${prevStage}`);
    }
  };

  const checkNotStage = (required: GameStage) => {
    if (stage === required) {
      throw new Error(`Invalid game state. Not allowed: ${required}, stage: ${stage}, prev: ${prevStage}`);
    }
  };

  switch (action.type) {
    case 'GAME_START': {
      checkStage(['READY']);
      const nextFigure = getRandomFigure(previewW, previewH);
      return {
        ...state,
        stage: 'INPROGRESS',
        prevStage: stage,
        cells: emptyWell,
        prevCells: emptyWell,
        previewCells: nextFigure.merge(emptyPreviewWell),
        nextFigure,
        gameStarted: new Date(),
        gameEnded: undefined,
        points: 0,
        lines: 0,
        figures: 0
      };
    }

    case 'GAME_STOP': {
      checkNotStage('READY');
      return {
        ...state,
        stage: 'READY',
        prevStage: stage,
        cells: closedWell,
        prevCells: closedWell,
        fullRows: [],
        figure: undefined,
        previewCells: closedPreviewWell,
        nextFigure: undefined,
        gameEnded: new Date()
      };
    }

    case 'GAME_PAUSE':
      if (stage === 'INPROGRESS') {
        return { ...state, stage: 'PAUSED', prevStage: stage };
      } else {
        return state;
      }

    case 'GAME_RESUME':
      if (stage === 'PAUSED') {
        return { ...state, stage: 'INPROGRESS', prevStage: stage };
      } else {
        return state;
      }

    case 'GAME_MOVE': {
      if (stage !== 'INPROGRESS') {
        return state;
      }

      if (!figure) {
        const fullRows = cells.reduce( (fr, r, idx) => r.every( c => c ) ? [...fr, idx] : fr, []);

        if (fullRows.length) {
          const rowPoints = points + burnRowsPoints[fullRows.length - 1];
          return {
            ...state,
            stage: 'INANIMATION',
            prevStage: stage,
            fullRows,
            cells: cells.map( (r, idx) => fullRows.includes(idx) ? rowInFire : r ),
            points: rowPoints > maxPoint ? maxPoint : rowPoints,
            lines: lines + fullRows.length,
            level: (level < maxLevel && points > (level + 1) * pointsPerLevel) ? level + 1 : level
          };
        }

        if (nextFigure) {
          const figure = nextFigure.setXY((w - nextFigure.getWidth()) / 2 >> 0, 0);
          if (figure.canMove(0, 0, false, prevCells)) {
            const nextFigure = getRandomFigure(previewW, previewH);
            const newPoints = points + figure.points + level;
            return {
              ...state,
              prevStage: stage,
              points: newPoints > maxPoint ? maxPoint : newPoints,
              figures: figures + 1,
              figure,
              cells: figure.merge(prevCells),
              nextFigure,
              previewCells: nextFigure.merge(emptyPreviewWell)
            };
          }

          return {
            ...state,
            stage: 'FINALBURN',
            prevStage: stage,
            gameEnded: new Date()
          }
        }
      } else {
        if (figure.canMove(action.dx, action.dy, action.turn, prevCells)) {
          const afterMove = figure.move(action.dx, action.dy, action.turn);
          return {
            ...state,
            prevStage: stage,
            points: !action.dy && points > 0 ? points - 1 : points,
            figure: afterMove,
            cells: afterMove.merge(prevCells)
          };
        } else {
          if (action.dy) {
            return {
              ...state,
              prevStage: stage,
              prevCells: cells,
              figure: undefined
            };
          }
        }
      }

      return state;
    }

    case 'GAME_DROP':
      if (figure && (stage === 'INPROGRESS' || stage === 'DROPPING')) {
        if (figure.canMove(0, 1, false, prevCells)) {
          const afterMove = figure.move(0, 1);
          return {
            ...state,
            stage: 'DROPPING',
            prevStage: stage,
            figure: afterMove,
            cells: afterMove.merge(prevCells),
          };
        } else {
          return {
            ...state,
            stage: 'INPROGRESS',
            prevStage: stage,
            prevCells: cells,
            figure: undefined
          };
        }
      } else {
        return state;
      }

    case 'GAME_BURNROWS':
      if (stage === 'FINALBURN') {
        if (fullRows.length === cells.length) {
          return {
            ...state,
            stage: 'READY',
            prevStage: stage,
            cells: closedWell,
            prevCells: closedWell,
            fullRows: [],
            figure: undefined,
            previewCells: closedPreviewWell,
            nextFigure: undefined,
            sendScore: true
          }
        } else {
          return {
            ...state,
            prevStage: stage,
            points: points + cells[fullRows.length].reduce( (p, c) => c ? p + 1 : p, 0),
            fullRows: [...fullRows, fullRows.length],
            cells: cells.map( (r, idx) => idx === fullRows.length ? r.map( c => c ? cellInFire : 0 ) : r )
          };
        }
      } else {
        return state;
      }

    case 'GAME_ENDANIMATION':
      if (stage === 'INANIMATION') {
        const removedFullRows = [...createWell(cells[0].length, fullRows.length), ...cells.filter( (_, idx) => !fullRows.includes(idx) )];
        return {
          ...state,
          stage: 'INPROGRESS',
          prevStage: stage,
          cells: removedFullRows,
          prevCells: removedFullRows,
          fullRows: []
        };
      } else {
        return state;
      }

    case 'GAME_INC_LEVEL':
      if (level < maxLevel) {
        return { ...state, level: level + 1 };
      } else {
        return state;
      }

    case 'GAME_DEC_LEVEL':
      if (level > minLevel) {
        return { ...state, level: level - 1 };
      } else {
        return state;
      }

    case 'GAME_SCORE_SENT':
      return {
        ...state,
        sendScore: false
      }

    default:
      return state;
  }
};

const calcDelay = (level: number) => initialDelay + levelDelay * (maxLevel - level);

export const App = ({ lang }: { lang: Lang }) => {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const { stage, prevStage, points, lines, figures, level, cells, previewCells, gameStarted, gameEnded, sendScore } = state;
  const timer = useRef<{ timerID: number; interval: number } | undefined>();
  const refApp = useRef<HTMLDivElement | null>(null);

  const inPlay = stage === 'INPROGRESS' || stage === 'DROPPING' || stage === 'INANIMATION';
  const paused = stage === 'PAUSED';

  const moveFigureLeft = useCallback( () => dispatch({
      type: 'GAME_MOVE',
      dx: -1,
      dy: 0,
      turn: false
    }), []);

  const moveFigureRight = useCallback( () => dispatch({
      type: 'GAME_MOVE',
      dx: 1,
      dy: 0,
      turn: false
    }), []);

  const moveFigureDown = useCallback( () => dispatch({
      type: 'GAME_MOVE',
      dx: 0,
      dy: 1,
      turn: false
    }), []);

  const rotateFigure = useCallback( () => dispatch({
      type: 'GAME_MOVE',
      dx: 0,
      dy: 0,
      turn: true
    }), []);

  const dropFigure = useCallback( () => dispatch({ type: 'GAME_DROP' }), []);

  const gameResume = useCallback( () => dispatch({ type: 'GAME_RESUME' }), []);
  const gameStop = useCallback( () => dispatch({ type: 'GAME_STOP' }), []);
  const gamePause = useCallback( () => dispatch({ type: 'GAME_PAUSE' }), []);
  const gameIncLevel = useCallback( () => dispatch({ type: 'GAME_INC_LEVEL' }), []);

  const processKey = useCallback( (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.keyCode === 37) {
      moveFigureLeft();
    } else if (event.keyCode === 39) {
      moveFigureRight();
    } else if (event.keyCode === 38) {
      rotateFigure();
    } else if (event.keyCode === 40 || event.keyCode === 32) {
      dropFigure();
    } else if (event.keyCode === 27) {
      dispatch({ type: 'GAME_STOP' });
    } else if (event.keyCode === 19) {
      dispatch({ type: 'GAME_PAUSE' });
    }
  }, [moveFigureLeft, moveFigureRight, dropFigure, rotateFigure]);

  useEffect( () => refApp.current?.focus(), []);

  useEffect( () => {
    if (prevStage !== stage) {
      if (timer.current) {
        window.clearInterval(timer.current.timerID);
        timer.current = undefined;
      }

      switch (stage) {
        case 'INPROGRESS': {
          const interval = calcDelay(level);
          timer.current = {
            timerID: window.setInterval(moveFigureDown, interval),
            interval
          };
          break;
        }

        case 'DROPPING': {
          timer.current = {
            timerID: window.setInterval(dropFigure, 20),
            interval: 20
          };
          break;
        }

        case 'INANIMATION': {
          timer.current = {
            timerID: window.setInterval( () => dispatch({ type: 'GAME_ENDANIMATION' }), 600),
            interval: 600
          };
          break;
        }

        case 'FINALBURN': {
          timer.current = {
            timerID: window.setInterval( () => dispatch({ type: 'GAME_BURNROWS' }), 200),
            interval: 200
          };
          break;
        }
      }
    } else {
      const interval = calcDelay(level);
      if (stage === 'INPROGRESS' && timer.current?.interval !== interval) {
        window.clearInterval(timer.current?.timerID);
        timer.current = {
          timerID: window.setInterval(moveFigureDown, interval),
          interval
        };
      }
    }
  }, [stage, prevStage, level, dropFigure, moveFigureDown]);

  useEffect( () => {
    if (sendScore) {
      const duration = gameEnded && gameStarted ? gameEnded.getTime() - gameStarted.getTime() : 0;
      const query = `&points=${points}&lines=${lines}&figures=${figures}&level=${level}&duration=${duration}`;
      const httpRequest = new XMLHttpRequest();
      httpRequest.open('GET', `telegramBot/v1/submitTetris/${window.location.search}${query}`, true);
      httpRequest.send(null);
      dispatch({ type: 'GAME_SCORE_SENT' });
    }
  }, [sendScore, points, lines, level, figures, gameStarted, gameEnded]);

  const gameToolbar = useMemo( () =>
    <div className="Toolbar">
      <Button className="ToolButton" caption="⏵" img={playBtn} disabled={!paused} onClick={gameResume} />
      <Button className="ToolButton" caption="■" img={stopBtn} disabled={!inPlay} onClick={gameStop} />
      <Button className="ToolButton" caption="‖" img={pauseBtn} disabled={!inPlay} onClick={gamePause} />
      <Button className="ToolButton" caption="⏵⏵" img={forwardBtn} disabled={level === maxLevel} onClick={gameIncLevel} />
    </div>, [paused, inPlay, level, gameResume, gameStop, gamePause, gameIncLevel]
  );

  const controlKeys = useMemo( () =>
    <div className="ControlKeys">
      {
        inPlay || paused
        ?
          <>
            <Button className="Key KeyRotate" caption="⭯ " img={rotateArrow} disabled={!inPlay} onClick={rotateFigure} />
            <Button className="Key KeyLeft" caption="⯇" img={leftArrow} disabled={!inPlay} onClick={moveFigureLeft} />
            <Button className="Key KeyRight" caption="⯈" img={rightArrow} disabled={!inPlay} onClick={moveFigureRight} />
            <Button className="Key KeyDrop" caption="⯆" img={downArrow} disabled={!inPlay} onClick={dropFigure} />
          </>
        :
          <>
            <Button className="Key KeyStart" caption={getLocString('letsPlay', lang)} onClick={ () => dispatch({ type: 'GAME_START' }) } />
            <Button className="Key KeyLevelDown" caption={getLocString('levelDown', lang)} disabled={level === minLevel} onClick={ () => dispatch({ type: 'GAME_DEC_LEVEL' }) } />
            <Button className="Key KeyLevelUp" caption={getLocString('levelUp', lang)} disabled={level === maxLevel} onClick={ () => dispatch({ type: 'GAME_INC_LEVEL' }) } />
          </>
      }
    </div>, [level, inPlay, paused, lang, rotateFigure, moveFigureLeft, moveFigureRight, dropFigure]
  );

  const onKeyDown = useCallback( (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (stage === 'INPROGRESS') {
      processKey(event);
    }
    else if(stage === 'READY' && event.keyCode === 32) {
      dispatch({ type: 'GAME_START' });
    }
  }, [stage, processKey]);

  return (
    <div className="App" tabIndex={0} onKeyDown={onKeyDown} ref={refApp}>
      <div className="Field">
        {gameToolbar}
        <div className="FieldInnerFrame">
          <Well cells={cells} paused={paused} />
          <div className="Buttons">
            <LCDLabel counter={points} paused={paused} />
            <LCDLabel counter={lines} paused={paused} />
            <LCDLabel counter={figures} paused={paused} />
            <LCDLabel counter={level} paused={paused} />
            <Well cells={previewCells} paused={paused} />
          </div>
        </div>
        {controlKeys}
      </div>
    </div>
  )
};
