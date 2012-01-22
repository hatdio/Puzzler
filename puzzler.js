//set main namespace
goog.provide('puzzler');


//get requirements
goog.require('lime.Director');
goog.require('lime.Button');
goog.require('lime.GlossyButton');
goog.require('lime.Scene');
goog.require('lime.Layer');
goog.require('lime.Circle');
goog.require('lime.Label');
goog.require('lime.animation.Spawn');
goog.require('lime.animation.FadeTo');
goog.require('lime.animation.ScaleTo');
goog.require('lime.animation.MoveTo');
goog.require('lime.fill.Frame');
goog.require('box2d.Vec2');
goog.require('puzzler.Piece');
goog.require('goog.ui.CheckBoxMenuItem');
goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuItem');


// entrypoint
puzzler.start = function(){

	this.map = [9,16,25,36];
	this.maxPieces = 36;
	this.SIDEWIDTH = 200;
	this.WIDTH = 1280+this.SIDEWIDTH+10;
	this.HEIGHT = 1034;
	this.IMGWIDTH = 1280;
	this.IMGHEIGHT = 1024;
	this.images = ['beach','beach2','dragon','dragon2','lake','lake2','natalia','newday','sunflower','yellowrose'];
	this.imgName = 'img/'+this.images[Math.floor(Math.random() * (this.images.length))]+'.jpg';
	this.level = 16;
	this.moves = 0;
	this.time = 0;
	this.started = false;
	this.showHelp = false;
	this.showHistory = false;
	this.showLoadImage = false;
	this.porder = [];
	this.xymap = [];
	this.pieces = [];
	this.games = {};
	this.director = new lime.Director(document.body, this.WIDTH, this.HEIGHT),
		scene = new lime.Scene(),
		this.imgScene = new lime.Scene(),
		this.optScene = new lime.Scene(),
		this.historyScene = new lime.Scene(),

		layer = new lime.Layer().setSize(this.IMGWIDTH, this.IMGHEIGHT).setPosition(this.IMGWIDTH/2+5, this.IMGHEIGHT/2+5),
		sideLayer = new lime.Layer().setSize(this.SIDEWIDTH,this.IMGHEIGHT).setPosition(this.WIDTH-this.SIDEWIDTH/2, this.IMGHEIGHT/2+5),
		this.imgSprite = new lime.Sprite(),
		loadLbl = new lime.Label().setSize(this.IMGWIDTH-200,100).setFontSize(50).setText('Loading...')
			.setPosition(662,300).setFontColor('#000').setFill('#F2F4C6');

	var butY = -this.HEIGHT/2+100;
	this.startButton	= new lime.GlossyButton('Start').setColor('#D1EFEC').setSize(140,40).setPosition(0,butY);
	this.levelButton	= new lime.GlossyButton('Level').setColor('#D1EFEC').setSize(140,40).setPosition(0,butY+80);
	this.loadButton		= new lime.GlossyButton('Other image').setColor('#D1EFEC').setSize(140,40).setPosition(0,butY+160);
	this.historyButton	= new lime.GlossyButton('History').setColor('#D1EFEC').setSize(140,40).setPosition(0,butY+240);
	var helpButton		= new lime.GlossyButton('Help').setColor('#D1EFEC').setSize(140,40).setPosition(0,butY+320);

	this.movesLbl	= new lime.Label().setFontSize(26).setSize(this.SIDEWIDTH-10,120).setPosition(0,100).setText('Moves:');
	this.matchLbl	= new lime.Label().setFontSize(26).setSize(this.SIDEWIDTH-10,120).setPosition(0,250).setText('Matched:');
	this.timeLbl	= new lime.Label().setFontSize(26).setSize(this.SIDEWIDTH-10,120).setPosition(0,400).setText('Time:');

	var backRect = new lime.Sprite().setSize(this.WIDTH, this.HEIGHT).setPosition(this.WIDTH/2, this.HEIGHT/2).setFill('#B1BAC8');

	sideLayer.appendChild(this.startButton);
	sideLayer.appendChild(this.levelButton);
	sideLayer.appendChild(this.loadButton);
	sideLayer.appendChild(this.historyButton);
	sideLayer.appendChild(helpButton);
	sideLayer.appendChild(this.movesLbl);
	sideLayer.appendChild(this.matchLbl);
	sideLayer.appendChild(this.timeLbl);

	this.imgScene.appendChild(this.imgSprite);

	var ok = new lime.GlossyButton('OK').setColor('#D1EFEC').setSize(240,80).setPosition(this.IMGWIDTH/2+100,this.IMGHEIGHT-200);
	var hOk = new lime.GlossyButton('OK').setColor('#6F9CB3').setSize(240,80).setPosition(this.IMGWIDTH/2,this.IMGHEIGHT-100);
	var reset = new lime.GlossyButton('Reset history').setColor('#6F9CB3').setSize(240,80).setPosition(this.IMGWIDTH/2+280,this.IMGHEIGHT-100);
	div = document.createElement('div');
	div.setAttribute('id', 'history');
	this.historyScene.appendChild(div);
	this.historyScene.appendChild(hOk);
	if (storageSupprt)
		this.historyScene.appendChild(reset);
	this.imgScene.appendChild(ok);
	this.historyDiv = div;

	scene.appendChild(backRect);
	scene.appendChild(layer);
	scene.appendChild(sideLayer);
	scene.appendChild(loadLbl);

	goog.events.listen(this.startButton, lime.Button.Event.CLICK, this.startGame.bind(this));
	goog.events.listen(this.historyButton, lime.Button.Event.CLICK, this.history.bind(this));
	goog.events.listen(helpButton, lime.Button.Event.CLICK, this.help.bind(this));
	goog.events.listen(ok, lime.Button.Event.CLICK, this.helpOk.bind(this));
	goog.events.listen(hOk, lime.Button.Event.CLICK, this.historyOk.bind(this));
	if (storageSupprt)
		goog.events.listen(reset, lime.Button.Event.CLICK, this.resetHistory.bind(this));

	this.layer = layer;
	this.sideLayer = sideLayer;
	this.scene = scene;
	this.img = new Image();
	this.img.src = this.imgName;
	this.imgSprite.setSize(this.IMGWIDTH,this.IMGHEIGHT).setPosition(this.IMGWIDTH/2+100,this.IMGHEIGHT/2);
	this.loadLbl = loadLbl;

	this.img.addEventListener('load', function() {
		puzzler.loadLbl.runAction(new lime.animation.FadeTo(0));
		puzzler.loadPieces();
	});

	this.img.addEventListener('error', function(e) {
		alert('Image \''+ puzzler.imgName +'\' failed to load');
		puzzler.loadLbl.runAction(new lime.animation.FadeTo(0));
	});

	for (i = 0;i < this.maxPieces;i++) {
		var p = new puzzler.Piece();
		this.pieces.push(p);
		this.layer.appendChild(p);

		var v = new box2d.Vec2();
		this.xymap[i] = v;
	}

	this.director.makeMobileWebAppCapable();

	goog.events.listen(window,'keydown',function(e){
		if (puzzler.showHelp) {
			puzzler.showHelp = false;
			puzzler.director.replaceScene(puzzler.scene);
		}

		if (puzzler.showHistory) {
			puzzler.showHistory = false;
			puzzler.director.replaceScene(puzzler.scene);
		}

		if (puzzler.showLoadImage && e.keyCode == 27) {
			puzzler.showLoadImage = false;
			puzzler.director.replaceScene(puzzler.scene);
		}

		if (puzzler.menu.isVisible())
			puzzler.menu.setVisible(false);
	});

	//add some interaction
	goog.events.listen(layer,['mousedown','touchstart'],function(e){
		if (puzzler.menu.isVisible())
			puzzler.menu.setVisible(false);

			if (!puzzler.started)
				return;
			var cols = Math.sqrt(puzzler.level);
			var sprite, xEvent = e.event.clientX, yEvent = e.event.clientY;
			var coord = new box2d.Vec2(xEvent,yEvent);
			var xLayer = Math.floor(puzzler.IMGWIDTH / cols), yLayer = Math.floor(puzzler.IMGHEIGHT / cols);
			var pos = puzzler.layer.screenToLocal(coord),
				x = pos.x, y = pos.y;
			//console.log([xEvent,yEvent]);

			for (var i = 0;i < puzzler.xymap.length;i++) {
				var v = puzzler.xymap[i];
				if ((x >= v.x-xLayer/2 && x <= v.x+xLayer/2) && (y >= v.y-yLayer/2 && y <= v.y+yLayer/2)) {
					break;
				}
			}
			var move = puzzler.findMove(i, xLayer, yLayer);

			if (move > -1) {
				//console.log('move '+i+' to '+move);
				puzzler.movePiece(i, move);
				puzzler.moves++;
				puzzler.movesLbl.setText('Moves: '+ puzzler.moves);
				var m = 0;
				for (var i = 0;i < puzzler.porder.length;i++)
					if (puzzler.porder[i] == i)
						m++;
				puzzler.matchLbl.setText('Matched: '+ m +'/'+puzzler.level);

				if (m == puzzler.level) {
					puzzler.buildScore();
					puzzler.endGame();
					alert("Congratulations, puzzle solved\n"+ puzzler.timeLbl.getText() +"\n"+puzzler.movesLbl.getText());
				}
			}
	});

	// menu
	this.doMenu();
	this.doLoadImage();

	// set current scene active
	this.director.replaceScene(scene);
	
	if (storageSupprt) {
		var s  = localStorage.getItem('games');
		this.games = JSON.parse(s);
	}
	if (!this.games)
		this.games = [];
};

puzzler.doMenu = function() {
	var levels = ['Level 1 (9 pieces)', 'Level 2 (16 pieces)', 'Level 3 (25 pieces)', 'Level 4 (36 pieces)'];
	this.menu = new goog.ui.Menu();
	for (var i = 0;i < levels.length;i++) {
		var m = new goog.ui.CheckBoxMenuItem(levels[i]);
		m._level = i;
		if (i == 1)
			m.setChecked(true);
		this.menu.addItem(m);
	}
	this.menu.render();
	this.menu.setVisible(false);

	goog.events.listen(this.loadButton, ['mousedown','touchstart'], function(e) {
		if (puzzler.menu.isVisible())
			return;
		var doaction = true;
		if (puzzler.started)
			doaction = confirm('End game and change image?');

		if (doaction) {
			if (puzzler.started)
				puzzler.endGame();
			puzzler.showLoadImage = true;
			puzzler.input.value = '';
			puzzler.director.replaceScene(puzzler.optScene);
		}
	});

	goog.events.listen(this.levelButton, ['mousedown','touchstart'], function(e) {
		if (puzzler.menu.isVisible()) {
			puzzler.menu.setVisible(false);
			return;
		}
		var xEvent = e.event.clientX, yEvent = e.event.clientY+20;
		puzzler.menu.setVisible(true);
		puzzler.menu.setPosition(xEvent,yEvent);
	});

	goog.events.listen(this.menu, ['action'], function(e) {
		var doaction = true;
		if (puzzler.started)
			doaction = confirm('End game and change level?');

		if (doaction) {
			puzzler.menu.forEachChild(function(c) {
				c.setChecked(false);
			});
			e.target.setChecked(true);
			var newLevel = puzzler.map[e.target._level], reload = false;

			if (newLevel != puzzler.level)
				reload = true;
			puzzler.level = puzzler.map[e.target._level];
			//console.log('level:'+puzzler.level);
			puzzler.menu.setVisible(false);

			if (puzzler.started)
				puzzler.endGame();
			if (reload)
				puzzler.loadPieces();
		} else {
			e.target.setChecked(false);
			puzzler.menu.setVisible(false);
			return false;
		}
	});
};

puzzler.doLoadImage = function() {
	var width = this.WIDTH-100, height = this.HEIGHT-200;
	var b = new lime.Sprite().setFill('#000').setSize(width,height).setPosition(width/2+50,height/2+100);
	this.optScene.appendChild(b);
	var l = new lime.Label().setFontSize(40).setFontColor('#B1BAC8').setText('Select image:').setPosition(width/2,height/2-280);
	this.optScene.appendChild(l);
	var x = width/2-440, xs = x;
	var y = height/2-160;
	this.imgButtons = [];

	for (var i = 0;i < this.images.length;i++) {
		var name = this.images[i];
		var src = name+'.jpg';
		var button = new lime.Sprite().setSize(200,150).setFill(src).setPosition(x,y);
		button._img = i;
		this.imgButtons.push(button);
		this.optScene.appendChild(button);

		goog.events.listen(button,['mousedown','touchstart'],function(e){
				var img = e.currentTarget._img;
				puzzler.imgName = 'img/'+puzzler.images[img]+'.jpg';
				puzzler.img.src = puzzler.imgName;
				puzzler.loadLbl.setOpacity(1);
				puzzler.showLoadImage = false;
				puzzler.director.replaceScene(puzzler.scene);
		});

		x+=250;
		if (i == 4) {
			y += 200;
			x = xs;
		}
	}
	y +=180;
	var or = new lime.Label().setFontSize(40).setFontColor('#B1BAC8').setText('Or enter image url:').setPosition(width/2,y);
	this.optScene.appendChild(or);
	y +=100;
	var pos = new box2d.Vec2();
	pos.x = width/2-500;
	pos.y = y;
	var v = this.optScene.localToScreen(pos);

	var ok = new lime.GlossyButton('Load image url').setColor('#D1EFEC').setSize(140,66).setPosition(width/2+300,y+36);
	var cancel = new lime.GlossyButton('Cancel').setColor('#D1EFEC').setSize(140,66).setPosition(width/2+600,y+36);
	this.optScene.appendChild(ok);
	this.optScene.appendChild(cancel);

	goog.events.listen(cancel,['mousedown','touchstart'],function(){
		puzzler.showLoadImage = false;
		puzzler.director.replaceScene(puzzler.scene);
	});
	goog.events.listen(ok,['mousedown','touchstart'],function(){
		var img = puzzler.input.value;
		if (!img.length)
			alert('No image url given');
		else {
			puzzler.imgName = img;
			puzzler.img.src = img;
			puzzler.loadLbl.setOpacity(1);
			puzzler.showLoadImage = false;
			puzzler.director.replaceScene(puzzler.scene);
		}
	});

	var inp = document.createElement('input');
	inp.setAttribute('type', 'text');
	goog.style.setStyle(inp, 'position', 'absolute');
	goog.style.setStyle(inp, 'top', v.y+'px');
	goog.style.setStyle(inp, 'left', v.x+'px');
	goog.style.setStyle(inp, 'padding', '12px');
	goog.style.setStyle(inp, 'font-size', '40px');
	goog.style.setStyle(inp, 'width', '680px');
	this.input = inp;

	this.optScene.appendChild(inp);
};

puzzler.movePiece = function(from, to) {
	var sprite = this.pieces[this.porder[from]], empty = this.pieces[this.porder[to]];
	var move = new lime.animation.MoveTo(this.xymap[to]).setDuration(.2);
	sprite.runAction(move);
	empty.setPosition(this.xymap[from]);

	var b = this.porder[from];
	this.porder[from] = this.porder[to];
	this.porder[to] = b;
	//console.log(this.porder);
};

puzzler.findMove = function(position, xLayer, yLayer) {
	var emptyPos, pos;
	// find empty index
	for (var i = 0;i < this.porder.length;i++)
		if (this.porder[i] == 0)
			break;

	emptyPos = this.xymap[i];
	pos = this.xymap[position];

	// left top right bottom
	if ( (Math.abs(emptyPos.x - pos.x) == xLayer && emptyPos.y == pos.y) ||
			(Math.abs(emptyPos.y - pos.y) == yLayer && emptyPos.x == pos.x))
		return i;
	return -1;
};

puzzler.buildScore = function() {
	var item = [], dt = new Date();
	item.push(this.time);
	item.push(this.moves);
	item.push(this.map.indexOf(this.level)+1);
	item.push(Math.floor(dt.getTime()/1000));
	this.games.push(item);
	this.games.sort(sortByTime);

	if (this.games.length > 10)
		this.game.splice(10, this.game.length - 10);
	if (storageSupprt)
		localStorage.setItem('games', JSON.stringify(this.games));
};

puzzler.endGame = function() {
	this.started = false;
	this.porder = [];
	for (var i = 0;i < this.level;i++)
		this.porder[i] = i;
	this.drawPieces();
	this.startButton.setText('Start');
	lime.scheduleManager.unschedule(this.timer, this);
};

puzzler.startGame = function() {
	if (this.started) {
		this.started = false;
		this.porder = [];
		for (var i = 0;i < this.level;i++)
			this.porder[i] = i;
		this.drawPieces();
		this.startButton.setText('Start');
		lime.scheduleManager.unschedule(this.timer, this);
	} else {
		this.moves = 0;
		this.time = 0;
		this.started = true;
		this.randomize();
		this.drawPieces();
		this.startButton.setText('End');
		this.movesLbl.setText('Moves: 0');
		this.timeLbl.setText('Time: 00');
		lime.scheduleManager.scheduleWithDelay(this.timer, this, 1000);
	}
};

puzzler.timer = function() {
	this.time++;
	var s = 'Time: ';
	this.timeLbl.setText(s+getTimeString(this.time));
};

puzzler.history = function() {
	this.showHistory = true;
	var html = '<table cellpadding="0" cellspacing="0" width="100%">';
	html += '<thead><tr><th>time</th><th>moves</th><th>level</th><th>date</th></thead>';
	html += '<tbody>';

	for (var i = 0;i < this.games.length;i++) {
		r = this.games[i];
		dt = new Date(r[3]*1000);

		html += '<tr>';
		html += '<td>'+ getTimeString(r[0]) +'</td>';
		html += '<td>'+ r[1] +'</td>';
		html += '<td>'+ r[2] +'</td>';
		html += '<td>'+ dt.toLocaleDateString()+' '+dt.toLocaleTimeString() +'</td>';
		html += '</tr>';
	}

	html += '</tbody>';
	html += '</table>';
	this.historyDiv.innerHTML = html;
	this.director.replaceScene(this.historyScene);
};

puzzler.resetHistory = function() {
	localStorage.removeItem('games');
	this.games = [];
};

puzzler.historyOk = function() {
	this.showHistory = false;
	this.director.replaceScene(this.scene);
};

puzzler.help = function() {
	this.showHelp = true;
	this.director.replaceScene(this.imgScene);
};

puzzler.helpOk = function() {
	this.showHelp = false;
	this.director.replaceScene(this.scene);
};

puzzler.randomize = function() {
	// build pieces order
	this.porder = [];
	for (var i = 0;i < this.level;i++) {

		while (true) {
			var r = Math.floor(Math.random() * this.level);
			var found = false;
			for (var j = 0;j < i; j++) {
				if (this.porder[j] == r) {
					found = true;
					break;
				}
			}

			if (!found) {
				this.porder[i] = r;
				break;
			}
		}// while
	}
	//console.log(this.porder);
};

puzzler.drawPieces = function() {
	//console.log('drawPieces');
	var cols = Math.sqrt(this.level);
	var xx = Math.floor(this.img.width / cols), yy = Math.floor(this.img.height / cols);
	var m = 0;
	if (this.started) {
		this.pieces[0].setHidden(true);
	} else {
		this.pieces[0].setHidden(false);
	}

	for (var i = 0;i < this.porder.length;i++) {
		var pieceNum = this.porder[i];
		var move = new lime.animation.MoveTo(this.xymap[i]).setDuration(.5);

		this.pieces[pieceNum].runAction(move);
		//this.pieces[pieceNum].setPosition(this.xymap[i]);
		if (pieceNum == i)
			m++;
	}
	if (this.started)
		this.matchLbl.setText('Matched: '+ m +'/'+this.level);
	// position all rest to y+yy (hide)
	//var y = this.HEIGHT;
	//for (var i = this.porder.length;i < this.maxPieces;i++)
		//this.pieces[i].setPosition(0,y);
};

puzzler.loadPieces = function() {
	var cols = Math.sqrt(this.level);
	var xx = (this.img.width / cols), yy = (this.img.height / cols);
	var xLayer = Math.floor(this.IMGWIDTH / cols), yLayer = Math.floor(this.IMGHEIGHT / cols);
	//console.log([xx,yy]);
	var ind = 0;
	var w = this.IMGWIDTH;
	var h = this.IMGHEIGHT;
	//console.log([w,h]);
	this.imgSprite.setFill(this.img);

	var xS = -(this.IMGWIDTH / 2);
	var yS = -(this.IMGHEIGHT / 2);

	for (var i = 0;i < cols;i++) {
		for (var j = 0;j < cols;j++) {
			imgX = j * xx;
			imgY = i * yy;

			x = xS + j * xLayer;
			y = yS + i * yLayer;

			x = x + xLayer/2;
			y = y + yLayer/2;

			s = this.pieces[ind];
			/*if (i == 0 && j == 0)
				s.setSize(xLayer,yLayer).setFill('#000').setPosition(x,y).setStroke(1);
			else*/
			var move = new lime.animation.MoveTo(x,y).setDuration(.5);
			s.setFill(new lime.fill.Frame(this.img, imgX, imgY, xx, yy)).setHidden(false).setSize(xLayer,yLayer).runAction(move);
			this.xymap[ind].x = x;
			this.xymap[ind].y = y;
			ind++;
		}
	}
	// hide (position) all rest to y+yy
	for (var i = this.level;i < this.maxPieces;i++)
		this.pieces[i].setHidden(true);
};


//this is required for outside access after code is compiled in ADVANCED_COMPILATIONS mode
goog.exportSymbol('puzzler.start', puzzler.start);

// safari fix
if (typeof Function.prototype.bind == 'undefined')
Function.prototype.bind = function (bind) {
	var self = this;
	return function () {
		var args = Array.prototype.slice.call(arguments);
		return self.apply(bind || null, args);
	};
};


function supports_html5_storage() {
	try {
		return 'localStorage' in window && window['localStorage'] !== null;
	} catch (e) {
		return false;
	}
}

var storageSupprt = supports_html5_storage();
function sortByTime(a,b) {
	return a[0] - b[0];
}

function getTimeString(time) {
	var mins = 0, secs = time;
	if (time > 59) {
		mins = Math.floor(time / 60);
		secs = time % 60;
	}
	return (mins ? (mins < 10 ? '0':'') + mins+':': '00:')+(secs<10 ? '0':'')+secs;
}
