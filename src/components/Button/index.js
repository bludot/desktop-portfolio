var Button = function (_a) {
    var onClick = _a.onClick, text = _a.text;
    var button = document.createElement("button");
    button.appendChild(document.createTextNode(text));
    button.onclick = onClick;
    return button;
};
export default Button;
//# sourceMappingURL=index.js.map