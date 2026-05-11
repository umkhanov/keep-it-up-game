// Oyun için temel değişkenler
var myGamePiece; // Oyuncu (kırmızı kare)
var pathSegments = []; // Yol segmentleri
var floatingSegments = []; // Sürüklenebilir segmentler
var selectedSegment = null; // Seçilen segment
var myScore; // Skor
var gameOver = false; // Oyun bitiş bayrağı

// Sabitler
const GAME_SPEED = 3; // Oyun hızı
const PATH_HEIGHT = 40; // Yol yüksekliği
const PATH_Y = 350; // Yolun Y konumu
const GAP_WIDTH = 100; // Yol boşluğu genişliği
const SEGMENT_WIDTH = 80; // Segment genişliği

// Oyun başlatma fonksiyonu
function startGame() {
    // Başlatma butonunu ve başlangıç metnini gizle
    document.getElementById("startBtn").style.display = "none";
    document.getElementById("initialText").style.display = "none";
    document.getElementById("bgMusic").play();

    // Oyuncu karakterini oluştur
    myGamePiece = new component(60, 60, "#F5A95D", 50, PATH_Y - 60);
    myGamePiece.gravity = 0.2;

    // Skor sayacını oluştur
    myScore = new component("30px", "Consolas", "black", 310, 40, "text");

    // Oyun alanını başlat
    myGameArea.start();

    // Sürüklenebilir segmentleri seçmek için fare olaylarını ekle
    myGameArea.canvas.addEventListener('mousedown', handleMouseDown);
    myGameArea.canvas.addEventListener('mousemove', handleMouseMove);
    myGameArea.canvas.addEventListener('mouseup', handleMouseUp);

    // İlk yol segmentlerini oluştur
    for (let x = 0; x < 1000; x += SEGMENT_WIDTH) {
        pathSegments.push(new component(SEGMENT_WIDTH, PATH_HEIGHT, "#564F69", x, PATH_Y));
    }
}

// Oyun alanı yönetimi
var myGameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.context = this.canvas.getContext("2d");

        this.canvas.style.backgroundColor = "#B0BFE8";
        this.canvas.style.borderRadius = "25px";

        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.frameNo = 0;
        this.interval = setInterval(updateGameArea, 20);
    },

    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    stop : function() {
        clearInterval(this.interval);
    }
};

// Bileşen yapıcı fonksiyonu
function component(width, height, color, x, y, type) {
    this.type = type;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.speedX = 0;
    this.speedY = 0;
    this.gravity = 0;
    this.gravitySpeed = 0;
    this.isFloating = false; // Sürüklenebilir mi?
    this.isPlaced = false; // Yerleştirildi mi?

    // Bileşeni çiz
    this.update = function() {
        ctx = myGameArea.context;

        if (this.type == "text") {
            
            ctx.font = this.width + " " + this.height;
            ctx.fillStyle = color;
            ctx.fillText(this.text, this.x, this.y);

        } else if (this.width==60) {

            // Oyuncu karakteri için özel çizim (siyah kenar ile)
            ctx.fillStyle = color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = "#000000"; // Kenar rengi (siyah)
            ctx.lineWidth = 3; // Kenar kalınlığı
            ctx.strokeRect(this.x, this.y, this.width, this.height);

        } else {
            
            ctx.fillStyle = color;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Seçilen segmentin kenarını sarı yap
            if (this.isFloating && this === selectedSegment) {
            
                ctx.strokeStyle = "yellow";
                ctx.lineWidth = 3;
                ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            }
        }
    };

    // Konumu güncelle
    this.newPos = function() {
        if (!this.isFloating) {
            this.gravitySpeed += this.gravity;
            this.y += this.speedY + this.gravitySpeed;
        }
        this.x += this.speedX;
    };

    // Altında destek var mı?
    this.hasSupport = function() {
        for (let i = 0; i < pathSegments.length; i++) {
            let segment = pathSegments[i];
            // Karenin yol segmenti üzerinde olup olmadığını kontrol et
            if (this.x + this.width > segment.x &&
                this.x < segment.x + segment.width &&
                Math.abs((this.y + this.height) - segment.y) < 5) {
                return true;
            }
        }
        return false;
    };

    // Boşluk üstünde mi?
    this.isOverGap = function() {
        // Eğer nesne yol seviyesinin üzerindeyse, boşluk üzerinde değildir
        if (this.y + this.height < PATH_Y) return false;

        // Nesnenin altında herhangi bir yol segmenti olup olmadığını kontrol et
        for (let i = 0; i < pathSegments.length; i++) {
            let segment = pathSegments[i];
            if (this.x + this.width > segment.x &&
                this.x < segment.x + segment.width) {
                return false;
            }
        }
        // Eğer nesnenin altında yol parçası yoksa, boşluğun üzerindedir
        return true;
    };
}

// Oyun durumunu güncelle
function updateGameArea() {
    if (gameOver) return;

    // Oyun alanını temizle
    myGameArea.clear();
    myGameArea.frameNo += 1;

    // Oyuncu karakterinin altında destek olup olmadığını kontrol et
    var hasSupport = myGamePiece.hasSupport();
    var isOverGap = myGamePiece.isOverGap();

    if (!hasSupport && (myGamePiece.y > PATH_Y || isOverGap)) {
        // Eğer destek yoksa ve karakter yol seviyesinin altındaysa veya boşluk üzerindeyse, düşer
        myGamePiece.gravity = 0.5;
    } else if (hasSupport) {
        // Eğer destek varsa, yerçekimini sıfırla
        myGamePiece.gravity = 0;
        myGamePiece.gravitySpeed = 0;
        myGamePiece.y = PATH_Y - myGamePiece.height;
    }

    // Karakterin aşağı düşüp düşmediğini kontrol et
    if (myGamePiece.y > myGameArea.canvas.height - 50) {
        let bgMusic = document.getElementById("bgMusic");
        bgMusic.pause();
        bgMusic.currentTime = 0;

        document.getElementById("fallSound").play();

        gameOver = true;
        myGameArea.stop();

        document.getElementById("restartBtn").style.display = "inline-block";
        const ctx = myGameArea.context;
        ctx.fillStyle = "red";
        ctx.font = "40px Arial";
        ctx.fillText("GAME OVER", myGameArea.canvas.width / 2 - 120, myGameArea.canvas.height / 2 - 57);

        // Final skorunu göster
        ctx.fillStyle = "black";
        ctx.font = "30px Arial";
        ctx.fillText("SCORE: " + myGameArea.frameNo, myGameArea.canvas.width / 2 - 94, myGameArea.canvas.height / 2 - 7);

        return;
    }

    // Tüm yolu sola kaydır (sağa hareket etkisi)
    for (let i = 0; i < pathSegments.length; i++) {
        pathSegments[i].speedX = -GAME_SPEED;
        pathSegments[i].newPos();
        pathSegments[i].update();
    }

    // Yeni yol segmentleri ekle
    var lastSegment = pathSegments[pathSegments.length - 1];

    if (lastSegment && lastSegment.x + lastSegment.width < myGameArea.canvas.width) {
        // Boşluk olup olmayacağını belirle
        let createGap = Math.random() < 0.6;

        if (createGap) {
            // Yolda boşluk oluştur
            let gapX = lastSegment.x + lastSegment.width + GAP_WIDTH;
            pathSegments.push(new component(SEGMENT_WIDTH, PATH_HEIGHT, "#564F69", gapX, PATH_Y));

            // Sürüklenebilir bir segment oluştur
            let floatingSegment = new component(GAP_WIDTH, PATH_HEIGHT, "#564F69",
                Math.random() * (myGameArea.canvas.width - 100) + 50, 100);
            floatingSegment.isFloating = true;
            floatingSegments.push(floatingSegment);
        } else {
            // Normal yol segmenti oluştur
            pathSegments.push(new component(SEGMENT_WIDTH, PATH_HEIGHT, "#564F69",
                lastSegment.x + lastSegment.width, PATH_Y));
        }
    }

    // Sürüklenebilir segmentleri güncelle
    for (let i = 0; i < floatingSegments.length; i++) {
        if (!floatingSegments[i].isPlaced) {
            floatingSegments[i].update();
        }
    }

    // Oyuncu karakterinin konumunu ve görünümünü güncelle
    myGamePiece.speedX = 0;
    myGamePiece.newPos();
    myGamePiece.update();

    // Skoru güncelle
    myScore.text = "SCORE: " + myGameArea.frameNo;
    myScore.update();
}

// Fare olayları
function handleMouseDown(e) {
    var rect = myGameArea.canvas.getBoundingClientRect();
    var mouseX = e.clientX - rect.left;
    var mouseY = e.clientY - rect.top;

    // Kullanıcının sürüklenebilir bir segmente tıklayıp tıklamadığını kontrol et
    for (let i = 0; i < floatingSegments.length; i++) {
        let segment = floatingSegments[i];
        if (!segment.isPlaced &&
            mouseX > segment.x && mouseX < segment.x + segment.width &&
            mouseY > segment.y && mouseY < segment.y + segment.height) {
            selectedSegment = segment;
            break;
        }
    }
}

function handleMouseMove(e) {
    if (selectedSegment) {
        var rect = myGameArea.canvas.getBoundingClientRect();
        selectedSegment.x = e.clientX - rect.left - selectedSegment.width / 2;
        selectedSegment.y = e.clientY - rect.top - selectedSegment.height / 2;
    }
}

function handleMouseUp(e) {
    if (selectedSegment) {
        // Segmentin yoldaki bir boşluğun üzerinde olup olmadığını kontrol et
        for (let i = 0; i < pathSegments.length - 1; i++) {
            let segment1 = pathSegments[i];
            let segment2 = pathSegments[i + 1];

            // Eğer segmentler arasında boşluk varsa
            if (segment2.x - (segment1.x + segment1.width) >= GAP_WIDTH - 10) {
                let gapX = segment1.x + segment1.width;
                let gapWidth = segment2.x - gapX;

                // Eğer sürüklenebilir segment yaklaşık olarak boşluğun üzerindeyse
                if (Math.abs(selectedSegment.x - gapX) < 30 &&
                    Math.abs(selectedSegment.y - PATH_Y) < 30) {

                    // Segmenti boşluğun yerine sabitle
                    selectedSegment.x = gapX;
                    selectedSegment.y = PATH_Y;
                    selectedSegment.isPlaced = true;
                    const placeSound = document.getElementById("placeSound");
                    placeSound.volume = 0.3; // Ses seviyesi (0.0 ile 1.0 arası)
                    placeSound.play();

                    // Ana yola ekle
                    pathSegments.push(new component(gapWidth, PATH_HEIGHT, "#564F69", gapX, PATH_Y));
                    pathSegments.sort((a, b) => a.x - b.x);

                    break;
                }
            }
        }
        selectedSegment = null;
    }
}

function restartGame() {
    // Tüm değişkenleri sıfırla
    document.getElementById("bgMusic").pause();
    document.getElementById("bgMusic").currentTime = 0;

    myGamePiece = null;
    pathSegments = [];
    floatingSegments = [];
    selectedSegment = null;
    gameOver = false;

    // Kanvası temizle
    myGameArea.clear();
    myGameArea.stop();

    // Eski kanvası kaldır ve yenisini oluştur
    document.body.removeChild(myGameArea.canvas);
    myGameArea = {
        canvas : document.createElement("canvas"),
        start : myGameArea.start,
        clear : myGameArea.clear,
        stop : myGameArea.stop
    };

    // Butonu gizle
    document.getElementById("restartBtn").style.display = "none";

    // Oyunu yeniden başlat
    startGame();
}