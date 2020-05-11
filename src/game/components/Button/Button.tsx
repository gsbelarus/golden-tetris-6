import React, { useState } from 'react';

interface IButtonProps {
  className: string;
  caption: string;
  img?: string;
  disabled?: boolean;
  onClick: () => void;
};

export const Button = ({ className, caption, img, disabled, onClick }: IButtonProps) => {
  const [pressed, setPressed] = useState(false);
  const defStyle = {
    backgroundColor: 'silver',
    color: disabled ? 'grey' : '#202020'
  };
  const pressedStyle = {
    borderTop: '1px solid grey',
    borderLeft: '1px solid grey',
    borderRight: '1px solid white',
    borderBottom: '1px solid white'
  };
  const risedStyle = {
    borderTop: '1px solid white',
    borderLeft: '1px solid white',
    borderRight: '1px solid grey',
    borderBottom: '1px solid grey',
  };
  return (
    <div
      className={className}
      style={{
        ...defStyle,
        ...(pressed ? pressedStyle : risedStyle)
      }}
      onClick={ disabled ? undefined : () => {
        setPressed(true);
        setTimeout( () => setPressed(false), 100 );
        onClick();
      }}
    >
      <span
        style={
          pressed ?
          {
            position: 'relative',
            left: '2px',
            top: '2px'
          }
          :
          undefined
        }
      >
        {img ? <img style={{ opacity: disabled ? 0.4 : 1 }} src={img} alt={caption} /> : <span>{caption}</span>}
      </span>
    </div>
  );
};