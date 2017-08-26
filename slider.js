class CircularSlider {
    constructor(options) {
        this.container = options.container
        this.ctx = this.container.getContext("2d")
        this.width = this.container.width
        this.height = this.container.height

        this.color = options.color
        this.minValue = options.min
        this.maxValue = options.max
        this.stepValue = options.step
        this.radius = options.radius
        this.updateValue(200)

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

        this.setup()
    }

    setup() {
        this.drawSteps()
        this.drawOverlay()
        this.drawButton()
    }

    drawSteps() {
        let innerRadius = this.constants['innerRadius']
        let outerRadius = this.constants['outerRadius']
        let numSteps = this.constants['numSteps']
        let spacingRatio = this.constants['stepSpacingRatio']

        this.ctx.fillStyle = '#ccc'

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

            this.ctx.beginPath()
            this.ctx.moveTo(ax, ay)
            this.ctx.lineTo(bx, by)
            this.ctx.lineTo(cx, cy)
            this.ctx.lineTo(dx, dy)
            this.ctx.closePath()
            this.ctx.fill()
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
    }
}