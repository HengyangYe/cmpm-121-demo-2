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

// Add a color picker for marker colors
const colorPicker = document.createElement("input");
colorPicker.type = "color";
colorPicker.value = "#000000"; // Default to black
app.appendChild(colorPicker);

let currentColor = colorPicker.value;

// Update currentColor when a new color is selected
colorPicker.addEventListener("input", (event) => {
  currentColor = (event.target as HTMLInputElement).value;
});

// Add a slider to control tool properties
const toolSlider = document.createElement("input");
toolSlider.type = "range";
toolSlider.min = "0";
toolSlider.max = "360";
toolSlider.value = "0"; // Default to 0
app.appendChild(toolSlider);

let sliderValue = parseInt(toolSlider.value, 10);

// Update sliderValue when the slider changes
toolSlider.addEventListener("input", (event) => {
  sliderValue = parseInt((event.target as HTMLInputElement).value, 10);
});

// Create Line class to handle drawing logic
class Line {
  private points: Array<{ x: number; y: number }> = [];
  private thickness: number;
  private color: string;

  constructor(startX: number, startY: number, thickness: number, color: string) {
    this.points.push({ x: startX, y: startY });
    this.thickness = thickness;
    this.color = color;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.lineWidth = this.thickness; // Set line thickness
    ctx.strokeStyle = this.color; // Set line color
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
    ctx.fillStyle = `hsl(${sliderValue}, 100%, 50%)`; // Use hue from slider for preview
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.previewSize);
    for (let i = 1; i < 5; i++) {
      const angle = i * (Math.PI * 4 / 5);
      ctx.lineTo(
        this.x + this.previewSize * Math.sin(angle),
        this.y - this.previewSize * Math.cos(angle)
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// StickerCommand class to handle sticker placement and preview
class StickerCommand {
  private x: number | null = null;
  private y: number | null = null;
  private emoji: string;
  private rotation: number = 0;

  constructor(emoji: string) {
    this.emoji = emoji;
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.rotation = sliderValue; // Use slider value for rotation
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.x === null || this.y === null) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180); // Apply rotation
    ctx.font = "24px Arial";
    ctx.fillText(this.emoji, 0, 0);
    ctx.restore();
  }
}

let isDrawing = false;
const lines: Array<{ type: "line" | "sticker"; item: Line | StickerCommand }> = [];
const redoStack: Array<{ type: "line" | "sticker"; item: Line | StickerCommand }> = [];
let currentLine: Line | null = null;
let selectedThickness = 1; // Default thickness for Thin marker
let toolPreview: ToolPreview | null = new ToolPreview(6); // Default preview size for Thin
let currentSticker: StickerCommand | null = null; // Active sticker preview

// Initial sticker set
const stickerSet = ["🤡", "🤣", "😍"];

// Draws the currently saved lines and tool preview
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lines.forEach((line) => {
    if (line.type === "line") (line.item as Line).display(ctx);
    if (line.type === "sticker") (line.item as StickerCommand).draw(ctx);
  });
  if (!isDrawing && toolPreview) toolPreview.draw(ctx); // Draw preview only if not drawing
  if (currentSticker) currentSticker.draw(ctx); // Draw current sticker if selected
}

// Event for drawing-changed
canvas.addEventListener("drawing-changed", () => {
  redraw();
});

// On mouse down, create a new Line instance or place a sticker
canvas.addEventListener("mousedown", (event) => {
  const rect = canvas.getBoundingClientRect();
  const startX = event.clientX - rect.left;
  const startY = event.clientY - rect.top;

  if (currentSticker) {
    currentSticker.setPosition(startX, startY);
    lines.push({ type: "sticker", item: currentSticker });
    currentSticker = null;
    redraw();
  } else {
    isDrawing = true;
    currentLine = new Line(startX, startY, selectedThickness, currentColor);
    lines.push({ type: "line", item: currentLine });
    redoStack.length = 0;
    toolPreview = null;
  }
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
  } else if (currentSticker) {
    currentSticker.setPosition(x, y); // Update sticker preview position
    const toolMovedEvent = new Event("tool-moved");
    canvas.dispatchEvent(toolMovedEvent);
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

// Instruction panel
const instructions = document.createElement("p");
instructions.textContent = "Use the Thin/Thick markers to draw, add stickers, or export your masterpiece!";
instructions.style.fontFamily = "Arial, sans-serif";
instructions.style.margin = "10px";
app.prepend(instructions);


// Create sticker buttons dynamically based on stickerSet
function createStickerButtons() {
  document.querySelectorAll(".sticker-btn").forEach(btn => btn.remove());

  stickerSet.forEach((emoji) => {
    const stickerButton = document.createElement("button");
    stickerButton.classList.add("sticker-btn");
    stickerButton.textContent = emoji;
    stickerButton.addEventListener("click", () => {
      currentSticker = new StickerCommand(emoji);
      const toolMovedEvent = new Event("tool-moved");
      canvas.dispatchEvent(toolMovedEvent);
    });
    app.appendChild(stickerButton);
  });
}

// Add custom sticker button to the button container
const customStickerButton = document.createElement("button");
customStickerButton.textContent = "Add Custom Sticker";
customStickerButton.addEventListener("click", () => {
  const text = prompt("Custom sticker text", "🧽");
  if (text) {
    stickerSet.push(text); // Add custom sticker to stickerSet
    createStickerButtons(); // Refresh sticker buttons
  }
});

// Initial creation of sticker buttons
createStickerButtons();

// Create and add a clear button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
app.appendChild(clearButton);

clearButton.addEventListener("click", handleClear);

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

undoButton.addEventListener("click", handleUndo);

// Redo button
const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
app.appendChild(redoButton);

redoButton.addEventListener("click", handleRedo);

// Export button
const exportButton = document.createElement("button");
exportButton.textContent = "Export";
exportButton.addEventListener("click", () => {
  // Create and size a temporary canvas
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d");

  if (exportCtx) {
    // Scaling context
    exportCtx.scale(4, 4);

    // Draw the contents of the current display list onto a new canvas 
    lines.forEach((item) => {
      if (item.type === "line") {
        (item.item as Line).display(exportCtx);
      } else if (item.type === "sticker") {
        (item.item as StickerCommand).draw(exportCtx);
      }
    });

    // Triggier download 
    const anchor = document.createElement("a");
    anchor.href = exportCanvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();
  }
});

// Event Handlers for Undo, Redo and Clear
function handleUndo() {
  if (lines.length > 0) {
    const undoneLine = lines.pop(); // Undo Recent Lines
    if (undoneLine) {
      redoStack.push(undoneLine); // Save to Redo Stack
    }
    const eventChanged = new Event("drawing-changed");
    canvas.dispatchEvent(eventChanged);
  }
}

function handleRedo() {
  if (redoStack.length > 0) {
    const redoneLine = redoStack.pop(); // Pop the most recently undone line
    if (redoneLine) {
      lines.push(redoneLine); // Re-add to display list
    }
    const eventChanged = new Event("drawing-changed");
    canvas.dispatchEvent(eventChanged);
  }
}

function handleClear() {
  lines.length = 0; // Clear all lines
  redoStack.length = 0; // Clear redo stack
  const eventChanged = new Event("drawing-changed");
  canvas.dispatchEvent(eventChanged);
}


// Format buttons and container
const buttonContainer = document.createElement("div");
buttonContainer.classList.add("button-container");
app.appendChild(buttonContainer);

buttonContainer.appendChild(clearButton);
buttonContainer.appendChild(undoButton);
buttonContainer.appendChild(redoButton);
buttonContainer.appendChild(thinButton);
buttonContainer.appendChild(thickButton);
buttonContainer.appendChild(customStickerButton);
app.appendChild(exportButton);