import { useCallback, useMemo, useState } from 'react';
import { PhaserBoard } from './PhaserBoard';
import { allIcons, levels, type LevelDef } from './game/levels';
import './styles.css';

type Screen = 'start' | 'levels' | 'game';

const UNLOCK_KEY = 'cow-match:max-unlocked-level';
const COMPLETED_KEY = 'cow-match:completed-levels';

function readStoredNumber(key: string, fallback: number) {
  const value = window.localStorage.getItem(key);
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readCompletedLevels() {
  const rawValue = window.localStorage.getItem(COMPLETED_KEY);
  if (!rawValue) return new Set<number>();

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return new Set<number>();
    return new Set(parsed.map((item) => Number(item)).filter((item) => Number.isInteger(item)));
  } catch {
    return new Set<number>();
  }
}

function clampUnlockedLevel(value: number) {
  return Math.min(Math.max(value, 1), levels.length);
}

function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [selectedLevel, setSelectedLevel] = useState<LevelDef>(levels[0]);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(() => clampUnlockedLevel(readStoredNumber(UNLOCK_KEY, 1)));
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(() => readCompletedLevels());

  const currentChallengeLevel = useMemo(() => {
    const firstUnfinished = levels.find((level) => level.id <= maxUnlockedLevel && !completedLevels.has(level.id));
    return firstUnfinished?.id ?? maxUnlockedLevel;
  }, [completedLevels, maxUnlockedLevel]);

  const completeLevel = useCallback((level: LevelDef) => {
    setCompletedLevels((previous) => {
      const nextCompleted = new Set(previous);
      nextCompleted.add(level.id);
      const nextUnlocked = Math.max(maxUnlockedLevel, Math.min(level.id + 1, levels.length));
      window.localStorage.setItem(UNLOCK_KEY, String(nextUnlocked));
      window.localStorage.setItem(COMPLETED_KEY, JSON.stringify([...nextCompleted].sort((a, b) => a - b)));
      setMaxUnlockedLevel(nextUnlocked);
      return nextCompleted;
    });
  }, [maxUnlockedLevel]);

  const startLevel = (level: LevelDef) => {
    if (level.id > maxUnlockedLevel) return;
    setSelectedLevel(level);
    setScreen('game');
  };

  const startNextLevel = useCallback(() => {
    const nextLevel = levels.find((level) => level.id === selectedLevel.id + 1);
    if (!nextLevel) return;
    setSelectedLevel(nextLevel);
    setScreen('game');
  }, [selectedLevel.id]);

  const backToLevels = useCallback(() => setScreen('levels'), []);

  if (screen === 'game') {
    return (
      <PhaserBoard
        level={selectedLevel}
        onBack={backToLevels}
        onComplete={completeLevel}
        onNextLevel={selectedLevel.id < levels.length ? startNextLevel : undefined}
      />
    );
  }

  return (
    <main className="app">
      <section className="hero-card">
        <div className="cloud cloud-a" />
        <div className="cloud cloud-b" />
        <span className="kicker">原创牧场 · 层层闯关三消</span>
        <h1>牛了个牛</h1>
        <p className="tagline">在奶油白、草地绿和牛奶蓝的小牧场里，按顺序解锁关卡，清理不透明叠放的真实图块。</p>

        {screen === 'start' ? (
          <div className="start-panel">
            <div className="progress-ribbon">已解锁第 {maxUnlockedLevel} 关 · 已完成 {completedLevels.size}/{levels.length}</div>
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
              开始闯关
            </button>
            <p className="notice">本地桌面版：不联网、不登录、不使用数据库、不读取用户本地文件。</p>
          </div>
        ) : (
          <div className="level-panel">
            <div className="level-header">
              <div>
                <h2>层层闯关地图</h2>
                <p>沿着牧场小路依次通关，通关上一关后才会解锁下一关。</p>
              </div>
              <button className="ghost-button" type="button" onClick={() => setScreen('start')}>
                返回开始界面
              </button>
            </div>
            <div className="level-path" aria-label="顺序关卡路径">
              {levels.map((level, index) => {
                const unlocked = level.id <= maxUnlockedLevel;
                const completed = completedLevels.has(level.id);
                const current = unlocked && level.id === currentChallengeLevel && !completed;
                return (
                  <button
                    className={`level-card ${completed ? 'is-complete' : ''} ${current ? 'is-current' : ''} ${!unlocked ? 'is-locked' : ''}`}
                    key={level.id}
                    type="button"
                    onClick={() => startLevel(level)}
                    disabled={!unlocked}
                    aria-disabled={!unlocked}
                  >
                    <span className="path-dot">{completed ? '✓' : level.id}</span>
                    <span className="level-index">第 {level.id} 关</span>
                    <strong>{level.name}</strong>
                    <small>{level.description}</small>
                    <span className="level-meta">
                      <em>{level.difficulty}</em>
                      <em>{level.tiles.length} 枚图块</em>
                    </span>
                    {!unlocked ? <span className="lock-note">🔒 通关上一关后解锁</span> : null}
                    {current ? <span className="current-note">当前可挑战</span> : null}
                    {index < levels.length - 1 ? <span className="path-line" aria-hidden="true" /> : null}
                  </button>
                );
              })}
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
