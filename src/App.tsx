import { useCallback, useState } from 'react';
import { PhaserBoard } from './PhaserBoard';
import { allIcons, levels, type LevelDef } from './game/levels';
import './styles.css';

type Screen = 'start' | 'levels' | 'game';

function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [selectedLevel, setSelectedLevel] = useState<LevelDef>(levels[0]);

  const startLevel = (level: LevelDef) => {
    setSelectedLevel(level);
    setScreen('game');
  };

  const backToLevels = useCallback(() => setScreen('levels'), []);

  if (screen === 'game') {
    return <PhaserBoard level={selectedLevel} onBack={backToLevels} />;
  }

  return (
    <main className="app">
      <section className="hero-card">
        <div className="cloud cloud-a" />
        <div className="cloud cloud-b" />
        <span className="kicker">原创牧场叠层三消原型</span>
        <h1>牛了个牛</h1>
        <p className="tagline">在奶油白、草地绿和牛奶蓝的小牧场里，收集三枚相同图块让卡槽保持清爽。</p>

        {screen === 'start' ? (
          <div className="start-panel">
            <div className="mascot" aria-hidden="true">
              <span className="horn left" />
              <span className="horn right" />
              <span className="ear left" />
              <span className="ear right" />
              <span className="spot one" />
              <span className="spot two" />
              <span className="nose" />
            </div>
            <button className="primary-button" type="button" onClick={() => setScreen('levels')}>
              开始游戏
            </button>
            <p className="notice">本地桌面版：不联网、不登录、不使用数据库、不读取用户本地文件。</p>
          </div>
        ) : (
          <div className="level-panel">
            <div className="level-header">
              <h2>选择测试关卡</h2>
              <button className="ghost-button" type="button" onClick={() => setScreen('start')}>
                返回开始界面
              </button>
            </div>
            <div className="level-grid">
              {levels.map((level) => (
                <button className="level-card" key={level.id} type="button" onClick={() => startLevel(level)}>
                  <span className="level-index">{level.id}</span>
                  <strong>{level.name}</strong>
                  <small>{level.description}</small>
                  <em>{level.tiles.length} 枚图块 · 多层叠放</em>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="icon-preview" aria-label="牧场主题原创图标列表">
          {allIcons.map((icon) => (
            <span key={icon}>{icon}</span>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
