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
        this.value = 0

        this.setup()
    }

    setup() {
        let range = this.maxValue - this.minValue
        let numSteps = range / this.stepValue
        let innerRadius = this.radius - 20

        for (var i = 0; i < numSteps; i++) {
            let angle = i / numSteps * 2 * Math.PI
            let toAngle = (i + 0.9) / numSteps * 2 * Math.PI

            let ax = this.width / 2 + Math.cos(angle) * innerRadius
            let ay = this.height / 2 + Math.sin(angle) * innerRadius
            let bx = this.width / 2 + Math.cos(angle) * this.radius
            let by = this.height / 2 + Math.sin(angle) * this.radius
            let cx = this.width / 2 + Math.cos(toAngle) * this.radius
            let cy = this.height / 2 + Math.sin(toAngle) * this.radius
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

    updateValue() {

    }

    move() {
        this.ctx.beginPath()
        this.ctx.arc(20, 75, 50, 0, 2 * Math.PI)
        this.ctx.stroke()
    }
}