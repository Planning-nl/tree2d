import { CoreRenderExecutor } from "../../tree/core/CoreRenderExecutor";
import { CoreContext } from "../../tree/core/CoreContext";
import { WebGLCoreQuadOperation } from "./WebGLCoreQuadOperation";
import { WebGLShader } from "./WebGLShader";
import { RenderTexture } from "../RenderTexture";
import { WebGLRenderTexture } from "./WebGLRenderTexture";
import { WebGLCoreRenderState } from "./WebGLCoreRenderState";

export class WebGLCoreRenderExecutor extends CoreRenderExecutor<WebGLCoreRenderState> {
    public readonly attribsBuffer: WebGLBuffer;
    public readonly quadsBuffer: WebGLBuffer;

    // The matrix that maps the [0,0 - W,H] coordinates to [-1,-1 - 1,1] in the vertex shaders.
    public projection: Float32Array;

    public scissor: number[] | undefined;
    public currentShaderProgram?: WebGLShader = undefined;
    public readonly gl: WebGLRenderingContext;
    public quadIndexType: typeof WebGLRenderingContext.UNSIGNED_SHORT | typeof WebGLRenderingContext.UNSIGNED_INT =
        WebGLRenderingContext.UNSIGNED_SHORT;
    private canvasHeight: number = this.context.stage.canvas.height;

    constructor(context: CoreContext) {
        super(context);

        this.gl = this.context.stage.gl;

        this.attribsBuffer = this.gl.createBuffer()!;

        this.quadsBuffer = this.gl.createBuffer()!;

        this.projection = this.getProjectionVector();

        this.init();
    }

    onResizeCanvas() {
        this.projection = this.getProjectionVector();
        this.canvasHeight = this.context.stage.canvas.height;
    }

    private getProjectionVector() {
        return new Float32Array([2 / this.context.stage.coordsWidth, -2 / this.context.stage.coordsHeight]);
    }

    init() {
        const gl = this.gl;

        const maxQuads = Math.floor(this.renderState.quadList.data.byteLength / 80);

        const indexUintExtension = gl.getExtension("OES_element_index_uint");

        this.quadIndexType = indexUintExtension
            ? WebGLRenderingContext.UNSIGNED_INT
            : WebGLRenderingContext.UNSIGNED_SHORT;

        const arrayType = this.quadIndexType === WebGLRenderingContext.UNSIGNED_INT ? Uint32Array : Uint16Array;

        const allIndices = new arrayType(maxQuads * 6);

        // fill the indices with the quads to draw.
        for (let i = 0, j = 0; i < maxQuads * 6; i += 6, j += 4) {
            allIndices[i] = j;
            allIndices[i + 1] = j + 1;
            allIndices[i + 2] = j + 2;
            allIndices[i + 3] = j;
            allIndices[i + 4] = j + 2;
            allIndices[i + 5] = j + 3;
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.quadsBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, allIndices, gl.STATIC_DRAW);
    }

    destroy() {
        super.destroy();
        this.gl.deleteBuffer(this.attribsBuffer);
        this.gl.deleteBuffer(this.quadsBuffer);
    }

    protected _reset() {
        super._reset();

        const gl = this.gl;
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);

        this._stopShaderProgram();
        this._setupBuffers();
    }

    protected _setupBuffers() {
        const gl = this.gl;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.quadsBuffer);
        const element = new DataView(this.renderState.quadList.data, 0, this.renderState.quadList.getDataLength());
        gl.bindBuffer(gl.ARRAY_BUFFER, this.attribsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, element, gl.DYNAMIC_DRAW);
    }

    protected _setupQuadOperation(quadOperation: WebGLCoreQuadOperation) {
        super._setupQuadOperation(quadOperation);
        this._useShaderProgram(quadOperation.getWebGLShader(), quadOperation);
    }

    protected _renderQuadOperation(op: WebGLCoreQuadOperation) {
        const shader = op.getWebGLShader();

        if (op.length || op.shader.addEmpty()) {
            shader.beforeDraw(op);
            shader.draw(op);
            shader.afterDraw(op);
        }
    }

    protected _useShaderProgram(shader: WebGLShader, operation: WebGLCoreQuadOperation) {
        if (!shader.hasSameProgram(this.currentShaderProgram!)) {
            if (this.currentShaderProgram) {
                this.currentShaderProgram.stopProgram();
            }
            shader.useProgram();
            this.currentShaderProgram = shader;
        }
        shader.setupUniforms(operation);
    }

    protected _stopShaderProgram() {
        if (this.currentShaderProgram) {
            // The currently used shader program should be stopped gracefully.
            this.currentShaderProgram.stopProgram();
            this.currentShaderProgram = undefined;
        }
    }

    public _bindRenderTexture(renderTexture: RenderTexture) {
        super._bindRenderTexture(renderTexture);

        const gl = this.gl;
        if (!renderTexture) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this.context.stage.w, this.context.stage.h);
        } else {
            const rt = renderTexture as WebGLRenderTexture;
            gl.bindFramebuffer(gl.FRAMEBUFFER, rt.framebuffer);
            gl.viewport(0, 0, rt.w, rt.h);
        }
    }

    protected _clearRenderTexture() {
        super._clearRenderTexture();
        const gl = this.gl;
        if (!this._renderTexture) {
            const glClearColor = this.context.stage.getClearColor();
            if (glClearColor) {
                gl.clearColor(
                    glClearColor[0] * glClearColor[3],
                    glClearColor[1] * glClearColor[3],
                    glClearColor[2] * glClearColor[3],
                    glClearColor[3],
                );
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
        } else {
            // Clear texture.
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
    }

    protected _setScissor(area: number[] | undefined) {
        super._setScissor(area);

        if (this.scissor === area) {
            return;
        }
        this.scissor = area;

        const gl = this.gl;
        if (!area) {
            gl.disable(gl.SCISSOR_TEST);
        } else {
            gl.enable(gl.SCISSOR_TEST);
            const pixelRatio = this.context.stage.getPixelRatio();

            /**
             We should map the stage coordinate to a raster coordinate in the same way as is done in the
             WebGLDefaultShader.

             Ideally, we should even simulate GLSL float 16 (mediump) rounding (errors) to make sure that drawn textures
             and scissors are mapped to the same position. Else we might experience unexpected pixel gaps at very
             specific coordinates that are near to pixel rounding boundaries.

             Based on the observations on multiple platforms we concluded that the mapping function was:
             floor(coordX + 255/512)

             Notice that rounding errors may still occur, and may differ on different platforms.
             We hope (but are not sure) that the basic rounding algorithm doesn't differ per platform.
             */
            const sx = Math.floor(area[0] * pixelRatio + 255 / 512);
            const ex = Math.floor((area[0] + area[2]) * pixelRatio + 255 / 512);
            const sy = Math.floor(area[1] * pixelRatio + 255 / 512);
            const ey = Math.floor((area[1] + area[3]) * pixelRatio + 255 / 512);

            // Main render texture is inversed.
            const y = this._renderTexture ? sy : this.canvasHeight - ey;
            gl.scissor(sx, y, ex - sx, ey - sy);
        }
    }
}
