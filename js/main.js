(function() {

    var Coord = function(x, y) {
        this.x = x;
        this.y = y;
    }

    Coord.fromMouseEvent = function(e) {
        return new Coord(e.offsetX, e.offsetY);
    }

    var Stroke = function() {
        this.coords = [];
    }

    var Frame = function() {
        this.strokes = [];
    }

    var Animation = function() {
        this.frames = [new Frame()];
        this.index = 0;
    }

    Animation.prototype.getFrame = function(index) {
        return this.frames[index || this.index];
    }

    var Cel = function(el) {
        this.el = $(el);
        this.ctx = this.el.get(0).getContext('2d');
        this.drawingFrame = null;

        this.boundMDown = _.bind(this.onMouseDown, this);
        this.boundMMove = _.bind(this.onMouseMove, this);
        this.boundMUp = _.bind(this.onMouseUp, this);

        this.initializeEvents();
    }

    Cel.prototype.setCurrentFrame = function(frame) {
        this.drawingFrame = frame;
    }

    Cel.prototype.initializeEvents = function() {
        this.el.on('mousedown', this.boundMDown);
    }

    Cel.prototype.onMouseDown = function(e) {
        this.addStroke();
        var coord = Coord.fromMouseEvent(e);
        this.ctx.beginPath();
        this.ctx.moveTo(coord.x, coord.y);
        this.el.on('mousemove', this.boundMMove)
        this.el.on('mouseup', this.boundMUp)
    }

    Cel.prototype.onMouseMove = function(e) {
        var coord = Coord.fromMouseEvent(e);
        this.pushCoord(coord);
        this.ctx.lineTo(coord.x, coord.y);
        this.ctx.stroke();
    }

    Cel.prototype.onMouseUp = function() {
        this.el.off('mousemove', this.boundMMove);
        this.el.off('mouseup', this.boundMUp);
    }

    Cel.prototype.pushCoord = function(coord) {
        _.last(this.drawingFrame.strokes).coords.push(coord);
        return coord;
    }

    Cel.prototype.addStroke = function() {
        this.drawingFrame.strokes.push(new Stroke);
    }

    Cel.prototype.clear = function() {
        this.ctx.clearRect(0, 0, this.el.width(), this.el.height());
    }

    Cel.prototype.renderFrame = function(frame, style) {
        this.clear();

        this.ctx.save();
        _.extend(this.ctx, style);
        _.each(frame.strokes, this.renderStroke, this);

        this.ctx.restore();
    }

    Cel.prototype.renderStroke = function(stroke) {
        if (stroke.coords <= 1) return;

        this.ctx.beginPath();
        this.ctx.moveTo(stroke.coords[0].x, stroke.coords[0].y);

        for (var i = 1; i < stroke.coords.length; i++) {
            this.ctx.lineTo(stroke.coords[i].x, stroke.coords[i].y);
        }

        this.ctx.stroke();
    }

    var Player = function(cel, animation, options) {
        this.cel = cel;
        this.animation = animation;
        this.options = _.extend({
            loop: true,
            fps: 24,
        }, options);

        this.playing = false;
        this.playHead = 0;
        this.lastTime = 0;
    }

    Player.prototype.loop = function(time) {
        debugger;
        if (!this.playing) return;
        requestAnimationFrame(_.bind(this.loop, this));

        if (!this.shouldDisplayNow(time)) return;
        this.lastTime = time;

        this.loopOrPause();
        this.showFrame(this.playHead++);
    }

    Player.prototype.showFrame = function(frameNum) {
        this.cel.clear();
        this.cel.renderFrame(animation.getFrame(frameNum));
    }

    Player.prototype.shouldDisplayNow = function(time) {
        var timeElapsed = time - this.lastTime;
        return timeElapsed > ((1000/this.options.fps));
    }

    Player.prototype.loopOrPause = function() {
        if (this.playHead >= this.animation.frames.length) {
            if (this.options.loop) {
                this.playHead = 0;
            } else {
                this.pause();
            }
        }
    }

    Player.prototype.play = function() {
        this.playing = true;
        requestAnimationFrame(_.bind(this.loop, this));
    }

    Player.prototype.pause = function() {
        this.playing = false;
    }

    var Controls = function(el, animation, cel) {
        this.el = $(el);
        this.animation = animation;
        this.cel = cel;
        this.initializeEvents();
    }

    Controls.prototype.initializeEvents = function() {
        this.el.find('[data-action-add-frame]').on('click', _.bind(this.onClickAddFrame, this));
        this.el.find('[data-action-play]').on('click', _.bind(this.onClickPlay, this));
    }

    Controls.prototype.onClickAddFrame = function() {
        this.cel.renderFrame(this.animation.getFrame(), {
            globalAlpha: .5,
            strokeStyle: '#ff0000'
        });
        this.animation.frames.push(new Frame);
        this.animation.index = this.animation.frames.length - 1;
        this.cel.setCurrentFrame(this.animation.getFrame());
        this.renderFrameInfo();
    }

    Controls.prototype.onClickPlay = function() {
        var player = new Player(this.cel, this.animation);
        player.play();
    }

    Controls.prototype.renderFrameInfo = function() {
        var tpl = _.template($('#frame-info-tpl').html());
        $('#frame-info').html(tpl({
            current_frame: animation.index + 1,
            num_frames: animation.frames.length,
        }));

    }

    var main = function () {
        window.animation = new Animation();
        window.cel = new Cel('#cel');
        cel.setCurrentFrame(animation.getFrame());

        window.controls = new Controls(
            '#controls',
            animation,
            cel
        );
        window.controls.renderFrameInfo();
    }

    main();

})()
