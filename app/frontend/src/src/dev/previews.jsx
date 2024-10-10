import {ComponentPreview, Previews} from '@react-buddy/ide-toolbox'
import {PaletteTree} from './palette'
import AtiExplorer from "../components/AtiExplorer";

const ComponentPreviews = () => {
    return (
        <Previews palette={<PaletteTree/>}>
            <ComponentPreview path="/AtiExplorer">
                <AtiExplorer/>
            </ComponentPreview>
        </Previews>
    )
}

export default ComponentPreviews