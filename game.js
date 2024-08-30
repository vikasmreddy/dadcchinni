const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
      default: 'arcade',
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
  
  const game = new Phaser.Game(config);
  let player;
  let platforms;
  let cursors;
  let worldWidth = 3200; // Increased world width
  let kids;
  let score = 0;
  let scoreText;
  let scorePopup;
  let kidSounds;
  let currentKidSoundIndex = 0;
  let canDoubleJump = false;
  let canTripleJump = false;
  let jumpCount = 0;
  let lastJumpTime = 0;
  let gameOver = false;
  
  let totalKids = 7; // Since we create 7 kids in the current setup
  let collectedKids = 0;
  
  function preload() {

    this.load.image('sky', 'https://labs.phaser.io/assets/skies/space3.png');
    this.load.image('ground', 'https://labs.phaser.io/assets/sprites/platform.png');
    this.load.spritesheet('dude', 'dude.png', { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('kid', 'https://labs.phaser.io/assets/sprites/dude.png', { frameWidth: 32, frameHeight: 48 });
    this.load.audio('kidSound1', 'rrsmack.wav');
    this.load.audio('kidSound2', 'ksmack.wav');
    this.load.audio('kidSound3', 'rzsmack.wav');
    this.load.audio('kidSound4', 'asmack.wav');
    this.load.image('shredder', 'shredder.png');
    this.load.image('flag', 'flag.png');
  }
  
  function create() {
    // Adding background
    this.add.tileSprite(0, 0, worldWidth, 600, 'sky').setOrigin(0, 0);
    
    // Set world bounds
    this.physics.world.setBounds(0, 0, worldWidth, 600);
    
    // Adding platforms
    platforms = this.physics.add.staticGroup();
  
    // Ground
    for (let i = 0; i < worldWidth; i += 400) {
      platforms.create(i, 568, 'ground').setScale(2).refreshBody();
    }
  
    // Create ledges
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');
    platforms.create(1200, 350, 'ground');
    platforms.create(1600, 200, 'ground');
    platforms.create(2000, 400, 'ground');
    platforms.create(2400, 250, 'ground');
    platforms.create(2800, 300, 'ground');
  
    // Player setup
    player = this.physics.add.sprite(100, 450, 'dude');
  
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
  
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
  
    this.anims.create({
      key: 'turn',
      frames: [ { key: 'dude', frame: 4 } ],
      frameRate: 20
    });
  
    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1
    });
  
    this.physics.add.collider(player, platforms);
  
    cursors = this.input.keyboard.createCursorKeys();
    
    // Set up camera to follow player
    this.cameras.main.setBounds(0, 0, worldWidth, 600);
    this.cameras.main.startFollow(player);

    // Kids setup
    kids = this.physics.add.group();
    
    // Create kids at various positions
    createKid(this, 400, 0);
    createKid(this, 800, 0);
    createKid(this, 1200, 0);
    createKid(this, 1600, 0);
    createKid(this, 2000, 0);
    createKid(this, 2400, 0);
    createKid(this, 2800, 0);

    this.physics.add.collider(kids, platforms);
    this.physics.add.overlap(player, kids, collectKid, null, this);

    // Score
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff', stroke: '#000', strokeThickness: 6 });
    scoreText.setScrollFactor(0);
    
    // Score popup
    scorePopup = this.add.text(0, 0, '', { fontSize: '48px', fill: '#ff0', stroke: '#000', strokeThickness: 6 });
    scorePopup.setOrigin(0.5);
    scorePopup.setVisible(false);

    // Kid sounds
    kidSounds = [
      this.sound.add('kidSound1'),
      this.sound.add('kidSound2'),
      this.sound.add('kidSound3'),
      this.sound.add('kidSound4')
    ];

    // Vegetable shredder setup
    this.shredder = this.physics.add.image(50, 50, 'shredder');
    this.shredder.setCollideWorldBounds(true);
    this.shredder.setBounce(1);
    this.shredder.setVelocity(20, 20);
    this.shredder.setMaxVelocity(50);

    // Add collision between player and shredder
    this.physics.add.collider(player, this.shredder, playerDeath, null, this);

    // Add flag at the end of the world
    this.flag = this.physics.add.sprite(worldWidth - 100, 450, 'flag');
    this.flag.setCollideWorldBounds(true);
    this.physics.add.collider(this.flag, platforms);
    this.physics.add.overlap(player, this.flag, playerWin, null, this);

    // Add win text
    winText = this.add.text(400, 300, 'You Win!', { fontSize: '64px', fill: '#fff' });
    winText.setOrigin(0.5);
    winText.setScrollFactor(0);
    winText.setVisible(false);

    gameOverText = this.add.text(400, 300, 'Game Over', { fontSize: '64px', fill: '#fff' });
    gameOverText.setOrigin(0.5);
    gameOverText.setScrollFactor(0);
    gameOverText.setVisible(false);

    // Add play again button
    playAgainButton = this.add.text(400, 400, 'Play Again', { fontSize: '32px', fill: '#fff' });
    playAgainButton.setOrigin(0.5);
    playAgainButton.setScrollFactor(0);
    playAgainButton.setInteractive({ useHandCursor: true });
    playAgainButton.on('pointerdown', restartGame, this);
    playAgainButton.setVisible(false);

    // Kids collected text
    kidsCollectedText = this.add.text(16, 50, 'Kids: 0/' + totalKids, { fontSize: '32px', fill: '#fff', stroke: '#000', strokeThickness: 6 });
    kidsCollectedText.setScrollFactor(0);
  }
  
  function update() {
    if (cursors.left.isDown) {
      player.setVelocityX(-160);
      player.anims.play('left', true);
    } else if (cursors.right.isDown) {
      player.setVelocityX(160);
      player.anims.play('right', true);
    } else {
      player.setVelocityX(0);
      player.anims.play('turn');
    }
  
    if (player.body.touching.down) {
      canDoubleJump = false;
      canTripleJump = false;
      jumpCount = 0;
    }

    if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
      jump();
    }

    // Make kids jump
    kids.children.entries.forEach(kid => {
      if (kid.body.touching.down) {
        kid.setVelocityY(-Phaser.Math.Between(100, 200));
      }
    });

    // Update shredder movement
    const angle = Phaser.Math.Angle.Between(this.shredder.x, this.shredder.y, player.x, player.y);
    this.physics.velocityFromRotation(angle, 30, this.shredder.body.velocity);
    this.shredder.setRotation(angle + Math.PI / 2);
  }

  function createKid(scene, x, y) {
    const kid = kids.create(x, y, 'kid');
    kid.setBounce(0.2);
    kid.setCollideWorldBounds(true);
    scene.anims.create({
      key: 'kidJump',
      frames: scene.anims.generateFrameNumbers('kid', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    kid.anims.play('kidJump', true);
  }

  function collectKid(player, kid) {
    kid.disableBody(true, true);
    score += 1;
    scoreText.setText('Score: ' + score);
    
    // Play kid sound in order
    kidSounds[currentKidSoundIndex].play();
    currentKidSoundIndex = (currentKidSoundIndex + 1) % kidSounds.length;
    
    scorePopup.setText('+1');
    scorePopup.setPosition(kid.x, kid.y);
    scorePopup.setVisible(true);
    
    this.tweens.add({
      targets: scorePopup,
      y: kid.y - 100,
      alpha: 0,
      scale: 2,
      duration: 1000,
      ease: 'Power2',
      onComplete: function() {
        scorePopup.setVisible(false);
        scorePopup.setAlpha(1);
        scorePopup.setScale(1);
      }
    });
    collectedKids++;
    kidsCollectedText.setText('Kids: ' + collectedKids + '/' + totalKids);
  }

  function jump() {
    const currentTime = new Date().getTime();
    if (player.body.touching.down) {
      player.setVelocityY(-250);  // Reduced jump velocity
      lastJumpTime = currentTime;
      jumpCount = 1;
    } else if (jumpCount < 3 && currentTime - lastJumpTime >= 250) {
      player.setVelocityY(-250);  // Reduced jump velocity for multiple jumps
      lastJumpTime = currentTime;
      jumpCount++;
      if (jumpCount === 2) {
        canDoubleJump = true;
      } else if (jumpCount === 3) {
        canTripleJump = true;
      }
    }
  }

  function playerDeath(player, shredder) {
    player.setTint(0xff0000);
    player.anims.play('turn');
    gameOver = true;
    this.physics.pause();

    gameOverText.setVisible(true);
    playAgainButton.setVisible(true);
  }

  function playerWin() {
    if (collectedKids === totalKids) {
      gameOver = true;
      this.physics.pause();
      winText.setVisible(true);
      playAgainButton.setVisible(true);
    } else {
      playerDeath.call(this, player, null);
    }
  }

  function restartGame() {
    gameOver = false;
    score = 0;
    collectedKids = 0;
    currentKidSoundIndex = 0;
    this.scene.restart();
  }