import React, { useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Button, CircularProgress, Snackbar, Alert, SnackbarCloseReason } from "@mui/material";
import FileDragDrop from "../components/FileDragDrop";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import { FileMetadata } from "../interfaces/File";
import { FileWithPath } from "react-dropzone";
import { set } from "react-hook-form";


interface FormData {
  userID: string,
  price: number,
  fileName: string,
  filePath: string,
  fileSize: number,
  timestamp: string,
  fileHash: string,
  bundleMode: boolean
}
interface UploadProps{}

const Upload: React.FC<UploadProps> = () => {

    //UseState to hold the file added
    const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarColor, setSnackbarColor] = useState<'success' | 'error' | 'info' | 'warning'>('success');
    const [fileName, setFileName] = useState<string>('');

    const handleCloseSnackbar = (
        event: React.SyntheticEvent<any, Event> | Event,
        reason?: SnackbarCloseReason
    ) => {
        if (reason === 'clickaway') {
        return;
        }
        setSnackbarOpen(false);
    }

    // const handleFileDrop = useCallback(async (file: File) => {
    //     if (!file.path) {
    //         console.error("Problem with file drop");
    //         setSnackbarMessage("Problem with file drop");
    //         setSnackbarColor('error');
    //         setSnackbarOpen(true);
    //         return;
    //     }
    //     setFileMetadata(null);
    //     try {
    //         if (!window.electronAPI || !window.electronAPI.handleDragDrop) {
    //             throw new Error("Electron API not available");
    //         }
    //         console.log("This is file: ", file);
    //         const result = await window.electronAPI.handleDragDrop(file);
    //         console.log("File path: ", file.path);
    //         console.log("Result: ", result);
    //         if (!result) {
    //             throw new Error("Problem with file drop");
    //         }
    //         if (result.fileMetadata) {
    //             console.log("hi");
    //             console.log("File metadata: ", result.fileMetadata);
    //             setFileMetadata(result.fileMetadata);
    //             setSnackbarMessage("File ready for upload");
    //             setSnackbarColor('success');
    //             setSnackbarOpen(true);
    //         }
    //     } catch (err: any) {
    //         console.error("Error with electron API: ", err);
    //         setSnackbarMessage(err.message);
    //         setSnackbarColor('error');
    //         setSnackbarOpen(true);
    //         return;
    //     }
    // }, []);
    
    const handleFileUpload = async () => {
        setFileMetadata(null);
        try {
            if (!window.electronAPI || !window.electronAPI.selectFile) {
                throw new Error("Electron API not available");
            }
            const result = await window.electronAPI.selectFile();
            if (!result) {
                throw new Error("Problem with file selection");
            }
            if (result.fileMetadata) {
                console.log("file path: ", result.fileMetadata.file_path);
                console.log("File metadata: ", result.fileMetadata);
                setFileMetadata(result.fileMetadata);
                setSnackbarMessage("File ready for upload");
                setSnackbarColor('success');
                setSnackbarOpen(true);
            }
        } catch (err: any) {
            console.error("Error with electron API: ", err);
            setSnackbarMessage(err.message);
            setSnackbarColor('error');
            setSnackbarOpen(true);
            return;
        }
    }

    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // FormData wrap the data
        const formData = new FormData(event.currentTarget);
        const userID = "user12345"; // Hardcoded for now
        const price = parseFloat(formData.get('price') as string);
        const bundleMode = formData.get('bundleMode') === 'Bundled';
        const fileName = formData.get('fileName') as string;

        if (!fileMetadata) {
            setSnackbarMessage("No file has been processed");
            setSnackbarColor('error');
            setSnackbarOpen(true);
            return;
        }

        const postData: FormData = {
            userID,
            price,
            fileName,
            filePath: fileMetadata.file_path,
            fileSize: fileMetadata.file_size,
            timestamp: fileMetadata.timestamp,
            fileHash: fileMetadata.file_hash,
            bundleMode
        }

        try {
        const response = await fetch("http://localhost:8080/uploadFile", {
            method: 'POST',
            body: JSON.stringify(postData),
        });
        const ret = await response.json();
        if (!ret) {
            throw new Error('The POST request to the backend failed.')
        }
        console.log("Successfully uploaded file to DHT.", ret);

        } catch(err) {
        console.error("An error occurred when attempting to upload the file.")
        }

    }
    return (
        <Box
        sx={{
        width: '100%',             
        maxWidth: '500px',         
        m: '0 auto',               
        p: 2,                      
        textAlign: 'center', 
        }}
        >
            <Box sx={{ m: 1, p: 2, width: '100%', maxWidth: '500px' }}> 
                <Typography variant="h3" sx={{ mb: 2, textAlign: 'center' }}>
                Upload a File
                </Typography>
                <form onSubmit={handleFormSubmit}>
                <TextField
                    id="outlined-price"
                    name="price"
                    label="Price"
                    variant="outlined"
                    fullWidth
                    required
                    sx={{ mb: 2 }}
                />
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <FormLabel id="bundle-mode-label">Bundle Mode</FormLabel>
                    <RadioGroup
                    aria-labelledby="bundle-mode-label"
                    defaultValue="No bundle"
                    name="bundleMode"
                    row
                    >
                    <FormControlLabel value="No bundle" control={<Radio />} label="No bundle" />
                    <FormControlLabel value="Bundled" control={<Radio />} label="Bundle" />
                    </RadioGroup>
                </FormControl>

                {/* <FileDragDrop onFileDrop={handleFileDrop} /> */}

                <Button variant="contained" sx={{ mt: 2 }} onClick={handleFileUpload} fullWidth>
                    Select File
                </Button>

                <TextField
                    id="outlined-file-name"
                    name="fileName"
                    label="File Name"
                    fullWidth
                    required
                    sx={{ mb: 2, mt: 2 }}
                    value={fileMetadata ? fileMetadata.file_name : fileName}  
                    onChange={(e) => setFileName(e.target.value)}

                />

                <Button variant="contained" sx={{ mt: 2 }} type="submit" fullWidth>
                    Submit
                </Button>
                </form>
            </Box>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarColor}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Upload;
