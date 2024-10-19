"use strict";
import { app, BrowserWindow, ipcMain, dialog } from "electron";
// import { ElectronAPI } from "@electron-toolkit/preload";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import fs from "fs";
import crypto from "crypto";

let mainWindow;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function createWindow() {
  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    resizable: true,
    fullscreenable: true,
    webPreferences: {
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.mjs"),
    },
    // disables default system frame (dont do this if you want a proper working menu bar)
    // frame: false,
  });
  console.log("This is __dirname: ", __dirname);
  console.log("Preload path: ", path.join(__dirname, "preload.js"));
  mainWindow.loadURL("http://localhost:5173");
}

app.whenReady().then(() => {
  createWindow();
})

interface FileMetadata {
  file_name: string;
  file_size: number;
  file_path: string;
  file_type: string;
  file_hash: string;
  timestamp: string;
}

ipcMain.handle("select-file", async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile"],
    });
    if (canceled || !filePaths.length) {
      return null;
    }

    const filePath = filePaths[0];

    const hash = await createFileHash(filePath);

    const fileMetadata: FileMetadata = {
      file_name: path.basename(filePath),
      file_size: fs.statSync(filePath).size,
      file_path: filePath,
      file_type: path.extname(filePath),
      file_hash: hash,
      timestamp: new Date().toISOString(),
    }
    return { fileMetadata };
  } catch (err) {
    console.error("Error with select-file: ", err);
    return null;
  }
});

ipcMain.handle("handle-drag-drop", async (event, file) => {
  console.log("File: ", file);
  console.log("File path: ", file.path);
  try {
    const hash = await createFileHash(file.path);
    const fileMetadata: FileMetadata = {
      file_name: path.basename(file.path),
      file_size: fs.statSync(file.path).size,
      file_path: file.path,
      file_type: path.extname(file.path),
      file_hash: hash,
      timestamp: new Date().toISOString(),
    };
    return { fileMetadata };
  }catch (err) {
    console.error("Error with handle-drag-drop: ", err);
    return null;
  }
});

function createFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);

    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => {
      resolve(hash.digest("hex"));
    })
    stream.on("error", (err) => {
      console.error(err);
      reject(err);
    });
  });
}
