import FlexTestUtils from "./src/FlexTestUtils.js";

const flexTestUtils = new FlexTestUtils();

// These tests must be performed separately from HTML because we want it to behave differently (more consistently) than HTML.
describe("layout", () => {
    describe("force stretch", () => {
        flexTestUtils.addMochaTestForAnnotatedStructure("alignSelf:stretch", {
            flex: {},
            r: [0, 0, 450, 300],
            children: [
                {
                    flex: { alignItems: "flex-end" },
                    r: [0, 0, 450, 300],
                    children: [
                        { w: 200, h: 300, r: [0, 0, 200, 300] },
                        { w: 100, h: 100, r: [200, 0, 100, 300], flexItem: { alignSelf: "stretch" } },
                        { w: 150, h: 150, r: [300, 150, 150, 150] }
                    ]
                }
            ]
        });
    });

    flexTestUtils.addMochaTestForAnnotatedStructure("borders", {
        flex: { direction: "column" },
        r: [0, 0, 420, 420],
        children: [
            { w: 0, h: 10, r: [0, 0, 420, 10] },
            {
                flex: { direction: "row" },
                r: [0, 10, 420, 400],
                children: [
                    { w: 10, h: 0, r: [0, 0, 10, 400] },
                    { w: 400, h: 400, r: [10, 0, 400, 400] },
                    { w: 10, h: 0, r: [410, 0, 10, 400] }
                ]
            },
            { w: 0, h: 10, r: [0, 410, 420, 10] }
        ]
    });

    flexTestUtils.addMochaTestForAnnotatedStructure("flex offset", {
        flex: { direction: "column" },
        x: 100,
        y: 120,
        r: [100, 120, 420, 420],
        children: [
            { w: 0, h: 10, r: [0, 0, 420, 10] },
            {
                flex: { direction: "row" },
                r: [0, 10, 420, 400],
                children: [
                    { w: 10, h: 0, r: [0, 0, 10, 400] },
                    { w: 400, h: 400, r: [10, 0, 400, 400] },
                    { w: 10, h: 0, r: [410, 0, 10, 400] }
                ]
            },
            { w: 0, h: 10, r: [0, 410, 420, 10] }
        ]
    });

    flexTestUtils.addMochaTestForAnnotatedStructure("flex item offset", {
        flex: { direction: "column" },
        x: 100,
        y: 120,
        r: [100, 120, 420, 420],
        children: [
            { w: 0, h: 10, r: [0, 0, 420, 10] },
            {
                flex: { direction: "row" },
                r: [0, 10, 420, 400],
                children: [
                    { x: 100, y: 10, w: 10, h: 0, r: [100, 10, 10, 400] },
                    { w: 400, h: 400, r: [10, 0, 400, 400] },
                    { x: 1, y: -10, w: 10, h: 0, r: [411, -10, 10, 400] }
                ]
            },
            { w: 0, h: 10, r: [0, 410, 420, 10] }
        ]
    });

    flexTestUtils.addMochaTestForAnnotatedStructure("simple shrink", {
        r: [0, 0, 310, 110],
        w: 300,
        flex: { padding: 5 },
        children: [
            { flexItem: { shrink: 1, minWidth: 50 }, w: 100, h: 100, r: [5, 5, 50, 100] },
            { w: 100, h: 100, r: [55, 5, 100, 100] },
            { w: 100, h: 100, r: [155, 5, 100, 100] },
            { w: 100, h: 100, r: [255, 5, 100, 100] }
        ]
    });

});
