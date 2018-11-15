import extractBrush from "./extractBrush";
import extractOpacity from "./extractOpacity";
import { fillProps } from "../props";

const fillRules = {
    evenodd: 0,
    nonzero: 1,
};

const fillKeys = Object.keys(fillProps);

export default function(props, styleProperties) {
    fillKeys.forEach(name => {
        if (props.hasOwnProperty(name)) {
            styleProperties.push(name);
        }
    });

    return {
        // default fill is black
        fill: extractBrush(props.fill || "#000"),
        fillOpacity: extractOpacity(props.fillOpacity),
        fillRule: fillRules[props.fillRule] === 0 ? 0 : 1,
    };
}
