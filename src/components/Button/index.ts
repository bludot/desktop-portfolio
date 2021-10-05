const Button = ({ onClick, text }) => {
  const button = document.createElement("button");
  button.appendChild(document.createTextNode(text));
  button.onclick = onClick;
  return button;
};

export default Button;
