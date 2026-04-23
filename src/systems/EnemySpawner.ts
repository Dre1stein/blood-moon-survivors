import Phaser from 'phaser';
import { BOSS_CONFIG, ELITE_CONFIG, ENEMY_CONFIG, WORLD } from '../constants';
import { GAME_MAP_MAP, GameMap } from '../data/MapData';
import { Boss } from '../entities/Boss';
import { Enemy } from '../entities/Enemy';
import { EliteEnemy } from '../entities/EliteEnemy';
import { GameScene } from '../scenes/GameScene';

export class EnemySpawner {
  private readonly scene: GameScene;
  private readonly group: Phaser.Physics.Arcade.Group;
  private spawnEvent?: Phaser.Time.TimerEvent;
  private eliteSpawnEvent?: Phaser.Time.TimerEvent;
  private bossSpawnEvent?: Phaser.Time.TimerEvent;
  private aliveCount = 0;
  private bossesSpawned = 0;
  private bossAlive = false;
  private mapConfig: GameMap = GAME_MAP_MAP['cursed-village'];

  constructor(scene: GameScene) {
    this.scene = scene;
    this.group = this.scene.physics.add.group();
    this.scene.events.on('boss-killed', this.handleBossKilled, this);
  }

  start(): void {
    this.spawnEvent?.remove(false);
    this.spawnEvent = this.scene.time.addEvent({
      delay: ENEMY_CONFIG.SPAWN_INTERVAL / this.mapConfig.enemySpawnRateMultiplier,
      loop: true,
      callback: () => {
        if (this.aliveCount >= ENEMY_CONFIG.MAX_ENEMIES) {
          return;
        }

        const enemy = this.spawnEnemy();
        this.group.add(enemy);
        this.aliveCount += 1;
      },
    });

    this.eliteSpawnEvent?.remove(false);
    this.eliteSpawnEvent = this.scene.time.addEvent({
      delay: ELITE_CONFIG.SPAWN_INTERVAL * this.mapConfig.eliteIntervalMultiplier,
      loop: true,
      callback: () => {
        const enemy = this.spawnEliteEnemy();
        this.group.add(enemy);
      },
    });

    this.bossSpawnEvent?.remove(false);
    this.bossSpawnEvent = this.scene.time.addEvent({
      delay: BOSS_CONFIG.SPAWN_INTERVAL * this.mapConfig.bossIntervalMultiplier,
      loop: true,
      callback: () => {
        if (this.bossAlive) {
          return;
        }

        const boss = this.spawnBoss();
        this.group.add(boss);
        this.bossAlive = true;
        this.bossesSpawned += 1;
        this.scene.cameras.main.shake(300, 0.008);
      },
    });
  }

  stop(): void {
    this.spawnEvent?.remove(false);
    this.spawnEvent = undefined;
    this.eliteSpawnEvent?.remove(false);
    this.eliteSpawnEvent = undefined;
    this.bossSpawnEvent?.remove(false);
    this.bossSpawnEvent = undefined;

    this.group.children.each((child) => {
      const enemy = child as Enemy;
      const body = enemy.body;

      if (enemy.active && body instanceof Phaser.Physics.Arcade.Body) {
        body.setVelocity(0, 0);
      }

      return true;
    });
  }

  getGroup(): Phaser.Physics.Arcade.Group {
    return this.group;
  }

  destroy(): void {
    this.stop();
    this.scene.events.off('boss-killed', this.handleBossKilled, this);
  }

  setMapConfig(map: GameMap): void {
    this.mapConfig = map;
  }

  update(playerX: number, playerY: number): void {
    this.aliveCount = 0;

    this.group.children.each((child) => {
      const enemy = child as Enemy;

      if (!enemy.active) {
        this.group.remove(enemy, false, false);
        return true;
      }

      if (!enemy.isAlive) {
        return true;
      }

      this.aliveCount += 1;
      enemy.update(playerX, playerY);
      return true;
    });
  }

  private spawnEnemy(): Enemy {
    const margin = Math.max(ENEMY_CONFIG.WIDTH, ENEMY_CONFIG.HEIGHT);
    const edge = Phaser.Math.Between(0, 3);
    const enemy = (() => {
      switch (edge) {
        case 0:
          return Enemy.fromScene(this.scene, Phaser.Math.Between(0, WORLD.WIDTH), -margin);
        case 1:
          return Enemy.fromScene(this.scene, WORLD.WIDTH + margin, Phaser.Math.Between(0, WORLD.HEIGHT));
        case 2:
          return Enemy.fromScene(this.scene, Phaser.Math.Between(0, WORLD.WIDTH), WORLD.HEIGHT + margin);
        default:
          return Enemy.fromScene(this.scene, -margin, Phaser.Math.Between(0, WORLD.HEIGHT));
      }
    })();

    enemy.hp = Math.max(1, Math.round(enemy.hp * this.mapConfig.enemyHpMultiplier));
    enemy.baseSpeed *= this.mapConfig.enemySpeedMultiplier;
    enemy.speed = enemy.baseSpeed;
    return enemy;
  }

  private spawnEliteEnemy(): EliteEnemy {
    const margin = ELITE_CONFIG.SIZE;
    const edge = Phaser.Math.Between(0, 3);
    const enemy = (() => {
      switch (edge) {
        case 0:
          return EliteEnemy.fromScene(this.scene, Phaser.Math.Between(0, WORLD.WIDTH), -margin);
        case 1:
          return EliteEnemy.fromScene(this.scene, WORLD.WIDTH + margin, Phaser.Math.Between(0, WORLD.HEIGHT));
        case 2:
          return EliteEnemy.fromScene(this.scene, Phaser.Math.Between(0, WORLD.WIDTH), WORLD.HEIGHT + margin);
        default:
          return EliteEnemy.fromScene(this.scene, -margin, Phaser.Math.Between(0, WORLD.HEIGHT));
      }
    })();

    enemy.hp = Math.max(1, Math.round(enemy.hp * this.mapConfig.enemyHpMultiplier));
    enemy.baseSpeed *= this.mapConfig.enemySpeedMultiplier;
    enemy.speed = enemy.baseSpeed;
    return enemy;
  }

  private spawnBoss(): Boss {
    const edge = Phaser.Math.Between(0, 3);
    const bossIndex = this.resolveBossIndex();
    const size = BOSS_CONFIG.TYPES[bossIndex].size;
    const boss = (() => {
      switch (edge) {
        case 0:
          return Boss.fromScene(this.scene, WORLD.WIDTH * 0.5, -size, bossIndex);
        case 1:
          return Boss.fromScene(this.scene, WORLD.WIDTH + size, WORLD.HEIGHT * 0.5, bossIndex);
        case 2:
          return Boss.fromScene(this.scene, WORLD.WIDTH * 0.5, WORLD.HEIGHT + size, bossIndex);
        default:
          return Boss.fromScene(this.scene, -size, WORLD.HEIGHT * 0.5, bossIndex);
      }
    })();

    boss.hp = Math.max(1, Math.round(boss.hp * this.mapConfig.enemyHpMultiplier));
    boss.baseSpeed *= this.mapConfig.enemySpeedMultiplier;
    boss.speed = boss.baseSpeed;
    return boss;
  }

  private resolveBossIndex(): number {
    if (this.bossesSpawned <= 0) {
      return 0;
    }

    if (this.bossesSpawned === 1) {
      return 1;
    }

    return 2;
  }

  private handleBossKilled(): void {
    this.bossAlive = false;
  }
}
