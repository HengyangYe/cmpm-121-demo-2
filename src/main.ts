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

// ToolPreview class to handle tool preview logic
class ToolPreview {
  private x: number | null = null;
  private y: number | null = null;
  private previewSize: number;

  constructor(previewSize: number) {
    this.previewSize = previewSize;
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.x === null || this.y === null) return;

    ctx.save();
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.previewSize); 
    for (let i = 1; i < 5; i++) { // To make a star
      const angle = i * (Math.PI * 4 / 5);
      ctx.lineTo(this.x + this.previewSize * Math.sin(angle), this.y - this.previewSize * Math.cos(angle));
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

let isDrawing = false;
const lines: Array<Line> = [];
const redoStack: Array<Line> = [];
let currentLine: Line | null = null;
let selectedThickness = 1; // Default thickness for Thin marker
let toolPreview: ToolPreview | null = new ToolPreview(6); // Default preview size for Thin

// Draws the currently saved lines and tool preview
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lines.forEach((line) => line.display(ctx));
  if (!isDrawing && toolPreview) toolPreview.draw(ctx); // Draw preview only if not drawing
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
  toolPreview = null; // Hide preview when drawing
});

// On mouse move, call drag to extend the line
canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  if (isDrawing && currentLine) {
    currentLine.drag(x, y);
    const eventChanged = new Event("drawing-changed");
    canvas.dispatchEvent(eventChanged);
  } else {
    if (!toolPreview) toolPreview = new ToolPreview(6); // Default preview size if null
    toolPreview.setPosition(x, y);
    const toolMovedEvent = new Event("tool-moved");
    canvas.dispatchEvent(toolMovedEvent); // Fire tool-moved event
  }
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

// tool-moved to update the preview
canvas.addEventListener("tool-moved", () => {
  redraw();
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
  toolPreview = new ToolPreview(6); // Set preview size for Thin
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
});

thickButton.addEventListener("click", () => {
  selectedThickness = 5;
  toolPreview = new ToolPreview(12); // Set preview size for Thick
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
