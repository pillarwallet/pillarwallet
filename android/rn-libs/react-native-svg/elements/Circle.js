import React from "react";
import { requireNativeComponent } from "react-native";
import Shape from "./Shape";
import { CircleAttributes } from "../lib/attributes";
import { pathProps, numberProp } from "../lib/props";
import extractProps from "../lib/extract/extractProps";

export default class extends Shape {
    static displayName = "Circle";

    static propTypes = {
        ...pathProps,
        cx: numberProp.isRequired,
        cy: numberProp.isRequired,
        r: numberProp.isRequired,
    };

    static defaultProps = {
        cx: 0,
        cy: 0,
        r: 0,
    };

    setNativeProps = (...args) => {
        this.root.setNativeProps(...args);
    };

    render() {
        const { props } = this;
        const { cx, cy, r } = props;
        return (
            <RNSVGCircle
                ref={ele => {
                    this.root = ele;
                }}
                {...extractProps(props, this)}
                cx={cx}
                cy={cy}
                r={r}
            />
        );
    }
}

const RNSVGCircle = requireNativeComponent("RNSVGCircle", null, {
    nativeOnly: CircleAttributes,
});
