const Button = ({ onClick, text }: { onClick: (e: MouseEvent) => void; text: string }) => {
  const button = document.createElement("button");
  button.appendChild(document.createTextNode(text));
  button.onclick = onClick;
  return button;
};

export default Button;
