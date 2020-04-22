import { WebGLDefaultShader } from "./WebGLDefaultShader";
import { CoreContext } from "../../../tree/core/CoreContext";
import { WebGLCoreQuadOperation } from "../WebGLCoreQuadOperation";

export class WebGLRadialFilterShader extends WebGLDefaultShader {
    private _radius: number = 0;
    private _cutoff: number = 1;

    constructor(context: CoreContext) {
        super(context);
    }

    set radius(v) {
        this._radius = v;
        this.redraw();
    }

    get radius() {
        return this._radius;
    }

    set cutoff(v) {
        this._cutoff = v;
        this.redraw();
    }

    get cutoff() {
        return this._cutoff;
    }

    useDefault() {
        return this._radius === 0;
    }

    setupUniforms(operation: WebGLCoreQuadOperation) {
        super.setupUniforms(operation);
        // We substract half a pixel to get a better cutoff effect.
        this._setUniform("radius", (2 * (this._radius - 0.5)) / operation.getRenderWidth(), this.gl.uniform1f);
        this._setUniform("cutoff", (0.5 * operation.getRenderWidth()) / this._cutoff, this.gl.uniform1f);
    }
}

WebGLRadialFilterShader.prototype.vertexShaderSource = `
    #ifdef GL_ES
    precision lowp float;
    #endif
    attribute vec2 aVertexPosition;
    attribute vec2 aTextureCoord;
    attribute vec4 aColor;
    uniform vec2 projection;
    varying vec2 pos;
    varying vec2 vTextureCoord;
    varying vec4 vColor;
    void main(void){
        gl_Position = vec4(aVertexPosition.x * projection.x - 1.0, aVertexPosition.y * -abs(projection.y) + 1.0, 0.0, 1.0);
        vTextureCoord = aTextureCoord;
        vColor = aColor;
        gl_Position.y = -sign(projection.y) * gl_Position.y;
        pos = gl_Position.xy;
    }
`;

WebGLRadialFilterShader.prototype.fragmentShaderSource = `
    #ifdef GL_ES
    precision lowp float;
    #endif
    varying vec2 vTextureCoord;
    varying vec2 pos;
    varying vec4 vColor;
    uniform sampler2D uSampler;
    uniform float radius;
    uniform float cutoff;
    void main(void){
        vec4 color = texture2D(uSampler, vTextureCoord);
        float f = max(0.0, min(1.0, 1.0 - (length(pos) - radius) * cutoff));
        gl_FragColor = texture2D(uSampler, vTextureCoord) * vColor * f;
    }
`;
