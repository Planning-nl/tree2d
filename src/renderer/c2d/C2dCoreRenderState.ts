import { CoreRenderState } from "../../tree/core/CoreRenderState";
import { NativeTexture } from "../NativeTexture";
import { RenderTextureInfo } from "../../tree/core/RenderTextureInfo";
import { ElementCore } from "../../tree/core/ElementCore";
import { C2dCoreQuadList } from "./C2dCoreQuadList";

export class C2dCoreRenderState extends CoreRenderState<C2dCoreQuadList> {
    isRenderTextureReusable(renderTextureInfo: RenderTextureInfo): boolean {
        return false;
    }

    finishRenderState(): void {
        // Noop
    }

    addQuad(texture: NativeTexture, elementCore: ElementCore) {
        const index = this.length;

        // Render context changes while traversing so we save it by ref.
        const quadList = this.quadList;
        quadList.add(texture, elementCore);
        quadList.setRenderContext(index, elementCore.getRenderContext());
        quadList.setWhite(index, elementCore.isWhite());
        quadList.setSimpleTc(index, elementCore.hasSimpleTexCoords());
    }
}
