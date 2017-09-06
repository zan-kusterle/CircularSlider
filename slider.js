class CircularSlider {
    constructor(options) {
        this.parent = options.container
        this.color = options.color
        this.minValue = options.min
        this.maxValue = options.max
        this.stepValue = options.step
        this.radius = options.radius

        if (!(this.parent instanceof HTMLElement))
            throw 'Container must be a DOM element'
        if (this.minValue >= this.maxValue)
            throw 'Minimum value must be less than maximum value'
        if (this.radius < 50)
            throw 'Radius must be at least 50px'
        if (this.stepValue <= 0)
            throw 'Step value must be positive'

        this._createChild()

        this._constants = this._getConstants()

        this._listeners = {
            set: [],
            change: []
        }
        this._isTouching = false

        this._handleEvents()

        this._drawSteps(this._backgroundCtx)
        this.setValue(this.minValue)
        this._setExactValue(this.minValue)

        this._startUpdating()
    }

    on(name, cb) {
        this._listeners[name].push(cb)

        if (name == 'set')
            cb(this._targetValue)
        else if (name == 'change')
            cb(this.value)
    }

    setValue(targetValue) {
        if (targetValue != this._targetValue) {
            if (targetValue <= this.minValue)
                targetValue = this.minValue
            else if (targetValue >= this.maxValue)
                targetValue = this.maxValue
            else
                targetValue = Math.round(targetValue / this.stepValue) * this.stepValue

            this._targetValue = targetValue

            let cbs = this._listeners['set']
            for (var i = 0; i < cbs.length; i++)
                cbs[i](this._targetValue)
        }
    }

    destroy() {
        if (this.container) {
            this.parent.removeChild(this.container)
            this.container = null

            let cancelAnimationFrame = window.cancelAnimationFrame ||
                window.mozCancelAnimationFrame ||
                function(requestID) { clearTimeout(requestID) }

            if (this._requestAnimationFrameID) {
                cancelAnimationFrame(this._requestAnimationFrameID)
                this._requestAnimationFrameID = null
            }
        }
    }

    _getConstants() {
        let range = this.maxValue - this.minValue
        let numSteps = Math.floor(range / this.stepValue)
        let height = 30
        let innerRadius = this.radius - height - 5
        let outerRadius = this.radius - 5
        let averageRadius = this.radius - 5 - height / 2

        return {
            numSteps: numSteps,
            buttonRadius: height / 2 + 4,
            stepSpacingRatio: 0.15,
            innerRadius: innerRadius,
            outerRadius: outerRadius,
            averageRadius: averageRadius,
            lineWidth: height,
            overlayOpacity: 0.6
        }
    }

    _startUpdating() {
        let requestAnimationFrame = window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(f) { return setTimeout(f, 1000 / 30) }

        let self = this
        let previousTime = Date.now()
        let updateFn = function(time) {
            let current = Date.now()
            self._update(current - previousTime)
            previousTime = current
            self._requestAnimationFrameID = requestAnimationFrame(updateFn)
        }
        this._requestAnimationFrameID = requestAnimationFrame(updateFn)
    }

    _update(elapsed) {
        let velocity = this._targetValue - this.value
        if (velocity < -this.stepValue)
            velocity = -Math.pow(-velocity, 0.6)
        else if (velocity > this.stepValue)
            velocity = Math.pow(velocity, 0.6)
        else
            velocity = Math.max(-this.stepValue / 10, Math.min(this.stepValue / 10, velocity))

        this._setExactValue(this.value + velocity * elapsed / 30)
    }

    _setExactValue(newValue) {
        if (newValue != this.value) {
            this.value = newValue
            this._ratio = (this.value - this.minValue) / (this.maxValue - this.minValue)
            this._angle = this._ratio * 2 * Math.PI - Math.PI / 2
            this._buttonX = this.radius + Math.cos(this._angle) * this._constants.averageRadius
            this._buttonY = this.radius + Math.sin(this._angle) * this._constants.averageRadius

            this._ctx.clearRect(0, 0, this.radius * 2, this.radius * 2)
            this._drawOverlay(this._ctx)
            this._drawButton(this._ctx)

            let cbs = this._listeners['change']
            for (var i = 0; i < cbs.length; i++)
                cbs[i](this.value)
        }
    }

    _handleEvents() {
        let self = this
        document.addEventListener("mousedown", function(e) {
            let rect = self._canvas.getBoundingClientRect()
            if (self._touchStart(e.clientX - rect.left, e.clientY - rect.top))
                e.preventDefault()
        }, false)
        document.addEventListener("mousemove", function(e) {
            let rect = self._canvas.getBoundingClientRect()
            if (self._touchMove(e.clientX - rect.left, e.clientY - rect.top))
                e.preventDefault()
        }, false)
        document.addEventListener("mouseup", function(e) {
            let rect = self._canvas.getBoundingClientRect()
            if (self._touchEnd(e.clientX - rect.left, e.clientY - rect.top))
                e.preventDefault()
        }, false)
        document.addEventListener("touchstart", function(e) {
            let rect = self._canvas.getBoundingClientRect()
            for (var i = 0; i < e.changedTouches.length; i++) {
                let touch = e.changedTouches[i]
                if (self._touchStart(touch.clientX - rect.left, touch.clientY - rect.top))
                    e.preventDefault()
            }
        }, false)
        document.addEventListener("touchmove", function(e) {
            let rect = self._canvas.getBoundingClientRect()
            for (var i = 0; i < e.changedTouches.length; i++) {
                let touch = e.changedTouches[i]
                if (self._touchMove(touch.clientX - rect.left, touch.clientY - rect.top))
                    e.preventDefault()
            }
        }, false)
        document.addEventListener("touchend", function(e) {
            let rect = self._canvas.getBoundingClientRect()
            for (var i = 0; i < e.changedTouches.length; i++) {
                let touch = e.changedTouches[i]
                if (self._touchEnd(touch.clientX - rect.left, touch.clientY - rect.top))
                    e.preventDefault()
            }

        }, false)
        document.addEventListener("touchcancel", function(e) {
            let rect = self._canvas.getBoundingClientRect()
            for (var i = 0; i < e.changedTouches.length; i++) {
                let touch = e.changedTouches[i]
                if (self._touchEnd(touch.clientX - rect.left, touch.clientY - rect.top))
                    e.preventDefault()
            }
        }, false)
    }

    _touchStart(x, y) {
        let outerRadius = this._constants.outerRadius + 5
        let innerRadius = this._constants.innerRadius - 5

        let centerX = x - this.radius
        let centerY = y - this.radius
        let centerDistanceSq = centerX * centerX + centerY * centerY

        let buttonDx = this._buttonX - x
        let buttonDy = this._buttonY - y
        let buttonDistanceSq = buttonDx * buttonDx + buttonDy * buttonDy
        let maxButtonDistance = 1.3 * this._constants.buttonRadius

        if (buttonDistanceSq < maxButtonDistance * maxButtonDistance) {
            this._isTouching = true
        } else if (centerDistanceSq < outerRadius * outerRadius && centerDistanceSq > innerRadius * innerRadius) {
            this._isTouching = true
        }
        this._touchMove(x, y)
        return this._isTouching
    }

    _touchMove(x, y) {
        if (!this._isTouching)
            return false

        let centerX = x - this.radius
        let centerY = y - this.radius
        let angle = Math.atan2(centerY, centerX) + Math.PI / 2

        angle = (angle + 2 * Math.PI) % (2 * Math.PI)
        let ratio = Math.max(Math.min(angle / (2 * Math.PI), 1), 0)

        if (this._ratio < 0.3 && ratio > 0.9) {
            this.setValue(this.minValue)
        } else if (this._ratio > 0.7 && ratio < 0.1) {
            this.setValue(this.maxValue)
        } else {
            this.setValue((this.maxValue - this.minValue) * ratio + this.minValue)
        }
        return true
    }

    _touchEnd(x, y) {
        if (this._isTouching) {
            this._isTouching = false
            return true
        } else {
            return false
        }
    }

    _createChild() {
        let backgroundCanvas = document.createElement('canvas')
        backgroundCanvas.width = this.radius * 2
        backgroundCanvas.height = this.radius * 2
        backgroundCanvas.style.zIndex = 0
        backgroundCanvas.style.position = 'absolute'
        this._backgroundCanvas = backgroundCanvas
        this._backgroundCtx = backgroundCanvas.getContext('2d')

        let canvas = document.createElement('canvas')
        canvas.width = this.radius * 2
        canvas.height = this.radius * 2
        canvas.style.zIndex = 1
        canvas.style.position = 'absolute'
        this._canvas = canvas
        this._ctx = canvas.getContext('2d')

        let mainDiv = document.createElement('div')
        mainDiv.appendChild(backgroundCanvas)
        mainDiv.appendChild(canvas)
        this.parent.appendChild(mainDiv)
        this.container = mainDiv
    }

    _drawSteps(ctx) {
        let innerRadius = this._constants.innerRadius
        let outerRadius = this._constants.outerRadius
        let numSteps = this._constants.numSteps
        let spacingRatio = this._constants.stepSpacingRatio

        ctx.lineWidth = this._constants.lineWidth
        ctx.strokeStyle = '#ccc'

        for (var i = 0; i < numSteps; i++) {
            let angle = (i + spacingRatio / 2) / numSteps * 2 * Math.PI
            let toAngle = (i + 1 - spacingRatio / 2) / numSteps * 2 * Math.PI

            ctx.beginPath()
            ctx.arc(this.radius, this.radius, this._constants.averageRadius, angle, toAngle)
            ctx.stroke()
        }
    }

    _drawButton(ctx) {
        ctx.lineWidth = 1
        ctx.strokeStyle = '#aaa'
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(this._buttonX, this._buttonY, this._constants.buttonRadius, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
    }

    _drawOverlay(ctx) {
        ctx.lineWidth = this._constants.lineWidth
        ctx.globalAlpha = this._constants.overlayOpacity
        ctx.strokeStyle = this.color
        ctx.beginPath()
        ctx.arc(this.radius, this.radius, this._constants.averageRadius, -Math.PI / 2, this._angle)
        ctx.stroke()
        ctx.globalAlpha = 1.0
    }
}