export type IconId =
  | 'cow'
  | 'milk'
  | 'bell'
  | 'grass'
  | 'cheese'
  | 'barn'
  | 'hoof'
  | 'flower'
  | 'hen'
  | 'corgi'
  | 'goose'
  | 'farmer';

export type TileDef = {
  id: string;
  icon: IconId;
  x: number;
  y: number;
  layer: number;
};

export type LevelDef = {
  id: number;
  name: string;
  description: string;
  difficulty: string;
  tiles: TileDef[];
};

const icons: IconId[] = [
  'cow',
  'milk',
  'bell',
  'grass',
  'cheese',
  'barn',
  'hoof',
  'flower',
  'hen',
  'corgi',
  'goose',
  'farmer',
];

function tripleIcons(count: number): IconId[] {
  const result: IconId[] = [];
  for (let i = 0; i < count; i += 1) {
    const icon = icons[i % icons.length];
    result.push(icon, icon, icon);
  }
  return result;
}

function makeTiles(levelId: number, positions: Array<[number, number, number]>): TileDef[] {
  const bag = tripleIcons(Math.ceil(positions.length / 3))
    .slice(0, positions.length)
    .map((icon, index) => ({ icon, weight: (index * 37 + levelId * 17) % 101 }))
    .sort((a, b) => a.weight - b.weight)
    .map((entry) => entry.icon);

  return positions.map(([x, y, layer], index) => ({
    id: `level-${levelId}-tile-${index}`,
    icon: bag[index],
    x,
    y,
    layer,
  }));
}

const meadowPositions: Array<[number, number, number]> = [
  [300, 150, 0], [396, 150, 0], [492, 150, 0], [588, 150, 0], [684, 150, 0],
  [300, 246, 0], [396, 246, 0], [492, 246, 0], [588, 246, 0], [684, 246, 0],
  [348, 198, 1], [444, 198, 1], [540, 198, 1], [636, 198, 1],
  [348, 294, 1], [444, 294, 1], [540, 294, 1], [636, 294, 1],
  [396, 246, 2], [492, 246, 2], [588, 246, 2],
  [444, 198, 3], [540, 294, 3], [636, 198, 3],
];

const dairyPositions: Array<[number, number, number]> = [
  [252, 125, 0], [348, 125, 0], [444, 125, 0], [540, 125, 0], [636, 125, 0], [732, 125, 0],
  [252, 221, 0], [348, 221, 0], [444, 221, 0], [540, 221, 0], [636, 221, 0], [732, 221, 0],
  [300, 173, 1], [396, 173, 1], [492, 173, 1], [588, 173, 1], [684, 173, 1],
  [300, 269, 1], [396, 269, 1], [492, 269, 1], [588, 269, 1], [684, 269, 1],
  [348, 221, 2], [444, 221, 2], [540, 221, 2], [636, 221, 2],
  [396, 173, 3], [492, 269, 3], [588, 173, 3], [684, 269, 3],
];

const barnPositions: Array<[number, number, number]> = [
  [252, 100, 0], [348, 100, 0], [444, 100, 0], [540, 100, 0], [636, 100, 0], [732, 100, 0],
  [252, 196, 0], [348, 196, 0], [444, 196, 0], [540, 196, 0], [636, 196, 0], [732, 196, 0],
  [252, 292, 0], [348, 292, 0], [444, 292, 0], [540, 292, 0], [636, 292, 0], [732, 292, 0],
  [300, 148, 1], [396, 148, 1], [492, 148, 1], [588, 148, 1], [684, 148, 1],
  [300, 244, 1], [396, 244, 1], [492, 244, 1], [588, 244, 1], [684, 244, 1],
  [348, 196, 2], [444, 196, 2], [540, 196, 2], [636, 196, 2],
  [396, 148, 3], [492, 244, 3], [588, 148, 3], [684, 244, 3],
];

export const levels: LevelDef[] = [
  {
    id: 1,
    name: '晨光草场',
    description: '少量叠层，适合熟悉卡槽消除节奏。',
    difficulty: '轻松',
    tiles: makeTiles(1, meadowPositions),
  },
  {
    id: 2,
    name: '奶香小路',
    description: '更多覆盖关系，注意先清理顶层。',
    difficulty: '进阶',
    tiles: makeTiles(2, dairyPositions),
  },
  {
    id: 3,
    name: '暖黄谷仓',
    description: '三层以上的牧场挑战原型关。',
    difficulty: '挑战',
    tiles: makeTiles(3, barnPositions),
  },
];

export const allIcons = icons;
