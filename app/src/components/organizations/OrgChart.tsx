import { AnimatedTree } from "react-tree-graph";

const OrgChart = () => {
    let data = {
        name: "Parent",
        children: [
            {
                name: "Child One",
            },
            {
                name: "Child Two",
            },
        ],
    };
    return (
        <AnimatedTree
            svgProps={{
                transform: "rotate(90)",
            }}
            data={data}
            height={400}
            width={400}
        />
    );
};

export default OrgChart;
