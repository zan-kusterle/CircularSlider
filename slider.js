class CircularSlider {
    constructor(options) {
        let requestAnimationFrame = window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(f) { return setTimeout(f, 1000 / 60) }

        let cancelAnimationFrame = window.cancelAnimationFrame ||
            window.mozCancelAnimationFrame ||
            function(requestID) { clearTimeout(requestID) }

        this.container = options.container

        this.color = options.color
        this.minValue = options.min
        this.maxValue = options.max
        this.stepValue = options.step
        this.radius = options.radius
        this.width = this.radius * 2
        this.height = this.radius * 2

        let canvas = document.createElement('canvas')
        canvas.width = this.radius * 2
        canvas.height = this.radius * 2
        canvas.style.zIndex = 0
        canvas.style.position = "absolute"
        this.container.appendChild(canvas)
        this.backgroundCanvas = canvas
        this.backgroundCtx = canvas.getContext("2d")

        let canvas2 = document.createElement('canvas')
        canvas2.width = this.radius * 2
        canvas2.height = this.radius * 2
        canvas2.style.zIndex = 1
        canvas2.style.position = "absolute"
        this.container.appendChild(canvas2)
        this.canvas = canvas2
        this.ctx = canvas2.getContext("2d")

        let range = this.maxValue - this.minValue
        let numSteps = range / this.stepValue
        let height = 30
        let innerRadius = this.radius - height + 3
        let outerRadius = this.radius - 3
        this.constants = {
            'numSteps': numSteps,
            'buttonRadius': height / 2,
            'stepSpacingRatio': 0.25,
            'innerRadius': innerRadius,
            'outerRadius': outerRadius,
            'lineWidth': height - 6,
            'overlayOpacity': 0.6
        }

        this.currentTouches = []
        this.isTouching = false
        let self = this
        document.addEventListener("mousedown", function(e) {
            let rect = self.canvas.getBoundingClientRect()
            self.touchStart(e.clientX - rect.left, e.clientY - rect.top)
        }, false)
        document.addEventListener("mousemove", function(e) {
            let rect = self.canvas.getBoundingClientRect()
            self.touchMove(e.clientX - rect.left, e.clientY - rect.top)
        }, false)
        document.addEventListener("mouseup", function(e) {
            let rect = self.canvas.getBoundingClientRect()
            self.touchEnd(e.clientX - rect.left, e.clientY - rect.top)
        }, false)
        document.addEventListener("touchstart", function(e) {
            let rect = self.canvas.getBoundingClientRect()
            self.touchStart(e.changedTouches[0].clientX - rect.left, e.changedTouches[0].clientY - rect.top)
        }, false)
        document.addEventListener("touchmove", function(e) {
            let rect = self.canvas.getBoundingClientRect()
            self.touchMove(e.changedTouches[0].clientX - rect.left, e.changedTouches[0].clientY - rect.top)
        }, false)
        document.addEventListener("touchend", function(e) {
            let rect = self.canvas.getBoundingClientRect()
            self.touchEnd(e.changedTouches[0].clientX - rect.left, e.changedTouches[0].clientY - rect.top)
        }, false)
        document.addEventListener("touchcancel", function(e) {
            let rect = self.canvas.getBoundingClientRect()
            self.touchEnd(e.changedTouches[0].clientX - rect.left, e.changedTouches[0].clientY - rect.top)
        }, false)

        this.onChangeCallbacks = []

        this.drawSteps()
        this.targetValue = this.minValue
        this.updateValue(this.minValue)

        let updateFn = function(time) {
            self.update(time)
            requestAnimationFrame(updateFn)
        }
        updateFn()
    }

    setOffset(x, y) {
        this.backgroundCanvas.style.left = x + 'px'
        this.backgroundCanvas.style.top = y + 'px'
        this.canvas.style.left = x + 'px'
        this.canvas.style.top = y + 'px'
    }

    on(name, cb) {
        if (name == 'change') {
            this.onChangeCallbacks.push(cb)
        }
    }

    update(time) {
        let difference = this.targetValue - this.value
        if (difference < -this.stepValue)
            difference = -Math.pow(-difference, 0.65)
        else if (difference > this.stepValue)
            difference = Math.pow(difference, 0.65)
        this.updateValue(this.value + difference)
    }

    touchStart(x, y) {
        let outerRadius = this.constants['outerRadius'] + 5
        let innerRadius = this.constants['innerRadius'] - 5
        let sx = x - this.width / 2
        let sy = y - this.height / 2
        let centerDistance = sx * sx + sy * sy

        let maxDistance = 2 * this.constants['buttonRadius']
        let dx = this.buttonX - x
        let dy = this.buttonY - y
        if (dx * dx + dy * dy < maxDistance * maxDistance) {
            this.isTouching = true
        } else if (centerDistance < outerRadius * outerRadius && centerDistance > innerRadius * innerRadius) {
            this.isTouching = true
        }
        this.touchMove(x, y)
    }

    touchMove(x, y) {
        if (!this.isTouching)
            return

        let sx = x - this.width / 2
        let sy = y - this.height / 2
        let angle = Math.atan2(sy, sx) + Math.PI / 2
        angle = (angle + 2 * Math.PI) % (2 * Math.PI)
        let ratio = angle / (2 * Math.PI)
        ratio = Math.max(Math.min(ratio, 1), 0)
        let value = (this.maxValue - this.minValue) * ratio

        let range = this.maxValue - this.minValue
        if (this.value < 0.25 * range && value > 0.75 * range) {
            this.targetValue = this.minValue
        } else if (this.value > range * 0.75 && value < range * 0.25) {
            this.targetValue = this.maxValue
        } else {
            this.targetValue = value
        }
    }

    touchEnd(evt) {
        this.isTouching = false
    }

    drawSteps() {
        let innerRadius = this.constants['innerRadius']
        let outerRadius = this.constants['outerRadius']
        let numSteps = this.constants['numSteps']
        let spacingRatio = this.constants['stepSpacingRatio']

        this.backgroundCtx.fillStyle = '#ccc'

        for (var i = 0; i < numSteps; i++) {
            let angle = i / numSteps * 2 * Math.PI
            let toAngle = (i + 1 - spacingRatio) / numSteps * 2 * Math.PI

            let ax = this.width / 2 + Math.cos(angle) * innerRadius
            let ay = this.height / 2 + Math.sin(angle) * innerRadius
            let bx = this.width / 2 + Math.cos(angle) * outerRadius
            let by = this.height / 2 + Math.sin(angle) * outerRadius
            let cx = this.width / 2 + Math.cos(toAngle) * outerRadius
            let cy = this.height / 2 + Math.sin(toAngle) * outerRadius
            let dx = this.width / 2 + Math.cos(toAngle) * innerRadius
            let dy = this.height / 2 + Math.sin(toAngle) * innerRadius

            this.backgroundCtx.beginPath()
            this.backgroundCtx.moveTo(ax, ay)
            this.backgroundCtx.lineTo(bx, by)
            this.backgroundCtx.lineTo(cx, cy)
            this.backgroundCtx.lineTo(dx, dy)
            this.backgroundCtx.closePath()
            this.backgroundCtx.fill()
        }
    }

    drawButton() {
        let buttonRadius = this.constants['buttonRadius']

        let x = this.width / 2 + Math.cos(this.angle) * (this.radius - buttonRadius)
        let y = this.height / 2 + Math.sin(this.angle) * (this.radius - buttonRadius)
        this.buttonX = x
        this.buttonY = y

        this.ctx.lineWidth = 1
        this.ctx.strokeStyle = '#aaa'
        this.ctx.fillStyle = '#fff'
        this.ctx.beginPath()
        this.ctx.arc(x, y, buttonRadius, 0, 2 * Math.PI)
        this.ctx.fill()
        this.ctx.stroke()
    }

    drawOverlay() {
        this.ctx.lineWidth = this.constants['lineWidth']
        this.ctx.globalAlpha = this.constants['overlayOpacity']
        this.ctx.strokeStyle = this.color
        this.ctx.beginPath()
        this.ctx.arc(this.width / 2, this.height / 2, this.radius - this.constants['buttonRadius'], -Math.PI / 2, this.angle)
        this.ctx.stroke()
        this.ctx.globalAlpha = 1.0
    }

    updateValue(newValue) {
        this.value = newValue
        this.angle = (this.value - this.minValue) / (this.maxValue - this.minValue) * 2 * Math.PI - Math.PI / 2

        this.ctx.clearRect(0, 0, this.width, this.height)
        this.drawOverlay()
        this.drawButton()

        for (var i = 0; i < this.onChangeCallbacks.length; i++)
            this.onChangeCallbacks[i](newValue)
    }
}