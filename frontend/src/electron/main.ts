import { app, BrowserWindow } from "electron";
import path from "path";

app.on("ready", () => {
  const mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    resizable: true,
    fullscreenable: true,
    // disables default system frame (dont do this if you want a proper working menu bar)
    // frame: false,
  });
  mainWindow.loadURL("http://localhost:5173");
});
