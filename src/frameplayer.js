/*
    frameplayer.js
    A video player without video files, just JSON. Based on "images frames" thought to mobile devices!

    @author: Vagner Santana
    @link: http://github.com/vagnervjs/frame-video
    @version: 0.2.0
    @since: 04/10/2013
*/

const FramePlayer = function (el, options) {
    this.divCont = document.getElementById(el);
    this.elem = el;
    this.jsonVideoSrc = this.divCont.getAttribute('data-vidsrc');
    this.rate = 20;
    this.controls = true;
    this.paused = false;
    this.width = '480px';
    this.height = '320px';
    this.backwards = false;
    this.currentFrame = -1;
    this.startFrame = 0;
    this.radius = null;

    // Events
    this.onFinish = function () {
    }

    this.setOptions(options);
    this.initializeRequestAnimationFrame();

    this.img = document.createElement('img');
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.divCont.appendChild(this.canvas);
};

FramePlayer.prototype.setOptions = function (options) {
    if ('rate' in options) {
        this.rate = this._rate = options.rate;
    }
    if ('controls' in options) {
        this.controls = options.controls;
    }
    if ('autoplay' in options) {
        if (!options.autoplay) {
            this.paused = true;
        }
    }
    if ('width' in options) {
        this.width = options.width;
    }
    if ('height' in options) {
        this.height = options.height;
    }
    if ('startFrame' in options) {
        this.startFrame = this.currentFrame = options.startFrame;
    }
    if ('backwards' in options) {
        this.backwards = options.backwards;
    }
    if ('isSpin' in options) {
        this.isSpin = options.isSpin;
    }
    if ('radius' in options) {
        const currentStyle = document.createElement('style');
        currentStyle.setAttribute('id', 'style-' + this.elem);
        currentStyle.innerHTML = '#' + this.elem + ', .frames-' + this.elem + '{ border-radius: ' + options.radius + '; overflow: hidden;}';
        document.head.appendChild(currentStyle);
    }

    this.divCont.style.width = this.width;
    this.divCont.style.height = this.height;

    if (this.controls) {
        this.createControlBar();
    }
};

FramePlayer.prototype.render = function (player) {

    let now,
        then = Date.now(),
        interval = 1000 / player.rate,
        delta,
        videoFramesNum = player.jsonVideoFile.frames.length,
        fps = 1,
        isFirstTime = true;

    this._fps = fps;

    const processFrame = function () {

        now = Date.now();
        delta = now - then;

        if (delta > interval || isFirstTime) {
            isFirstTime = false;
            then = now - (delta % interval);

            if (!player.paused) {

                player.currentFrame = (player.backwards) ? player.currentFrame -= fps : player.currentFrame += fps;

                const isFinished = (player.playToFrame &&
                    (player.currentFrame === player.playToFrame || Math.abs(player.currentFrame - player.playToFrame) < player._fps + 1));

                if (isFinished) {
                    player.currentFrame = player.playToFrame;
                }

                if (player.currentFrame >= videoFramesNum) player.currentFrame = 0;
                else if (player.currentFrame < 0) player.currentFrame = videoFramesNum - 1;

                player.drawFrame(player);

                if (isFinished) {
                    player.paused = true;
                    player.playToFrame = 0;

                    // Notify system
                    player.onFinish();
                    return;
                }
            } else {
                return;
            }
        }

        window.requestAnimationFrame(processFrame);
    };

    window.requestAnimationFrame(processFrame);
};

FramePlayer.prototype.drawFrame = function (player) {
    player.img.src = player.jsonVideoFile.frames[player.currentFrame];
    player.context.drawImage(player.img, 0, 0, player.canvas.width, player.canvas.height);
};

FramePlayer.prototype.createControlBar = function () {
    const _self = this,
        controlBar = document.createElement('div');
    controlBar.setAttribute('class', 'fp-ctrl');
    controlBar.style.width = this.width;

    // Pause Button
    const btnPause = document.createElement('button');
    btnPause.setAttribute('id', 'pause-' + _self.elem);
    btnPause.setAttribute('class', 'fp-btn');
    btnPause.innerHTML = 'Pause';
    btnPause.addEventListener('click', function () {
            _self.pause();
        }, false
    );
    controlBar.appendChild(btnPause);

    // Play Button
    const btnPlay = document.createElement('button');
    btnPlay.setAttribute('id', 'play-' + _self.elem);
    btnPlay.setAttribute('class', 'fp-btn');
    btnPlay.innerHTML = 'Play';
    btnPlay.addEventListener('click', function () {
            _self.resume();
        }, false
    );
    controlBar.appendChild(btnPlay);

    // Backwards Button
    const btnBackwards = document.createElement('button');
    btnBackwards.setAttribute('id', 'backwards-' + _self.elem);
    btnBackwards.setAttribute('class', 'fp-btn');
    btnBackwards.innerHTML = 'Backward';
    btnBackwards.addEventListener('click', function () {
            _self.reverse()
        }, false
    );
    controlBar.appendChild(btnBackwards);

    // Display Play/Pause Button
    _self.paused ? btnPause.style.display = 'none' : btnPlay.style.display = 'none';

    // Filter Select
    const selectFilter = document.createElement('select'),
        options = ['normal', 'grayscale', 'sepia', 'invert'];

    let i = 0, t = options.length;
    for (; i < t; i++) {
        const $option = document.createElement('option');

        $option.setAttribute('value', options[i]);
        $option.innerHTML = options[i];
        selectFilter.appendChild($option);
    }

    selectFilter.setAttribute('id', 'filter-' + _self.elem);
    selectFilter.setAttribute('class', 'fp-select');
    selectFilter.addEventListener('change', function () {
            _self.setFilter(this.value);
        }, false
    );
    controlBar.appendChild(selectFilter);

    const toFrameLabel = document.createElement('label'),
        toFrameInput = document.createElement('input'),
        toFrameSubmit = document.createElement('input');

    toFrameLabel.className = "to-frame";

    toFrameInput.type = 'text';
    toFrameInput.name = 'frame';
    toFrameInput.value = _self.startFrame;
    toFrameInput.className = "to-frame";
    _self.toFrameInput = toFrameInput;

    toFrameSubmit.type = 'submit';
    toFrameSubmit.value = 'go to frame';

    toFrameSubmit.onclick = function () {
        let value = parseInt(toFrameInput.value, 10)
        _self.gotoFrame(value);
    }

    toFrameLabel.appendChild(toFrameInput);
    toFrameLabel.appendChild(toFrameSubmit);
    controlBar.appendChild(toFrameLabel);

    // Add control bar
    this.divCont.appendChild(controlBar);
};

FramePlayer.prototype.play = function () {
    if (this._isLoading) {
        return;
    }
    this._isLoading = true;

    const callback = function (player) {
        if (player.paused) {
            player.render(player);
            player.drawFrame(player);
        } else {
            player.render(player);
        }
    };
    // See if the video has already been preloaded
    if ('_jsonVideo' in window && this.jsonVideoSrc in window._jsonVideo) {
        const video = window._jsonVideo[this.jsonVideoSrc];
        this.jsonVideoFile = JSON.parse(video);
        callback(this);
    } else {
        this.getFile(this.jsonVideoSrc, callback);
    }
};

FramePlayer.prototype.playTo = function (frame) {
    this.playToFrame = frame;
    let isBackwards;
    if (this.isSpin) {

        const totalFrames = this.jsonVideoFile.frames.length - 1,
            framesForward = Math.abs(frame - this.currentFrame),
            framesBackward = Math.abs(totalFrames + frame - this.currentFrame);
        isBackwards = framesForward > framesBackward;

    } else {
        isBackwards = false;
    }
    if (frame < this.currentFrame) {
        isBackwards = !isBackwards;
    }
    this.backwards = isBackwards;
    const baseRate = this._rate;
    this.rate = (!this.isSpin && this.backwards) ? baseRate * 2 : baseRate;
    this.paused = false;
    this.render(this);
};

FramePlayer.prototype.resume = function () {
    const btnPlay = document.getElementById('play-' + this.elem),
        btnPause = document.getElementById('pause-' + this.elem);

    if (btnPlay) btnPlay.style.display = 'none';
    if (btnPause) btnPause.style.display = 'block';
    this.paused = false;
};

FramePlayer.prototype.pause = function () {
    const btnPlay = document.getElementById('play-' + this.elem),
        btnPause = document.getElementById('pause-' + this.elem);

    if (btnPlay) btnPlay.style.display = 'block';
    if (btnPause) btnPause.style.display = 'none';
    this.paused = true;
};

FramePlayer.prototype.reverse = function () {
    const btnBackwards = document.getElementById('backwards-' + this.elem);
    this.backwards = !this.backwards;
    let value = this.backwards ? 'Forward' : 'Backward';
    btnBackwards.innerHTML = value;
};

FramePlayer.prototype.gotoFrame = function (value) {

    if (value !== parseInt(value, 10)) return;

    this.currentFrame = this.startFrame = this.toFrameInput.value = value;

    if (this.jsonVideoFile === undefined) {
        this.play();
    } else {
        this.drawFrame(this);
    }
};

FramePlayer.prototype.setFilter = function (filter) {
    const canvas = document.querySelector('#' + this.elem + ' canvas');

    switch (filter) {
        case 'normal':
            canvas.setAttribute('class', '');
            break;
        case 'grayscale':
            canvas.setAttribute('class', 'fp-grayscale');
            break;
        case 'sepia':
            canvas.setAttribute('class', 'fp-sepia');
            break;
        case 'invert':
            canvas.setAttribute('class', 'fp-invert');
            break;
        default:
            break;
    }
};

FramePlayer.prototype.getFile = function (src, callback) {
    let _HTTP = new XMLHttpRequest(),
        _self = this,
        p = document.createElement('p');

    if (_HTTP) {
        _HTTP.open('GET', src, true);
        _HTTP.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        _HTTP.send(null);

        _HTTP.onprogress = function () {
            p.innerHTML = 'Loading...';
            p.setAttribute('class', 'fp-loading');
            _self.divCont.appendChild(p);
        };

        if (typeof (_HTTP.onload) !== undefined) {
            _HTTP.onload = function () {
                _self.divCont.removeChild(p);
                _self.jsonVideoFile = JSON.parse(this.responseText)
                callback(_self);
                _HTTP = null;
            };
        } else {
            _HTTP.onreadystatechange = function () {
                if (_HTTP.readyState === 4) {
                    _self.divCont.removeChild(p);
                    _self.jsonVideoFile = JSON.parse(this.responseText)
                    callback(_self);
                    _HTTP = null;
                }
            };
        }
    } else {
        throw('Error loading file.');
    }
};

// Polyfill
FramePlayer.prototype.initializeRequestAnimationFrame = function () {
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
    // requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
    // MIT license

    let lastTime = 0;
    const vendors = ['ms', 'moz', 'webkit', 'o'];
    for (let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
            || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback) {
            const currTime = new Date().getTime();
            const timeToCall = Math.max(0, 16 - (currTime - lastTime));
            const id = window.setTimeout(function () {
                    callback(currTime + timeToCall);
                },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
};