import React from "react";
import { getLocString, Lang } from "./stringResources";

export const NoChatWarning = ({ lang }: { lang: Lang }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '32px',
        padding: '24px',
        width: '100%',
        height: '100vh'
      }}
    >
      <div>
        {getLocString('warningA', lang)}<strong>Golden Tetris</strong>{getLocString('warningB', lang)}<a href="https://t.me/GoldenTetrisBot">@GoldenTetrisBot</a>.
      </div>
    </div>
  );
};