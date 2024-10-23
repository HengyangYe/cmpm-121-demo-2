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
canvas.id = "appCanvas";
app.appendChild(canvas);

const ctx = canvas.getContext("2d")!;
let isDrawing = false;
const lines: Array<Array<{ x: number; y: number }>> = [];
let currentLine: Array<{ x: number; y: number }> = [];
const redoStack: Array<Array<{ x: number; y: number }>> = [];

// Draws the currently saved line
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const line of lines) {
    ctx.beginPath();
    for (let i = 0; i < line.length; i++) {
      const point = line[i];
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }
    ctx.stroke();
  }
}

// event for drawing-changed
canvas.addEventListener("drawing-changed", () => {
  redraw();
});

canvas.addEventListener("mousedown", () => {
  isDrawing = true;
  currentLine = [];
  lines.push(currentLine);
  redoStack.length = 0; // Empty the redo stack because of the new drawing contents
});

canvas.addEventListener("mousemove", (event) => {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  currentLine.push({ x, y });
  
  // event for drawing-changed
  const eventChanged = new Event("drawing-changed");
  canvas.dispatchEvent(eventChanged);
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

// Create and add a clear button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
app.appendChild(clearButton);

clearButton.addEventListener("click", () => {
  lines.length = 0; // clear
  const eventChanged = new Event("drawing-changed");
  canvas.dispatchEvent(eventChanged); // Redrawing the emptied canvas
});

// Undo button
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
app.appendChild(undoButton);

undoButton.addEventListener("click", () => {
  if (lines.length > 0) {
    const undoneLine = lines.pop(); // Undo Recent Lines
    if (undoneLine) {
      redoStack.push(undoneLine); // Save to Redo Stack
    }
    const eventChanged = new Event("drawing-changed");
    canvas.dispatchEvent(eventChanged);
  }
});

// Redo button
const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
app.appendChild(redoButton);

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const redoneLine = redoStack.pop(); // Take out the most recently undone line
    if (redoneLine) {
      lines.push(redoneLine); // Re-add to display list
    }
    const eventChanged = new Event("drawing-changed");
    canvas.dispatchEvent(eventChanged);
  }
});

// Format to look nice
const buttonContainer = document.createElement("div");
buttonContainer.classList.add("button-container");
app.appendChild(buttonContainer);

buttonContainer.appendChild(clearButton);
buttonContainer.appendChild(undoButton);
buttonContainer.appendChild(redoButton);
