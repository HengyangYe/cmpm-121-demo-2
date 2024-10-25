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

// Create Line class to handle drawing logic
class Line {
  private points: Array<{ x: number; y: number }> = [];
  private thickness: number;

  constructor(startX: number, startY: number, thickness: number) {
    this.points.push({ x: startX, y: startY });
    this.thickness = thickness;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.lineWidth = this.thickness; // Set line thickness
    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }
    ctx.stroke();
  }
}

let isDrawing = false;
const lines: Array<Line> = [];
const redoStack: Array<Line> = [];
let currentLine: Line | null = null;
let selectedThickness = 1; // Default thickness

// Draws the currently saved lines
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lines.forEach((line) => line.display(ctx));
}

// Event for drawing-changed
canvas.addEventListener("drawing-changed", () => {
  redraw();
});

// On mouse down, create a new Line instance
canvas.addEventListener("mousedown", (event) => {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  const startX = event.clientX - rect.left;
  const startY = event.clientY - rect.top;
  currentLine = new Line(startX, startY, selectedThickness); // Use selected thickness
  lines.push(currentLine);
  redoStack.length = 0; // Empty the redo stack because of the new drawing contents
});

// On mouse move, call drag to extend the line
canvas.addEventListener("mousemove", (event) => {
  if (!isDrawing || !currentLine) return;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  currentLine.drag(x, y);
  
  // Event for drawing-changed
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

// Thin/Thick buttons
const thinButton = document.createElement("button");
thinButton.textContent = "Thin Marker";
thinButton.classList.add("selectedTool"); // Initially selected

const thickButton = document.createElement("button");
thickButton.textContent = "Thick Marker";

app.appendChild(thinButton);
app.appendChild(thickButton);

// Tool selection 
thinButton.addEventListener("click", () => {
  selectedThickness = 1;
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
});

thickButton.addEventListener("click", () => {
  selectedThickness = 5;
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");
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
    const redoneLine = redoStack.pop(); // pop out the most recently undone line
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
buttonContainer.appendChild(thinButton);
buttonContainer.appendChild(thickButton);