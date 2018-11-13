import React from "react";
import { requireNativeComponent } from "react-native";
import { LineAttributes } from "../lib/attributes";
import Shape from "./Shape";
import { pathProps, numberProp } from "../lib/props";
import extractProps from "../lib/extract/extractProps";

export default class extends Shape {
    static displayName = "Line";

    static propTypes = {
        ...pathProps,
        x1: numberProp.isRequired,
        x2: numberProp.isRequired,
        y1: numberProp.isRequired,
        y2: numberProp.isRequired,
    };

    static defaultProps = {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
    };

    setNativeProps = (...args) => {
        this.root.setNativeProps(...args);
    };

    render() {
        const { props } = this;
        const { x1, y1, x2, y2 } = props;
        return (
            <RNSVGLine
                ref={ele => {
                    this.root = ele;
                }}
                {...extractProps(props, this)}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
            />
        );
    }
}

const RNSVGLine = requireNativeComponent("RNSVGLine", null, {
    nativeOnly: LineAttributes,
});
