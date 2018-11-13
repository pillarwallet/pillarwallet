import React, { Component } from "react";
import PropTypes from "prop-types";
import extractViewBox from "../lib/extract/extractViewBox";
import { requireNativeComponent } from "react-native";
import { SymbolAttributes } from "../lib/attributes";

export default class extends Component {
    static displayName = "Symbol";
    static propTypes = {
        id: PropTypes.string.isRequired,
        viewBox: PropTypes.string,
        preserveAspectRatio: PropTypes.string,
    };
    render() {
        const { props } = this;
        const { id, children } = props;

        return (
            <RNSVGSymbol name={id} {...extractViewBox(props)}>
                {children}
            </RNSVGSymbol>
        );
    }
}

const RNSVGSymbol = requireNativeComponent("RNSVGSymbol", null, {
    nativeOnly: SymbolAttributes,
});
