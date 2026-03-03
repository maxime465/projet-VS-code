var groupe_plateformes;
var player;
var clavier;
var groupe_etoiles;
var groupe_bombes;
var groupeBullets;
var groupeCibles;
var boutonFeu;
var score = 0;
var nbBombes = 0;
var nbEtoiles;
var texteScore;
var texteEtoiles;
var texteBombes;
var texteGameOver;
var gameOver = false;

var config = {
    type: Phaser.AUTO,
    width: 800, 
    height: 600, 
    physics: {
        default: "arcade", 
        arcade: {
            gravity: { y: 300 },
            debug: false 
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

new Phaser.Game(config);

function preload() {
    this.load.image("img_ciel", "src/assets/sky.png");
    this.load.image("img_plateforme", "src/assets/platform.png");
    this.load.spritesheet("img_perso", "src/assets/dude.png", { frameWidth: 32, frameHeight: 48 });
    this.load.image("img_etoile", "src/assets/star.png");
    this.load.image("bomb", "src/assets/bomb.png");
    this.load.image("bullet", "src/assets/balle.png");
    this.load.image("cible", "src/assets/cible.png");
}

function create() {
    this.add.image(400, 300, "img_ciel");

    // plateformes
    groupe_plateformes = this.physics.add.staticGroup();
    groupe_plateformes.create(200, 584, "img_plateforme");
    groupe_plateformes.create(600, 584, "img_plateforme");
    groupe_plateformes.create(50, 300, "img_plateforme");
    groupe_plateformes.create(600, 450, "img_plateforme");
    groupe_plateformes.create(750, 270, "img_plateforme");

    // joueur
    player = this.physics.add.sprite(100, 450, "img_perso");
    player.setCollideWorldBounds(true);
    player.setBounce(0.2);
    player.direction = 'right'; // direction par défaut
    this.physics.add.collider(player, groupe_plateformes);

    // clavier
    clavier = this.input.keyboard.createCursorKeys();
    boutonFeu = this.input.keyboard.addKey('A');

    // animations
    this.anims.create({
        key: "left",
        frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: "turn",
        frames: [ { key: "img_perso", frame: 4 } ],
        frameRate: 20
    });
    this.anims.create({
        key: "right",
        frames: this.anims.generateFrameNumbers("img_perso", { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    // étoiles
    creerEtoiles.call(this);

    // bombes
    groupe_bombes = this.physics.add.group();
    this.physics.add.collider(groupe_bombes, groupe_plateformes);
    this.physics.add.collider(player, groupe_bombes, chocAvecBombe, null, this);

    // balles
    groupeBullets = this.physics.add.group();
    this.physics.world.on("worldbounds", function(body) {
        var objet = body.gameObject;
        if (groupeBullets.contains(objet)) {
            objet.destroy();
        }
    });

    // cibles
    groupeCibles = this.physics.add.group({
        key: 'cible',
        repeat: 7,
        setXY: { x: 24, y: 0, stepX: 107 }
    });
    this.physics.add.collider(groupeCibles, groupe_plateformes);
    groupeCibles.children.iterate(function(cible) {
        cible.pointsVie = Phaser.Math.Between(1, 5);
        cible.y = Phaser.Math.Between(10, 250);
        cible.setBounce(1);
    });

    // overlap balle / cible
    this.physics.add.overlap(groupeBullets, groupeCibles, hit, null, this);

    // texte
    texteScore = this.add.text(16, 16, "Score: 0", { fontSize: "32px", fill: "#000" });
    texteEtoiles = this.add.text(16, 50, "⭐ x" + nbEtoiles, { fontSize: "32px", fill: "#000" });
    texteBombes = this.add.text(700, 16, "💣 x0", { fontSize: "32px", fill: "#000" });
    texteGameOver = this.add.text(400, 300, "GAME OVER", { fontSize: "64px", fill: "#ff0000" });
    texteGameOver.setOrigin(0.5);
    texteGameOver.setVisible(false);
}

function update() {
    if (gameOver) return;

    // déplacement et direction
    if (clavier.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play("left", true);
        player.direction = 'left';
    } else if (clavier.right.isDown) {
        player.setVelocityX(160);
        player.anims.play("right", true);
        player.direction = 'right';
    } else {
        player.setVelocityX(0);
        player.anims.play("turn");
    }

    // saut
    if (clavier.space.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }

    // tir
    if (Phaser.Input.Keyboard.JustDown(boutonFeu)) {
        tirer(player);
    }
}

function creerEtoiles() {
    groupe_etoiles = this.physics.add.group({
        key: "img_etoile",
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    nbEtoiles = groupe_etoiles.getChildren().length;

    groupe_etoiles.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.2, 0.5));
    });

    this.physics.add.collider(groupe_etoiles, groupe_plateformes);
    this.physics.add.overlap(player, groupe_etoiles, collectStar, null, this);
}

function collectStar(player, star) {
    star.disableBody(true, true);
    score += 10;
    nbEtoiles--;
    texteScore.setText("Score: " + score);
    texteEtoiles.setText("⭐ x" + nbEtoiles);

    if (score % 20 === 0) {
        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
        var bomb = groupe_bombes.create(x, 16, "bomb");
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        nbBombes++;
        texteBombes.setText("💣 x" + nbBombes);
    }

    if (nbEtoiles === 0) {
        creerEtoiles.call(this);
    }
}

function chocAvecBombe(player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play("turn");
    gameOver = true;
    texteGameOver.setVisible(true);
}

// fonction tir
function tirer(player) {
    var coefDir = (player.direction === 'left') ? -1 : 1;
    var bullet = groupeBullets.create(player.x + (25 * coefDir), player.y - 4, 'bullet');
    bullet.setCollideWorldBounds(true);
    bullet.body.allowGravity = false;
    bullet.setVelocity(1000 * coefDir, 0);
    bullet.body.onWorldBounds = true;
}

// fonction hit balle / cible
function hit(bullet, cible) {
    cible.pointsVie--;
    if (cible.pointsVie === 0) {
        cible.destroy();
    }
    bullet.destroy();
}