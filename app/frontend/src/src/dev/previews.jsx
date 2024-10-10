import {ComponentPreview, Previews} from '@react-buddy/ide-toolbox'
import {PaletteTree} from './palette'
import AtiExplorer from "../components/AtiExplorer";
import GoalDetails from "../components/graph_components/implementation/GoalDetails";

const ComponentPreviews = () => {
    return (
        <Previews palette={<PaletteTree/>}>
            <ComponentPreview path="/AtiExplorer">
                <AtiExplorer/>
            </ComponentPreview>
            <ComponentPreview path="/GoalDetails">
                <GoalDetails/>
            </ComponentPreview>
        </Previews>
    )
}

export default ComponentPreviews