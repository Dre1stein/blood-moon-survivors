import Phaser from 'phaser';
import { CharacterData } from '../data/CharacterData';
import { PLAYER_CONFIG, PLAYER_HP, WORLD, XP_CONFIG } from '../constants';
import { PassiveSystem } from '../systems/PassiveSystem';
import { EquipmentStatName, FacingDirection, PassiveType, StatType } from '../types';

const _tempVec = new Phaser.Math.Vector2();

type MovementKeys = {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors?: MovementKeys;
  private lastPressedDirection = FacingDirection.Down;
  private isDead = false;
  private speedBonus = 0;
  private damageBonus = 0;
  private equipmentDamageBonus = 0;
  private speedMultiplierBonus = 1;
  private damageMultiplierBonus = 1;
  private pickupRangeMultiplierBonus = 1;
  private critChanceBonus = 0;
  private hpRegenBonus = 0;
  private passiveSpeedMultiplier = 1;
  private passiveDamageMultiplier = 1;
  private passiveCritChance = 0;
  private passiveHpRegenRate = 0;
  private equipmentCritBonus = 0;
  private equipmentHpRegenBonus = 0;
  private passiveArmorBonus = 0;
  private passivePickupRangeMultiplier = 1;
  private passiveXpMultiplier = 1;
  private passiveCooldownMultiplier = 1;
  private passiveLifeStealPercent = 0;
  private selectedCharacter?: CharacterData;

  facing = FacingDirection.Idle;
  hp: number = PLAYER_HP.MAX;
  maxHp: number = PLAYER_HP.MAX;
  speed: number = PLAYER_CONFIG.SPEED;
  pickupRange: number = XP_CONFIG.PICKUP_RANGE;
  damage: number = 1;
  critChance: number = 0;
  hpRegenRate: number = 0;
  armor: number = 0;
  critDamageMultiplier: number = 1;
  cooldownMultiplier: number = 1;
  meleeDamageMultiplier: number = 1;
  rangedDamageMultiplier: number = 1;
  isInvincible = false;
  invincibleTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5);
  }

  init(x: number, y: number): void {
    this.setPosition(x, y);
    this.cursors = this.scene.input.keyboard?.addKeys('W,A,S,D') as MovementKeys | undefined;
    this.facing = FacingDirection.Idle;
    this.lastPressedDirection = FacingDirection.Down;
    this.hp = PLAYER_HP.MAX;
    this.maxHp = PLAYER_HP.MAX;
    this.speed = PLAYER_CONFIG.SPEED;
    this.pickupRange = XP_CONFIG.PICKUP_RANGE;
    this.damage = 1;
    this.critChance = 0;
    this.hpRegenRate = 0;
    this.armor = 0;
    this.critDamageMultiplier = 1;
    this.cooldownMultiplier = 1;
    this.meleeDamageMultiplier = 1;
    this.rangedDamageMultiplier = 1;
    this.speedBonus = 0;
    this.damageBonus = 0;
    this.equipmentDamageBonus = 0;
    this.speedMultiplierBonus = 1;
    this.damageMultiplierBonus = 1;
    this.pickupRangeMultiplierBonus = 1;
    this.critChanceBonus = 0;
    this.hpRegenBonus = 0;
    this.passiveSpeedMultiplier = 1;
    this.passiveDamageMultiplier = 1;
    this.passiveCritChance = 0;
    this.passiveHpRegenRate = 0;
    this.equipmentCritBonus = 0;
    this.equipmentHpRegenBonus = 0;
    this.passiveArmorBonus = 0;
    this.passivePickupRangeMultiplier = 1;
    this.passiveXpMultiplier = 1;
    this.passiveCooldownMultiplier = 1;
    this.passiveLifeStealPercent = 0;
    this.isInvincible = false;
    this.invincibleTimer = 0;
    this.isDead = false;
    this.clearTint();
    this.setAlpha(1);
  }

  update(delta: number): void {
    const body = this.body;

    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      return;
    }

    this.updateInvincibility();
    this.updateHpRegen(delta);

    if (this.isDead) {
      body.setVelocity(0, 0);
      return;
    }

    if (!this.cursors) {
      return;
    }

    const left = this.cursors.A.isDown;
    const right = this.cursors.D.isDown;
    const up = this.cursors.W.isDown;
    const down = this.cursors.S.isDown;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.W)) {
      this.lastPressedDirection = FacingDirection.Up;
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.S)) {
      this.lastPressedDirection = FacingDirection.Down;
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.A)) {
      this.lastPressedDirection = FacingDirection.Left;
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.D)) {
      this.lastPressedDirection = FacingDirection.Right;
    }

    const horizontal = Number(right) - Number(left);
    const vertical = Number(down) - Number(up);

    if (horizontal === 0 && vertical === 0) {
      body.setVelocity(0, 0);
      this.facing = FacingDirection.Idle;
      this.clampToWorld();
      return;
    }

    const velocity = _tempVec.set(horizontal, vertical)
      .normalize()
      .scale(this.speed);

    body.setVelocity(velocity.x, velocity.y);
    this.facing = this.resolveFacing({ left, right, up, down, horizontal, vertical });
    this.clampToWorld();
  }

  static fromScene(scene: Phaser.Scene, x: number, y: number): Player {
    const player = new Player(scene, x, y, 'player');
    player.init(x, y);
    return player;
  }

  takeDamage(amount: number): void {
    if (this.isInvincible || this.isDead) {
      return;
    }

    amount = Math.max(1, amount - this.armor);
    this.hp = Math.max(0, this.hp - amount);
    this.isInvincible = true;
    this.invincibleTimer = this.scene.time.now + PLAYER_HP.INVINCIBILITY_MS;
    this.setTint(PLAYER_HP.HIT_FLASH_COLOR);
    this.setAlpha(0.5);

    if (this.hp <= 0) {
      this.die();
      this.scene.events.emit('player-died');
    }
  }

  heal(amount: number): void {
    if (this.isDead) {
      return;
    }

    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  applyStatBoost(stat: StatType): void {
    switch (stat) {
      case StatType.MaxHp:
        this.maxHp += 10;
        this.heal(10);
        break;
      case StatType.Speed:
        this.speedBonus += 15;
        this.recalculateSpeed();
        break;
      case StatType.PickupRange:
        this.pickupRange += 15;
        break;
      case StatType.Damage:
        this.damageBonus += 0.15;
        this.recalculateDamage();
        break;
    }
  }

  applyPassive(type: PassiveType, passiveSystem: PassiveSystem): void {
    switch (type) {
      case PassiveType.MoveSpeed:
        this.passiveSpeedMultiplier = passiveSystem.getMoveSpeedMultiplier();
        this.recalculateSpeed();
        break;
      case PassiveType.HpRegen:
        this.passiveHpRegenRate = passiveSystem.getHpRegenPerSecond();
        this.recalculateHpRegen();
        break;
      case PassiveType.DamageBonus:
        this.passiveDamageMultiplier = passiveSystem.getDamageMultiplier();
        this.recalculateDamage();
        break;
      case PassiveType.CritChance:
        this.passiveCritChance = passiveSystem.getCritChance();
        this.recalculateCritChance();
        break;
      case PassiveType.PickupRange:
        this.passivePickupRangeMultiplier = passiveSystem.getPickupRangeMultiplier();
        this.recalculatePickupRange();
        break;
      case PassiveType.Armor:
        this.passiveArmorBonus = passiveSystem.getArmorBonus();
        this.recalculateArmor();
        break;
      case PassiveType.XpBoost:
        this.passiveXpMultiplier = passiveSystem.getXpMultiplier();
        break;
      case PassiveType.CooldownReduction:
        this.passiveCooldownMultiplier = passiveSystem.getCooldownMultiplier();
        this.recalculateCooldown();
        break;
      case PassiveType.LifeSteal:
        this.passiveLifeStealPercent = passiveSystem.getLifeStealPercent();
        break;
    }
  }

  applyEquipmentBonus(statName: EquipmentStatName, amount: number): void {
    switch (statName) {
      case 'damage':
        this.equipmentDamageBonus += amount;
        this.recalculateDamage();
        break;
      case 'maxHp':
        this.maxHp = Math.max(1, this.maxHp + amount);

        if (amount > 0) {
          this.hp = Phaser.Math.Clamp(this.hp + amount, 0, this.maxHp);
        } else {
          this.hp = Math.min(this.hp, this.maxHp);
        }
        break;
      case 'hpRegen':
        this.equipmentHpRegenBonus += amount;
        this.recalculateHpRegen();
        break;
      case 'critChance':
        this.equipmentCritBonus += amount;
        this.recalculateCritChance();
        break;
    }
  }

  applyCharacter(character: CharacterData): void {
    this.selectedCharacter = character;
    const { bonuses } = character;

    if (bonuses.speedMultiplier !== undefined) {
      this.speedMultiplierBonus *= bonuses.speedMultiplier;
      this.recalculateSpeed();
    }

    if (bonuses.damageMultiplier !== undefined) {
      this.damageMultiplierBonus *= bonuses.damageMultiplier;
      this.recalculateDamage();
    }

    if (bonuses.maxHpBonus !== undefined) {
      this.maxHp += bonuses.maxHpBonus;
    }

    if (bonuses.pickupRangeMultiplier !== undefined) {
      this.pickupRangeMultiplierBonus *= bonuses.pickupRangeMultiplier;
      this.recalculatePickupRange();
    }

    if (bonuses.armor !== undefined) {
      this.armor = bonuses.armor;
    }

    if (bonuses.cooldownMultiplier !== undefined) {
      this.cooldownMultiplier = bonuses.cooldownMultiplier;
    }

    if (bonuses.meleeDamageMultiplier !== undefined) {
      this.meleeDamageMultiplier = bonuses.meleeDamageMultiplier;
    }

    if (bonuses.rangedDamageMultiplier !== undefined) {
      this.rangedDamageMultiplier = bonuses.rangedDamageMultiplier;
    }

    this.hp = this.maxHp;
  }

  calculateDamage(baseDamage: number, damageType: 'melee' | 'ranged' = 'ranged'): number {
    const critMultiplier = Math.random() < this.critChance ? 0.5 + this.critDamageMultiplier : 1;
    const typeMultiplier = damageType === 'melee' ? this.meleeDamageMultiplier : this.rangedDamageMultiplier;
    return baseDamage * this.damage * typeMultiplier * critMultiplier;
  }

  grantInvincibility(seconds: number): void {
    if (seconds <= 0 || this.isDead) {
      return;
    }

    this.isInvincible = true;
    this.invincibleTimer = this.scene.time.now + seconds * 1000;
    this.setTint(PLAYER_HP.HIT_FLASH_COLOR);
    this.setAlpha(0.75);
  }

  calculateCooldown(baseCooldown: number): number {
    return baseCooldown * this.cooldownMultiplier;
  }

  getXpMultiplier(): number {
    return this.passiveXpMultiplier;
  }

  getLifeStealPercent(): number {
    return this.passiveLifeStealPercent;
  }

  applySpeedMultiplier(multiplier: number): void {
    if (multiplier <= 0) {
      return;
    }

    this.speedMultiplierBonus *= multiplier;
    this.recalculateSpeed();
  }

  applyDamageMultiplier(multiplier: number): void {
    if (multiplier <= 0) {
      return;
    }

    this.damageMultiplierBonus *= multiplier;
    this.recalculateDamage();
  }

  applyPickupRangeMultiplier(multiplier: number): void {
    if (multiplier <= 0) {
      return;
    }

    this.pickupRangeMultiplierBonus *= multiplier;
    this.recalculatePickupRange();
  }

  addCritChanceBonus(amount: number): void {
    this.critChanceBonus += amount;
    this.recalculateCritChance();
  }

  addHpRegenBonus(amount: number): void {
    this.hpRegenBonus += amount;
    this.recalculateHpRegen();
  }

  private resolveFacing(input: {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    horizontal: number;
    vertical: number;
  }): FacingDirection {
    if (this.isDirectionActive(this.lastPressedDirection, input)) {
      return this.lastPressedDirection;
    }

    if (input.horizontal < 0) {
      return FacingDirection.Left;
    }

    if (input.horizontal > 0) {
      return FacingDirection.Right;
    }

    if (input.vertical < 0) {
      return FacingDirection.Up;
    }

    return FacingDirection.Down;
  }

  private isDirectionActive(
    direction: FacingDirection,
    input: { left: boolean; right: boolean; up: boolean; down: boolean }
  ): boolean {
    switch (direction) {
      case FacingDirection.Left:
        return input.left;
      case FacingDirection.Right:
        return input.right;
      case FacingDirection.Up:
        return input.up;
      case FacingDirection.Down:
        return input.down;
      case FacingDirection.Idle:
        return false;
    }
  }

  private clampToWorld(): void {
    const halfWidth = this.displayWidth * 0.5;
    const halfHeight = this.displayHeight * 0.5;

    this.x = Phaser.Math.Clamp(this.x, halfWidth, WORLD.WIDTH - halfWidth);
    this.y = Phaser.Math.Clamp(this.y, halfHeight, WORLD.HEIGHT - halfHeight);
  }

  private die(): void {
    const body = this.body;

    this.isDead = true;
    this.isInvincible = false;
    this.invincibleTimer = 0;
    this.cursors = undefined;
    this.setAlpha(1);
    this.setTint(0x660000);

    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.setVelocity(0, 0);
    }
  }

  private updateInvincibility(): void {
    if (!this.isInvincible) {
      return;
    }

    if (this.scene.time.now >= this.invincibleTimer) {
      this.isInvincible = false;
      this.invincibleTimer = 0;

      if (!this.isDead) {
        this.clearTint();
      }

      this.setAlpha(1);
      return;
    }

    this.setTint(PLAYER_HP.HIT_FLASH_COLOR);
    this.setAlpha(Math.floor(this.scene.time.now / 100) % 2 === 0 ? 0.35 : 0.75);
  }

  private updateHpRegen(delta: number): void {
    if (this.isDead || this.hpRegenRate <= 0 || this.hp >= this.maxHp) {
      return;
    }

    this.hp = Math.min(this.maxHp, this.hp + this.hpRegenRate * (delta / 1000));
  }

  private recalculateSpeed(): void {
    this.speed = (PLAYER_CONFIG.SPEED + this.speedBonus) * this.speedMultiplierBonus * this.passiveSpeedMultiplier;
  }

  private recalculateDamage(): void {
    this.damage = (1 + this.damageBonus + this.equipmentDamageBonus) * this.damageMultiplierBonus * this.passiveDamageMultiplier;
  }

  private recalculateCritChance(): void {
    this.critChance = this.passiveCritChance + this.equipmentCritBonus + this.critChanceBonus;
  }

  private recalculateHpRegen(): void {
    this.hpRegenRate = this.passiveHpRegenRate + this.equipmentHpRegenBonus + this.hpRegenBonus;
  }

  private recalculatePickupRange(): void {
    this.pickupRange = XP_CONFIG.PICKUP_RANGE * this.pickupRangeMultiplierBonus * this.passivePickupRangeMultiplier;
  }

  private recalculateArmor(): void {
    this.armor = (this.selectedCharacter?.bonuses?.armor ?? 0) + this.passiveArmorBonus;
  }

  private recalculateCooldown(): void {
    this.cooldownMultiplier = (this.selectedCharacter?.bonuses?.cooldownMultiplier ?? 1) * this.passiveCooldownMultiplier;
  }
}
