class CircularSlider {
    constructor(options) {
        this.container = options.container
        this.color = options.color
        this.minValue = options.min
        this.maxValue = options.max
        this.stepValue = options.step
        this.radius = options.radius

        if (!(this.container instanceof HTMLElement))
            throw 'Container must be a DOM element'
        if (this.minValue >= this.maxValue)
            throw 'Minimum value must be less than maximum value'
        if (this.radius < 50)
            throw 'Radius must be at least 50px'
        if (this.stepValue <= 0)
            throw 'Step value must be positive'

        this.container.style.position = 'relative'

        this._createChild()

        this.constants = this._getConstants()

        this.listeners = {
            set: [],
            change: []
        }
        this.isTouching = false

        this._handleEvents()

        this._drawSteps(this.backgroundCtx)
        this.setValue(this.minValue)
        this.setExactValue(this.minValue)

        this._startUpdating()
    }

    on(name, cb) {
        this.listeners[name].push(cb)

        if (name == 'set')
            cb(this.targetValue)
        else if (name == 'change')
            cb(this.value)
    }

    setValue(targetValue) {
        if (targetValue != this.targetValue) {
            this.targetValue = targetValue

            let cbs = this.listeners['set']
            for (var i = 0; i < cbs.length; i++)
                cbs[i](this.targetValue)
        }
    }

    setExactValue(newValue) {
        if (newValue != this.value) {
            this.value = newValue
            this.ratio = (this.value - this.minValue) / (this.maxValue - this.minValue)
            this.angle = this.ratio * 2 * Math.PI - Math.PI / 2

            this.ctx.clearRect(0, 0, this.radius * 2, this.radius * 2)
            this._drawOverlay(this.ctx)
            this._drawButton(this.ctx)

            let cbs = this.listeners['change']
            for (var i = 0; i < cbs.length; i++)
                cbs[i](this.value)
        }
    }

    destroy() {
        if (this.mainDiv) {
            this.container.removeChild(this.mainDiv)
            this.mainDiv = null

            let cancelAnimationFrame = window.cancelAnimationFrame ||
                window.mozCancelAnimationFrame ||
                function(requestID) { clearTimeout(requestID) }

            if (this.requestAnimationFrameID)
                cancelAnimationFrame(this.requestAnimationFrameID)
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
            'numSteps': numSteps,
            'buttonRadius': height / 2 + 4,
            'stepSpacingRatio': 0.15,
            'innerRadius': innerRadius,
            'outerRadius': outerRadius,
            'averageRadius': averageRadius,
            'lineWidth': height,
            'overlayOpacity': 0.6
        }
    }

    _startUpdating() {
        let requestAnimationFrame = window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(f) { return setTimeout(f, 1000 / 60) }

        let self = this
        let updateFn = function(time) {
            self._update(time)
            self.requestAnimationFrameID = requestAnimationFrame(updateFn)
        }
        updateFn()
    }

    _update(time) {
        let difference = this.targetValue - this.value
        if (difference < -this.stepValue)
            difference = -Math.pow(-difference, 0.6)
        else if (difference > this.stepValue)
            difference = Math.pow(difference, 0.6)
        else
            difference = Math.max(-this.stepValue / 10, Math.min(this.stepValue / 10, difference))

        this.setExactValue(this.value + difference)
    }

    _handleEvents() {
        let self = this
        document.addEventListener("mousedown", function(e) {
            let rect = self.canvas.getBoundingClientRect()
            if (self._touchStart(e.clientX - rect.left, e.clientY - rect.top))
                e.preventDefault()
        }, false)
        document.addEventListener("mousemove", function(e) {
            let rect = self.canvas.getBoundingClientRect()
            if (self._touchMove(e.clientX - rect.left, e.clientY - rect.top))
                e.preventDefault()
        }, false)
        document.addEventListener("mouseup", function(e) {
            let rect = self.canvas.getBoundingClientRect()
            if (self._touchEnd(e.clientX - rect.left, e.clientY - rect.top))
                e.preventDefault()
        }, false)
        document.addEventListener("touchstart", function(e) {
            let rect = self.canvas.getBoundingClientRect()
            for (var i = 0; i < e.changedTouches.length; i++) {
                let touch = e.changedTouches[i]
                if (self._touchStart(touch.clientX - rect.left, touch.clientY - rect.top))
                    e.preventDefault()
            }
        }, false)
        document.addEventListener("touchmove", function(e) {
            let rect = self.canvas.getBoundingClientRect()
            for (var i = 0; i < e.changedTouches.length; i++) {
                let touch = e.changedTouches[i]
                if (self._touchMove(touch.clientX - rect.left, touch.clientY - rect.top))
                    e.preventDefault()
            }
        }, false)
        document.addEventListener("touchend", function(e) {
            let rect = self.canvas.getBoundingClientRect()
            for (var i = 0; i < e.changedTouches.length; i++) {
                let touch = e.changedTouches[i]
                if (self._touchEnd(touch.clientX - rect.left, touch.clientY - rect.top))
                    e.preventDefault()
            }

        }, false)
        document.addEventListener("touchcancel", function(e) {
            let rect = self.canvas.getBoundingClientRect()
            for (var i = 0; i < e.changedTouches.length; i++) {
                let touch = e.changedTouches[i]
                if (self._touchEnd(touch.clientX - rect.left, touch.clientY - rect.top))
                    e.preventDefault()
            }
        }, false)
    }

    _touchStart(x, y) {
        let outerRadius = this.constants['outerRadius'] + 5
        let innerRadius = this.constants['innerRadius'] - 5
        let sx = x - this.radius
        let sy = y - this.radius
        let centerDistance = sx * sx + sy * sy

        let maxDistance = 1.3 * this.constants['buttonRadius']
        let dx = this.buttonX - x
        let dy = this.buttonY - y
        if (dx * dx + dy * dy < maxDistance * maxDistance) {
            this.isTouching = true
        } else if (centerDistance < outerRadius * outerRadius && centerDistance > innerRadius * innerRadius) {
            this.isTouching = true
        }
        this._touchMove(x, y)
        return this.isTouching
    }

    _touchMove(x, y) {
        if (!this.isTouching)
            return false

        let sx = x - this.radius
        let sy = y - this.radius
        let angle = Math.atan2(sy, sx) + Math.PI / 2
        angle = (angle + 2 * Math.PI) % (2 * Math.PI)
        let ratio = angle / (2 * Math.PI)
        ratio = Math.max(Math.min(ratio, 1), 0)

        if (this.ratio < 0.3 && ratio > 0.9) {
            this.setValue(this.minValue)
        } else if (this.ratio > 0.7 && ratio < 0.1) {
            this.setValue(this.maxValue)
        } else {
            let value = (this.maxValue - this.minValue) * ratio + this.minValue
            let fixedValue = Math.round(value / this.stepValue) * this.stepValue
            this.setValue(fixedValue)
        }
        return true
    }

    _touchEnd(x, y) {
        if (this.isTouching) {
            this.isTouching = false
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
        this.backgroundCanvas = backgroundCanvas
        this.backgroundCtx = backgroundCanvas.getContext('2d')

        let canvas = document.createElement('canvas')
        canvas.width = this.radius * 2
        canvas.height = this.radius * 2
        canvas.style.zIndex = 1
        canvas.style.position = 'absolute'
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')

        let mainDiv = document.createElement('div')
        mainDiv.appendChild(backgroundCanvas)
        mainDiv.appendChild(canvas)
        this.container.appendChild(mainDiv)
        this.mainDiv = mainDiv
    }

    _drawSteps(ctx) {
        let innerRadius = this.constants['innerRadius']
        let outerRadius = this.constants['outerRadius']
        let numSteps = this.constants['numSteps']
        let spacingRatio = this.constants['stepSpacingRatio']

        ctx.fillStyle = '#ccc'

        for (var i = 0; i < numSteps; i++) {
            let angle = i / numSteps * 2 * Math.PI
            let toAngle = (i + 1 - spacingRatio) / numSteps * 2 * Math.PI

            ctx.beginPath()
            ctx.moveTo(this.radius + Math.cos(angle) * innerRadius, this.radius + Math.sin(angle) * innerRadius)
            ctx.lineTo(this.radius + Math.cos(angle) * outerRadius, this.radius + Math.sin(angle) * outerRadius)
            ctx.lineTo(this.radius + Math.cos(toAngle) * outerRadius, this.radius + Math.sin(toAngle) * outerRadius)
            ctx.lineTo(this.radius + Math.cos(toAngle) * innerRadius, this.radius + Math.sin(toAngle) * innerRadius)
            ctx.closePath()
            ctx.fill()
        }
    }

    _drawButton(ctx) {
        let buttonRadius = this.constants['buttonRadius']
        let averageRadius = this.constants['averageRadius']

        let x = this.radius + Math.cos(this.angle) * averageRadius
        let y = this.radius + Math.sin(this.angle) * averageRadius
        this.buttonX = x
        this.buttonY = y

        ctx.lineWidth = 1
        ctx.strokeStyle = '#aaa'
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(x, y, buttonRadius, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
    }

    _drawOverlay(ctx) {
        let averageRadius = this.constants['averageRadius']
        ctx.lineWidth = this.constants['lineWidth']
        ctx.globalAlpha = this.constants['overlayOpacity']
        ctx.strokeStyle = this.color
        ctx.beginPath()
        ctx.arc(this.radius, this.radius, averageRadius, -Math.PI / 2, this.angle)
        ctx.stroke()
        ctx.globalAlpha = 1.0
    }
}