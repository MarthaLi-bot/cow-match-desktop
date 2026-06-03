import * as Phaser from 'phaser';
import { useEffect, useRef } from 'react';
import { PastureScene } from './game/PastureScene';
import type { LevelDef } from './game/levels';

type PhaserBoardProps = {
  level: LevelDef;
  onBack: () => void;
};

export function PhaserBoard({ level, onBack }: PhaserBoardProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hostRef.current) return undefined;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 1080,
      height: 720,
      parent: hostRef.current,
      backgroundColor: '#fff8e7',
      scene: new PastureScene(level, onBack),
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        antialias: true,
        pixelArt: false,
      },
    });

    return () => {
      game.destroy(true);
    };
  }, [level, onBack]);

  return <div className="game-shell" ref={hostRef} aria-label={`${level.name} 游戏棋盘`} />;
}
