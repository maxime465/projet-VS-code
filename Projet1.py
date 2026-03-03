<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Jeu Phaser 3 avec tir et cibles</title>
    <script src="//cdn.jsdelivr.net/npm/phaser@3.50.0/dist/phaser.js"></script>
    <style>
      body { margin: 0; }
    </style>
  </head>
  <body>
    <script>
      var config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        physics: {
          default: "arcade",
          arcade: { gravity: { y: 300 }, debug: true }
        },
        scene: { preload: preload, create: create, update: update }
      };

      var game = new Phaser.Game(config);

      var player;
      var platforms;
      var cursors;
      var boutonFeu;
      var groupeBullets;
      var groupeCibles;

      function preload() {
        this.load.image("sky", "assets/sky.png");
        this.load.image("ground", "assets/platform.png");
        this.load.image("star", "assets/star.png");
        this.load.image("bomb", "assets/bomb.png");
        this.load.image("bullet", "assets/balle.png");
        this.load.image("cible", "assets/cible.png");
        this.load.spritesheet("dude", "assets/dude.png", { frameWidth: 32, frameHeight: 48 });
      }

      function create() {
        this.add.image(400, 300, "sky");

        platforms = this.physics.add.staticGroup();
        platforms.create(400, 568, "ground").setScale(2).refreshBody();
        platforms.create(600, 400, "ground");
        platforms.create(50, 250, "ground");
        platforms.create(750, 220, "ground");

        // Création du joueur
        player = this.physics.add.sprite(100, 450, "dude");
        player.setBounce(0.3);
        player.setCollideWorldBounds(true);
        player.direction = 'right'; // direction par défaut
        this.physics.add.collider(player, platforms);

        // Animations du joueur
        this.anims.create({ key: "left", frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: "turn", frames: [{ key: "dude", frame: 4 }], frameRate: 20 });
        this.anims.create({ key: "right", frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }), frameRate: 10, repeat: -1 });

        cursors = this.input.keyboard.createCursorKeys();
        boutonFeu = this.input.keyboard.addKey('A');

        // Groupe de balles
        groupeBullets = this.physics.add.group();

        // Groupe de cibles
        groupeCibles = this.physics.add.group({
          key: 'cible',
          repeat: 7,
          setXY: { x: 24, y: 0, stepX: 107 }
        });

        // Paramètres des cibles
        groupeCibles.children.iterate(function (cibleTrouvee) {
          cibleTrouvee.pointsVie = Phaser.Math.Between(1, 5);
          cibleTrouvee.y = Phaser.Math.Between(10, 250);
          cibleTrouvee.setBounce(1);
        });

        // Collisions
        this.physics.add.collider(groupeCibles, platforms);
        this.physics.add.overlap(groupeBullets, groupeCibles, hit, null, this);

        // Détection des balles hors du monde
        this.physics.world.on("worldbounds", function(body) {
          var objet = body.gameObject;
          if (groupeBullets.contains(objet)) {
            objet.destroy();
          }
        });
      }

      function update() {
        // Déplacement joueur et mise à jour direction
        if (cursors.left.isDown) {
          player.direction = 'left';
          player.setVelocityX(-160);
          player.anims.play("left", true);
        } else if (cursors.right.isDown) {
          player.direction = 'right';
          player.setVelocityX(160);
          player.anims.play("right", true);
        } else {
          player.setVelocityX(0);
          player.anims.play("turn");
        }
        if (cursors.up.isDown && player.body.touching.down) {
          player.setVelocityY(-330);
        }

        // Tir
        if (Phaser.Input.Keyboard.JustDown(boutonFeu)) {
          tirer(player);
        }
      }

      function tirer(player) {
        var coefDir = (player.direction === 'left') ? -1 : 1;
        var bullet = groupeBullets.create(player.x + (25 * coefDir), player.y - 4, 'bullet');
        bullet.body.allowGravity = false;
        bullet.setVelocity(1000 * coefDir, 0);
        bullet.setCollideWorldBounds(true);
        bullet.body.onWorldBounds = true;
      }

      function hit(bullet, cible) {
        cible.pointsVie--;
        if (cible.pointsVie === 0) {
          cible.destroy();
        }
        bullet.destroy();
      }
    </script>
  </body>
</html>