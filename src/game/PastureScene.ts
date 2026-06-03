import Phaser from 'phaser';
import { iconUrls } from './iconUrls';
import type { IconId, LevelDef, TileDef } from './levels';

type TileSprite = Phaser.GameObjects.Container & {
  tileId: string;
  icon: IconId;
  layer: number;
  baseX: number;
  baseY: number;
  tileRect: Phaser.Geom.Rectangle;
  blocked: boolean;
};

type SlotItem = {
  sprite: TileSprite;
  icon: IconId;
};

const TILE_W = 96;
const TILE_H = 96;
const SLOT_SIZE = 86;
const SLOT_GAP = 12;
const SLOT_Y = 660;
const SLOT_START_X = 260;

export class PastureScene extends Phaser.Scene {
  private readonly level: LevelDef;
  private readonly onBack: () => void;
  private tiles = new Map<string, TileSprite>();
  private slotItems: SlotItem[] = [];
  private statusText?: Phaser.GameObjects.Text;
  private slotGraphics?: Phaser.GameObjects.Graphics;
  private locked = false;
  private ended = false;

  constructor(level: LevelDef, onBack: () => void) {
    super(`pasture-level-${level.id}-${Date.now()}`);
    this.level = level;
    this.onBack = onBack;
  }

  preload() {
    Object.entries(iconUrls).forEach(([key, url]) => {
      this.load.svg(`icon-${key}`, url, { width: 60, height: 60 });
    });
  }

  create() {
    this.createBackground();
    this.createHud();
    [...this.level.tiles]
      .sort((a, b) => a.layer - b.layer || a.y - b.y || a.x - b.x)
      .forEach((tile) => this.createTile(tile));
    this.refreshBlockState();
    this.drawSlots();
  }

  private createBackground() {
    this.add.rectangle(540, 360, 1080, 720, 0xfff8e7);
    this.add.rectangle(540, 420, 1040, 430, 0xdff6c4, 0.82).setStrokeStyle(4, 0xb8de85, 0.8);
    this.add.ellipse(210, 120, 160, 70, 0xffffff, 0.65);
    this.add.ellipse(890, 100, 190, 76, 0xffffff, 0.55);
    this.add.circle(930, 95, 42, 0xffd76a, 0.85);
    this.add.text(38, 24, `牛了个牛 · ${this.level.name}`, {
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      fontSize: '30px',
      color: '#3f5f36',
      fontStyle: 'bold',
    });
  }

  private createHud() {
    this.statusText = this.add.text(40, 70, '清掉所有牧场图块。卡槽满 7 格且未消除会失败。', {
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      fontSize: '18px',
      color: '#557248',
    });

    this.makeButton(790, 42, '重新开始', () => this.scene.restart());
    this.makeButton(940, 42, '返回选关', () => this.onBack());
  }


  private roundedPanel(x: number, y: number, width: number, height: number, radius: number, fill: number, alpha = 1, stroke?: number, lineWidth = 0) {
    const graphics = this.add.graphics();
    return this.paintRoundedPanel(graphics, x, y, width, height, radius, fill, alpha, stroke, lineWidth);
  }

  private paintRoundedPanel(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, radius: number, fill: number, alpha = 1, stroke?: number, lineWidth = 0) {
    graphics.clear();
    graphics.fillStyle(fill, alpha);
    graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);
    if (stroke !== undefined && lineWidth > 0) {
      graphics.lineStyle(lineWidth, stroke, 1);
      graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, radius);
    }
    return graphics;
  }

  private makeButton(x: number, y: number, label: string, action: () => void) {
    const group = this.add.container(x, y);
    const bg = this.roundedPanel(0, 0, 126, 44, 16, 0xffffff, 1, 0x8acb66, 3);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      fontSize: '17px',
      color: '#3f6d34',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    group.add([bg, text]);
    group.setSize(126, 44).setInteractive({ useHandCursor: true });
    group.on('pointerover', () => this.paintRoundedPanel(bg, 0, 0, 126, 44, 16, 0xf0ffe7, 1, 0x8acb66, 3));
    group.on('pointerout', () => this.paintRoundedPanel(bg, 0, 0, 126, 44, 16, 0xffffff, 1, 0x8acb66, 3));
    group.on('pointerup', action);
  }

  private createTile(tile: TileDef) {
    const container = this.add.container(tile.x, tile.y) as TileSprite;
    container.tileId = tile.id;
    container.icon = tile.icon;
    container.layer = tile.layer;
    container.baseX = tile.x;
    container.baseY = tile.y;
    container.tileRect = new Phaser.Geom.Rectangle(tile.x - TILE_W / 2, tile.y - TILE_H / 2, TILE_W, TILE_H);
    container.blocked = false;

    const shadow = this.roundedPanel(6, 8, TILE_W, TILE_H, 20, 0x6b7a55, 0.18);
    const face = this.roundedPanel(0, 0, TILE_W, TILE_H, 20, 0xfffbef, 1, 0xffffff, 4);
    const icon = this.add.image(0, -3, `icon-${tile.icon}`).setDisplaySize(62, 62);
    const badge = this.add.text(28, 31, `${tile.layer + 1}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#6b8b4f',
      backgroundColor: '#efffdd',
      padding: { x: 6, y: 2 },
    }).setOrigin(0.5);

    container.add([shadow, face, icon, badge]);
    container.setDepth(tile.layer * 100 + tile.y);
    container.setSize(TILE_W, TILE_H).setInteractive({ useHandCursor: true });
    container.on('pointerup', () => this.handleTileClick(container));
    this.tiles.set(tile.id, container);
  }

  private handleTileClick(tile: TileSprite) {
    if (this.locked || this.ended || tile.blocked || !this.tiles.has(tile.tileId)) return;
    this.locked = true;
    this.tiles.delete(tile.tileId);
    tile.disableInteractive();
    this.slotItems.push({ sprite: tile, icon: tile.icon });
    const index = this.slotItems.length - 1;
    const targetX = SLOT_START_X + index * (SLOT_SIZE + SLOT_GAP);

    this.tweens.add({
      targets: tile,
      x: targetX,
      y: SLOT_Y,
      scale: 0.82,
      angle: 0,
      duration: 260,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.compactSlots(() => {
          this.resolveMatches();
          this.refreshBlockState();
          this.checkEndState();
          this.locked = false;
        });
      },
    });
  }

  private resolveMatches() {
    const byIcon = new Map<IconId, SlotItem[]>();
    this.slotItems.forEach((item) => {
      byIcon.set(item.icon, [...(byIcon.get(item.icon) ?? []), item]);
    });

    const matched = [...byIcon.values()].find((items) => items.length >= 3)?.slice(0, 3);
    if (!matched) return;

    this.slotItems = this.slotItems.filter((item) => !matched.includes(item));
    matched.forEach((item, index) => {
      this.tweens.add({
        targets: item.sprite,
        scale: 0,
        alpha: 0,
        angle: index % 2 === 0 ? 18 : -18,
        duration: 280,
        ease: 'Cubic.easeIn',
        onComplete: () => item.sprite.destroy(),
      });
    });
    this.time.delayedCall(300, () => this.compactSlots());
  }

  private compactSlots(done?: () => void) {
    this.drawSlots();
    if (this.slotItems.length === 0) {
      done?.();
      return;
    }

    let remaining = this.slotItems.length;
    this.slotItems.forEach((item, index) => {
      this.tweens.add({
        targets: item.sprite,
        x: SLOT_START_X + index * (SLOT_SIZE + SLOT_GAP),
        y: SLOT_Y,
        duration: 150,
        ease: 'Sine.easeOut',
        onComplete: () => {
          remaining -= 1;
          if (remaining === 0) done?.();
        },
      });
    });
  }

  private refreshBlockState() {
    const remaining = [...this.tiles.values()];
    remaining.forEach((tile) => {
      tile.blocked = remaining.some((other) => other.layer > tile.layer && Phaser.Geom.Intersects.RectangleToRectangle(tile.tileRect, other.tileRect));
      tile.setAlpha(tile.blocked ? 0.58 : 1);
      tile.setScale(tile.blocked ? 0.96 : 1);
    });
  }

  private checkEndState() {
    if (this.tiles.size === 0 && this.slotItems.length === 0) {
      this.endGame(true);
      return;
    }
    if (this.slotItems.length >= 7) {
      this.endGame(false);
    }
  }

  private endGame(won: boolean) {
    this.ended = true;
    const message = won ? '胜利！牧场图块全部收集完成。' : '失败！卡槽已满，先试试别的点击顺序。';
    this.statusText?.setText(message);
    this.roundedPanel(540, 360, 560, 180, 26, 0xffffff, 0.9, won ? 0x8acb66 : 0xff9f6e, 5);
    this.add.text(540, 340, won ? '牧场大成功' : '卡槽挤满啦', {
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      fontSize: '36px',
      color: won ? '#3f7d35' : '#b55b31',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(540, 392, message, {
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      fontSize: '20px',
      color: '#557248',
    }).setOrigin(0.5);
  }

  private drawSlots() {
    this.slotGraphics?.destroy();
    this.slotGraphics = this.add.graphics().setDepth(5000);
    this.slotGraphics.fillStyle(0xffffff, 0.7);
    this.slotGraphics.fillRoundedRect(215, 603, 710, 120, 24);
    this.slotGraphics.lineStyle(4, 0x9cd47b, 1);
    this.slotGraphics.strokeRoundedRect(215, 603, 710, 120, 24);
    for (let i = 0; i < 7; i += 1) {
      const x = SLOT_START_X + i * (SLOT_SIZE + SLOT_GAP);
      this.slotGraphics.fillStyle(0xeaf8ff, 0.9);
      this.slotGraphics.fillRoundedRect(x - SLOT_SIZE / 2, SLOT_Y - SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 18);
      this.slotGraphics.lineStyle(2, 0xb7dff3, 1);
      this.slotGraphics.strokeRoundedRect(x - SLOT_SIZE / 2, SLOT_Y - SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 18);
    }
    this.slotGraphics.setDepth(10);
    this.slotItems.forEach((item) => item.sprite.setDepth(20));
  }
}
