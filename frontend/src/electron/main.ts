import { app, BrowserWindow, ipcMain, dialog } from "electron";
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
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    // disables default system frame (dont do this if you want a proper working menu bar)
    // frame: false,
  });
  mainWindow.loadURL("http://localhost:5173");
}

app.on("ready", () => {
  createWindow();
});

interface FileMetadata {
  file_name: string;
  file_size: number;
  file_path: string;
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

    const fileMetaData: FileMetadata = {
      file_name: path.basename(filePath),
      file_size: fs.statSync(filePath).size,
      file_path: filePath,
      file_hash: hash,
      timestamp: new Date().toISOString(),
    }
    return { fileMetaData };
  } catch (err) {
    console.error("Error with select-file: ", err);
    return null;
  }
});

ipcMain.handle("handle-drag-drop", async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error("File does not exist");
    }
    const hash = await createFileHash(filePath);
    const fileMetaData: FileMetadata = {
      file_name: path.basename(filePath),
      file_size: fs.statSync(filePath).size,
      file_path: filePath,
      file_hash: hash,
      timestamp: new Date().toISOString(),
    };
    return { fileMetaData };
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
      console.log(hash.digest("hex"));
    })
    stream.on("error", (err) => {
      console.error(err);
    });
  });
}
