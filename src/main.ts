import "./style.css";

const APP_NAME = "We Are Young";
const app = document.querySelector<HTMLDivElement>("#app")!;

// Title
document.title = APP_NAME;

const title = document.createElement("h1");
title.textContent = APP_NAME;
app.appendChild(title);

// Create and add a canvas element
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "appCanvas"; // To make it easier to apply styles in CSS
app.appendChild(canvas);

const ctx = canvas.getContext("2d")!;
let isDrawing = false;

canvas.addEventListener("mousedown", () => {
  isDrawing = true;
  ctx.beginPath();
});

canvas.addEventListener("mousemove", (event) => {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  ctx.lineTo(x, y);
  ctx.stroke();
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  ctx.closePath();
});

// Create and add a clear button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
app.appendChild(clearButton);

clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});