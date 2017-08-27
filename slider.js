class CircularSlider {
    constructor(options) {
        this.container = options.container

        this.color = options.color
        this.minValue = options.min
        this.maxValue = options.max
        this.stepValue = options.step
        this.radius = options.radius
        this.width = this.radius * 2
        this.height = this.radius * 2

        this.container.style.position = 'relative'

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
        let height = 20
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
        let self = this
        this.canvas.addEventListener("touchstart", function(e) {
            self.touchStart(e)
        }, false)
        this.canvas.addEventListener("touchmove", function(e) {
            self.touchMove(e)
        }, false)
        this.canvas.addEventListener("touchend", function(e) {
            self.touchEnd(e)
        }, false)
        this.canvas.addEventListener("touchcancel", function(e) {
            self.touchEnd(e)
        }, false)

        this.drawSteps()
        this.updateValue(0)
    }

    setOffset(x, y) {
        this.backgroundCanvas.style.left = x + 'px'
        this.backgroundCanvas.style.top = y + 'px'
        this.canvas.style.left = x + 'px'
        this.canvas.style.top = y + 'px'
    }

    touchStart(evt) {
        var touches = evt.changedTouches
        for (var i = 0; i < touches.length; i++) {
            this.currentTouches.push(touches[i])
        }
    }

    touchMove(evt) {
        let touch = evt.touches[0]

        let x = touch.clientX - this.width / 2
        let y = touch.clientY - this.height / 2
        let angle = Math.atan2(y, x) + Math.PI / 2
        angle = (angle + 2 * Math.PI) % (2 * Math.PI)
        let ratio = angle / (2 * Math.PI)

        ratio = Math.max(Math.min(ratio, 1), 0)
        let value = (this.maxValue - this.minValue) * ratio

        let range = (this.maxValue - this.minValue)
        if (!(this.value < 0.25 * range && value > 0.75 * range || this.value > range * 0.75 && value < range * 0.25))
            this.updateValue(value)
    }

    touchEnd(evt) {}

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
    }
}