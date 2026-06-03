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
  [250, 150, 0], [380, 150, 0], [510, 150, 0], [640, 150, 0], [770, 150, 0],
  [250, 270, 0], [380, 270, 0], [510, 270, 0], [640, 270, 0], [770, 270, 0],
  [315, 210, 1], [445, 210, 1], [575, 210, 1], [705, 210, 1],
  [315, 330, 1], [445, 330, 1], [575, 330, 1], [705, 330, 1],
  [380, 270, 2], [510, 270, 2], [640, 270, 2],
  [445, 210, 3], [575, 330, 3], [705, 210, 3],
];

const dairyPositions: Array<[number, number, number]> = [
  [185, 135, 0], [315, 135, 0], [445, 135, 0], [575, 135, 0], [705, 135, 0], [835, 135, 0],
  [185, 255, 0], [315, 255, 0], [445, 255, 0], [575, 255, 0], [705, 255, 0], [835, 255, 0],
  [250, 195, 1], [380, 195, 1], [510, 195, 1], [640, 195, 1], [770, 195, 1],
  [250, 315, 1], [380, 315, 1], [510, 315, 1], [640, 315, 1], [770, 315, 1],
  [315, 255, 2], [445, 255, 2], [575, 255, 2], [705, 255, 2],
  [380, 195, 3], [510, 315, 3], [640, 195, 3], [770, 315, 3],
];

const barnPositions: Array<[number, number, number]> = [
  [185, 110, 0], [315, 110, 0], [445, 110, 0], [575, 110, 0], [705, 110, 0], [835, 110, 0],
  [185, 230, 0], [315, 230, 0], [445, 230, 0], [575, 230, 0], [705, 230, 0], [835, 230, 0],
  [185, 350, 0], [315, 350, 0], [445, 350, 0], [575, 350, 0], [705, 350, 0], [835, 350, 0],
  [250, 170, 1], [380, 170, 1], [510, 170, 1], [640, 170, 1], [770, 170, 1],
  [250, 290, 1], [380, 290, 1], [510, 290, 1], [640, 290, 1], [770, 290, 1],
  [315, 230, 2], [445, 230, 2], [575, 230, 2], [705, 230, 2],
  [380, 170, 3], [510, 290, 3], [640, 170, 3], [770, 290, 3],
];

export const levels: LevelDef[] = [
  {
    id: 1,
    name: '晨光草场',
    description: '少量叠层，适合熟悉卡槽消除节奏。',
    tiles: makeTiles(1, meadowPositions),
  },
  {
    id: 2,
    name: '奶香小路',
    description: '更多覆盖关系，注意先清理顶层。',
    tiles: makeTiles(2, dairyPositions),
  },
  {
    id: 3,
    name: '暖黄谷仓',
    description: '三层以上的牧场挑战原型关。',
    tiles: makeTiles(3, barnPositions),
  },
];

export const allIcons = icons;
