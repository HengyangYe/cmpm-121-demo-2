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
