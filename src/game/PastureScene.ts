import * as Phaser from 'phaser';
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
const BOARD_DEPTH = 100;
const SLOT_DEPTH = 5000;
const MODAL_DEPTH = 9000;

export class PastureScene extends Phaser.Scene {
  private readonly level: LevelDef;
  private readonly onBack: () => void;
  private readonly onComplete: (level: LevelDef) => void;
  private readonly onNextLevel?: () => void;
  private tiles = new Map<string, TileSprite>();
  private slotItems: SlotItem[] = [];
  private statusText?: Phaser.GameObjects.Text;
  private remainingText?: Phaser.GameObjects.Text;
  private slotCountText?: Phaser.GameObjects.Text;
  private slotGraphics?: Phaser.GameObjects.Graphics;
  private locked = false;
  private ended = false;
  private iconObjectUrls: string[] = [];

  constructor(level: LevelDef, onBack: () => void, onComplete: (level: LevelDef) => void, onNextLevel?: () => void) {
    super(`pasture-level-${level.id}-${Date.now()}`);
    this.level = level;
    this.onBack = onBack;
    this.onComplete = onComplete;
    this.onNextLevel = onNextLevel;
  }

  preload() {
    Object.entries(iconUrls).forEach(([key, url]) => {
      this.queueIconTextureLoad(key as IconId, url);
    });
    this.load.once('complete', () => this.revokeIconObjectUrls());
  }

  create() {
    this.ensureIconFallbackTextures();
    this.createBackground();
    this.createHud();
    [...this.level.tiles]
      .sort((a, b) => a.layer - b.layer || a.y - b.y || a.x - b.x)
      .forEach((tile) => this.createTile(tile));
    this.refreshBlockState();
    this.drawSlots();
    this.updateHud();
  }

  private createBackground() {
    this.add.rectangle(540, 360, 1080, 720, 0xfff8e7);
    this.add.rectangle(540, 418, 1040, 432, 0xdff6c4, 1).setStrokeStyle(4, 0xb8de85, 1);
    this.add.ellipse(210, 120, 160, 70, 0xffffff, 0.82);
    this.add.ellipse(890, 100, 190, 76, 0xffffff, 0.78);
    this.add.circle(930, 95, 42, 0xffd76a, 1);
    this.add.text(38, 22, `牛了个牛 · 第 ${this.level.id} 关 · ${this.level.name}`, {
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      fontSize: '30px',
      color: '#315e2b',
      fontStyle: 'bold',
    });
  }

  private createHud() {
    this.statusText = this.add.text(40, 68, '先点击没有被上层遮挡的图块，凑齐三枚相同图标即可消除。', {
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      fontSize: '18px',
      color: '#557248',
    });

    this.remainingText = this.add.text(40, 98, '', {
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      fontSize: '19px',
      color: '#315e2b',
      fontStyle: 'bold',
    });

    this.slotCountText = this.add.text(235, 98, '', {
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      fontSize: '19px',
      color: '#245d7e',
      fontStyle: 'bold',
    });

    this.makeButton(790, 42, '重新开始', () => this.scene.restart());
    this.makeButton(940, 42, '返回选关', () => this.onBack());
  }

  private queueIconTextureLoad(icon: IconId, source: string) {
    const loadUrl = this.getLoadableSvgUrl(source);
    if (!loadUrl) return;

    this.load.svg(`icon-${icon}`, loadUrl, { width: 60, height: 60 });
  }

  private getLoadableSvgUrl(source: string) {
    const trimmed = source.trim();

    if (trimmed.startsWith('<svg') || trimmed.startsWith('<?xml')) {
      return this.createSvgObjectUrl(trimmed);
    }

    if (!trimmed.startsWith('data:image/svg+xml')) {
      return trimmed;
    }

    const commaIndex = trimmed.indexOf(',');
    if (commaIndex === -1 || trimmed.slice(0, commaIndex).toLowerCase().includes(';base64')) {
      return undefined;
    }

    try {
      return this.createSvgObjectUrl(decodeURIComponent(trimmed.slice(commaIndex + 1)));
    } catch {
      return undefined;
    }
  }

  private createSvgObjectUrl(svgText: string) {
    const objectUrl = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
    this.iconObjectUrls.push(objectUrl);
    return objectUrl;
  }

  private revokeIconObjectUrls() {
    this.iconObjectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    this.iconObjectUrls = [];
  }

  private ensureIconFallbackTextures() {
    Object.keys(iconUrls).forEach((icon) => {
      const textureKey = `icon-${icon}`;
      if (!this.textures.exists(textureKey)) {
        this.createFallbackIconTexture(textureKey, icon);
      }
    });
  }

  private createFallbackIconTexture(textureKey: string, label: string) {
    const texture = this.textures.createCanvas(textureKey, 60, 60);
    if (!texture) return;

    const context = texture.getContext();
    context.fillStyle = '#f0ffe7';
    context.strokeStyle = '#8acb66';
    context.lineWidth = 4;
    context.fillRect(4, 4, 52, 52);
    context.strokeRect(4, 4, 52, 52);
    context.fillStyle = '#3f6d34';
    context.font = 'bold 22px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label.slice(0, 1).toUpperCase(), 30, 31);
    texture.refresh();
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

  private makeButton(x: number, y: number, label: string, action: () => void, width = 126) {
    const group = this.add.container(x, y).setDepth(MODAL_DEPTH + 1);
    const bg = this.roundedPanel(0, 0, width, 44, 16, 0xffffff, 1, 0x8acb66, 3);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      fontSize: '17px',
      color: '#3f6d34',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    group.add([bg, text]);
    group.setSize(width, 44).setInteractive({ useHandCursor: true });
    group.on('pointerover', () => this.paintRoundedPanel(bg, 0, 0, width, 44, 16, 0xf0ffe7, 1, 0x8acb66, 3));
    group.on('pointerout', () => this.paintRoundedPanel(bg, 0, 0, width, 44, 16, 0xffffff, 1, 0x8acb66, 3));
    group.on('pointerup', action);
    return group;
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

    const shadow = this.roundedPanel(5, 7, TILE_W - 4, TILE_H - 4, 18, 0x6b7a55, 0.22);
    const opaqueBase = this.add.rectangle(0, 0, TILE_W, TILE_H, 0xfffbef, 1);
    const face = this.roundedPanel(0, 0, TILE_W - 2, TILE_H - 2, 18, 0xfffbef, 1, 0x6fb15a, 2);
    const inner = this.roundedPanel(0, 0, TILE_W - 14, TILE_H - 14, 15, 0xffffff, 1, 0xffe7a6, 2);
    const icon = this.add.image(0, -3, `icon-${tile.icon}`).setDisplaySize(62, 62);
    const badge = this.add.text(28, 31, `${tile.layer + 1}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#315e2b',
      backgroundColor: '#efffdd',
      padding: { x: 6, y: 2 },
    }).setOrigin(0.5);

    container.add([shadow, opaqueBase, face, inner, icon, badge]);
    container.setDepth(BOARD_DEPTH + tile.layer * 1000 + tile.y);
    container.setSize(TILE_W, TILE_H).setInteractive({ useHandCursor: true });
    container.on('pointerup', () => this.handleTileClick(container));
    this.tiles.set(tile.id, container);
  }

  private handleTileClick(tile: TileSprite) {
    if (this.locked || this.ended || tile.blocked || !this.tiles.has(tile.tileId)) return;
    this.locked = true;
    this.tiles.delete(tile.tileId);
    tile.disableInteractive();
    tile.setDepth(SLOT_DEPTH + 20 + this.slotItems.length);
    this.slotItems.push({ sprite: tile, icon: tile.icon });
    const index = this.slotItems.length - 1;
    const targetX = SLOT_START_X + index * (SLOT_SIZE + SLOT_GAP);
    this.updateHud();

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
          this.updateHud();
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
    this.time.delayedCall(300, () => {
      this.compactSlots();
      this.updateHud();
      this.checkEndState();
    });
  }

  private compactSlots(done?: () => void) {
    this.drawSlots();
    if (this.slotItems.length === 0) {
      done?.();
      return;
    }

    let remaining = this.slotItems.length;
    this.slotItems.forEach((item, index) => {
      item.sprite.setDepth(SLOT_DEPTH + 20 + index);
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
      tile.setAlpha(1);
      tile.setScale(1);
      if (tile.blocked) {
        tile.disableInteractive();
      } else {
        tile.setInteractive({ useHandCursor: true });
      }
      tile.setDepth(BOARD_DEPTH + tile.layer * 1000 + tile.baseY);
    });
  }

  private updateHud() {
    this.remainingText?.setText(`剩余图块：${this.tiles.size}`);
    this.slotCountText?.setText(`卡槽：${this.slotItems.length}/7`);
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
    if (this.ended) return;
    this.ended = true;
    if (won) this.onComplete(this.level);

    const hasNext = won && this.onNextLevel !== undefined;
    const message = won
      ? hasNext
        ? '胜利！下一关已经解锁，继续沿牧场小路挑战吧。'
        : '胜利！已完成全部关卡。'
      : '失败！卡槽已满，先试试别的点击顺序。';
    this.statusText?.setText(message);

    this.roundedPanel(540, 360, 620, hasNext ? 236 : 220, 28, 0xffffff, 1, won ? 0x8acb66 : 0xff9f6e, 5).setDepth(MODAL_DEPTH);
    this.add.text(540, 316, won ? '牧场大成功' : '卡槽挤满啦', {
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      fontSize: '36px',
      color: won ? '#3f7d35' : '#b55b31',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(MODAL_DEPTH + 1);
    this.add.text(540, 366, message, {
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      fontSize: '20px',
      color: '#557248',
      align: 'center',
      wordWrap: { width: 520 },
    }).setOrigin(0.5).setDepth(MODAL_DEPTH + 1);

    if (hasNext) {
      this.makeButton(420, 430, '继续下一关', () => this.onNextLevel?.(), 150);
      this.makeButton(565, 430, '重新开始', () => this.scene.restart(), 126);
      this.makeButton(710, 430, '返回选关', () => this.onBack(), 126);
    } else {
      this.makeButton(465, 426, '重新开始', () => this.scene.restart(), 126);
      this.makeButton(615, 426, '返回选关', () => this.onBack(), 126);
    }
  }

  private drawSlots() {
    this.slotGraphics?.destroy();
    this.slotGraphics = this.add.graphics().setDepth(SLOT_DEPTH);
    this.slotGraphics.fillStyle(0xffffff, 1);
    this.slotGraphics.fillRoundedRect(215, 603, 710, 120, 24);
    this.slotGraphics.lineStyle(4, 0x9cd47b, 1);
    this.slotGraphics.strokeRoundedRect(215, 603, 710, 120, 24);
    for (let i = 0; i < 7; i += 1) {
      const x = SLOT_START_X + i * (SLOT_SIZE + SLOT_GAP);
      this.slotGraphics.fillStyle(0xeaf8ff, 1);
      this.slotGraphics.fillRoundedRect(x - SLOT_SIZE / 2, SLOT_Y - SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 18);
      this.slotGraphics.lineStyle(2, 0xb7dff3, 1);
      this.slotGraphics.strokeRoundedRect(x - SLOT_SIZE / 2, SLOT_Y - SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 18);
    }
    this.slotItems.forEach((item, index) => item.sprite.setDepth(SLOT_DEPTH + 20 + index));
  }
}
