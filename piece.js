goog.provide('puzzler.Piece');

goog.require('lime.Sprite');

puzzler.Piece = function() {
	lime.Sprite.call(this);
	this.piece = new lime.Sprite();
	this.appendChild(this.piece);
};
goog.inherits(puzzler.Piece, lime.Sprite);
